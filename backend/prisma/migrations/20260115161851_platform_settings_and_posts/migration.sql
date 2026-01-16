-- CreateTable
CREATE TABLE `PlatformPost` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `platform` ENUM('X', 'LINKEDIN', 'REDDIT') NOT NULL,
    `content` TEXT NOT NULL,
    `hashtags` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlatformPost_postId_idx`(`postId`),
    UNIQUE INDEX `PlatformPost_postId_platform_key`(`postId`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPlatformSettings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `xEnabled` BOOLEAN NOT NULL DEFAULT false,
    `linkedinEnabled` BOOLEAN NOT NULL DEFAULT true,
    `redditEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserPlatformSettings_userId_key`(`userId`),
    INDEX `UserPlatformSettings_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PlatformPost` ADD CONSTRAINT `PlatformPost_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `GeneratedPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPlatformSettings` ADD CONSTRAINT `UserPlatformSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
