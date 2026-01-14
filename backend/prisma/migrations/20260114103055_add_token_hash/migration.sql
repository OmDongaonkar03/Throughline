-- DropIndex
DROP INDEX `VerificationToken_token_key` ON `VerificationToken`;

-- AlterTable - Change token to TEXT
ALTER TABLE `VerificationToken` MODIFY `token` TEXT NOT NULL;

-- Delete existing broken tokens
DELETE FROM `VerificationToken`;

-- AlterTable - Add tokenHash (table is now empty)
ALTER TABLE `VerificationToken` ADD COLUMN `tokenHash` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `VerificationToken_tokenHash_key` ON `VerificationToken`(`tokenHash`);

-- CreateIndex
CREATE INDEX `VerificationToken_tokenHash_idx` ON `VerificationToken`(`tokenHash`);