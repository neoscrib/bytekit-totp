export const binaryToHex = (input: Uint8Array): string => {
  return [...input].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const hexToBinary = (input: string): Uint8Array => {
  const normalized = input.length % 2 === 0 ? input : `0${input}`;
  const buffer = new Uint8Array(normalized.length / 2);
  for (
    let outputIndex = 0, inputOffset = 0;
    inputOffset < normalized.length;
    outputIndex++, inputOffset += 2
  ) {
    const byte = Number.parseInt(
      normalized.slice(inputOffset, inputOffset + 2),
      16
    );
    if (Number.isNaN(byte)) {
      throw new TypeError("Invalid hex input");
    }
    buffer[outputIndex] = byte;
  }
  return buffer;
};

/**
 *
 * @see https://datatracker.ietf.org/doc/html/rfc4648#section-6
 */
export const base32decode = (input: string): Uint8Array => {
  let value = 0;
  let bits = 0;
  let sawPadding = false;
  const bytes: number[] = [];

  for (const c of input.toUpperCase()) {
    if (c === "=") {
      sawPadding = true;
      continue;
    }

    if (sawPadding) {
      throw new Error("Invalid base-32 padding");
    }

    let m: number;
    if (/[A-Z]/.test(c)) {
      m = c.codePointAt(0)! - 65;
    } else if (/[2-7]/.test(c)) {
      m = c.codePointAt(0)! - 24;
    } else {
      throw new Error(`Invalid base-32 character '${c}'`);
    }

    value = (value << 5) | m;
    bits += 5;

    while (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
      value &= (1 << bits) - 1;
    }
  }

  return new Uint8Array(bytes);
};
