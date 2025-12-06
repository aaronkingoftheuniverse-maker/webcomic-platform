-- AlterTable
ALTER TABLE `episode` ADD COLUMN `publishedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `post` ADD COLUMN `publishedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Episode_publishedAt_idx` ON `Episode`(`publishedAt`);

-- CreateIndex
CREATE INDEX `Post_publishedAt_idx` ON `Post`(`publishedAt`);
