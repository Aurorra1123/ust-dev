-- CreateEnum
CREATE TYPE "ResourceReleaseFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "ResourceReleaseRule" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "frequency" "ResourceReleaseFrequency" NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceReleaseRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceBookingClosure" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceBookingClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceReleaseRule_resourceId_isActive_idx" ON "ResourceReleaseRule"("resourceId", "isActive");

-- CreateIndex
CREATE INDEX "ResourceBookingClosure_resourceId_startsAt_idx" ON "ResourceBookingClosure"("resourceId", "startsAt");

-- CreateIndex
CREATE INDEX "ResourceBookingClosure_resourceId_isActive_idx" ON "ResourceBookingClosure"("resourceId", "isActive");

-- AddForeignKey
ALTER TABLE "ResourceReleaseRule" ADD CONSTRAINT "ResourceReleaseRule_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBookingClosure" ADD CONSTRAINT "ResourceBookingClosure_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
