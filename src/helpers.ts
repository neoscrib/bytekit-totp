export const isSubtleCryptoAvailable = () => {
  return !!globalThis.crypto?.subtle;
};
