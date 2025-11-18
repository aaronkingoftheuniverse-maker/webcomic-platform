/*
  Warnings:

  - Added the required column `creatorProfileId` to the `Comic` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `comic` ADD COLUMN `coverImage` VARCHAR(191) NULL,
    ADD COLUMN `creatorProfileId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Comic` ADD CONSTRAINT `Comic_creatorProfileId_fkey` FOREIGN KEY (`creatorProfileId`) REFERENCES `CreatorProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
