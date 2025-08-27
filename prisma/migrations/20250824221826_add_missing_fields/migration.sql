-- AlterTable
ALTER TABLE "public"."Content" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "fileName" TEXT;

-- AlterTable
ALTER TABLE "public"."Playlist" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_PlaylistTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PlaylistTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_SharedPlaylists" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SharedPlaylists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "public"."Tag"("name");

-- CreateIndex
CREATE INDEX "_PlaylistTags_B_index" ON "public"."_PlaylistTags"("B");

-- CreateIndex
CREATE INDEX "_SharedPlaylists_B_index" ON "public"."_SharedPlaylists"("B");

-- AddForeignKey
ALTER TABLE "public"."_PlaylistTags" ADD CONSTRAINT "_PlaylistTags_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PlaylistTags" ADD CONSTRAINT "_PlaylistTags_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_SharedPlaylists" ADD CONSTRAINT "_SharedPlaylists_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_SharedPlaylists" ADD CONSTRAINT "_SharedPlaylists_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
