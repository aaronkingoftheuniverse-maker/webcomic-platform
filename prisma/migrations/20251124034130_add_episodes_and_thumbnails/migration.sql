/*
  Warnings:

  - You are about to drop the column `comicId` on the `post` table. All the data in the column will be lost.
  - The values [CREATOR] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[thumbnailImageId]` on the table `Post` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `episodeId` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_comicId_fkey`;

-- DropIndex
DROP INDEX `Post_comicId_postNumber_idx` ON `post`;

-- AlterTable
ALTER TABLE `post` DROP COLUMN `comicId`,
    ADD COLUMN `episodeId` INTEGER NOT NULL,
    ADD COLUMN `thumbnailImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `Episode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `episodeNumber` INTEGER NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` VARCHAR(191) NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `comicId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Episode_slug_key`(`slug`),
    INDEX `Episode_comicId_idx`(`comicId`),
    INDEX `Episode_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Post_thumbnailImageId_key` ON `Post`(`thumbnailImageId`);

-- CreateIndex
CREATE INDEX `Post_episodeId_postNumber_idx` ON `Post`(`episodeId`, `postNumber`);

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_episodeId_fkey` FOREIGN KEY (`episodeId`) REFERENCES `Episode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_thumbnailImageId_fkey` FOREIGN KEY (`thumbnailImageId`) REFERENCES `Image`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Episode` ADD CONSTRAINT `Episode_comicId_fkey` FOREIGN KEY (`comicId`) REFERENCES `Comic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Episode` ADD CONSTRAINT `Episode_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Episode`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
