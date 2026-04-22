CREATE TYPE "PaymentCompensationType" AS ENUM ('LATE_CALLBACK_REJECTED');

CREATE TABLE "PaymentCompensationLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentRecordId" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "type" "PaymentCompensationType" NOT NULL,
    "reason" TEXT NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentCompensationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentCompensationLog_transactionNo_type_key"
ON "PaymentCompensationLog"("transactionNo", "type");

CREATE INDEX "PaymentCompensationLog_orderId_createdAt_idx"
ON "PaymentCompensationLog"("orderId", "createdAt");

CREATE INDEX "PaymentCompensationLog_paymentRecordId_createdAt_idx"
ON "PaymentCompensationLog"("paymentRecordId", "createdAt");

ALTER TABLE "PaymentCompensationLog"
ADD CONSTRAINT "PaymentCompensationLog_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentCompensationLog"
ADD CONSTRAINT "PaymentCompensationLog_paymentRecordId_fkey"
FOREIGN KEY ("paymentRecordId") REFERENCES "PaymentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
