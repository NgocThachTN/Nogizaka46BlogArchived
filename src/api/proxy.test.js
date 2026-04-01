import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("proxy api helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("creates encoded proxy URL with params", async () => {
    const mod = await import("./proxy.js");
    const url = mod.createProxyUrl("/s/n46/api/list/member", { callback: "res" });
    expect(url).toContain("/api/proxy?url=");
    expect(decodeURIComponent(url.split("url=")[1])).toBe(
      "https://www.nogizaka46.com/s/n46/api/list/member?callback=res"
    );
  });

  it("caches successful responses and avoids duplicate fetch", async () => {
    vi.doMock("../utils/deviceDetection.js", () => ({
      isIOS18Plus: () => false,
    }));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "res({\"ok\":true})",
    });
    vi.stubGlobal("fetch", fetchMock);

    const mod = await import("./proxy.js");
    const first = await mod.fetchWithProxy("/s/n46/api/list/member", {
      callback: "res",
    });
    const second = await mod.fetchWithProxy("/s/n46/api/list/member", {
      callback: "res",
    });

    expect(first).toBe("res({\"ok\":true})");
    expect(second).toBe("res({\"ok\":true})");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries after failure and succeeds on next attempt", async () => {
    vi.useFakeTimers();
    vi.doMock("../utils/deviceDetection.js", () => ({
      isIOS18Plus: () => false,
    }));

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "retry-success",
      });
    vi.stubGlobal("fetch", fetchMock);

    const mod = await import("./proxy.js");
    const promise = mod.fetchWithProxy("/s/n46/api/list/blog", { page: 0 }, 2);
    await vi.runAllTimersAsync();
    const data = await promise;

    expect(data).toBe("retry-success");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws on non-ok response after last retry", async () => {
    vi.doMock("../utils/deviceDetection.js", () => ({
      isIOS18Plus: () => false,
    }));

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    const mod = await import("./proxy.js");
    await expect(
      mod.fetchWithProxy("/s/n46/api/list/member", { callback: "res" }, 1)
    ).rejects.toThrow("HTTP error! status: 500");
  });
});
