-- CreateEnum
CREATE TYPE "ReservationCategory" AS ENUM ('ACADEMIC_SPACE', 'SPORTS_FACILITY');

-- AlterTable
ALTER TABLE "ActivityRegistration" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ReservationParticipant" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReservationRestriction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "ReservationCategory" NOT NULL,
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "bannedUntil" TIMESTAMP(3),
    "lastViolatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReservationRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationParticipant_userId_createdAt_idx" ON "ReservationParticipant"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReservationParticipant_orderId_checkedInAt_idx" ON "ReservationParticipant"("orderId", "checkedInAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationParticipant_orderId_userId_key" ON "ReservationParticipant"("orderId", "userId");

-- CreateIndex
CREATE INDEX "UserReservationRestriction_category_bannedUntil_idx" ON "UserReservationRestriction"("category", "bannedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "UserReservationRestriction_userId_category_key" ON "UserReservationRestriction"("userId", "category");

-- AddForeignKey
ALTER TABLE "ReservationParticipant" ADD CONSTRAINT "ReservationParticipant_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationParticipant" ADD CONSTRAINT "ReservationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReservationRestriction" ADD CONSTRAINT "UserReservationRestriction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
