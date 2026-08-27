import { pool } from '../db.js';
import { calculatePriority } from '../services/priorityService.js';

export async function listIssues(req, res) {
  try {
    const values = [];
    const conditions = [];

    if (req.query.status) {
      values.push(req.query.status);
      conditions.push(`i.status = $${values.length}`);
    }

    if (req.query.department) {
      values.push(req.query.department);
      conditions.push(`i.department_id = $${values.length}`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await pool.query(
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
        COUNT(DISTINCT s.user_id)::int AS supporter_count
      FROM issues i
      LEFT JOIN departments d
        ON d.id = i.department_id
      LEFT JOIN issue_supporters s
        ON s.issue_id = i.id
      ${where}
      GROUP BY
        i.id,
        d.name
      ORDER BY
        i.priority_score DESC,
        i.created_at DESC
      `,
      values
    );

    res.json({ issues: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Could not load issues'
    });
  }
}


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
      departmentId == null ||
      latitude == null ||
      longitude == null
    ) {
      return res.status(400).json({
        error:
          'title, departmentId, latitude and longitude are required'
      });
    }

    await client.query('BEGIN');

    // Verify department
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
        error: 'Invalid department'
      });
    }

    // Look for a nearby issue assigned to the same department.
    // This does NOT automatically merge the reports.
    const nearby = await client.query(
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
      [longitude, latitude, departmentId]
    );

    const result = await client.query(
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
        status,
        severity,
        priority_score,
        created_at
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
          result.rows[0].id,
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
      VALUES ($1, 'REPORTED', $2, $3)
      `,
      [
        result.rows[0].id,
        req.user.id,
        nearby.rows[0]
          ? `Possible nearby related issue: #${nearby.rows[0].id}`
          : 'Issue reported'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      issue: result.rows[0],
      possibleDuplicate: nearby.rows[0] || null
    });

  } catch (error) {
    await client.query('ROLLBACK');

    console.error(error);

    res.status(500).json({
      error: 'Could not create issue'
    });

  } finally {
    client.release();
  }
}


export async function supportIssue(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const issue = await client.query(
      `
      SELECT
        id,
        severity,
        created_at
      FROM issues
      WHERE id = $1
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!issue.rows[0]) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        error: 'Issue not found'
      });
    }

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

    const supporters = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM issue_supporters
      WHERE issue_id = $1
      `,
      [req.params.id]
    );

    const priority = calculatePriority({
      severity: issue.rows[0].severity,
      supporters: supporters.rows[0].count,
      createdAt: issue.rows[0].created_at
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
      supporterCount: supporters.rows[0].count,
      priorityScore: priority
    });

  } catch (error) {
    await client.query('ROLLBACK');

    console.error(error);

    res.status(500).json({
      error: 'Could not support issue'
    });

  } finally {
    client.release();
  }
}