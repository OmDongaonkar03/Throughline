-- DropIndex
DROP INDEX `VerificationToken_token_idx` ON `verificationtoken`;

-- AlterTable
ALTER TABLE `refreshtoken` ALTER COLUMN `createdAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user` ALTER COLUMN `createdAt` DROP DEFAULT;
