/*
  Warnings:

  - You are about to alter the column `address` on the `Token` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(42)`.

*/
-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "address" SET DATA TYPE VARCHAR(42),
ALTER COLUMN "totalSupply" SET DATA TYPE DOUBLE PRECISION;
