-- CreateTable
CREATE TABLE "Pair" (
    "id" SERIAL NOT NULL,
    "baseTokenAddress" VARCHAR(42) NOT NULL,
    "quoteTokenAddress" VARCHAR(42) NOT NULL,
    "chainId" INTEGER NOT NULL,
    "pairAddress" VARCHAR(42) NOT NULL,

    CONSTRAINT "Pair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pair_pairAddress_key" ON "Pair"("pairAddress");
