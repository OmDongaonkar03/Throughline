/*
  Warnings:

  - You are about to drop the column `tokensUsed` on the `generatedpost` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `tokenusage` table. All the data in the column will be lost.
  - You are about to drop the column `platformPostId` on the `tokenusage` table. All the data in the column will be lost.
  - You are about to drop the `platformpost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userplatformsettings` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `generatedPostId` on table `tokenusage` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `platformpost` DROP FOREIGN KEY `PlatformPost_postId_fkey`;

-- DropForeignKey
ALTER TABLE `tokenusage` DROP FOREIGN KEY `TokenUsage_generatedPostId_fkey`;

-- DropForeignKey
ALTER TABLE `tokenusage` DROP FOREIGN KEY `TokenUsage_platformPostId_fkey`;

-- DropForeignKey
ALTER TABLE `userplatformsettings` DROP FOREIGN KEY `UserPlatformSettings_userId_fkey`;

-- AlterTable
ALTER TABLE `generatedpost` DROP COLUMN `tokensUsed`;

-- AlterTable
ALTER TABLE `tokenusage` DROP COLUMN `platform`,
    DROP COLUMN `platformPostId`,
    MODIFY `generatedPostId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `platformpost`;

-- DropTable
DROP TABLE `userplatformsettings`;

-- AddForeignKey
ALTER TABLE `TokenUsage` ADD CONSTRAINT `TokenUsage_generatedPostId_fkey` FOREIGN KEY (`generatedPostId`) REFERENCES `GeneratedPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
