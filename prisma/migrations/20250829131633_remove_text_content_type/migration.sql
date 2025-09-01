-- AlterEnum
-- Remove TEXT from ContentType enum
BEGIN;

-- First, delete any content with type 'TEXT'
DELETE FROM "Content" WHERE type = 'TEXT';

-- Create new enum without TEXT
CREATE TYPE "ContentType_new" AS ENUM ('IMAGE', 'VIDEO', 'PDF', 'URL', 'YOUTUBE');

-- Update the column to use the new enum
ALTER TABLE "Content" ALTER COLUMN "type" TYPE "ContentType_new" USING ("type"::text::"ContentType_new");

-- Drop the old enum
DROP TYPE "ContentType";

-- Rename the new enum
ALTER TYPE "ContentType_new" RENAME TO "ContentType";

COMMIT;