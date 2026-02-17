export {totp} from "./totp";
export {hotp} from "./hotp";
const INTEGER_REGEX = /^\d+$/;

const parseInteger = (value: string): number => {
  if (!INTEGER_REGEX.test(value)) {
    return Number.NaN;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : Number.NaN;
};

const parsePositiveInteger = (value: string, name: string): number => {
  const parsed = parseInteger(value);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new Error(`${name} param must be a positive integer`);
  }
  return parsed;
};

const parseHotpCounter = (parsed: URL): number | undefined => {
  if (parsed.hostname.toLowerCase() !== "hotp") {
    return undefined;
  }

  if (!parsed.searchParams.has("counter")) {
    throw new Error("Counter param must be present when type is hotp");
  }

  const counter = parseInteger(parsed.searchParams.get("counter")!);
  if (Number.isNaN(counter)) {
    throw new TypeError("Counter param must be a number");
  }

  return counter;
};

const parseLabel = (pathname: string): {account: string; issuer?: string} => {
  const decodedPath = decodeURIComponent(pathname);
  const path = decodedPath.slice(1);
  if (!path.includes(":")) {
    return {account: path};
  }

  const index = path.indexOf(":");
  return {
    issuer: path.slice(0, index),
    account: path.slice(index + 1)
  };
};

export function generateOtpUri(token: IOtpAuth): string {
  const {issuer, algorithm, digits, period, counter, key, type, account} =
    token;

  if (!account) {
    throw new Error("Account must be specified");
  }

  if (typeof key !== "string") {
    throw new TypeError("OTP URI key must be a base-32 string");
  }

  const digitsValue = typeof digits === "number" ? digits : 6;
  if (!Number.isSafeInteger(digitsValue) || digitsValue < 1) {
    throw new Error("Digits param must be a positive integer");
  }

  const params = new URLSearchParams({
    secret: key,
    algorithm: algorithm ?? "SHA1",
    digits: digitsValue.toString()
  });

  switch (type) {
    case "totp": {
      const periodValue = typeof period === "number" ? period : 30;
      if (!Number.isSafeInteger(periodValue) || periodValue < 1) {
        throw new Error("Period param must be a positive integer");
      }
      params.set("period", periodValue.toString());
      break;
    }
    case "hotp": {
      if (
        typeof counter !== "number" ||
        !Number.isSafeInteger(counter) ||
        counter < 0
      ) {
        throw new Error("Counter must be specified for hotp");
      }
      params.set("counter", counter.toString());
      break;
    }
    default: {
      throw new Error("Type must be either hotp or totp");
    }
  }

  if (issuer) {
    params.set("issuer", issuer);
  }

  const label = issuer ? `${issuer}:${account}` : account;
  return `otpauth://${type}/${encodeURIComponent(label)}?${params}`;
}

export function parseOtpUri(uri: string): IOtpAuth {
  const parsed = new URL(uri);
  if (parsed.protocol !== "otpauth:") {
    throw new Error("Invalid OTP auth URI");
  }

  const secret = parsed.searchParams.get("secret");
  if (!secret) {
    throw new Error("OTP auth URI missing secret");
  }

  const type = parsed.hostname.toLowerCase();
  if (type !== "hotp" && type !== "totp") {
    throw new Error("OTP auth URI type must be either hotp or totp");
  }

  const counter = parseHotpCounter(parsed);
  const {account, issuer: pathIssuer} = parseLabel(parsed.pathname);
  let issuer = pathIssuer;

  if (!account) {
    throw new Error("OTP auth URI missing account");
  }

  if (!issuer && parsed.searchParams.has("issuer")) {
    issuer = decodeURIComponent(parsed.searchParams.get("issuer")!);
  }

  const digits = parsePositiveInteger(
    parsed.searchParams.get("digits") ?? "6",
    "Digits"
  );

  const result: IOtpAuth = {
    account,
    type,
    key: secret,
    algorithm: parsed.searchParams.get("algorithm") ?? "SHA1",
    digits
  };

  if (type === "totp") {
    Object.assign(result, {
      period: parsePositiveInteger(
        parsed.searchParams.get("period") ?? "30",
        "Period"
      )
    });
  }

  if (issuer) {
    Object.assign(result, {issuer});
  }

  if (typeof counter === "number") {
    Object.assign(result, {counter});
  }

  return result;
}
