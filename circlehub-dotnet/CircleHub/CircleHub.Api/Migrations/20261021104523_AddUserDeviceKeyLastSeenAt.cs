using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CircleHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserDeviceKeyLastSeenAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Added nullable on purpose: MySQL's DATETIME starts at 1000-01-01, so the "no default"
            // sentinel EF would use for a NOT NULL column is not a value this column can hold.
            migrationBuilder.AddColumn<DateTime>(
                name: "LastSeenAt",
                table: "UserDeviceKeys",
                type: "datetime(6)",
                nullable: true);

            // A device that was already in the directory was last seen when it published, and
            // `CreatedAt` used to be rewritten on every publish, so it is the closest thing to a
            // last-seen stamp the table still holds.
            migrationBuilder.Sql(
                "UPDATE `UserDeviceKeys` SET `LastSeenAt` = `CreatedAt`;");

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastSeenAt",
                table: "UserDeviceKeys",
                type: "datetime(6)",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserDeviceKeys_UserId_LastSeenAt",
                table: "UserDeviceKeys",
                columns: new[] { "UserId", "LastSeenAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserDeviceKeys_UserId_LastSeenAt",
                table: "UserDeviceKeys");

            migrationBuilder.DropColumn(
                name: "LastSeenAt",
                table: "UserDeviceKeys");
        }
    }
}
