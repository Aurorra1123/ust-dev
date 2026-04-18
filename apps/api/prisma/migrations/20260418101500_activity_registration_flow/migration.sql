CREATE TABLE "ActivityRegistration" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "activityTicketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActivityRegistration_orderId_key" ON "ActivityRegistration"("orderId");
CREATE INDEX "ActivityRegistration_activityId_createdAt_idx" ON "ActivityRegistration"("activityId", "createdAt");
CREATE INDEX "ActivityRegistration_activityTicketId_idx" ON "ActivityRegistration"("activityTicketId");
CREATE INDEX "ActivityRegistration_userId_createdAt_idx" ON "ActivityRegistration"("userId", "createdAt");
CREATE UNIQUE INDEX "activity_registration_active_user_unique"
ON "ActivityRegistration"("activityId", "userId")
WHERE "status" IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'NO_SHOW');

ALTER TABLE "ActivityTicket"
ADD CONSTRAINT "ActivityTicket_reserved_range_check"
CHECK ("reserved" >= 0 AND "reserved" <= "stock");

ALTER TABLE "ActivityRegistration"
ADD CONSTRAINT "ActivityRegistration_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityRegistration"
ADD CONSTRAINT "ActivityRegistration_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityRegistration"
ADD CONSTRAINT "ActivityRegistration_activityTicketId_fkey"
FOREIGN KEY ("activityTicketId") REFERENCES "ActivityTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActivityRegistration"
ADD CONSTRAINT "ActivityRegistration_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
