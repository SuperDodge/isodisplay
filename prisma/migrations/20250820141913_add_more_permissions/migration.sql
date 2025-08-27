-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Permission" ADD VALUE 'CONTENT_DELETE';
ALTER TYPE "public"."Permission" ADD VALUE 'PLAYLIST_CREATE';
ALTER TYPE "public"."Permission" ADD VALUE 'PLAYLIST_DELETE';
ALTER TYPE "public"."Permission" ADD VALUE 'DISPLAY_CONTROL';
ALTER TYPE "public"."Permission" ADD VALUE 'SYSTEM_SETTINGS';
