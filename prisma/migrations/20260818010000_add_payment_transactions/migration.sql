CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerTransactionId" TEXT NOT NULL,
    "referenceCode" TEXT,
    "gateway" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "amount" DECIMAL(12,0) NOT NULL,
    "transactionDate" TIMESTAMP(3),
    "rawPayload" JSONB NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentTransaction_provider_providerTransactionId_key"
ON "PaymentTransaction"("provider", "providerTransactionId");

CREATE INDEX "PaymentTransaction_orderId_createdAt_idx"
ON "PaymentTransaction"("orderId", "createdAt");

ALTER TABLE "PaymentTransaction"
ADD CONSTRAINT "PaymentTransaction_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
