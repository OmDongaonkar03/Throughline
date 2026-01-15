-- AlterTable
ALTER TABLE `checkin` MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `GeneratedPost` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `content` TEXT NOT NULL,
    `metadata` JSON NULL,
    `toneProfileId` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `isLatest` BOOLEAN NOT NULL DEFAULT true,
    `generationType` ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'AUTO',
    `modelUsed` VARCHAR(191) NULL,
    `tokensUsed` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GeneratedPost_userId_date_type_idx`(`userId`, `date`, `type`),
    INDEX `GeneratedPost_userId_type_isLatest_idx`(`userId`, `type`, `isLatest`),
    INDEX `GeneratedPost_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ToneProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `voice` TEXT NOT NULL,
    `sentenceStyle` TEXT NOT NULL,
    `emotionalRange` TEXT NOT NULL,
    `commonPhrases` JSON NULL,
    `exampleText` TEXT NOT NULL,
    `fullProfile` JSON NOT NULL,
    `extractedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modelUsed` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ToneProfile_userId_key`(`userId`),
    INDEX `ToneProfile_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GenerationSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dailyEnabled` BOOLEAN NOT NULL DEFAULT true,
    `dailyTime` VARCHAR(191) NOT NULL DEFAULT '21:00',
    `weeklyEnabled` BOOLEAN NOT NULL DEFAULT true,
    `weeklyDay` INTEGER NOT NULL DEFAULT 0,
    `weeklyTime` VARCHAR(191) NOT NULL DEFAULT '20:00',
    `monthlyEnabled` BOOLEAN NOT NULL DEFAULT true,
    `monthlyDay` INTEGER NOT NULL DEFAULT 28,
    `monthlyTime` VARCHAR(191) NOT NULL DEFAULT '20:00',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GenerationSchedule_userId_key`(`userId`),
    INDEX `GenerationSchedule_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GenerationJob` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `error` TEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GenerationJob_userId_status_idx`(`userId`, `status`),
    INDEX `GenerationJob_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GeneratedPost` ADD CONSTRAINT `GeneratedPost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneratedPost` ADD CONSTRAINT `GeneratedPost_toneProfileId_fkey` FOREIGN KEY (`toneProfileId`) REFERENCES `ToneProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ToneProfile` ADD CONSTRAINT `ToneProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GenerationSchedule` ADD CONSTRAINT `GenerationSchedule_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GenerationJob` ADD CONSTRAINT `GenerationJob_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
