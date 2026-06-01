/*
  Warnings:

  - Added the required column `runtime` to the `uploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `synopsis` to the `uploads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "uploads" ADD COLUMN     "runtime" INTEGER NOT NULL,
ADD COLUMN     "synopsis" TEXT NOT NULL;
