using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CircleHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationReadAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReadAt",
                table: "Notifications",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReadAt",
                table: "Notifications");
        }
    }
}
