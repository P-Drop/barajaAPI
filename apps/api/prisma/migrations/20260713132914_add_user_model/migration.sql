-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "nicknameNormalized" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "totalPlaySeconds" INTEGER NOT NULL DEFAULT 0,
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nicknameNormalized_key" ON "User"("nicknameNormalized");
