-- Ensure necessary extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for user roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user');
    END IF;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    last_active TIMESTAMPTZ NOT NULL
);

COMMENT ON COLUMN users.is_admin IS 'role=''admin'' typically implies is_admin=true but not enforced';

-- Permissions table (1:1 with users.id)
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    can_manage_users BOOLEAN NOT NULL DEFAULT false,
    can_manage_displays BOOLEAN NOT NULL DEFAULT false,
    can_manage_settings BOOLEAN NOT NULL DEFAULT false,
    can_edit_content BOOLEAN NOT NULL DEFAULT true,
    can_create_playlists BOOLEAN NOT NULL DEFAULT true
);

-- ROLLBACK
-- DROP TABLE IF EXISTS user_permissions;
-- DROP TABLE IF EXISTS users;
-- DROP TYPE IF EXISTS user_role;
/*
Explanation:
- pgcrypto preferred for gen_random_uuid(); uuid-ossp added for fallback uuid generation.
- user_role enum constrains role values.
- users table enforces uniqueness on email and keeps is_admin independent of role.
- user_permissions stores per-user flags in a 1:1 related table with cascading delete.
*/
