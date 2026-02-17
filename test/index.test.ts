import {parseOtpUri, totp, generateOtpUri} from "../src/index";

describe("parseUrl", () => {
  it("parses a totp url", async () => {
    const result = parseOtpUri(
      "otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA-256&digits=8&period=60"
    );
    expect(result).toStrictEqual({
      account: "john.doe@email.com",
      type: "totp",
      key: "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ",
      algorithm: "SHA-256",
      digits: 8,
      period: 60,
      issuer: "ACME Co"
    });

    expect(await totp({...result, timestamp: 1736638420})).toStrictEqual({
      expires: 1736638440,
      token: "80187452",
      next: "68005190",
      previous: "12019689"
    });
  });

  it("uses issuer from params when not specified in path", () => {
    const result = parseOtpUri(
      "otpauth://totp/john.doe@email.com?issuer=ACME%20Co&secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30"
    );
    expect(result).toStrictEqual({
      account: "john.doe@email.com",
      type: "totp",
      key: "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      issuer: "ACME Co"
    });
  });

  it("ignores issuer param when path also has issuer", () => {
    const result = parseOtpUri(
      "otpauth://totp/ACME%20Co:john.doe@email.com?issuer=8675309&secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30"
    );
    expect(result).toStrictEqual({
      account: "john.doe@email.com",
      type: "totp",
      key: "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      issuer: "ACME Co"
    });
  });

  it("uses defaults for algorithm, digits, and period when not specified", () => {
    const result = parseOtpUri(
      "otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co"
    );
    expect(result).toStrictEqual({
      account: "john.doe@email.com",
      type: "totp",
      key: "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      issuer: "ACME Co"
    });
  });

  it("parses an hotp url", async () => {
    const result = parseOtpUri(
      "otpauth://hotp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&counter=1"
    );
    expect(result).toStrictEqual({
      account: "john.doe@email.com",
      type: "hotp",
      key: "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ",
      algorithm: "SHA1",
      digits: 6,
      counter: 1,
      issuer: "ACME Co"
    });
  });

  it("throws when protocol is not otpauth", () => {
    expect(() => parseOtpUri("https://localhost/")).toThrow(
      "Invalid OTP auth URI"
    );
  });

  it("throws when no secret is supplied", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://totp/ACME%20Co:john.doe@email.com?issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30"
      )
    ).toThrow("OTP auth URI missing secret");
  });

  it("throws when type is hotp and counter is not specified", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://hotp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6"
      )
    ).toThrow("Counter param must be present when type is hotp");
  });

  it("throws type is hotp and counter is not a number", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://hotp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&counter=notANumber"
      )
    ).toThrow("Counter param must be a number");
  });

  it("throws when OTP type is invalid", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://custom/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ"
      )
    ).toThrow("OTP auth URI type must be either hotp or totp");
  });

  it("throws when digits is not an integer", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&digits=6abc"
      )
    ).toThrow("Digits param must be a positive integer");
  });

  it("throws when period is not an integer", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&period=30abc"
      )
    ).toThrow("Period param must be a positive integer");
  });

  it("throws when counter has trailing characters", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://hotp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&counter=1abc"
      )
    ).toThrow("Counter param must be a number");
  });

  it("throws when counter is larger than a safe integer", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://hotp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&counter=9007199254740993"
      )
    ).toThrow("Counter param must be a number");
  });

  it("throws when counter has leading whitespace", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://hotp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&counter=%201"
      )
    ).toThrow("Counter param must be a number");
  });

  it("throws when counter has trailing whitespace", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://hotp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&counter=1%20"
      )
    ).toThrow("Counter param must be a number");
  });

  it("throws when account is missing", () => {
    expect(() =>
      parseOtpUri("otpauth://totp/?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ")
    ).toThrow("OTP auth URI missing account");
  });

  it("accepts digits and period with value 1", () => {
    const result = parseOtpUri(
      "otpauth://totp/john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&digits=1&period=1"
    );
    expect(result).toStrictEqual({
      account: "john.doe@email.com",
      type: "totp",
      key: "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ",
      algorithm: "SHA1",
      digits: 1,
      period: 1
    });
  });

  it("rejects zero digits", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://totp/john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&digits=0"
      )
    ).toThrow("Digits param must be a positive integer");
  });

  it("rejects zero period", () => {
    expect(() =>
      parseOtpUri(
        "otpauth://totp/john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&period=0"
      )
    ).toThrow("Period param must be a positive integer");
  });

  it("does not include issuer when uri has none", () => {
    const result = parseOtpUri(
      "otpauth://totp/john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ"
    );
    expect(result).toStrictEqual({
      account: "john.doe@email.com",
      type: "totp",
      key: "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ",
      algorithm: "SHA1",
      digits: 6,
      period: 30
    });
  });
});

