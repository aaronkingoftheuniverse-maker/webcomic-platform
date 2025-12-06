-- CreateTable
CREATE TABLE `_UserComicSubscriptions` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_UserComicSubscriptions_AB_unique`(`A`, `B`),
    INDEX `_UserComicSubscriptions_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_UserCreatorSubscriptions` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_UserCreatorSubscriptions_AB_unique`(`A`, `B`),
    INDEX `_UserCreatorSubscriptions_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_UserComicSubscriptions` ADD CONSTRAINT `_UserComicSubscriptions_A_fkey` FOREIGN KEY (`A`) REFERENCES `Comic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserComicSubscriptions` ADD CONSTRAINT `_UserComicSubscriptions_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserCreatorSubscriptions` ADD CONSTRAINT `_UserCreatorSubscriptions_A_fkey` FOREIGN KEY (`A`) REFERENCES `CreatorProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserCreatorSubscriptions` ADD CONSTRAINT `_UserCreatorSubscriptions_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
