-- CreateTable
CREATE TABLE `TokenUsage` (
    `id` VARCHAR(191) NOT NULL,
    `generatedPostId` VARCHAR(191) NULL,
    `platformPostId` VARCHAR(191) NULL,
    `promptTokens` INTEGER NOT NULL,
    `completionTokens` INTEGER NOT NULL,
    `totalTokens` INTEGER NOT NULL,
    `modelUsed` VARCHAR(191) NOT NULL,
    `estimatedCost` DOUBLE NULL,
    `agentType` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TokenUsage_generatedPostId_idx`(`generatedPostId`),
    INDEX `TokenUsage_platformPostId_idx`(`platformPostId`),
    INDEX `TokenUsage_agentType_idx`(`agentType`),
    INDEX `TokenUsage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TokenUsage` ADD CONSTRAINT `TokenUsage_generatedPostId_fkey` FOREIGN KEY (`generatedPostId`) REFERENCES `GeneratedPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TokenUsage` ADD CONSTRAINT `TokenUsage_platformPostId_fkey` FOREIGN KEY (`platformPostId`) REFERENCES `PlatformPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
