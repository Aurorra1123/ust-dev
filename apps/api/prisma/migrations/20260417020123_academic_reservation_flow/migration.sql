CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateTable
CREATE TABLE "AcademicReservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceUnitId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "bufferBeforeMin" INTEGER NOT NULL DEFAULT 5,
    "bufferAfterMin" INTEGER NOT NULL DEFAULT 5,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicReservation_orderId_key" ON "AcademicReservation"("orderId");

-- CreateIndex
CREATE INDEX "AcademicReservation_resourceUnitId_startTime_idx" ON "AcademicReservation"("resourceUnitId", "startTime");

-- CreateIndex
CREATE INDEX "AcademicReservation_userId_createdAt_idx" ON "AcademicReservation"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AcademicReservation" ADD CONSTRAINT "AcademicReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicReservation" ADD CONSTRAINT "AcademicReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicReservation" ADD CONSTRAINT "AcademicReservation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicReservation" ADD CONSTRAINT "AcademicReservation_resourceUnitId_fkey" FOREIGN KEY ("resourceUnitId") REFERENCES "ResourceUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Protect academic space reservations from overlapping buffered ranges.
ALTER TABLE "AcademicReservation"
ADD CONSTRAINT "academic_reservation_no_overlap"
EXCLUDE USING GIST (
    "resourceUnitId" WITH =,
    tsrange(
        "startTime" - ("bufferBeforeMin" * INTERVAL '1 minute'),
        "endTime" + ("bufferAfterMin" * INTERVAL '1 minute'),
        '[)'
    ) WITH &&
)
WHERE ("status" IN ('PENDING_CONFIRMATION'::"OrderStatus", 'CONFIRMED'::"OrderStatus"));
