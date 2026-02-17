import {base32decode, binaryToHex, hexToBinary} from "../src/encoding";

describe("encoding", () => {
  describe("binaryToHex", () => {
    it("encodes binary input to a hex string", () => {
      const inputString = "hello world";
      const input = new Uint8Array(
        [...inputString].map((c) => c.codePointAt(0)!)
      );
      const result = binaryToHex(input);
      expect(result).toEqual("68656c6c6f20776f726c64");
    });
  });

  describe("hexToBinary", () => {
    it("decodes odd-length hex input by padding a leading zero", () => {
      const result = hexToBinary("abc");
      expect(binaryToHex(result)).toEqual("0abc");
    });

    it("decodes even-length hex input in the correct byte order", () => {
      const result = hexToBinary("123456");
      expect(binaryToHex(result)).toEqual("123456");
    });

    it("throws on invalid hex input", () => {
      expect(() => hexToBinary("zz")).toThrow("Invalid hex input");
    });
  });

  describe("base32decode", () => {
    it("decodes a base-32 string to binary", () => {
      const result = base32decode("JBSWY3DPEHPK3PXP");
      const resultHex = binaryToHex(result);
      expect(resultHex).toEqual("48656c6c6f21deadbeef");
    });

    it("throws with invalid base-32 characters", () => {
      expect(() => base32decode("JBSWY3DPE1PK3PXP")).toThrow(
        "Invalid base-32 character '1'"
      );
    });

    it("throws with invalid base-32 padding", () => {
      expect(() => base32decode("MY=Y====")).toThrow("Invalid base-32 padding");
    });

    it("throws with invalid base-32 punctuation", () => {
      expect(() => base32decode("A_======")).toThrow(
        "Invalid base-32 character '_'"
      );
    });

    it("accepts upper range base-32 digits", () => {
      expect(() => base32decode("77777777")).not.toThrow();
    });

    it("preserves leading zero bytes", () => {
      expect(binaryToHex(base32decode("AAAA===="))).toEqual("0000");
      expect(binaryToHex(base32decode("AAAQ===="))).toEqual("0001");
    });

    it("performance test", () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        const actual = new TextDecoder().decode(
          base32decode("MZXW6YTBOI======")
        );
        expect(actual).toEqual("foobar");
      }
      const elapsed = performance.now() - start;
      console.log(elapsed);
      expect(elapsed).toBeLessThan(10000);
    });

    for (const [input, expected] of [
      ["", ""],
      ["MY======", "f"],
      ["MZXQ====", "fo"],
      ["MZXW6===", "foo"],
      ["MZXW6YQ=", "foob"],
      ["MZXW6YTB", "fooba"],
      ["MZXW6YTBOI======", "foobar"]
    ]) {
      /**
       * @see https://datatracker.ietf.org/doc/html/rfc4648#section-10
       */
      it(`decodes rfc-4648 test vectors ${input || "(empty)"}`, () => {
        const actual = new TextDecoder().decode(base32decode(input));
        expect(actual).toEqual(expected);
      });
    }
  });
});
