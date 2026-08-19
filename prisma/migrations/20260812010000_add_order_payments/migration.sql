CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED');

ALTER TABLE "Order"
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "paymentRequired" DECIMAL(12,0) NOT NULL DEFAULT 0,
ADD COLUMN "paidAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_paymentReference_key" ON "Order"("paymentReference");
