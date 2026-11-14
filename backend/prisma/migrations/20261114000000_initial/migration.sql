-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSkill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `skillName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `type` ENUM('OFFERED', 'WANTED') NOT NULL,
    `proficiency` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT') NOT NULL DEFAULT 'BEGINNER',
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SkillRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `requesterId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Todo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('TODO', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'TODO',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `dueDate` DATETIME(3) NULL,
    `reminderAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL DEFAULT 'PERSONAL',
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NULL,
    `reminderAt` DATETIME(3) NULL,
    `recurrenceRule` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `creatorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `requiredSkills` VARCHAR(191) NULL,
    `requiredRoles` VARCHAR(191) NULL,
    `teamSize` INTEGER NOT NULL DEFAULT 1,
    `deadline` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'OPEN', 'TEAM_FORMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ownerId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectApplication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `projectId` INTEGER NOT NULL,
    `applicantId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` VARCHAR(191) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `projectId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectMilestone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `projectId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectComment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `projectId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `condition` VARCHAR(191) NULL,
    `approvalMode` ENUM('AUTO_APPROVED', 'ADMIN_APPROVAL_REQUIRED') NOT NULL DEFAULT 'AUTO_APPROVED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ownerId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResourceBooking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `purpose` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `resourceId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resume` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `resumeText` TEXT NOT NULL,
    `jobDescription` TEXT NULL,
    `atsScore` INTEGER NULL,
    `missingKeywords` TEXT NULL,
    `suggestions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `githubUrl` VARCHAR(191) NULL,
    `portfolioUrl` VARCHAR(191) NULL,
    `summary` TEXT NULL,
    `education` TEXT NULL,
    `experience` TEXT NULL,
    `achievements` TEXT NULL,
    `certifications` TEXT NULL,
    `languages` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Profile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserSkill` ADD CONSTRAINT `UserSkill_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SkillRequest` ADD CONSTRAINT `SkillRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SkillRequest` ADD CONSTRAINT `SkillRequest_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectApplication` ADD CONSTRAINT `ProjectApplication_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectApplication` ADD CONSTRAINT `ProjectApplication_applicantId_fkey` FOREIGN KEY (`applicantId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMember` ADD CONSTRAINT `ProjectMember_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMember` ADD CONSTRAINT `ProjectMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMilestone` ADD CONSTRAINT `ProjectMilestone_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectComment` ADD CONSTRAINT `ProjectComment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectComment` ADD CONSTRAINT `ProjectComment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResourceBooking` ADD CONSTRAINT `ResourceBooking_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResourceBooking` ADD CONSTRAINT `ResourceBooking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resume` ADD CONSTRAINT `Resume_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

