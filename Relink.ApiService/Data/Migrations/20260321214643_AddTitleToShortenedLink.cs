using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relink.ApiService.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTitleToShortenedLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "ShortenedLinks",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Title",
                table: "ShortenedLinks");
        }
    }
}
