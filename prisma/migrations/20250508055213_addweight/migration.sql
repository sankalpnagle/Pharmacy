/*
  Warnings:

  - Added the required column `weight` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product` ADD COLUMN `weight` DECIMAL(10, 2) NOT NULL;
