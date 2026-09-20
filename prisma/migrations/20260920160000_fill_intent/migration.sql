-- CreateEnum
CREATE TYPE "FillIntentStatus" AS ENUM ('OFFERED', 'CONFIRMED', 'RESOLVED');

-- CreateTable
CREATE TABLE "FillIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fuel" "FuelKind" NOT NULL,
    "country" "CountryCode" NOT NULL,
    "priceAtFill" DECIMAL(10,3) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "status" "FillIntentStatus" NOT NULL DEFAULT 'OFFERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "FillIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FillIntent_userId_status_idx" ON "FillIntent"("userId", "status");

-- CreateIndex
CREATE INDEX "FillIntent_country_fuel_status_idx" ON "FillIntent"("country", "fuel", "status");

-- AddForeignKey
ALTER TABLE "FillIntent" ADD CONSTRAINT "FillIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
