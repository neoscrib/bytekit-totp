import {hmac} from "./hmac";

/**
 * @see https://datatracker.ietf.org/doc/html/rfc4226
 */
export const hotp = async (
  key: Uint8Array,
  data: Uint8Array,
  digits = 6,
  alg = "SHA-1"
): Promise<string> => {
  const hs = await hmac(key, data, alg);
  const offset = hs.at(-1)! & 0xf;
  const dt =
    ((hs[offset] & 0x7f) << 24) |
    (hs[offset + 1] << 16) |
    (hs[offset + 2] << 8) |
    hs[offset + 3];
  return `${dt % Math.pow(10, digits)}`.padStart(digits, "0");
};
