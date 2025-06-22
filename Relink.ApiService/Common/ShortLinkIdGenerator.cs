using System.Security.Cryptography;

namespace Relink.ApiService.Common;

public static class ShortLinkIdGenerator
{
    private static readonly char[] UsableCharacters = [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ];

    public static string CreateRandomId()
    {
        var randomChars = Enumerable.Range(0, 8)
          .Select(_ => UsableCharacters[RandomNumberGenerator.GetInt32(0, UsableCharacters.Length - 1)]);

        return string.Join("", randomChars);
    }
}
