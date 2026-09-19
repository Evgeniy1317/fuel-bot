-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('ru', 'ro');

-- CreateEnum
CREATE TYPE "CountryCode" AS ENUM ('PMR', 'MD');

-- CreateEnum
CREATE TYPE "FuelKind" AS ENUM ('AI92', 'AI95', 'AI98', 'DIESEL', 'LPG');

-- CreateEnum
CREATE TYPE "VehiclePropulsion" AS ENUM ('GASOLINE', 'LPG');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'COMPLIMENTARY', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "AlertKind" AS ENUM ('PRICE_UP', 'PRICE_DOWN', 'PREDICTED_HIKE');

-- CreateEnum
CREATE TYPE "AlertOutcome" AS ENUM ('PENDING', 'HIT', 'MISS', 'WAIVED');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('API', 'NEWS_SITE', 'TG_CHANNEL', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'ru',
    "country" "CountryCode",
    "dailyKm" DECIMAL(8,1),
    "watchFuels" "FuelKind"[],
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "litersPer100km" DECIMAL(5,2) NOT NULL,
    "propulsion" "VehiclePropulsion" NOT NULL,
    "fillGrade" "FuelKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "country" "CountryCode" NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameRo" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "fuel" "FuelKind" NOT NULL,
    "amount" DECIMAL(10,3) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "source" "PriceSource" NOT NULL,
    "sourceRef" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AlertKind" NOT NULL,
    "fuel" "FuelKind" NOT NULL,
    "country" "CountryCode" NOT NULL,
    "predictedAmount" DECIMAL(10,3),
    "actualAmount" DECIMAL(10,3),
    "currencyCode" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "outcome" "AlertOutcome" NOT NULL DEFAULT 'PENDING',
    "predictionWindowEndsAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "currentPeriodEndsAt" TIMESTAMP(3),
    "starsChargeId" TEXT,
    "complimentaryReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "liters" DECIMAL(10,2) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsEvent" (
    "id" TEXT NOT NULL,
    "source" "PriceSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "country" "CountryCode",
    "rawText" TEXT NOT NULL,
    "extracted" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_country_idx" ON "User"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_userId_key" ON "Vehicle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_country_key" ON "Region"("country");

-- CreateIndex
CREATE INDEX "PriceHistory_regionId_fuel_observedAt_idx" ON "PriceHistory"("regionId", "fuel", "observedAt");

-- CreateIndex
CREATE INDEX "Alert_userId_sentAt_idx" ON "Alert"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "Alert_outcome_predictionWindowEndsAt_idx" ON "Alert"("outcome", "predictionWindowEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "SavingsRecord_userId_periodStart_idx" ON "SavingsRecord"("userId", "periodStart");

-- CreateIndex
CREATE INDEX "SavingsRecord_amount_idx" ON "SavingsRecord"("amount");

-- CreateIndex
CREATE UNIQUE INDEX "NewsEvent_source_externalId_key" ON "NewsEvent"("source", "externalId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsRecord" ADD CONSTRAINT "SavingsRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
