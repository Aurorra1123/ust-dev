-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('ACADEMIC_SPACE', 'SPORTS_FACILITY');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ResourceAvailabilityMode" AS ENUM ('CONTINUOUS', 'DISCRETE_SLOT');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityTicketStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OrderBizType" AS ENUM ('RESOURCE_RESERVATION', 'ACTIVITY_REGISTRATION');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "creditScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceUnit" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "availabilityMode" "ResourceAvailabilityMode" NOT NULL,
    "capacity" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceGroup" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceGroupItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "resourceUnitId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ResourceGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "totalQuota" INTEGER NOT NULL,
    "saleStartTime" TIMESTAMP(3) NOT NULL,
    "saleEndTime" TIMESTAMP(3) NOT NULL,
    "eventStartTime" TIMESTAMP(3),
    "eventEndTime" TIMESTAMP(3),
    "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityTicket" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "status" "ActivityTicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT,
    "bizType" "OrderBizType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "version" INTEGER NOT NULL DEFAULT 1,
    "expireAt" TIMESTAMP(3),
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "resourceId" TEXT,
    "resourceUnitId" TEXT,
    "activityTicketId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "slotCount" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "bufferBeforeMin" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMin" INTEGER NOT NULL DEFAULT 0,
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "payStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionNo" TEXT,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expression" JSONB,
    "status" "RuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceRuleBinding" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceRuleBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRuleProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "profileValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRuleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCreditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreDelta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCreditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_code_key" ON "Resource"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceUnit_code_key" ON "ResourceUnit"("code");

-- CreateIndex
CREATE INDEX "ResourceUnit_resourceId_sortOrder_idx" ON "ResourceUnit"("resourceId", "sortOrder");

-- CreateIndex
CREATE INDEX "ResourceGroup_resourceId_idx" ON "ResourceGroup"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceGroup_resourceId_name_key" ON "ResourceGroup"("resourceId", "name");

-- CreateIndex
CREATE INDEX "ResourceGroupItem_resourceUnitId_idx" ON "ResourceGroupItem"("resourceUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceGroupItem_groupId_resourceUnitId_key" ON "ResourceGroupItem"("groupId", "resourceUnitId");

-- CreateIndex
CREATE INDEX "Activity_status_saleStartTime_idx" ON "Activity"("status", "saleStartTime");

-- CreateIndex
CREATE INDEX "ActivityTicket_activityId_status_idx" ON "ActivityTicket"("activityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityTicket_activityId_name_key" ON "ActivityTicket"("activityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_activityId_idx" ON "Order"("activityId");

-- CreateIndex
CREATE INDEX "Order_status_expireAt_idx" ON "Order"("status", "expireAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_resourceUnitId_startTime_idx" ON "OrderItem"("resourceUnitId", "startTime");

-- CreateIndex
CREATE INDEX "OrderItem_activityTicketId_idx" ON "OrderItem"("activityTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_transactionNo_key" ON "PaymentRecord"("transactionNo");

-- CreateIndex
CREATE INDEX "PaymentRecord_orderId_payStatus_idx" ON "PaymentRecord"("orderId", "payStatus");

-- CreateIndex
CREATE INDEX "OrderStatusLog_orderId_createdAt_idx" ON "OrderStatusLog"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceRuleBinding_ruleId_idx" ON "ResourceRuleBinding"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceRuleBinding_resourceId_ruleId_key" ON "ResourceRuleBinding"("resourceId", "ruleId");

-- CreateIndex
CREATE INDEX "UserRuleProfile_ruleId_idx" ON "UserRuleProfile"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRuleProfile_userId_ruleId_key" ON "UserRuleProfile"("userId", "ruleId");

-- CreateIndex
CREATE INDEX "UserCreditLog_userId_createdAt_idx" ON "UserCreditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ResourceUnit" ADD CONSTRAINT "ResourceUnit_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceGroup" ADD CONSTRAINT "ResourceGroup_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceGroupItem" ADD CONSTRAINT "ResourceGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ResourceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceGroupItem" ADD CONSTRAINT "ResourceGroupItem_resourceUnitId_fkey" FOREIGN KEY ("resourceUnitId") REFERENCES "ResourceUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityTicket" ADD CONSTRAINT "ActivityTicket_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_resourceUnitId_fkey" FOREIGN KEY ("resourceUnitId") REFERENCES "ResourceUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_activityTicketId_fkey" FOREIGN KEY ("activityTicketId") REFERENCES "ActivityTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusLog" ADD CONSTRAINT "OrderStatusLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRuleBinding" ADD CONSTRAINT "ResourceRuleBinding_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRuleBinding" ADD CONSTRAINT "ResourceRuleBinding_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRuleProfile" ADD CONSTRAINT "UserRuleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRuleProfile" ADD CONSTRAINT "UserRuleProfile_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreditLog" ADD CONSTRAINT "UserCreditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
