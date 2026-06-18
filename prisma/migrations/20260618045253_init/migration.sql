-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar" TEXT,
    "avatarKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT '',
    "logo" TEXT,
    "favicon" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "copyrightText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_pages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_meta" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "label" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_role_idx" ON "users"("email", "role");

-- CreateIndex
CREATE UNIQUE INDEX "cms_pages_slug_key" ON "cms_pages"("slug");

-- CreateIndex
CREATE INDEX "cms_pages_slug_idx" ON "cms_pages"("slug");

-- CreateIndex
CREATE INDEX "cms_pages_status_idx" ON "cms_pages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "seo_meta_pageKey_key" ON "seo_meta"("pageKey");

-- CreateIndex
CREATE INDEX "seo_meta_pageKey_idx" ON "seo_meta"("pageKey");

-- CreateIndex
CREATE INDEX "otp_verifications_phoneNumber_idx" ON "otp_verifications"("phoneNumber");

-- CreateIndex
CREATE INDEX "otp_verifications_phoneNumber_verified_idx" ON "otp_verifications"("phoneNumber", "verified");
