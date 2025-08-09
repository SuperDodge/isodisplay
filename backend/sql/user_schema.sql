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

-- Content items represent media or text to be shown on displays
CREATE TABLE IF NOT EXISTS content_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    duration BIGINT,
    thumbnail TEXT,
    description TEXT,
    tags JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    pdf_page BOOLEAN NOT NULL DEFAULT false,
    background_color TEXT,
    text_color TEXT,
    font_size TEXT,
    created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by TEXT,
    is_sample BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON COLUMN content_item.content IS 'May hold plain text or URL; adjust type if needed';

CREATE INDEX IF NOT EXISTS idx_content_item_created_by_id ON content_item(created_by_id);

-- Playlists group content items with an optional order
CREATE TABLE IF NOT EXISTS playlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    content_items JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    loop BOOLEAN NOT NULL DEFAULT false,
    transition_effect TEXT,
    created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by TEXT,
    is_sample BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON COLUMN playlist.content_items IS 'Legacy denormalized list; see playlist_content_item for normalized order';
CREATE INDEX IF NOT EXISTS idx_playlist_created_by_id ON playlist(created_by_id);

-- Displays show playlists in physical locations
CREATE TABLE IF NOT EXISTS display (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    active_playlist_id UUID,
    background_color TEXT,
    show_clock BOOLEAN NOT NULL DEFAULT false,
    clock_position TEXT,
    refresh_interval BIGINT,
    last_ping TIMESTAMPTZ,
    created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by TEXT,
    is_sample BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_display_active_playlist FOREIGN KEY (active_playlist_id) REFERENCES playlist(id) ON DELETE SET NULL
);
COMMENT ON COLUMN display.last_ping IS 'Assumed to be timestamp; original CSV stored as text';

CREATE INDEX IF NOT EXISTS idx_display_active_playlist_id ON display(active_playlist_id);
CREATE INDEX IF NOT EXISTS idx_display_created_by_id ON display(created_by_id);

-- Display settings (1:1 with display); largely duplicates display fields
CREATE TABLE IF NOT EXISTS display_settings (
    display_id UUID PRIMARY KEY REFERENCES display(id) ON DELETE CASCADE,
    active_playlist_id UUID,
    background_color TEXT,
    show_clock BOOLEAN NOT NULL DEFAULT false,
    clock_position TEXT,
    refresh_interval BIGINT,
    created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by TEXT,
    is_sample BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_display_settings_active_playlist FOREIGN KEY (active_playlist_id) REFERENCES playlist(id) ON DELETE SET NULL
);
COMMENT ON COLUMN display_settings.active_playlist_id IS 'Redundant with display.active_playlist_id; kept for compatibility';
COMMENT ON TABLE display_settings IS 'Assumed 1:1 with display; original CSV used display_name';

CREATE INDEX IF NOT EXISTS idx_display_settings_active_playlist_id ON display_settings(active_playlist_id);
CREATE INDEX IF NOT EXISTS idx_display_settings_created_by_id ON display_settings(created_by_id);

-- Junction table capturing ordered items within a playlist
CREATE TABLE IF NOT EXISTS playlist_content_item (
    playlist_id UUID NOT NULL REFERENCES playlist(id) ON DELETE CASCADE,
    content_item_id UUID NOT NULL REFERENCES content_item(id) ON DELETE CASCADE,
    position INT NOT NULL,
    duration BIGINT,
    PRIMARY KEY (playlist_id, position),
    UNIQUE (playlist_id, content_item_id)
);
COMMENT ON TABLE playlist_content_item IS 'Order of content items in a playlist; duration overrides content_item.duration if set';
CREATE INDEX IF NOT EXISTS idx_playlist_content_item_content_id ON playlist_content_item(content_item_id);

-- ROLLBACK
-- DROP TABLE IF EXISTS playlist_content_item;
-- DROP TABLE IF EXISTS display_settings;
-- DROP TABLE IF EXISTS display;
-- DROP TABLE IF EXISTS playlist;
-- DROP TABLE IF EXISTS content_item;
-- DROP TABLE IF EXISTS user_permissions;
-- DROP TABLE IF EXISTS users;
-- DROP TYPE IF EXISTS user_role;

/*
Explanation:
- pgcrypto preferred for gen_random_uuid(); uuid-ossp added for fallback uuid generation.
- user_role enum constrains role values.
- users table enforces uniqueness on email and keeps is_admin independent of role.
- user_permissions stores per-user flags in a 1:1 related table with cascading delete.
- content_item, playlist, display, and display_settings model the Base44 schema;
  some assumptions (e.g., last_ping type, redundant active_playlist_id) may need review.
- playlist_content_item normalizes playlist.content_items for ordered many-to-many relations.
*/
