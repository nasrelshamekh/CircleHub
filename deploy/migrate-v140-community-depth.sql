START TRANSACTION;

ALTER TABLE `Posts` ADD `IsPinned` tinyint(1) NOT NULL DEFAULT FALSE;

ALTER TABLE `Posts` ADD `PinnedAt` datetime(6) NULL;

ALTER TABLE `Posts` ADD `PinnedById` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `Comments` ADD `ParentCommentId` char(36) COLLATE ascii_general_ci NULL;

CREATE TABLE `CommentLikes` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `CommentId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_CommentLikes` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_CommentLikes_Comments_CommentId` FOREIGN KEY (`CommentId`) REFERENCES `Comments` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_CommentLikes_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Posts_IsPinned` ON `Posts` (`IsPinned`);

CREATE INDEX `IX_Posts_PinnedById` ON `Posts` (`PinnedById`);

CREATE INDEX `IX_Comments_ParentCommentId` ON `Comments` (`ParentCommentId`);

CREATE UNIQUE INDEX `IX_CommentLikes_CommentId_UserId` ON `CommentLikes` (`CommentId`, `UserId`);

CREATE INDEX `IX_CommentLikes_UserId` ON `CommentLikes` (`UserId`);

ALTER TABLE `Comments` ADD CONSTRAINT `FK_Comments_Comments_ParentCommentId` FOREIGN KEY (`ParentCommentId`) REFERENCES `Comments` (`Id`) ON DELETE CASCADE;

ALTER TABLE `Posts` ADD CONSTRAINT `FK_Posts_Users_PinnedById` FOREIGN KEY (`PinnedById`) REFERENCES `Users` (`Id`) ON DELETE SET NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261108093004_AddCommunityDiscussionDepth', '9.0.0');

COMMIT;