describe("generateUrl", () => {
  it("generates a totp url without issuer in the label", () => {
    const result = generateOtpUri({
      key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
      account: "rentals@bestrentalsinc.com",
      type: "totp",
      digits: 8,
      period: 60
    });

    expect(result).toBe(
      "otpauth://totp/rentals%40bestrentalsinc.com?secret=RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4&algorithm=SHA1&digits=8&period=60"
    );
  });

  it("generates a totp url", () => {
    const result = generateOtpUri({
      key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
      account: "rentals@bestrentalsinc.com",
      issuer: "Ubiquiti SSO",
      type: "totp"
    });
    expect(result).toBe(
      "otpauth://totp/Ubiquiti%20SSO%3Arentals%40bestrentalsinc.com?secret=RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4&algorithm=SHA1&digits=6&period=30&issuer=Ubiquiti+SSO"
    );
  });

  it("generates a hotp url", () => {
    const result = generateOtpUri({
      key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
      account: "rentals@bestrentalsinc.com",
      type: "hotp",
      counter: 1
    });
    expect(result).toBe(
      "otpauth://hotp/rentals%40bestrentalsinc.com?secret=RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4&algorithm=SHA1&digits=6&counter=1"
    );
  });

  it("generates a hotp url with counter 0", () => {
    const result = generateOtpUri({
      key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
      account: "rentals@bestrentalsinc.com",
      type: "hotp",
      counter: 0
    });
    expect(result).toBe(
      "otpauth://hotp/rentals%40bestrentalsinc.com?secret=RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4&algorithm=SHA1&digits=6&counter=0"
    );
  });

  it("throws when type is invalid", () => {
    expect(() =>
      generateOtpUri({
        key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
        account: "rentals@bestrentalsinc.com",
        type: "custom" as "totp"
      })
    ).toThrow("Type must be either hotp or totp");
  });

  it("throws when account is missing", () => {
    expect(() =>
      generateOtpUri({
        key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
        account: "",
        type: "totp"
      })
    ).toThrow("Account must be specified");
  });

  it("throws when key is not a string", () => {
    expect(() =>
      generateOtpUri({
        key: new Uint8Array([1, 2, 3]) as unknown as string,
        account: "rentals@bestrentalsinc.com",
        type: "totp"
      })
    ).toThrow("OTP URI key must be a base-32 string");
  });

  it("throws when digits is not a positive integer", () => {
    expect(() =>
      generateOtpUri({
        key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
        account: "rentals@bestrentalsinc.com",
        type: "totp",
        digits: 0
      })
    ).toThrow("Digits param must be a positive integer");
  });

  it("throws when period is not a positive integer", () => {
    expect(() =>
      generateOtpUri({
        key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
        account: "rentals@bestrentalsinc.com",
        type: "totp",
        period: 0
      })
    ).toThrow("Period param must be a positive integer");
  });

  it("throws when hotp counter is not supplied", () => {
    expect(() =>
      generateOtpUri({
        key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
        account: "rentals@bestrentalsinc.com",
        type: "hotp"
      })
    ).toThrow("Counter must be specified for hotp");
  });

  it("throws when hotp counter is invalid", () => {
    expect(() =>
      generateOtpUri({
        key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
        account: "rentals@bestrentalsinc.com",
        type: "hotp",
        counter: -1
      })
    ).toThrow("Counter must be specified for hotp");
  });

  it("accepts digits and period with value 1", () => {
    const result = generateOtpUri({
      key: "RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4",
      account: "rentals@bestrentalsinc.com",
      type: "totp",
      digits: 1,
      period: 1
    });
    expect(result).toBe(
      "otpauth://totp/rentals%40bestrentalsinc.com?secret=RJGRMVN2JLRKRYEJGAFDLF7KUHCMZXM4&algorithm=SHA1&digits=1&period=1"
    );
  });
});
