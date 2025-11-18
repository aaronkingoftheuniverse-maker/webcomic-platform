-- DropForeignKey
ALTER TABLE `loginlog` DROP FOREIGN KEY `LoginLog_userId_fkey`;

-- DropIndex
DROP INDEX `LoginLog_userId_fkey` ON `loginlog`;

-- AlterTable
ALTER TABLE `loginlog` ADD COLUMN `ipAddress` VARCHAR(191) NULL,
    ADD COLUMN `success` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `userAgent` VARCHAR(191) NULL,
    MODIFY `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `LoginLog` ADD CONSTRAINT `LoginLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
