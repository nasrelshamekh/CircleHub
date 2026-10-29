CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;
ALTER DATABASE CHARACTER SET utf8mb4;

CREATE TABLE `Users` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Username` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Email` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Gender` longtext CHARACTER SET utf8mb4 NULL,
    `DateOfBirth` datetime(6) NULL,
    `JobTitle` longtext CHARACTER SET utf8mb4 NULL,
    `AvatarUrl` longtext CHARACTER SET utf8mb4 NULL,
    `CoverImageUrl` longtext CHARACTER SET utf8mb4 NULL,
    `Bio` longtext CHARACTER SET utf8mb4 NULL,
    `Location` longtext CHARACTER SET utf8mb4 NULL,
    `Website` longtext CHARACTER SET utf8mb4 NULL,
    `Skills` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Communities` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Slug` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Category` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ImageUrl` longtext CHARACTER SET utf8mb4 NULL,
    `Visibility` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    `AdminId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Communities` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Communities_Users_AdminId` FOREIGN KEY (`AdminId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Follows` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `FollowerId` char(36) COLLATE ascii_general_ci NOT NULL,
    `FollowingId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Follows` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Follows_Users_FollowerId` FOREIGN KEY (`FollowerId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Follows_Users_FollowingId` FOREIGN KEY (`FollowingId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `CommunityJoinRequests` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Note` longtext CHARACTER SET utf8mb4 NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `CommunityId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_CommunityJoinRequests` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_CommunityJoinRequests_Communities_CommunityId` FOREIGN KEY (`CommunityId`) REFERENCES `Communities` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_CommunityJoinRequests_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `CommunityMembers` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Role` longtext CHARACTER SET utf8mb4 NOT NULL,
    `JoinedAt` datetime(6) NOT NULL,
    `CommunityId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_CommunityMembers` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_CommunityMembers_Communities_CommunityId` FOREIGN KEY (`CommunityId`) REFERENCES `Communities` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_CommunityMembers_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `CommunityModerationLogs` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `PostId` char(36) COLLATE ascii_general_ci NOT NULL,
    `PostAuthorId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Action` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Reason` longtext CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `CommunityId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ActorId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_CommunityModerationLogs` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_CommunityModerationLogs_Communities_CommunityId` FOREIGN KEY (`CommunityId`) REFERENCES `Communities` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_CommunityModerationLogs_Users_ActorId` FOREIGN KEY (`ActorId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Posts` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Content` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ImageUrl` longtext CHARACTER SET utf8mb4 NULL,
    `ImagePublicId` longtext CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    `AuthorId` char(36) COLLATE ascii_general_ci NOT NULL,
    `CommunityId` char(36) COLLATE ascii_general_ci NULL,
    CONSTRAINT `PK_Posts` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Posts_Communities_CommunityId` FOREIGN KEY (`CommunityId`) REFERENCES `Communities` (`Id`),
    CONSTRAINT `FK_Posts_Users_AuthorId` FOREIGN KEY (`AuthorId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Comments` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Content` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    `PostId` char(36) COLLATE ascii_general_ci NOT NULL,
    `AuthorId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Comments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Comments_Posts_PostId` FOREIGN KEY (`PostId`) REFERENCES `Posts` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Comments_Users_AuthorId` FOREIGN KEY (`AuthorId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Likes` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `PostId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Likes` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Likes_Posts_PostId` FOREIGN KEY (`PostId`) REFERENCES `Posts` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Likes_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Comments_AuthorId` ON `Comments` (`AuthorId`);

CREATE INDEX `IX_Comments_PostId` ON `Comments` (`PostId`);

CREATE INDEX `IX_Communities_AdminId` ON `Communities` (`AdminId`);

CREATE UNIQUE INDEX `IX_Communities_Slug` ON `Communities` (`Slug`);

CREATE UNIQUE INDEX `IX_CommunityJoinRequests_CommunityId_UserId` ON `CommunityJoinRequests` (`CommunityId`, `UserId`);

CREATE INDEX `IX_CommunityJoinRequests_UserId` ON `CommunityJoinRequests` (`UserId`);

CREATE UNIQUE INDEX `IX_CommunityMembers_CommunityId_UserId` ON `CommunityMembers` (`CommunityId`, `UserId`);

CREATE INDEX `IX_CommunityMembers_UserId` ON `CommunityMembers` (`UserId`);

CREATE INDEX `IX_CommunityModerationLogs_ActorId` ON `CommunityModerationLogs` (`ActorId`);

CREATE INDEX `IX_CommunityModerationLogs_CommunityId` ON `CommunityModerationLogs` (`CommunityId`);

CREATE UNIQUE INDEX `IX_Follows_FollowerId_FollowingId` ON `Follows` (`FollowerId`, `FollowingId`);

CREATE INDEX `IX_Follows_FollowingId` ON `Follows` (`FollowingId`);

CREATE UNIQUE INDEX `IX_Likes_PostId_UserId` ON `Likes` (`PostId`, `UserId`);

CREATE INDEX `IX_Likes_UserId` ON `Likes` (`UserId`);

CREATE INDEX `IX_Posts_AuthorId` ON `Posts` (`AuthorId`);

CREATE INDEX `IX_Posts_CommunityId` ON `Posts` (`CommunityId`);

CREATE UNIQUE INDEX `IX_Users_Email` ON `Users` (`Email`);

CREATE UNIQUE INDEX `IX_Users_Username` ON `Users` (`Username`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260818130039_InitialCreate', '9.0.0');

ALTER TABLE `Users` ADD `EmailVerificationTokenExpires` datetime(6) NULL;

ALTER TABLE `Users` ADD `EmailVerificationTokenHash` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Users` ADD `EmailVerified` tinyint(1) NOT NULL DEFAULT FALSE;

ALTER TABLE `Users` ADD `VerificationEmailSentAt` datetime(6) NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260902100030_AddEmailVerification', '9.0.0');

ALTER TABLE `Communities` ADD `CoverImageUrl` longtext CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260908202453_AddCommunityCoverImage', '9.0.0');

ALTER TABLE `Users` ADD `PasswordResetEmailSentAt` datetime(6) NULL;

ALTER TABLE `Users` ADD `PasswordResetTokenExpires` datetime(6) NULL;

ALTER TABLE `Users` ADD `PasswordResetTokenHash` longtext CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261011154011_AddPasswordReset', '9.0.0');

ALTER TABLE `Users` ADD `TokenVersion` int NOT NULL DEFAULT 0;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261011162324_AddUserTokenVersion', '9.0.0');

ALTER TABLE `Users` ADD `CommunityUpdates` tinyint(1) NOT NULL DEFAULT TRUE;

ALTER TABLE `Users` ADD `EmailNotifications` tinyint(1) NOT NULL DEFAULT TRUE;

ALTER TABLE `Users` ADD `MessagesFrom` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Followers';

ALTER TABLE `Users` ADD `ProfileVisibility` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Public';

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261013095525_AddUserSettings', '9.0.0');

CREATE TABLE `Conversations` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `LastMessageAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Conversations` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `ConversationParticipants` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `ConversationId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `LastReadAt` datetime(6) NULL,
    CONSTRAINT `PK_ConversationParticipants` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ConversationParticipants_Conversations_ConversationId` FOREIGN KEY (`ConversationId`) REFERENCES `Conversations` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ConversationParticipants_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Messages` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `ConversationId` char(36) COLLATE ascii_general_ci NOT NULL,
    `SenderId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Content` longtext CHARACTER SET utf8mb4 NULL,
    `PostId` char(36) COLLATE ascii_general_ci NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Messages` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Messages_Conversations_ConversationId` FOREIGN KEY (`ConversationId`) REFERENCES `Conversations` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Messages_Posts_PostId` FOREIGN KEY (`PostId`) REFERENCES `Posts` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_Messages_Users_SenderId` FOREIGN KEY (`SenderId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_ConversationParticipants_ConversationId_UserId` ON `ConversationParticipants` (`ConversationId`, `UserId`);

CREATE INDEX `IX_ConversationParticipants_UserId` ON `ConversationParticipants` (`UserId`);

CREATE INDEX `IX_Conversations_LastMessageAt` ON `Conversations` (`LastMessageAt`);

CREATE INDEX `IX_Messages_ConversationId_CreatedAt` ON `Messages` (`ConversationId`, `CreatedAt`);

CREATE INDEX `IX_Messages_PostId` ON `Messages` (`PostId`);

CREATE INDEX `IX_Messages_SenderId` ON `Messages` (`SenderId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261013103130_AddMessaging', '9.0.0');

ALTER TABLE `Users` ADD `LastSeenAt` datetime(6) NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261019182004_AddUserLastSeenAt', '9.0.0');

ALTER TABLE `Users` ADD `NotificationsSeenAt` datetime(6) NULL;

CREATE TABLE `Notifications` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Type` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ActorId` char(36) COLLATE ascii_general_ci NOT NULL,
    `PostId` char(36) COLLATE ascii_general_ci NULL,
    `CommunityId` char(36) COLLATE ascii_general_ci NULL,
    CONSTRAINT `PK_Notifications` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Notifications_Communities_CommunityId` FOREIGN KEY (`CommunityId`) REFERENCES `Communities` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Notifications_Posts_PostId` FOREIGN KEY (`PostId`) REFERENCES `Posts` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Notifications_Users_ActorId` FOREIGN KEY (`ActorId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Notifications_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Notifications_ActorId` ON `Notifications` (`ActorId`);

CREATE INDEX `IX_Notifications_CommunityId` ON `Notifications` (`CommunityId`);

CREATE INDEX `IX_Notifications_PostId` ON `Notifications` (`PostId`);

CREATE INDEX `IX_Notifications_UserId_CreatedAt` ON `Notifications` (`UserId`, `CreatedAt`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261019213735_AddNotifications', '9.0.0');

ALTER TABLE `Notifications` ADD `ReadAt` datetime(6) NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261019222318_AddNotificationReadAt', '9.0.0');

CREATE TABLE `UserDeviceKeys` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `DeviceId` varchar(64) CHARACTER SET utf8mb4 NOT NULL,
    `PublicKey` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_UserDeviceKeys` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_UserDeviceKeys_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_UserDeviceKeys_UserId_DeviceId` ON `UserDeviceKeys` (`UserId`, `DeviceId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261020100420_AddUserDeviceKeys', '9.0.0');

CREATE TABLE `UserKeyBackups` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `WrappedAccountKey` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
    `Salt` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `KdfIterations` int NOT NULL,
    `KdfAlgorithm` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_UserKeyBackups` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_UserKeyBackups_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_UserKeyBackups_UserId` ON `UserKeyBackups` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261020112344_AddUserKeyBackups', '9.0.0');

CREATE TABLE `DeviceTokens` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Token` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Platform` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_DeviceTokens` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_DeviceTokens_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_DeviceTokens_Token` ON `DeviceTokens` (`Token`);

CREATE INDEX `IX_DeviceTokens_UserId` ON `DeviceTokens` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261020144854_AddDeviceTokens', '9.0.0');

ALTER TABLE `UserDeviceKeys` ADD `LastSeenAt` datetime(6) NULL;

UPDATE `UserDeviceKeys` SET `LastSeenAt` = `CreatedAt`;

ALTER TABLE `UserDeviceKeys` MODIFY COLUMN `LastSeenAt` datetime(6) NOT NULL;

CREATE INDEX `IX_UserDeviceKeys_UserId_LastSeenAt` ON `UserDeviceKeys` (`UserId`, `LastSeenAt`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261021104523_AddUserDeviceKeyLastSeenAt', '9.0.0');

ALTER TABLE `Users` MODIFY COLUMN `MessagesFrom` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Followers';

ALTER TABLE `Posts` ADD `AdditionalImageUrls` longtext CHARACTER SET utf8mb4 NULL;

CREATE TABLE `Polls` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `PostId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Question` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ExpiresAt` datetime(6) NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Polls` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Polls_Posts_PostId` FOREIGN KEY (`PostId`) REFERENCES `Posts` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `PollOptions` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `PollId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Text` longtext CHARACTER SET utf8mb4 NOT NULL,
    `DisplayOrder` int NOT NULL,
    CONSTRAINT `PK_PollOptions` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_PollOptions_Polls_PollId` FOREIGN KEY (`PollId`) REFERENCES `Polls` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `PollVotes` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `PollId` char(36) COLLATE ascii_general_ci NOT NULL,
    `PollOptionId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `VotedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_PollVotes` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_PollVotes_PollOptions_PollOptionId` FOREIGN KEY (`PollOptionId`) REFERENCES `PollOptions` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_PollVotes_Polls_PollId` FOREIGN KEY (`PollId`) REFERENCES `Polls` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_PollVotes_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_PollOptions_PollId` ON `PollOptions` (`PollId`);

CREATE UNIQUE INDEX `IX_Polls_PostId` ON `Polls` (`PostId`);

CREATE UNIQUE INDEX `IX_PollVotes_PollId_UserId` ON `PollVotes` (`PollId`, `UserId`);

CREATE INDEX `IX_PollVotes_PollOptionId` ON `PollVotes` (`PollOptionId`);

CREATE INDEX `IX_PollVotes_UserId` ON `PollVotes` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261029010702_AddPollsAndRichPosts', '9.0.0');

COMMIT;

