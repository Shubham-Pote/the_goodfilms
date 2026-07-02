/*
  Warnings:

  - You are about to drop the `WatchHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WatchHistory" DROP CONSTRAINT "WatchHistory_userId_fkey";

-- DropTable
DROP TABLE "WatchHistory";
