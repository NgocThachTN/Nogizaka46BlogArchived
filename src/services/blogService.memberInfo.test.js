import { afterEach, describe, expect, it, vi } from "vitest";

const baseMemberList = [
  { code: "10001", name: "山下 美月", cate: "3期生" },
  { code: "10002", name: "与田 祐希", cate: "3期生" },
];

const mockCommonDeps = ({
  useLocalDB = false,
  graduatedMember = null,
  proxyText = `res(${JSON.stringify({ data: baseMemberList })})`,
} = {}) => {
  vi.doMock("../api/proxy.js", () => ({
    fetchWithProxy: vi.fn().mockResolvedValue(proxyText),
  }));
  vi.doMock("../utils/deviceDetection.js", () => ({
    shouldUseProxy: () => true,
    getUserAgent: () => "test-agent",
  }));
  vi.doMock("../utils/localBlogLoader.js", () => ({
    shouldUseLocalDB: () => false,
    getFolderFromMemberCode: vi.fn(),
    loadLocalBlogs: vi.fn().mockResolvedValue([]),
    loadLocalMemberInfo: vi.fn().mockResolvedValue(null),
    getMemberCodeFromFolder: vi.fn(),
  }));
  vi.doMock("../utils/graduatedMembersLoader.js", () => ({
    shouldUseLocalDB: () => useLocalDB,
    loadGraduatedMember: vi.fn().mockResolvedValue(graduatedMember),
    isGraduatedMember: vi.fn().mockReturnValue(false),
  }));
};

describe("blogService member info flows", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns hardcoded relay member for special 40008 code", async () => {
    mockCommonDeps();
    const mod = await import("./blogService.js");
    const result = await mod.fetchMemberInfo("40008");
    expect(result).toMatchObject({
      code: "40008",
      name: "6期生リレー",
      cate: "6期生",
      graduation: "NO",
    });
  });

  it("returns local graduated member when local DB mode provides one", async () => {
    const graduated = { code: "36758", name: "齋藤 飛鳥", cate: "1期生" };
    mockCommonDeps({ useLocalDB: true, graduatedMember: graduated });
    const mod = await import("./blogService.js");
    const result = await mod.fetchMemberInfo("36758");
    expect(result).toEqual(graduated);
  });

  it("falls back to member list API lookup when no local graduated member", async () => {
    mockCommonDeps({ useLocalDB: true, graduatedMember: null });
    const mod = await import("./blogService.js");
    const result = await mod.fetchMemberInfo("10002");
    expect(result).toMatchObject({ code: "10002", name: "与田 祐希" });
  });

  it("returns null when member code does not exist", async () => {
    mockCommonDeps();
    const mod = await import("./blogService.js");
    const result = await mod.fetchMemberInfo("99999");
    expect(result).toBeNull();
  });

  it("finds member by normalized name spacing", async () => {
    mockCommonDeps();
    const mod = await import("./blogService.js");
    const result = await mod.fetchMemberInfoByName("山下美月");
    expect(result).toMatchObject({ code: "10001", name: "山下 美月" });
  });

  it("returns relay data for 6th gen aliases in name lookup", async () => {
    mockCommonDeps();
    const mod = await import("./blogService.js");
    const result = await mod.fetchMemberInfoByName("6th Gen Relay");
    expect(result).toMatchObject({
      code: "40008",
      name: "6期生リレー",
      cate: "6期生",
    });
  });
});
