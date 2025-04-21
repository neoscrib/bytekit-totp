import {base32decode, binaryToHex} from "../src/encoding";

describe("encoding", () => {
  describe("binaryToHex", () => {
    it("encodes binary input to a hex string", () => {
      const inputString = "hello world";
      const input = new Uint8Array([...inputString].map((c) => c.charCodeAt(0)));
      const result = binaryToHex(input);
      expect(result).toEqual("68656c6c6f20776f726c64")
    });
  });

  describe("base32decode", () => {
    it("decodes a base-32 string to binary", () => {
      const result = base32decode("JBSWY3DPEHPK3PXP");
      const resultHex = binaryToHex(result);
      expect(resultHex).toEqual("48656c6c6f21deadbeef");
    });

    it("throws with invalid base-32 characters", () => {
      expect(() => base32decode("JBSWY3DPE1PK3PXP")).toThrow("Invalid base-32 character '1'");
    });

    it("performance test", () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        const actual = new TextDecoder().decode(base32decode("MZXW6YTBOI======"));
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