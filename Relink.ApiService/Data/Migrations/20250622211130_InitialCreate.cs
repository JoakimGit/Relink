using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Relink.ApiService.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShortenedLinks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    LongUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    FallbackUrl = table.Column<string>(type: "text", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpirationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    MaxUsages = table.Column<int>(type: "integer", nullable: true),
                    CurrentUsages = table.Column<int>(type: "integer", nullable: false),
                    IsLocked = table.Column<bool>(type: "boolean", nullable: false),
                    GroupId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShortenedLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShortenedLinks_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LinkAnalytics",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ShortenedLinkId = table.Column<string>(type: "text", nullable: false),
                    AccessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    Referrer = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkAnalytics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkAnalytics_ShortenedLinks_ShortenedLinkId",
                        column: x => x.ShortenedLinkId,
                        principalTable: "ShortenedLinks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LinkMetadata",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ShortenedLinkId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    SiteName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    LastScrapedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkMetadata", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkMetadata_ShortenedLinks_ShortenedLinkId",
                        column: x => x.ShortenedLinkId,
                        principalTable: "ShortenedLinks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShortenedLinkTag",
                columns: table => new
                {
                    ShortenedLinksId = table.Column<string>(type: "text", nullable: false),
                    TagsId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShortenedLinkTag", x => new { x.ShortenedLinksId, x.TagsId });
                    table.ForeignKey(
                        name: "FK_ShortenedLinkTag_ShortenedLinks_ShortenedLinksId",
                        column: x => x.ShortenedLinksId,
                        principalTable: "ShortenedLinks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShortenedLinkTag_Tags_TagsId",
                        column: x => x.TagsId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Groups_Name",
                table: "Groups",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LinkAnalytics_ShortenedLinkId_AccessedAt",
                table: "LinkAnalytics",
                columns: new[] { "ShortenedLinkId", "AccessedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_LinkMetadata_ShortenedLinkId",
                table: "LinkMetadata",
                column: "ShortenedLinkId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShortenedLinks_GroupId",
                table: "ShortenedLinks",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ShortenedLinkTag_TagsId",
                table: "ShortenedLinkTag",
                column: "TagsId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_Name",
                table: "Tags",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LinkAnalytics");

            migrationBuilder.DropTable(
                name: "LinkMetadata");

            migrationBuilder.DropTable(
                name: "ShortenedLinkTag");

            migrationBuilder.DropTable(
                name: "ShortenedLinks");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "Groups");
        }
    }
}
