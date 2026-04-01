import { describe, expect, it } from "vitest";
import { getImageUrl } from "./blogService.js";

describe("blogService getImageUrl", () => {
  it("returns empty string for empty path", () => {
    expect(getImageUrl("")).toBe("");
  });

  it("returns absolute URL as-is", () => {
    const absolute = "https://example.com/image.jpg";
    expect(getImageUrl(absolute)).toBe(absolute);
  });

  it("returns local database path unchanged", () => {
    const localPath = "/blogdb/asuka.saito/img/pic.jpg";
    expect(getImageUrl(localPath)).toBe(localPath);
  });

  it("builds nogizaka absolute URL for relative path", () => {
    expect(getImageUrl("/img/test.jpg")).toBe(
      "https://www.nogizaka46.com/img/test.jpg"
    );
    expect(getImageUrl("img/test.jpg")).toBe(
      "https://www.nogizaka46.com/img/test.jpg"
    );
  });

  it("adds width query parameter when requested", () => {
    expect(getImageUrl("/img/test.jpg", { w: 640 })).toBe(
      "https://www.nogizaka46.com/img/test.jpg?w=640"
    );
    expect(getImageUrl("/img/test.jpg?foo=1", { w: 640 })).toBe(
      "https://www.nogizaka46.com/img/test.jpg?foo=1&w=640"
    );
  });
});
