import { beforeEach, describe, expect, it, vi } from "vitest";

const setNavigator = (overrides = {}) => {
  const defaultNavigator = {
    userAgent: "Mozilla/5.0",
    platform: "Win32",
    maxTouchPoints: 0,
  };

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { ...defaultNavigator, ...overrides },
  });
};

describe("deviceDetection", () => {
  beforeEach(() => {
    vi.resetModules();
    setNavigator();
  });

  it("detects iOS devices including iPad on MacIntel with touch", async () => {
    setNavigator({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPhone",
      maxTouchPoints: 0,
    });
    const mod1 = await import("./deviceDetection");
    expect(mod1.isIOS()).toBe(true);

    vi.resetModules();
    setNavigator({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
      platform: "MacIntel",
      maxTouchPoints: 5,
    });
    const mod2 = await import("./deviceDetection");
    expect(mod2.isIOS()).toBe(true);
  });

  it("detects iOS 18+ from user agent", async () => {
    setNavigator({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15",
    });
    const mod = await import("./deviceDetection");
    expect(mod.isIOS18Plus()).toBe(true);
  });

  it("returns falsy for non-iOS user agents", async () => {
    setNavigator({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
    const mod = await import("./deviceDetection");
    expect(Boolean(mod.isIOS18Plus())).toBe(false);
  });

  it("detects iPhone XS family user agent", async () => {
    setNavigator({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) iPhone12,3 AppleWebKit/605.1.15",
    });
    const mod = await import("./deviceDetection");
    expect(mod.isIPhoneXS()).toBe(true);
  });

  it("detects safari but not chrome", async () => {
    setNavigator({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
    });
    let mod = await import("./deviceDetection");
    expect(mod.isSafari()).toBe(true);

    vi.resetModules();
    setNavigator({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
    });
    mod = await import("./deviceDetection");
    expect(mod.isSafari()).toBe(false);
  });

  it("detects mobile user agents", async () => {
    setNavigator({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36",
    });
    const mod = await import("./deviceDetection");
    expect(mod.isMobile()).toBe(true);
  });

  it("returns appropriate user agent by platform", async () => {
    setNavigator({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPhone",
    });
    let mod = await import("./deviceDetection");
    expect(mod.getUserAgent()).toContain("iPhone");

    vi.resetModules();
    setNavigator({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36",
      platform: "Linux armv8",
    });
    mod = await import("./deviceDetection");
    expect(mod.getUserAgent()).toContain("Android");

    vi.resetModules();
    setNavigator({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      platform: "Win32",
    });
    mod = await import("./deviceDetection");
    expect(mod.getUserAgent()).toContain("Windows NT 10.0");
  });

  it("always uses proxy", async () => {
    const mod = await import("./deviceDetection");
    expect(mod.shouldUseProxy()).toBe(true);
  });
});
