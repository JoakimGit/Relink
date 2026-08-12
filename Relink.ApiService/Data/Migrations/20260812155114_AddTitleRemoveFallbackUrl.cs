using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relink.ApiService.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTitleRemoveFallbackUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FallbackUrl",
                table: "Links");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Links",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                defaultValue: "");

            // Backfill existing Links: use the Short Code as a placeholder Title.
            migrationBuilder.Sql("UPDATE \"Links\" SET \"Title\" = \"Id\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Title",
                table: "Links");

            migrationBuilder.AddColumn<string>(
                name: "FallbackUrl",
                table: "Links",
                type: "text",
                nullable: true);
        }
    }
}
