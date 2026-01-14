-- AlterTable
ALTER TABLE `refreshtoken` ALTER COLUMN `createdAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user` ALTER COLUMN `createdAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `SamplePost` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SamplePost_userId_idx`(`userId`),
    INDEX `SamplePost_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SamplePost` ADD CONSTRAINT `SamplePost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
