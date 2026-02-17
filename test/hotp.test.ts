import {hotp} from "../src/hotp";
import {hexToBinary} from "../src/encoding";

describe("hotp", () => {
  const baseKey = [0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30];
  const keyLengths = {
    "SHA-1": 20,
    "SHA-256": 32,
    "SHA-384": 48,
    "SHA-512": 64
  };

  for (const [t, alg, expected] of [
    ["0000000000000001", "SHA-1", "94287082"],
    ["0000000000000001", "SHA-256", "46119246"],
    ["0000000000000001", "SHA-384", "12260385"],
    ["0000000000000001", "SHA-512", "90693936"],
    ["00000000023523EC", "SHA-1", "07081804"],
    ["00000000023523EC", "SHA-256", "68084774"],
    ["00000000023523EC", "SHA-384", "93607533"],
    ["00000000023523EC", "SHA-512", "25091201"],
    ["00000000023523ED", "SHA-1", "14050471"],
    ["00000000023523ED", "SHA-256", "67062674"],
    ["00000000023523ED", "SHA-384", "30635264"],
    ["00000000023523ED", "SHA-512", "99943326"],
    ["000000000273EF07", "SHA-1", "89005924"],
    ["000000000273EF07", "SHA-256", "91819424"],
    ["000000000273EF07", "SHA-384", "29066410"],
    ["000000000273EF07", "SHA-512", "93441116"],
    ["0000000003F940AA", "SHA-1", "69279037"],
    ["0000000003F940AA", "SHA-256", "90698825"],
    ["0000000003F940AA", "SHA-384", "45679189"],
    ["0000000003F940AA", "SHA-512", "38618901"],
    ["0000000027BC86AA", "SHA-1", "65353130"],
    ["0000000027BC86AA", "SHA-256", "77737706"],
    ["0000000027BC86AA", "SHA-384", "33578931"],
    ["0000000027BC86AA", "SHA-512", "47863826"]
  ] as [string, keyof typeof keyLengths, string][]) {
    /**
     * @see https://datatracker.ietf.org/doc/html/rfc6238#appendix-B
     * SHA-384 vectors are generated from an independent Node.js crypto implementation
     * using RFC 4226 dynamic truncation and the RFC 6238 key construction pattern.
     */
    it(`generates valid hmac-based one-time passwords for ${alg} at ${t}`, async () => {
      const keyLength = keyLengths[alg];
      const keyData = [...baseKey];
      while (keyData.length < keyLength) {
        keyData.push(baseKey[keyData.length % baseKey.length]);
      }

      const key = new Uint8Array(keyData);
      const data = hexToBinary(t);
      const result = await hotp(key, data, 8, alg);
      expect(result).toEqual(expected);
    });
  }

  describe("rfc-4226 vectors", () => {
    const key = new TextEncoder().encode("12345678901234567890");

    for (const [counter, expected] of [
      [0, "755224"],
      [1, "287082"],
      [2, "359152"],
      [3, "969429"],
      [4, "338314"],
      [5, "254676"],
      [6, "287922"],
      [7, "162583"],
      [8, "399871"],
      [9, "520489"]
    ] as [number, string][]) {
      /**
       * @see https://datatracker.ietf.org/doc/html/rfc4226#appendix-D
       */
      it(`generates the expected HOTP for counter ${counter}`, async () => {
        const data = hexToBinary(counter.toString(16).padStart(16, "0"));
        const result = await hotp(key, data, 6, "SHA-1");
        expect(result).toEqual(expected);
      });
    }

    it("uses SHA-1 as the default algorithm", async () => {
      const data = hexToBinary("0000000000000000");
      const result = await hotp(key, data, 6);
      expect(result).toEqual("755224");
    });
  });
});
