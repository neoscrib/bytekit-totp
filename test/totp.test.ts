import {base32decode} from "../src/encoding";
import {totp} from "../src/totp";

describe("totp", () => {
  describe("nodejs", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("generates valid one-time passwords with base-32 input", async () => {
      const key = "JBSWY3DPEHPK3PXP";
      const result = await totp({key, timestamp: 1736638420});

      expect(result).toEqual({
        expires: 1736638440,
        token: "482223",
        previous: "534333",
        next: "291802"
      });
    });

    it("generates valid one-time passwords with binary input", async () => {
      const key = base32decode("JBSWY3DPEHPK3PXP");
      const result = await totp({key, timestamp: 1736638420});

      expect(result).toEqual({
        expires: 1736638440,
        token: "482223",
        previous: "534333",
        next: "291802"
      });
    });

    it("uses current time in seconds by default", async () => {
      vi.spyOn(Date, "now").mockReturnValue(1736638420000);
      const key = "JBSWY3DPEHPK3PXP";
      const result = await totp({key});

      expect(result).toEqual({
        expires: 1736638440,
        token: "482223",
        previous: "534333",
        next: "291802"
      });
    });

    describe("rfc-6238 vectors", () => {
      const baseKey = [
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30
      ];
      const keyLengths = {
        "SHA-1": 20,
        "SHA-256": 32,
        "SHA-384": 48,
        "SHA-512": 64
      } as const;

      for (const [timestamp, alg, expected] of [
        [59, "SHA-1", "94287082"],
        [59, "SHA-256", "46119246"],
        [59, "SHA-384", "12260385"],
        [59, "SHA-512", "90693936"],
        [1111111109, "SHA-1", "07081804"],
        [1111111109, "SHA-256", "68084774"],
        [1111111109, "SHA-384", "93607533"],
        [1111111109, "SHA-512", "25091201"],
        [1111111111, "SHA-1", "14050471"],
        [1111111111, "SHA-256", "67062674"],
        [1111111111, "SHA-384", "30635264"],
        [1111111111, "SHA-512", "99943326"],
        [1234567890, "SHA-1", "89005924"],
        [1234567890, "SHA-256", "91819424"],
        [1234567890, "SHA-384", "29066410"],
        [1234567890, "SHA-512", "93441116"],
        [2000000000, "SHA-1", "69279037"],
        [2000000000, "SHA-256", "90698825"],
        [2000000000, "SHA-384", "45679189"],
        [2000000000, "SHA-512", "38618901"],
        [20000000000, "SHA-1", "65353130"],
        [20000000000, "SHA-256", "77737706"],
        [20000000000, "SHA-384", "33578931"],
        [20000000000, "SHA-512", "47863826"]
      ] as [number, keyof typeof keyLengths, string][]) {
        /**
         * @see https://datatracker.ietf.org/doc/html/rfc6238#appendix-B
         * SHA-384 vectors are generated from an independent Node.js crypto implementation
         * using RFC 4226 dynamic truncation and the RFC 6238 key construction pattern.
         */
        it(`generates valid TOTP tokens for ${alg} at ${timestamp}`, async () => {
          const keyLength = keyLengths[alg];
          const keyData = [...baseKey];
          while (keyData.length < keyLength) {
            keyData.push(baseKey[keyData.length % baseKey.length]);
          }

          const key = new Uint8Array(keyData);
          const result = await totp({
            key,
            timestamp,
            digits: 8,
            algorithm: alg
          });
          expect(result.token).toEqual(expected);
        });
      }
    });
  });
});
