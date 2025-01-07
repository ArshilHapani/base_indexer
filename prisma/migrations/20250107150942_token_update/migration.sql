/*
  Warnings:

  - You are about to drop the column `baseTokenId` on the `Pool` table. All the data in the column will be lost.
  - Added the required column `baseTokenAddress` to the `Pool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chainId` to the `Pool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chainId` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Pool" DROP CONSTRAINT "Pool_baseTokenId_fkey";

-- AlterTable
ALTER TABLE "Pool" DROP COLUMN "baseTokenId",
ADD COLUMN     "baseTokenAddress" TEXT NOT NULL,
ADD COLUMN     "chainId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "chainId" INTEGER NOT NULL;
