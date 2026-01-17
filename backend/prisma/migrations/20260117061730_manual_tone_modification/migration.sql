-- AlterTable
ALTER TABLE `toneprofile` ADD COLUMN `avoidTopics` JSON NULL,
    ADD COLUMN `contentPurpose` TEXT NULL,
    ADD COLUMN `customEmotionalRange` TEXT NULL,
    ADD COLUMN `customSentenceStyle` TEXT NULL,
    ADD COLUMN `customVoice` TEXT NULL,
    ADD COLUMN `includeEmojis` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `includeHashtags` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `lastManualEdit` DATETIME(3) NULL,
    ADD COLUMN `manuallyEdited` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `preferredLength` VARCHAR(191) NULL,
    ADD COLUMN `targetAudience` JSON NULL,
    ADD COLUMN `toneCharacteristics` JSON NULL,
    ADD COLUMN `writingGoals` JSON NULL;
