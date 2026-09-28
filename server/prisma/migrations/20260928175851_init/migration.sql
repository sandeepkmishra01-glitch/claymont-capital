-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('active', 'won', 'lost');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "avatar_color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stages" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "short_label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "color_hex" TEXT NOT NULL,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "industries" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "sources" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "legal_name" TEXT,
    "website" TEXT,
    "founded_year" INTEGER,
    "employee_count" INTEGER,
    "industry_key" TEXT,
    "location" TEXT,
    "description" TEXT,
    "stage_key" TEXT,
    "status" "DealStatus" NOT NULL DEFAULT 'active',
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "revenue" DOUBLE PRECISION,
    "ebitda" DOUBLE PRECISION,
    "asking_price" DOUBLE PRECISION,
    "asking_multiple" DOUBLE PRECISION,
    "source_key" TEXT,
    "deal_lead_id" UUID,
    "next_action" TEXT,
    "next_action_due_date" DATE,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "close_reason" TEXT,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_assignees" (
    "deal_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,

    CONSTRAINT "deal_assignees_pkey" PRIMARY KEY ("deal_id","member_id")
);

-- CreateTable
CREATE TABLE "stage_history" (
    "id" UUID NOT NULL,
    "deal_id" UUID NOT NULL,
    "from_stage_key" TEXT,
    "to_stage_key" TEXT NOT NULL,
    "changed_by" UUID,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" UUID NOT NULL,
    "deal_id" UUID,
    "member_id" UUID,
    "action_type" TEXT NOT NULL,
    "action_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "deal_id" UUID NOT NULL,
    "member_id" UUID,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "deal_id" UUID,
    "uploader_id" UUID,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT,
    "doc_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stage_history_deal_id_changed_at_idx" ON "stage_history"("deal_id", "changed_at");

-- CreateIndex
CREATE INDEX "activity_log_created_at_idx" ON "activity_log"("created_at");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_industry_key_fkey" FOREIGN KEY ("industry_key") REFERENCES "industries"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_key_fkey" FOREIGN KEY ("stage_key") REFERENCES "stages"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_source_key_fkey" FOREIGN KEY ("source_key") REFERENCES "sources"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_deal_lead_id_fkey" FOREIGN KEY ("deal_lead_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_assignees" ADD CONSTRAINT "deal_assignees_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_assignees" ADD CONSTRAINT "deal_assignees_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_from_stage_key_fkey" FOREIGN KEY ("from_stage_key") REFERENCES "stages"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_to_stage_key_fkey" FOREIGN KEY ("to_stage_key") REFERENCES "stages"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
