import { pool } from '../db.js';
import { calculatePriority } from '../services/priorityService.js';

/* =========================
   LIST ISSUES
========================= */

export async function listIssues(req, res) {
  try {
    const v = [];
    const c = [];

    if (req.query.status) {
      v.push(req.query.status);
      c.push(`i.status=$${v.length}`);
    }

    if (req.query.department) {
      v.push(req.query.department);
      c.push(`i.department_id=$${v.length}`);
    }

    const where = c.length ? `WHERE ${c.join(' AND ')}` : '';

    const userId = req.user?.id || null;
    const userParam = v.length + 1;

    const r = await pool.query(
      `
      SELECT
        i.id,
        i.title,
        i.description,
        i.status,
        i.severity,
        i.priority_score,
        i.created_at,
        d.name AS department,
        ST_Y(i.location::geometry) AS latitude,
        ST_X(i.location::geometry) AS longitude,
        COUNT(DISTINCT s.user_id)::int AS supporter_count,

        CASE
          WHEN $${userParam}::bigint IS NULL THEN false
          WHEN EXISTS (
            SELECT 1
            FROM issue_supporters us
            WHERE us.issue_id = i.id
              AND us.user_id = $${userParam}
          )
          THEN true
          ELSE false
        END AS has_supported

      FROM issues i

      LEFT JOIN departments d
        ON d.id = i.department_id

      LEFT JOIN issue_supporters s
        ON s.issue_id = i.id

      ${where}

      GROUP BY i.id, d.name

      ORDER BY
        i.priority_score DESC,
        i.created_at DESC
      `,
      [...v, userId]
    );

    res.json({
      issues: r.rows
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: 'Could not load issues'
    });
  }
}


/* =========================
   CREATE ISSUE
========================= */

export async function createIssue(req, res) {
  const client = await pool.connect();

  try {
    const {
      title,
      description,
      departmentId,
      latitude,
      longitude,
      severity = 3,
      imageUrl = null
    } = req.body;

    if (
      !title ||
      !departmentId ||
      latitude == null ||
      longitude == null
    ) {
      return res.status(400).json({
        error: 'title, departmentId, latitude and longitude are required'
      });
    }

    await client.query('BEGIN');

    const department = await client.query(
      `
      SELECT id, name
      FROM departments
      WHERE id = $1
      `,
      [departmentId]
    );

    if (!department.rows[0]) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        error: 'Invalid authority/department'
      });
    }

    const duplicate = await client.query(
      `
      SELECT
        i.id,
        i.title,
        ST_Distance(
          i.location,
          ST_SetSRID(
            ST_MakePoint($1, $2),
            4326
          )::geography
        ) AS distance_m

      FROM issues i

      WHERE i.department_id = $3
        AND i.status NOT IN (
          'CLOSED',
          'REJECTED',
          'DUPLICATE'
        )
        AND ST_DWithin(
          i.location,
          ST_SetSRID(
            ST_MakePoint($1, $2),
            4326
          )::geography,
          100
        )

      ORDER BY distance_m
      LIMIT 1
      `,
      [
        longitude,
        latitude,
        departmentId
      ]
    );

    const issue = await client.query(
      `
      INSERT INTO issues (
        title,
        description,
        reported_by,
        department_id,
        location,
        severity
      )

      VALUES (
        $1,
        $2,
        $3,
        $4,
        ST_SetSRID(
          ST_MakePoint($5, $6),
          4326
        )::geography,
        $7
      )

      RETURNING
        id,
        title,
        description,
        department_id,
        reported_by,
        location,
        severity,
        status,
        priority_score,
        created_at,
        updated_at
      `,
      [
        title.trim(),
        description || null,
        req.user.id,
        departmentId,
        longitude,
        latitude,
        severity
      ]
    );

    if (imageUrl) {
      await client.query(
        `
        INSERT INTO issue_images (
          issue_id,
          image_url,
          uploaded_by
        )

        VALUES ($1, $2, $3)
        `,
        [
          issue.rows[0].id,
          imageUrl,
          req.user.id
        ]
      );
    }

    await client.query(
      `
      INSERT INTO issue_status_history (
        issue_id,
        new_status,
        changed_by,
        notes
      )

      VALUES (
        $1,
        'REPORTED',
        $2,
        $3
      )
      `,
      [
        issue.rows[0].id,
        req.user.id,
        duplicate.rows[0]
          ? `Possible nearby related issue: #${duplicate.rows[0].id}`
          : 'Issue reported'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      issue: issue.rows[0],
      possibleDuplicate: duplicate.rows[0] || null
    });

  } catch (e) {
    await client.query('ROLLBACK');

    console.error(e);

    res.status(500).json({
      error: 'Could not create issue'
    });

  } finally {
    client.release();
  }
}


/* =========================
   SUPPORT ISSUE
========================= */

export async function supportIssue(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
      INSERT INTO issue_supporters (
        issue_id,
        user_id
      )

      VALUES ($1, $2)

      ON CONFLICT DO NOTHING
      `,
      [
        req.params.id,
        req.user.id
      ]
    );

    const c = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM issue_supporters
      WHERE issue_id = $1
      `,
      [req.params.id]
    );

    const i = await client.query(
      `
      SELECT
        severity,
        created_at
      FROM issues
      WHERE id = $1
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!i.rows[0]) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    const priority = calculatePriority({
      severity: i.rows[0].severity,
      supporters: c.rows[0].count,
      createdAt: i.rows[0].created_at
    });

    await client.query(
      `
      UPDATE issues
      SET
        priority_score = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [
        priority,
        req.params.id
      ]
    );

    await client.query('COMMIT');

    res.json({
      supporterCount: c.rows[0].count,
      priorityScore: priority
    });

  } catch (e) {
    await client.query('ROLLBACK');

    console.error(e);

    res.status(500).json({
      error: 'Could not support issue'
    });

  } finally {
    client.release();
  }
}