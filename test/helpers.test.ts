import {isSubtleCryptoAvailable} from "../src/helpers";

describe("helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when subtle crypto is available", () => {
    vi.stubGlobal("crypto", {subtle: {}});
    expect(isSubtleCryptoAvailable()).toBe(true);
  });

  it("returns false when subtle crypto is unavailable", () => {
    vi.stubGlobal("crypto", {});
    expect(isSubtleCryptoAvailable()).toBe(false);
  });

  it("returns false when crypto is unavailable", () => {
    vi.stubGlobal("crypto", null);
    expect(isSubtleCryptoAvailable()).toBe(false);
  });
});
