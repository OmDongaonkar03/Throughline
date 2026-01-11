-- AlterTable
ALTER TABLE `refreshtoken` ALTER COLUMN `createdAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `profilePhoto` VARCHAR(191) NULL,
    ALTER COLUMN `createdAt` DROP DEFAULT;
