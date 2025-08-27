-- CreateEnum
CREATE TYPE "public"."Permission" AS ENUM ('CONTENT_CREATE', 'PLAYLIST_ASSIGN', 'USER_CONTROL');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('IMAGE', 'VIDEO', 'PDF', 'URL', 'YOUTUBE', 'TEXT');

-- CreateEnum
CREATE TYPE "public"."TransitionType" AS ENUM ('CUT', 'FADE', 'CROSSFADE', 'DISSOLVE', 'WIPE', 'ZOOM', 'PUSH', 'SLIDE_OVER', 'IRIS', 'MORPH', 'BURN', 'BARN_DOORS', 'PAGE_ROLL', 'PEEL');

-- CreateEnum
CREATE TYPE "public"."DisplayOrientation" AS ENUM ('LANDSCAPE', 'PORTRAIT');

-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "permissions" "public"."Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Content" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ContentType" NOT NULL,
    "filePath" TEXT,
    "metadata" JSONB,
    "backgroundColor" TEXT,
    "cropSettings" JSONB,
    "fileSize" BIGINT,
    "mimeType" TEXT,
    "originalName" TEXT,
    "fileHash" TEXT,
    "processingStatus" "public"."ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "storageLocation" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Playlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlaylistItem" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "transitionType" "public"."TransitionType" NOT NULL DEFAULT 'CUT',
    "transitionDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Display" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "urlSlug" TEXT NOT NULL,
    "playlistId" TEXT,
    "resolution" TEXT NOT NULL DEFAULT '1920x1080',
    "orientation" "public"."DisplayOrientation" NOT NULL DEFAULT 'LANDSCAPE',
    "lastSeen" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Display_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileThumbnail" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileThumbnail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileVersion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "changes" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ErrorLog" (
    "id" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "metadata" TEXT,
    "userAgent" TEXT,
    "url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ViewLog" (
    "id" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "expectedDuration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "skipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ViewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE INDEX "Content_type_idx" ON "public"."Content"("type");

-- CreateIndex
CREATE INDEX "Content_createdAt_idx" ON "public"."Content"("createdAt");

-- CreateIndex
CREATE INDEX "Content_uploadedBy_idx" ON "public"."Content"("uploadedBy");

-- CreateIndex
CREATE INDEX "Content_fileHash_idx" ON "public"."Content"("fileHash");

-- CreateIndex
CREATE INDEX "Content_processingStatus_idx" ON "public"."Content"("processingStatus");

-- CreateIndex
CREATE INDEX "Playlist_createdBy_idx" ON "public"."Playlist"("createdBy");

-- CreateIndex
CREATE INDEX "Playlist_isActive_idx" ON "public"."Playlist"("isActive");

-- CreateIndex
CREATE INDEX "PlaylistItem_playlistId_order_idx" ON "public"."PlaylistItem"("playlistId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistItem_playlistId_order_key" ON "public"."PlaylistItem"("playlistId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Display_urlSlug_key" ON "public"."Display"("urlSlug");

-- CreateIndex
CREATE INDEX "Display_urlSlug_idx" ON "public"."Display"("urlSlug");

-- CreateIndex
CREATE INDEX "Display_isOnline_idx" ON "public"."Display"("isOnline");

-- CreateIndex
CREATE INDEX "Display_playlistId_idx" ON "public"."Display"("playlistId");

-- CreateIndex
CREATE INDEX "FileThumbnail_contentId_idx" ON "public"."FileThumbnail"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "FileThumbnail_contentId_size_key" ON "public"."FileThumbnail"("contentId", "size");

-- CreateIndex
CREATE INDEX "FileVersion_contentId_idx" ON "public"."FileVersion"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "FileVersion_contentId_version_key" ON "public"."FileVersion"("contentId", "version");

-- CreateIndex
CREATE INDEX "ErrorLog_displayId_idx" ON "public"."ErrorLog"("displayId");

-- CreateIndex
CREATE INDEX "ErrorLog_errorType_idx" ON "public"."ErrorLog"("errorType");

-- CreateIndex
CREATE INDEX "ErrorLog_timestamp_idx" ON "public"."ErrorLog"("timestamp");

-- CreateIndex
CREATE INDEX "ViewLog_displayId_idx" ON "public"."ViewLog"("displayId");

-- CreateIndex
CREATE INDEX "ViewLog_playlistId_idx" ON "public"."ViewLog"("playlistId");

-- CreateIndex
CREATE INDEX "ViewLog_contentId_idx" ON "public"."ViewLog"("contentId");

-- CreateIndex
CREATE INDEX "ViewLog_viewedAt_idx" ON "public"."ViewLog"("viewedAt");

-- AddForeignKey
ALTER TABLE "public"."Content" ADD CONSTRAINT "Content_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Playlist" ADD CONSTRAINT "Playlist_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlaylistItem" ADD CONSTRAINT "PlaylistItem_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "public"."Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlaylistItem" ADD CONSTRAINT "PlaylistItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Display" ADD CONSTRAINT "Display_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "public"."Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileThumbnail" ADD CONSTRAINT "FileThumbnail_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileVersion" ADD CONSTRAINT "FileVersion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileVersion" ADD CONSTRAINT "FileVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ErrorLog" ADD CONSTRAINT "ErrorLog_displayId_fkey" FOREIGN KEY ("displayId") REFERENCES "public"."Display"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ViewLog" ADD CONSTRAINT "ViewLog_displayId_fkey" FOREIGN KEY ("displayId") REFERENCES "public"."Display"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ViewLog" ADD CONSTRAINT "ViewLog_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "public"."Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ViewLog" ADD CONSTRAINT "ViewLog_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
