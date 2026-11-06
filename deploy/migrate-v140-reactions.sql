START TRANSACTION;
CREATE TABLE `MessageReactions` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `MessageId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Emoji` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_MessageReactions` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MessageReactions_Messages_MessageId` FOREIGN KEY (`MessageId`) REFERENCES `Messages` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_MessageReactions_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_MessageReactions_MessageId` ON `MessageReactions` (`MessageId`);

CREATE UNIQUE INDEX `IX_MessageReactions_MessageId_UserId` ON `MessageReactions` (`MessageId`, `UserId`);

CREATE INDEX `IX_MessageReactions_UserId` ON `MessageReactions` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261106193126_AddMessageReactions', '9.0.0');

COMMIT;

