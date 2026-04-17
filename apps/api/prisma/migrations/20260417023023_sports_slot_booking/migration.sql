-- CreateTable
CREATE TABLE "SportsReservationSlot" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceUnitId" TEXT NOT NULL,
    "slotStart" TIMESTAMP(3) NOT NULL,
    "slotEnd" TIMESTAMP(3) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportsReservationSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SportsReservationSlot_resourceUnitId_slotStart_idx" ON "SportsReservationSlot"("resourceUnitId", "slotStart");

-- CreateIndex
CREATE INDEX "SportsReservationSlot_userId_createdAt_idx" ON "SportsReservationSlot"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SportsReservationSlot_orderId_idx" ON "SportsReservationSlot"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "sports_active_slot_unique"
ON "SportsReservationSlot"("resourceUnitId", "slotStart")
WHERE "status" IN ('PENDING_CONFIRMATION', 'CONFIRMED');

-- AddForeignKey
ALTER TABLE "SportsReservationSlot" ADD CONSTRAINT "SportsReservationSlot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportsReservationSlot" ADD CONSTRAINT "SportsReservationSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportsReservationSlot" ADD CONSTRAINT "SportsReservationSlot_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportsReservationSlot" ADD CONSTRAINT "SportsReservationSlot_resourceUnitId_fkey" FOREIGN KEY ("resourceUnitId") REFERENCES "ResourceUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
