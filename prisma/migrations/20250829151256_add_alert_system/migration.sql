-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AlertCategory" AS ENUM ('DISPLAY', 'CONTENT', 'PLAYLIST', 'SYSTEM', 'USER');

-- CreateTable
CREATE TABLE "public"."Alert" (
    "id" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "category" "public"."AlertCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "displayId" TEXT,
    "userId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "public"."Alert"("type");

-- CreateIndex
CREATE INDEX "Alert_category_idx" ON "public"."Alert"("category");

-- CreateIndex
CREATE INDEX "Alert_displayId_idx" ON "public"."Alert"("displayId");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "public"."Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_resolved_idx" ON "public"."Alert"("resolved");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "public"."Alert"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_displayId_fkey" FOREIGN KEY ("displayId") REFERENCES "public"."Display"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
