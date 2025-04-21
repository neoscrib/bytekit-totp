export const binaryToHex = (input: Uint8Array): string => {
  return [...input].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const hexToBinary = (input: string): Uint8Array => {
  if (input.length % 2 !== 0) {
    input = "0" + input;
  }

  const buffer = new Uint8Array(input.length / 2);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = parseInt(input.substring(i * 2, i * 2 + 2), 16) & 0xff;
  }
  return buffer;
};

/**
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc4648#section-6
 */
export const base32decode = (input: string): Uint8Array => {
  if (!input.length) {
    return new Uint8Array();
  }

  let n = BigInt(0);
  for (const c of [...input.toUpperCase().replace(/=+$/, "")]) {
    const m = c.charCodeAt(0) - (/[2-7]/.test(c) ? 24 : 65);
    if (m < 0 || m > 31) {
      throw new Error(`Invalid base-32 character '${c}'`);
    }
    n = (n << 5n) | BigInt(m);
  }
  
  const padding = /=+$/.exec(input)?.[0].length;
  if (padding) {
    const extraBits = BigInt(8 - ((padding * 5) % 8));
    n >>= extraBits;
  }

  const binary = hexToBinary(n.toString(16));

  return binary;
};
