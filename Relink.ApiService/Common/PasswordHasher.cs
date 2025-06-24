using System.Security.Cryptography;
using System.Text;

namespace Relink.ApiService.Common;

public static class PasswordHasher
{
    public static string? CalculatePasswordHash(string password, string shortLinkId)
    {
        if (password.Trim() == string.Empty) return null;

        // prefer Shake256, fallback to SHA256 if not supported on Platform
        return Shake256.IsSupported
          ? CalculateShake256PasswordHash(password, shortLinkId)
          : CalculateSha256PasswordHash(password, shortLinkId);
    }

    private static readonly Dictionary<string, Func<string?, string, string?>> AlgMap = new() {
    { "shake256:32", CalculateShake256PasswordHash },
    { $"sha256:{SHA256.HashSizeInBytes}", CalculateSha256PasswordHash }
  };


    public static bool VerifyPasswordHash(string? passwordHash, string? password, string shortLinkId)
    {
        if (passwordHash == null) return true;
        if (password == null) return false;

        var parts = passwordHash.Split('|');
        if (parts.Length != 2) return false;
        var algorithm = parts[0];
        if (!AlgMap.TryGetValue(algorithm, out var calculatePasswordHash)) return false;

        var hashedPassword = calculatePasswordHash(password, shortLinkId);
        if (hashedPassword == null) return false;
        return hashedPassword == passwordHash;
    }


    public static string? CalculateShake256PasswordHash(string? password, string shortLinkId)
    {
        if (password == null) return null;
        var buf = new byte[32];
        Shake256.HashData(Encoding.UTF8.GetBytes($"{shortLinkId}-{password}-{shortLinkId}"), buf);
        return $"shake256:32|{Convert.ToBase64String(buf)}";
    }

    public static string? CalculateSha256PasswordHash(string? password, string shortLinkId)
    {
        if (password == null) return null;
        var buf = new byte[SHA256.HashSizeInBytes];
        SHA256.HashData(Encoding.UTF8.GetBytes($"{shortLinkId}-{password}-{shortLinkId}"), buf);
        return $"sha256:{SHA256.HashSizeInBytes}|{Convert.ToBase64String(buf)}";
    }
}
