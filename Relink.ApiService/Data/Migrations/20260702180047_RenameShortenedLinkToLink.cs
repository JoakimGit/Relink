using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relink.ApiService.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameShortenedLinkToLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop foreign keys before renaming tables
            migrationBuilder.DropForeignKey(
                name: "FK_LinkAnalytics_ShortenedLinks_ShortenedLinkId",
                table: "LinkAnalytics");

            migrationBuilder.DropForeignKey(
                name: "FK_LinkMetadata_ShortenedLinks_ShortenedLinkId",
                table: "LinkMetadata");

            migrationBuilder.DropForeignKey(
                name: "FK_ShortenedLinks_Groups_GroupId",
                table: "ShortenedLinks");

            // Drop FKs on the join table
            migrationBuilder.DropForeignKey(
                name: "FK_ShortenedLinkTag_ShortenedLinks_ShortenedLinksId",
                table: "ShortenedLinkTag");

            migrationBuilder.DropForeignKey(
                name: "FK_ShortenedLinkTag_Tags_TagsId",
                table: "ShortenedLinkTag");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ShortenedLinkTag",
                table: "ShortenedLinkTag");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ShortenedLinks",
                table: "ShortenedLinks");

            // Drop the Title column before renaming the table
            migrationBuilder.DropColumn(
                name: "Title",
                table: "ShortenedLinks");

            // Rename join table and its columns
            migrationBuilder.RenameTable(
                name: "ShortenedLinkTag",
                newName: "LinkTag");

            migrationBuilder.RenameColumn(
                name: "ShortenedLinksId",
                table: "LinkTag",
                newName: "LinksId");

            // Rename main table
            migrationBuilder.RenameTable(
                name: "ShortenedLinks",
                newName: "Links");

            // Rename columns on the main table
            migrationBuilder.RenameColumn(
                name: "MaxUsages",
                table: "Links",
                newName: "MaxVisits");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Links",
                newName: "Notes");

            migrationBuilder.RenameColumn(
                name: "CurrentUsages",
                table: "Links",
                newName: "VisitCount");

            // Rename indexes
            migrationBuilder.RenameIndex(
                name: "IX_ShortenedLinkTag_TagsId",
                table: "LinkTag",
                newName: "IX_LinkTag_TagsId");

            migrationBuilder.RenameIndex(
                name: "IX_ShortenedLinks_GroupId",
                table: "Links",
                newName: "IX_Links_GroupId");

            // Add primary keys back
            migrationBuilder.AddPrimaryKey(
                name: "PK_LinkTag",
                table: "LinkTag",
                columns: new[] { "LinksId", "TagsId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_Links",
                table: "Links",
                column: "Id");

            // Re-add foreign keys
            migrationBuilder.AddForeignKey(
                name: "FK_LinkAnalytics_Links_ShortenedLinkId",
                table: "LinkAnalytics",
                column: "ShortenedLinkId",
                principalTable: "Links",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LinkMetadata_Links_ShortenedLinkId",
                table: "LinkMetadata",
                column: "ShortenedLinkId",
                principalTable: "Links",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Links_Groups_GroupId",
                table: "Links",
                column: "GroupId",
                principalTable: "Groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_LinkTag_Links_LinksId",
                table: "LinkTag",
                column: "LinksId",
                principalTable: "Links",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LinkTag_Tags_TagsId",
                table: "LinkTag",
                column: "TagsId",
                principalTable: "Tags",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop FKs
            migrationBuilder.DropForeignKey(
                name: "FK_LinkAnalytics_Links_ShortenedLinkId",
                table: "LinkAnalytics");

            migrationBuilder.DropForeignKey(
                name: "FK_LinkMetadata_Links_ShortenedLinkId",
                table: "LinkMetadata");

            migrationBuilder.DropForeignKey(
                name: "FK_Links_Groups_GroupId",
                table: "Links");

            migrationBuilder.DropForeignKey(
                name: "FK_LinkTag_Links_LinksId",
                table: "LinkTag");

            migrationBuilder.DropForeignKey(
                name: "FK_LinkTag_Tags_TagsId",
                table: "LinkTag");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LinkTag",
                table: "LinkTag");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Links",
                table: "Links");

            // Rename columns back
            migrationBuilder.RenameColumn(
                name: "VisitCount",
                table: "Links",
                newName: "CurrentUsages");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "Links",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "MaxVisits",
                table: "Links",
                newName: "MaxUsages");

            // Rename join table column back
            migrationBuilder.RenameColumn(
                name: "LinksId",
                table: "LinkTag",
                newName: "ShortenedLinksId");

            // Rename tables back
            migrationBuilder.RenameTable(
                name: "Links",
                newName: "ShortenedLinks");

            migrationBuilder.RenameTable(
                name: "LinkTag",
                newName: "ShortenedLinkTag");

            // Rename indexes back
            migrationBuilder.RenameIndex(
                name: "IX_LinkTag_TagsId",
                table: "ShortenedLinkTag",
                newName: "IX_ShortenedLinkTag_TagsId");

            migrationBuilder.RenameIndex(
                name: "IX_Links_GroupId",
                table: "ShortenedLinks",
                newName: "IX_ShortenedLinks_GroupId");

            // Re-add Title column
            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "ShortenedLinks",
                type: "text",
                nullable: false,
                defaultValue: "");

            // Re-add primary keys
            migrationBuilder.AddPrimaryKey(
                name: "PK_ShortenedLinkTag",
                table: "ShortenedLinkTag",
                columns: new[] { "ShortenedLinksId", "TagsId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShortenedLinks",
                table: "ShortenedLinks",
                column: "Id");

            // Re-add foreign keys
            migrationBuilder.AddForeignKey(
                name: "FK_LinkAnalytics_ShortenedLinks_ShortenedLinkId",
                table: "LinkAnalytics",
                column: "ShortenedLinkId",
                principalTable: "ShortenedLinks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LinkMetadata_ShortenedLinks_ShortenedLinkId",
                table: "LinkMetadata",
                column: "ShortenedLinkId",
                principalTable: "ShortenedLinks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShortenedLinks_Groups_GroupId",
                table: "ShortenedLinks",
                column: "GroupId",
                principalTable: "Groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ShortenedLinkTag_ShortenedLinks_ShortenedLinksId",
                table: "ShortenedLinkTag",
                column: "ShortenedLinksId",
                principalTable: "ShortenedLinks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShortenedLinkTag_Tags_TagsId",
                table: "ShortenedLinkTag",
                column: "TagsId",
                principalTable: "Tags",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
