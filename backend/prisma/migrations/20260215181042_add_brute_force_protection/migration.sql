-- DropIndex
DROP INDEX `GeneratedPost_toneProfileId_fkey` ON `generatedpost`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `lockedUntil` DATETIME(3) NULL,
    ADD COLUMN `loginAttempts` INTEGER NOT NULL DEFAULT 0;
