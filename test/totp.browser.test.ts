import {base32decode} from "../src/encoding";
import {hexToBinary} from "../src/encoding";
import {hotp} from "../src/hotp";
import {generateOtpUri, parseOtpUri} from "../src/index";
import {totp} from "../src/totp";

describe("totp browser", () => {
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

  it("supports SHA-256 and SHA-512 vectors in browser mode", async () => {
    const baseKey = new TextEncoder().encode("12345678901234567890");
    const sha256Key = new Uint8Array(32);
    const sha512Key = new Uint8Array(64);
    for (let index = 0; index < sha256Key.length; index++) {
      sha256Key[index] = baseKey[index % baseKey.length];
    }
    for (let index = 0; index < sha512Key.length; index++) {
      sha512Key[index] = baseKey[index % baseKey.length];
    }

    const sha256 = await totp({
      key: sha256Key,
      timestamp: 59,
      digits: 8,
      algorithm: "SHA-256"
    });
    const sha512 = await totp({
      key: sha512Key,
      timestamp: 59,
      digits: 8,
      algorithm: "SHA-512"
    });

    expect(sha256.token).toBe("46119246");
    expect(sha512.token).toBe("90693936");
  });

  it("generates RFC-4226 HOTP values in browser mode", async () => {
    const key = new TextEncoder().encode("12345678901234567890");
    const data = hexToBinary("0000000000000001");
    const result = await hotp(key, data, 6, "SHA-1");
    expect(result).toBe("287082");
  });

  it("supports HOTP with SHA-256 and SHA-512 in browser mode", async () => {
    const baseKey = new TextEncoder().encode("12345678901234567890");
    const sha256Key = new Uint8Array(32);
    const sha512Key = new Uint8Array(64);
    for (let index = 0; index < sha256Key.length; index++) {
      sha256Key[index] = baseKey[index % baseKey.length];
    }
    for (let index = 0; index < sha512Key.length; index++) {
      sha512Key[index] = baseKey[index % baseKey.length];
    }

    const data = hexToBinary("0000000000000001");
    const sha256 = await hotp(sha256Key, data, 8, "SHA-256");
    const sha512 = await hotp(sha512Key, data, 8, "SHA-512");

    expect(sha256).toBe("46119246");
    expect(sha512).toBe("90693936");
  });

  it("round-trips OTP auth URIs in browser mode", () => {
    const uri = generateOtpUri({
      key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
      account: "rentals@bestrentalsinc.com",
      issuer: "Ubiquiti SSO",
      type: "totp",
      digits: 8,
      period: 60,
      algorithm: "SHA-256"
    });

    expect(uri).toBe(
      "otpauth://totp/Ubiquiti%20SSO%3Arentals%40bestrentalsinc.com?secret=RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4&algorithm=SHA-256&digits=8&period=60&issuer=Ubiquiti+SSO"
    );

    const parsed = parseOtpUri(uri);
    expect(parsed).toStrictEqual({
      account: "rentals@bestrentalsinc.com",
      type: "totp",
      key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
      algorithm: "SHA-256",
      digits: 8,
      period: 60,
      issuer: "Ubiquiti SSO"
    });
  });
});
