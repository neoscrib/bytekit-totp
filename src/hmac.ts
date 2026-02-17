import {binaryToHex} from "./encoding";
import {isSubtleCryptoAvailable} from "./helpers";

export const hmachex = async (
  key: string,
  data: string,
  alg = "SHA-1"
): Promise<string> => {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const dataBuffer = enc.encode(data);
  const signature = await hmac(keyData, dataBuffer, alg);
  return binaryToHex(signature);
};

export const hmac = async (
  key: Uint8Array,
  data: Uint8Array,
  alg = "SHA-1"
): Promise<Uint8Array> => {
  let name = alg;
  const match = /^SHA-?(1|256|384|512)$/i.exec(name);
  if (match) {
    name = `SHA-${match[1]}`;
  }

  const subtle = globalThis.crypto?.subtle;
  if (!isSubtleCryptoAvailable() || !subtle) {
    return hmac_legacy(key, data, name);
  }

  const keyBuffer = new Uint8Array(key).buffer;
  const dataBuffer = new Uint8Array(data).buffer;

  const cryptoKey = await subtle.importKey(
    "raw",
    keyBuffer,
    {name: "HMAC", hash: {name}},
    false,
    ["sign"]
  );
  const signature = await subtle.sign("HMAC", cryptoKey, dataBuffer);
  return new Uint8Array(signature);
};

const hmac_legacy = async (
  key: Uint8Array,
  data: Uint8Array,
  alg: string
): Promise<Uint8Array> => {
  const hmac = (await import("node:crypto")).createHmac(alg, key);
  hmac.update(data);
  return hmac.digest();
};
