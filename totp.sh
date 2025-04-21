#!/bin/bash

if [[ -z "${EPOCH}" ]]; then
  EPOCH=$(date +%s)
fi

if [[ -z "${DIGITS}" ]]; then
  DIGITS=6
fi

if [[ -z "${ALG}" ]]; then
  ALG=sha1
fi

COUNTER=$(($EPOCH / 30))
HEX_DATA=$(printf '%016x' $COUNTER)
HEX_KEY=$(echo $1 | base32 --decode | xxd -p -c256)
HASH=$(echo -n $HEX_DATA | xxd -r -p | openssl dgst -mac HMAC -macopt hexkey:$HEX_KEY -binary -$ALG | xxd -p -c256)

NIB=0x$(echo -n $HASH | tail -c1)
OFFSET=$(printf '%d' $NIB)
A=$(echo -n $HASH | xxd -r -p | head -c$(expr $OFFSET + 1) | tail -c1 | xxd -p)
B=$(echo -n $HASH | xxd -r -p | head -c$(expr $OFFSET + 2) | tail -c1 | xxd -p)
C=$(echo -n $HASH | xxd -r -p | head -c$(expr $OFFSET + 3) | tail -c1 | xxd -p)
D=$(echo -n $HASH | xxd -r -p | head -c$(expr $OFFSET + 4) | tail -c1 | xxd -p)
HEX_N=$(printf '0x%02x%02s%02s%02s' $((0x$A & 0x7f)) $B $C $D)
N=$(printf '%d' $HEX_N)
TOKEN=$(expr $N % $((10**$DIGITS)))
TOKEN=$(printf '%0*d' $DIGITS $TOKEN)
echo $TOKEN