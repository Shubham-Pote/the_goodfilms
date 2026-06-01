/*
  Warnings:

  - Added the required column `title` to the `uploads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "uploads" ADD COLUMN     "title" TEXT NOT NULL;
