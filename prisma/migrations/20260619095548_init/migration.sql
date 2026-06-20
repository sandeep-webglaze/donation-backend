-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "pageKey" TEXT NOT NULL DEFAULT 'home',
    "section" TEXT NOT NULL DEFAULT 'gallery',
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_blocks" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "body" TEXT,
    "settings" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gallery_items_pageKey_section_sortOrder_idx" ON "gallery_items"("pageKey", "section", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "content_blocks_pageKey_sectionKey_key" ON "content_blocks"("pageKey", "sectionKey");
