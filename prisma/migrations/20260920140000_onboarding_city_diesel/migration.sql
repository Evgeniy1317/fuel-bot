-- AlterEnum
ALTER TYPE "VehiclePropulsion" ADD VALUE 'DIESEL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "city" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "brand" DROP NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "model" DROP NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "litersPer100km" DROP NOT NULL;
