using Microsoft.EntityFrameworkCore;

namespace Relink.ApiService.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ShortenedLink> ShortenedLinks { get; set; }
    public DbSet<LinkMetadata> LinkMetadata { get; set; }
    public DbSet<LinkAnalytics> LinkAnalytics { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<Group> Groups { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureShortenedLinkTable(modelBuilder);
        ConfigureLinkMetadataTable(modelBuilder);
        ConfigureLinkAnalyticsTable(modelBuilder);
        ConfigureTagTable(modelBuilder);
        ConfigureGroupTable(modelBuilder);

        base.OnModelCreating(modelBuilder);
    }

    private static void ConfigureShortenedLinkTable(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ShortenedLink>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LongUrl).IsRequired().HasMaxLength(2048);

            entity.HasOne(e => e.Metadata)
                .WithOne(m => m.ShortenedLink)
                .HasForeignKey<LinkMetadata>(m => m.ShortenedLinkId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Analytics)
                .WithOne(a => a.ShortenedLink)
                .HasForeignKey(a => a.ShortenedLinkId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Group)
                .WithMany(g => g.ShortenedLinks)
                .HasForeignKey(e => e.GroupId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.Tags).WithMany(t => t.ShortenedLinks);
        });
    }

    private static void ConfigureLinkMetadataTable(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LinkMetadata>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(500);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ImageUrl).HasMaxLength(2048);
            entity.Property(e => e.SiteName).HasMaxLength(200);
        });
    }

    private static void ConfigureLinkAnalyticsTable(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LinkAnalytics>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.Referrer).HasMaxLength(2048);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.HasIndex(e => new { e.ShortenedLinkId, e.AccessedAt });
        });
    }

    private static void ConfigureTagTable(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Name).IsUnique();
        });
    }

    private static void ConfigureGroupTable(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Group>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Name).IsUnique();
        });
    }
}