import {MockInstance} from "vitest";
import {hmac, hmachex} from "../src/hmac";
import * as helpers from "../src/helpers";
import * as crypto from "node:crypto";

// allows us to spy on the crypto module
vi.mock("crypto", async (importOriginal) => {
  return {
    ...(await importOriginal())
  };
});

describe("hmac", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("hmachex", () => {
    it("generates a valid hmac-sha-1", async () => {
      const actual = await hmachex("hello", "world");
      expect(actual).toEqual("8a3a84bcd0d0065e97f175d370447c7d02e00973");
    });

    it("generates a valid hmac-sha-256", async () => {
      const actual = await hmachex("hello", "world", "SHA-256");
      expect(actual).toEqual(
        "f1ac9702eb5faf23ca291a4dc46deddeee2a78ccdaf0a412bed7714cfffb1cc4"
      );
    });

    it("generates a valid hmac-sha-384", async () => {
      const actual = await hmachex("hello", "world", "SHA-384");
      expect(actual).toEqual(
        "80d036d9974e6f71ceabe493ee897d00235edcc4c72e046ddfc8bf68e86a477d63b9f7d26ad5b990aae6ac17db57ddcf"
      );
    });

    it("generates a valid hmac-sha-512", async () => {
      const actual = await hmachex("hello", "world", "SHA-512");
      expect(actual).toEqual(
        "6668ed2f7d016c5f12d7808fc4f2d1dc4851622d7f15616de947a823b3ee67d761b953f09560da301f832902020dd1c64f496df37eb7ac4fd2feeeb67d77ba9b"
      );
    });

    it("normalizes SHA384 algorithm names", async () => {
      const actual = await hmachex("hello", "world", "SHA384");
      expect(actual).toEqual(
        "80d036d9974e6f71ceabe493ee897d00235edcc4c72e046ddfc8bf68e86a477d63b9f7d26ad5b990aae6ac17db57ddcf"
      );
    });

    it("rejects prefixed algorithm names", async () => {
      await expect(hmachex("hello", "world", "X-SHA-256")).rejects.toThrow();
    });

    it("rejects suffixed algorithm names", async () => {
      await expect(
        hmachex("hello", "world", "SHA-256-EXTRA")
      ).rejects.toThrow();
    });

    it("uses subtle crypto when available", async () => {
      const createHmacSpy = vi.spyOn(crypto, "createHmac");
      await hmachex("hello", "world", "SHA-256");
      expect(createHmacSpy).not.toHaveBeenCalled();
    });

    it("works when global crypto is unavailable", async () => {
      vi.stubGlobal("crypto", null);
      const actual = await hmachex("hello", "world", "SHA-1");
      expect(actual).toEqual("8a3a84bcd0d0065e97f175d370447c7d02e00973");
      vi.unstubAllGlobals();
    });

    it("imports subtle key as non-extractable", async () => {
      const importKey = vi.fn().mockResolvedValue({id: "key"});
      const sign = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
      vi.spyOn(helpers, "isSubtleCryptoAvailable").mockReturnValue(true);
      vi.stubGlobal("crypto", {subtle: {importKey, sign}});

      await hmac(new Uint8Array([1, 2]), new Uint8Array([3, 4]), "SHA-1");

      expect(importKey).toHaveBeenCalledWith(
        "raw",
        expect.any(ArrayBuffer),
        {name: "HMAC", hash: {name: "SHA-1"}},
        false,
        ["sign"]
      );
      vi.unstubAllGlobals();
    });

    it("uses SHA-1 as default algorithm in subtle mode", async () => {
      const actual = await hmac(new Uint8Array([1, 2]), new Uint8Array([3, 4]));
      const expected = await hmac(
        new Uint8Array([1, 2]),
        new Uint8Array([3, 4]),
        "SHA-1"
      );
      expect(actual).toEqual(expected);
    });

    it("uses SHA-1 as default algorithm in legacy mode", async () => {
      vi.spyOn(helpers, "isSubtleCryptoAvailable").mockReturnValue(false);
      const actual = await hmac(new Uint8Array([1, 2]), new Uint8Array([3, 4]));
      const expected = await hmac(
        new Uint8Array([1, 2]),
        new Uint8Array([3, 4]),
        "SHA-1"
      );
      expect(actual).toEqual(expected);
    });

    if (globalThis.crypto?.subtle) {
      describe("uses legacy hmac when subtle is not available", () => {
        let createHmacSpy: MockInstance;

        beforeEach(() => {
          vi.spyOn(helpers, "isSubtleCryptoAvailable").mockReturnValue(false);
          createHmacSpy = vi.spyOn(crypto, "createHmac");
        });

        it("generates a valid hmac-sha-1", async () => {
          const actual = await hmachex("hello", "world");
          expect(actual).toEqual("8a3a84bcd0d0065e97f175d370447c7d02e00973");
          expect(createHmacSpy).toHaveBeenCalledWith(
            "SHA-1",
            expect.any(Uint8Array)
          );
        });

        it("generates a valid hmac-sha-256", async () => {
          const actual = await hmachex("hello", "world", "SHA-256");
          expect(actual).toEqual(
            "f1ac9702eb5faf23ca291a4dc46deddeee2a78ccdaf0a412bed7714cfffb1cc4"
          );
          expect(createHmacSpy).toHaveBeenCalledWith(
            "SHA-256",
            expect.any(Uint8Array)
          );
        });

        it("generates a valid hmac-sha-384", async () => {
          const actual = await hmachex("hello", "world", "SHA-384");
          expect(actual).toEqual(
            "80d036d9974e6f71ceabe493ee897d00235edcc4c72e046ddfc8bf68e86a477d63b9f7d26ad5b990aae6ac17db57ddcf"
          );
          expect(createHmacSpy).toHaveBeenCalledWith(
            "SHA-384",
            expect.any(Uint8Array)
          );
        });

        it("generates a valid hmac-sha-512", async () => {
          const actual = await hmachex("hello", "world", "SHA-512");
          expect(actual).toEqual(
            "6668ed2f7d016c5f12d7808fc4f2d1dc4851622d7f15616de947a823b3ee67d761b953f09560da301f832902020dd1c64f496df37eb7ac4fd2feeeb67d77ba9b"
          );
          expect(createHmacSpy).toHaveBeenCalledWith(
            "SHA-512",
            expect.any(Uint8Array)
          );
        });
      });
    }
  });
});
