-- ============================================================
-- CIVIFIX DATABASE SCHEMA
-- Crowdsourced Civic Issue Reporting & Resolution System
-- PostgreSQL + PostGIS
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENABLE POSTGIS
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS postgis;


-- ------------------------------------------------------------
-- 2. DELETE OLD CIVIFIX TABLES
-- ------------------------------------------------------------

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS issue_verifications CASCADE;
DROP TABLE IF EXISTS issue_status_history CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS issue_supporters CASCADE;
DROP TABLE IF EXISTS issue_images CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ------------------------------------------------------------
-- 3. USERS
-- ------------------------------------------------------------

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    phone VARCHAR(20),

    role VARCHAR(20) NOT NULL DEFAULT 'CITIZEN',

    CHECK (
        role IN (
            'CITIZEN',
            'OFFICER',
            'WORKER',
            'ADMIN'
        )
    ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- 4. DEPARTMENTS
-- These are the departments citizens can target.
-- ------------------------------------------------------------

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,

    name VARCHAR(150) UNIQUE NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- 5. CIVIC ISSUES
--
-- IMPORTANT:
-- There is NO fixed problem/category field.
--
-- The citizen types the problem themselves.
--
-- department_id is selected from the department dropdown.
-- ------------------------------------------------------------

CREATE TABLE issues (
    id BIGSERIAL PRIMARY KEY,

    -- Short problem title entered by citizen
    title VARCHAR(200) NOT NULL,

    -- Full problem description entered by citizen
    description TEXT NOT NULL,

    -- Citizen chooses the authority/department
    department_id INT NOT NULL
        REFERENCES departments(id)
        ON DELETE RESTRICT,

    -- Person who reported the problem
    reported_by BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    -- GPS location captured from the user's device
    location GEOGRAPHY(POINT, 4326) NOT NULL,

    -- 1 = Low
    -- 2 = Moderate
    -- 3 = Medium
    -- 4 = High
    -- 5 = Critical
    severity SMALLINT NOT NULL DEFAULT 3,

    CHECK (severity BETWEEN 1 AND 5),

    -- Current lifecycle state
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',

    CHECK (
        status IN (
            'REPORTED',
            'VERIFIED',
            'ASSIGNED',
            'IN_PROGRESS',
            'RESOLVED',
            'CITIZEN_VERIFICATION',
            'CLOSED',
            'REOPENED',
            'REJECTED',
            'DUPLICATE'
        )
    ),

    -- Calculated from severity + community support + age
    priority_score INT NOT NULL DEFAULT 0,

    CHECK (priority_score >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    resolved_at TIMESTAMPTZ
);


-- ------------------------------------------------------------
-- 6. ISSUE IMAGES
-- Citizens can upload evidence.
-- Resolution images can later be uploaded by workers/officers.
-- ------------------------------------------------------------

CREATE TABLE issue_images (
    id BIGSERIAL PRIMARY KEY,

    issue_id BIGINT NOT NULL
        REFERENCES issues(id)
        ON DELETE CASCADE,

    image_url TEXT NOT NULL,

    image_type VARCHAR(20) NOT NULL DEFAULT 'REPORT',

    CHECK (
        image_type IN (
            'REPORT',
            'RESOLUTION'
        )
    ),

    uploaded_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- 7. COMMUNITY SUPPORT
--
-- Other citizens can support an existing complaint.
--
-- Example:
--
-- Citizen A reports pothole
-- Citizen B supports it
-- Citizen C supports it
-- Citizen D supports it
--
-- Priority increases.
-- ------------------------------------------------------------

CREATE TABLE issue_supporters (
    id BIGSERIAL PRIMARY KEY,

    issue_id BIGINT NOT NULL
        REFERENCES issues(id)
        ON DELETE CASCADE,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(issue_id, user_id)
);


-- ------------------------------------------------------------
-- 8. WORKER / OFFICER ASSIGNMENTS
-- ------------------------------------------------------------

CREATE TABLE assignments (
    id BIGSERIAL PRIMARY KEY,

    issue_id BIGINT NOT NULL
        REFERENCES issues(id)
        ON DELETE CASCADE,

    worker_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    assigned_by BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    started_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    notes TEXT
);


-- ------------------------------------------------------------
-- 9. ISSUE STATUS HISTORY
--
-- Keeps a complete history of what happened to a complaint.
-- ------------------------------------------------------------

CREATE TABLE issue_status_history (
    id BIGSERIAL PRIMARY KEY,

    issue_id BIGINT NOT NULL
        REFERENCES issues(id)
        ON DELETE CASCADE,

    old_status VARCHAR(30),

    new_status VARCHAR(30) NOT NULL,

    changed_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- 10. NOTIFICATIONS
-- ------------------------------------------------------------

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    issue_id BIGINT
        REFERENCES issues(id)
        ON DELETE CASCADE,

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- 11. CITIZEN VERIFICATION
--
-- After an authority marks an issue resolved,
-- the citizen can confirm whether the problem is actually fixed.
-- ------------------------------------------------------------

CREATE TABLE issue_verifications (
    id BIGSERIAL PRIMARY KEY,

    issue_id BIGINT NOT NULL
        REFERENCES issues(id)
        ON DELETE CASCADE,

    citizen_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    verified BOOLEAN NOT NULL,

    feedback TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- 12. INDEXES
-- ------------------------------------------------------------

-- Geographic searching
CREATE INDEX idx_issues_location
ON issues
USING GIST(location);


-- Frequently filtered fields
CREATE INDEX idx_issues_status
ON issues(status);


CREATE INDEX idx_issues_department
ON issues(department_id);


CREATE INDEX idx_issues_priority
ON issues(priority_score DESC);


CREATE INDEX idx_issues_created_at
ON issues(created_at DESC);


CREATE INDEX idx_supporters_issue
ON issue_supporters(issue_id);


CREATE INDEX idx_notifications_user
ON notifications(user_id);


-- ------------------------------------------------------------
-- 13. INITIAL DEPARTMENTS
-- ------------------------------------------------------------

INSERT INTO departments
    (name, description)
VALUES
    (
        'Roads & Transport',
        'Roads, potholes, traffic infrastructure and related civic issues'
    ),

    (
        'Sanitation',
        'Garbage collection, waste disposal and cleanliness'
    ),

    (
        'Water Supply',
        'Water supply, pipelines and public water infrastructure'
    ),

    (
        'Electricity',
        'Electrical infrastructure and power-related civic issues'
    ),

    (
        'Drainage',
        'Stormwater drainage, sewage and drainage infrastructure'
    ),

    (
        'Public Works',
        'General public infrastructure and municipal construction'
    ),

    (
        'Parks & Horticulture',
        'Public parks, trees, gardens and horticulture'
    ),

    (
        'Street Lighting',
        'Public streetlights and lighting infrastructure'
    ),

    (
        'Municipal Corporation',
        'General municipal issues that do not belong to another department'
    ),

    (
        'Other',
        'Issues that do not clearly belong to another department'
    );


-- ============================================================
-- END OF CIVIFIX SCHEMA
-- ============================================================