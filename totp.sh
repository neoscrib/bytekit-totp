#!/bin/bash
set -euo pipefail

if [[ $# -lt 1 || -z "${1:-}" ]]; then
  echo "Usage: $0 <base32-secret>" >&2
  exit 1
fi

if [[ -z "${EPOCH:-}" ]]; then
  EPOCH=$(date +%s)
fi

if [[ -z "${DIGITS:-}" ]]; then
  DIGITS=6
fi

if [[ -z "${ALG:-}" ]]; then
  ALG=sha1
fi

if ! [[ "$DIGITS" =~ ^[0-9]+$ ]] || [[ "$DIGITS" -lt 1 ]]; then
  echo "DIGITS must be a positive integer" >&2
  exit 1
fi

if ! [[ "$EPOCH" =~ ^[0-9]+$ ]]; then
  echo "EPOCH must be a non-negative integer timestamp in seconds" >&2
  exit 1
fi

case "$ALG" in
  sha1|sha256|sha384|sha512) ;;
  *)
    echo "ALG must be one of: sha1, sha256, sha384, sha512" >&2
    exit 1
    ;;
esac

SECRET=$(printf '%s' "$1" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')
if [[ -z "$SECRET" ]]; then
  echo "Secret cannot be empty" >&2
  exit 1
fi

COUNTER=$((EPOCH / 30))
HEX_DATA=$(printf '%016x' "$COUNTER")
HEX_KEY=$(printf '%s' "$SECRET" | base32 --decode 2>/dev/null | xxd -p -c256 || true)
if [[ -z "$HEX_KEY" ]]; then
  echo "Invalid base32 secret" >&2
  exit 1
fi

OPENSSL_ALG="-$ALG"
HASH=$(printf '%s' "$HEX_DATA" | xxd -r -p | openssl dgst -mac HMAC -macopt "hexkey:$HEX_KEY" -binary "$OPENSSL_ALG" | xxd -p -c256)
if [[ ${#HASH} -lt 40 ]]; then
  echo "Failed to generate HMAC digest" >&2
  exit 1
fi

OFFSET=$((16#${HASH: -1}))
START=$((OFFSET * 2))
PART=${HASH:$START:8}
A=${PART:0:2}
B=${PART:2:2}
C=${PART:4:2}
D=${PART:6:2}

N=$(( ((16#$A & 0x7f) << 24) | (16#$B << 16) | (16#$C << 8) | 16#$D ))
TOKEN=$((N % 10**DIGITS))
printf '%0*d\n' "$DIGITS" "$TOKEN"
