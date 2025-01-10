-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "totalSupply" DOUBLE PRECISION NOT NULL,
    "logo" TEXT,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" SERIAL NOT NULL,
    "baseTokenAddress" VARCHAR(42) NOT NULL,
    "quoteTokenAddress" VARCHAR(42) NOT NULL,
    "chainId" INTEGER NOT NULL,
    "pairAddress" VARCHAR(42) NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_key" ON "Token"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Pool_pairAddress_key" ON "Pool"("pairAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");
