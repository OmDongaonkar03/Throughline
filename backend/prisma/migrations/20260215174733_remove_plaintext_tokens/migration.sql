/*
  Warnings:

  - You are about to drop the column `token` on the `passwordresettoken` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `verificationtoken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `checkin` DROP FOREIGN KEY `CheckIn_userId_fkey`;

-- DropForeignKey
ALTER TABLE `generatedpost` DROP FOREIGN KEY `GeneratedPost_toneProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `generatedpost` DROP FOREIGN KEY `GeneratedPost_userId_fkey`;

-- DropForeignKey
ALTER TABLE `generationjob` DROP FOREIGN KEY `GenerationJob_userId_fkey`;

-- DropForeignKey
ALTER TABLE `generationschedule` DROP FOREIGN KEY `GenerationSchedule_userId_fkey`;

-- DropForeignKey
ALTER TABLE `notificationsettings` DROP FOREIGN KEY `NotificationSettings_userId_fkey`;

-- DropForeignKey
ALTER TABLE `passwordresettoken` DROP FOREIGN KEY `PasswordResetToken_userId_fkey`;

-- DropForeignKey
ALTER TABLE `postfeedback` DROP FOREIGN KEY `PostFeedback_userId_fkey`;

-- DropForeignKey
ALTER TABLE `refreshtoken` DROP FOREIGN KEY `RefreshToken_userId_fkey`;

-- DropForeignKey
ALTER TABLE `samplepost` DROP FOREIGN KEY `SamplePost_userId_fkey`;

-- DropForeignKey
ALTER TABLE `tokenusage` DROP FOREIGN KEY `TokenUsage_generatedPostId_fkey`;

-- DropForeignKey
ALTER TABLE `toneprofile` DROP FOREIGN KEY `ToneProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `verificationtoken` DROP FOREIGN KEY `VerificationToken_userId_fkey`;

-- AlterTable
ALTER TABLE `passwordresettoken` DROP COLUMN `token`;

-- AlterTable
ALTER TABLE `verificationtoken` DROP COLUMN `token`;
