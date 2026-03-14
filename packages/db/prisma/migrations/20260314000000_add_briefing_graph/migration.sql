-- AlterEnum: replace "generating" with "generating_doc"
ALTER TYPE "CampaignStatus" RENAME VALUE 'generating' TO 'generating_doc';

-- AlterEnum: add "briefing" if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'briefing' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CampaignStatus')) THEN
    ALTER TYPE "CampaignStatus" ADD VALUE 'briefing';
  END IF;
END$$;

-- AddColumn
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "briefingSummary" TEXT;

-- AlterEnum: add missing MediaType values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'x_post' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MediaType')) THEN
    ALTER TYPE "MediaType" ADD VALUE 'x_post';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'x_thread' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MediaType')) THEN
    ALTER TYPE "MediaType" ADD VALUE 'x_thread';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'linkedin_post' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MediaType')) THEN
    ALTER TYPE "MediaType" ADD VALUE 'linkedin_post';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'linkedin_carousel' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MediaType')) THEN
    ALTER TYPE "MediaType" ADD VALUE 'linkedin_carousel';
  END IF;
END$$;

-- CreateEnum
CREATE TYPE "SourceFileContentType" AS ENUM ('document', 'logo', 'photo', 'pdf', 'other');

-- AlterTable: source_connections
ALTER TABLE "source_connections" ADD COLUMN IF NOT EXISTS "folderNames" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: source_files
ALTER TABLE "source_files" ADD COLUMN IF NOT EXISTS "contentType" "SourceFileContentType" NOT NULL DEFAULT 'other';
ALTER TABLE "source_files" ADD COLUMN IF NOT EXISTS "imageData" TEXT;

-- Drop FK from campaigns to projects, drop projectId column, then drop projects table
ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "campaigns_projectId_fkey";
ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "projectId";
DROP INDEX IF EXISTS "campaigns_projectId_idx";
DROP TABLE IF EXISTS "projects";

-- CreateTable: campaign_messages
CREATE TABLE IF NOT EXISTS "campaign_messages" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "campaign_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "campaign_messages_campaignId_idx" ON "campaign_messages"("campaignId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_messages_campaignId_fkey') THEN
    ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- CreateTable: briefing_nodes
CREATE TABLE "briefing_nodes" (
    "id" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageData" TEXT,
    "imageMimeType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "briefing_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: briefing_edges
CREATE TABLE "briefing_edges" (
    "id" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "briefing_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "briefing_nodes_campaignId_idx" ON "briefing_nodes"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "briefing_edges_sourceId_targetId_key" ON "briefing_edges"("sourceId", "targetId");

-- AddForeignKey
ALTER TABLE "briefing_nodes" ADD CONSTRAINT "briefing_nodes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefing_edges" ADD CONSTRAINT "briefing_edges_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "briefing_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefing_edges" ADD CONSTRAINT "briefing_edges_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "briefing_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
