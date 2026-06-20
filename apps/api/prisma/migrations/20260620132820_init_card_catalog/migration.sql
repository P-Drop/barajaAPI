-- CreateEnum
CREATE TYPE "Suit" AS ENUM ('OROS', 'COPAS', 'ESPADAS', 'BASTOS');

-- CreateTable
CREATE TABLE "Card" (
    "id" SERIAL NOT NULL,
    "value" INTEGER,
    "suit" "Suit",
    "isJoker" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_suit_value_key" ON "Card"("suit", "value");
