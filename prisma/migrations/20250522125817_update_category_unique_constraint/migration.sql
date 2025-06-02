/*
  Warnings:

  - A unique constraint covering the columns `[name,parentId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,token]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `OrderItem_productId_fkey`;

-- DropIndex
DROP INDEX `Category_name_key` ON `category`;

-- DropIndex
DROP INDEX `OrderItem_productId_fkey` ON `orderitem`;

-- DropIndex
DROP INDEX `Patient_email_key` ON `patient`;

-- DropIndex
DROP INDEX `VerificationToken_id_token_key` ON `verificationtoken`;

-- AlterTable
ALTER TABLE `orderitem` MODIFY `productId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `patient` MODIFY `email` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `verificationtoken` ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Category_name_parentId_key` ON `Category`(`name`, `parentId`);

-- CreateIndex
CREATE UNIQUE INDEX `VerificationToken_email_token_key` ON `VerificationToken`(`email`, `token`);

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
