# @bytekit/totp

A lightweight, promise-based library for generating TOTP and HOTP tokens in Node.js and browser environments. Fully supports standard OTP URI parsing and flexible configuration options.

## Features

- 🔐 Generate Time-based One-Time Passwords (TOTP)
- 🔢 Generate HMAC-based One-Time Passwords (HOTP)
- 🌐 Parse and extract OTP configuration from standard otpauth:// URIs
- 📦 Lightweight and dependency-free

## Installation

```bash
npm install @bytekit/totp
```

or

```bash
yarn add @bytekit/totp
```

## Usage

### Generate a TOTP

```ts
import { totp } from "@bytekit/totp";

const token = await totp({
  key: "JBSWY3DPEHPK3PXP", // base32 or Uint8Array
  digits: 6,              // optional, default: 6
  algorithm: "SHA-1",     // optional, default: SHA-1
  period: 30,             // optional, default: 30
  timestamp: Date.now() / 1000,  // optional, default: now (seconds)
});

console.log(token.token); // => "123456"
console.log(token.expires);   // Timestamp when this token expires
console.log(token.next);      // Next valid token
console.log(token.previous);  // Previous valid token
```

### Generate a HOTP

```ts
import { hotp } from "@bytekit/totp";

const key = new Uint8Array([/* your binary secret key */]);
const counter = new Uint8Array([/* your counter as binary */]);

const token = await hotp(key, counter, 6, "SHA-1");

console.log(token); // => "654321"
```

### Parse an OTP URI

```ts
import { parseOtpUri } from "@bytekit/totp";

const otpAuth = parseOtpUri("otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example");

console.log(otpAuth);
/*
{
  type: 'totp',
  account: 'user@example.com',
  issuer: 'Example',
  key: 'JBSWY3DPEHPK3PXP',
  digits: 6,
  algorithm: 'SHA-1',
  period: 30
}
*/
```

## Types

### `ITotpOptions`

| Option     | Type               | Default  | Description                                         |
|------------|--------------------|----------|-----------------------------------------------------|
| `key`      | `string` or `Uint8Array` | —        | Secret key in base32 or binary                      |
| `digits`   | `number`           | `6`      | Number of digits in the OTP                         |
| `algorithm`| `string`           | `"SHA-1"`| Hashing algorithm (`SHA-1`, `SHA-256`, etc.)        |
| `period`   | `number`           | `30`     | Validity period in seconds                          |
| `timestamp`| `number`           | `now`    | Unix timestamp to calculate OTP for                 |

### `ITotpToken`

```ts
interface ITotpToken {
  token: string;
  expires: number;
  next: string;
  previous: string;
}
```

### `IOtpAuth`

Returned by `parseOtpUri`.

```ts
interface IOtpAuth {
  type: string;
  account: string;
  issuer?: string;
  key: string | Uint8Array;
  digits?: number;
  algorithm?: string;
  period?: number;
  counter?: number;
}
```

## License

MIT
