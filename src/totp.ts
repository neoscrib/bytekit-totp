import {base32decode, hexToBinary} from "./encoding";
import {hotp} from "./hotp";

/**
 * @see https://datatracker.ietf.org/doc/html/rfc6238
 */
export async function totp({
  key,
  digits = 6,
  algorithm = "SHA-1",
  period = 30,
  timestamp = Date.now() / 1000
}: ITotpOptions): Promise<ITotpToken> {
  const t = Math.floor(timestamp / period);
  const expires = t * period + period;
  const dataBuffer = hexToBinary(t.toString(16).padStart(16, "0"));
  const nextBuffer = hexToBinary((t + 1).toString(16).padStart(16, "0"));
  const prevBuffer = hexToBinary((t - 1).toString(16).padStart(16, "0"));
  const keyBuffer = typeof key === "string" ? base32decode(key) : key;
  const token = await hotp(keyBuffer, dataBuffer, digits, algorithm);
  const next = await hotp(keyBuffer, nextBuffer, digits, algorithm);
  const previous = await hotp(keyBuffer, prevBuffer, digits, algorithm);

  return {token, expires, next, previous};
}
