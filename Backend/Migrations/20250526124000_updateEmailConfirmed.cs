using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RideWild.Migrations
{
    /// <inheritdoc />
    public partial class updateEmailConfirmed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddressLine",
                table: "CustomerData");

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailConfirmed",
                table: "CustomerData",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsEmailConfirmed",
                table: "CustomerData");

            migrationBuilder.AddColumn<string>(
                name: "AddressLine",
                table: "CustomerData",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");
        }
    }
}
