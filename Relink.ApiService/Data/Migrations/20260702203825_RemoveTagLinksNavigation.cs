using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relink.ApiService.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTagLinksNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LinkTag_Links_LinksId",
                table: "LinkTag");

            migrationBuilder.RenameColumn(
                name: "LinksId",
                table: "LinkTag",
                newName: "LinkId");

            migrationBuilder.AddForeignKey(
                name: "FK_LinkTag_Links_LinkId",
                table: "LinkTag",
                column: "LinkId",
                principalTable: "Links",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LinkTag_Links_LinkId",
                table: "LinkTag");

            migrationBuilder.RenameColumn(
                name: "LinkId",
                table: "LinkTag",
                newName: "LinksId");

            migrationBuilder.AddForeignKey(
                name: "FK_LinkTag_Links_LinksId",
                table: "LinkTag",
                column: "LinksId",
                principalTable: "Links",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
