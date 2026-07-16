CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('subsystem_admin', 'staff', 'opcr_evaluator');
CREATE TYPE office_code AS ENUM ('ADMIN_OFFICE', 'ACADEMIC_OFFICE', 'OSAS');

CREATE TABLE offices (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    code        office_code NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id          UUID PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(200) NOT NULL UNIQUE,
    role        user_role NOT NULL,
    office_id   UUID NOT NULL REFERENCES offices(id),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_office ON users(office_id);
CREATE INDEX idx_users_role ON users(role);

CREATE OR REPLACE FUNCTION fn_sync_user(
    p_id        UUID,
    p_name      VARCHAR,
    p_email     VARCHAR,
    p_role      user_role,
    p_office_id UUID,
    p_office_code office_code DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO users (id, name, email, role, office_id, synced_at)
    VALUES (p_id, p_name, p_email, p_role, p_office_id, NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        office_id = EXCLUDED.office_id,
        is_active = TRUE,
        synced_at = NOW();
END;
$$;

-- Seed offices
INSERT INTO offices (id, name, code) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Administrative Office',                   'ADMIN_OFFICE'),
    ('00000000-0000-0000-0000-000000000002', 'Academic Office',                         'ACADEMIC_OFFICE'),
    ('00000000-0000-0000-0000-000000000003', 'Office of Student Affairs and Services',  'OSAS')
ON CONFLICT DO NOTHING;

-- Seed baseline teachers
INSERT INTO users (id, name, email, role, office_id) VALUES
    ('22000000-0000-0000-0000-000000000001', 'Prof. Juan Dela Cruz', 'jdelacruz_teacher@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000001'),
    ('22000000-0000-0000-0000-000000000002', 'Prof. Maria Clara', 'mclara_teacher@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000001'),
    ('22000000-0000-0000-0000-000000000003', 'Prof. Crisostomo Ibarra', 'cibarra_teacher@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000001'),
    ('22000000-0000-0000-0000-000000000004', 'Prof. Juan Dela Cruz (Acad)', 'jdelacruz_teacher_acad@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000002'),
    ('22000000-0000-0000-0000-000000000005', 'Prof. Maria Clara (Acad)', 'mclara_teacher_acad@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000002'),
    ('22000000-0000-0000-0000-000000000006', 'Prof. Crisostomo Ibarra (Acad)', 'cibarra_teacher_acad@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000002'),
    ('22000000-0000-0000-0000-000000000007', 'Prof. Juan Dela Cruz (OSAS)', 'jdelacruz_teacher_osas@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000003'),
    ('22000000-0000-0000-0000-000000000008', 'Prof. Maria Clara (OSAS)', 'mclara_teacher_osas@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000003'),
    ('22000000-0000-0000-0000-000000000009', 'Prof. Crisostomo Ibarra (OSAS)', 'cibarra_teacher_osas@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
