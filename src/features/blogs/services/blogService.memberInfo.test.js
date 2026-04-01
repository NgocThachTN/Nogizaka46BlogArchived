import { afterEach, describe, expect, it, vi } from "vitest";

const baseMemberList = [
  { code: "10001", name: "\u5C71\u4E0B \u7F8E\u6708", cate: "3\u671F\u751F" },
  { code: "10002", name: "\u4E0E\u7530 \u7950\u5E0C", cate: "3\u671F\u751F" },
];

const mockCommonDeps = ({
  useLocalDB = false,
  graduatedMember = null,
  proxyText = `res(${JSON.stringify({ data: baseMemberList })})`,
} = {}) => {
  vi.doMock("../../../lib/api/proxy", () => ({
    fetchWithProxy: vi.fn().mockResolvedValue(proxyText),
  }));
  vi.doMock("../../../lib/utils/deviceDetection", () => ({
    shouldUseProxy: () => true,
    getUserAgent: () => "test-agent",
  }));
  vi.doMock("../data/localBlogLoader", () => ({
    shouldUseLocalDB: () => useLocalDB,
    getFolderFromMemberCode: vi.fn(),
    loadLocalBlogs: vi.fn().mockResolvedValue([]),
    loadLocalMemberInfo: vi.fn().mockResolvedValue(null),
    getMemberCodeFromFolder: vi.fn(),
  }));
  vi.doMock("../../members/data/graduatedMembersLoader", () => ({
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
    const mod = await import("./blogService");
    const result = await mod.fetchMemberInfo("40008");
    expect(result).toMatchObject({
      code: "40008",
      name: "6\u671F\u751F\u30EA\u30EC\u30FC",
      cate: "6\u671F\u751F",
      graduation: "NO",
    });
  });

  it("returns local graduated member when local DB mode provides one", async () => {
    const graduated = {
      code: "36758",
      name: "\u9F4B\u85E4 \u98DB\u9CE5",
      cate: "1\u671F\u751F",
    };
    mockCommonDeps({ useLocalDB: true, graduatedMember: graduated });
    const mod = await import("./blogService");
    const result = await mod.fetchMemberInfo("36758");
    expect(result).toEqual(graduated);
  });

  it("falls back to member list API lookup when no local graduated member", async () => {
    mockCommonDeps({ useLocalDB: true, graduatedMember: null });
    const mod = await import("./blogService");
    const result = await mod.fetchMemberInfo("10002");
    expect(result).toMatchObject({
      code: "10002",
      name: "\u4E0E\u7530 \u7950\u5E0C",
    });
  });

  it("returns null when member code does not exist", async () => {
    mockCommonDeps();
    const mod = await import("./blogService");
    const result = await mod.fetchMemberInfo("99999");
    expect(result).toBeNull();
  });

  it("finds member by normalized name spacing", async () => {
    mockCommonDeps();
    const mod = await import("./blogService");
    const result = await mod.fetchMemberInfoByName("\u5C71\u4E0B\u7F8E\u6708");
    expect(result).toMatchObject({
      code: "10001",
      name: "\u5C71\u4E0B \u7F8E\u6708",
    });
  });

  it("returns relay data for 6th gen aliases in name lookup", async () => {
    mockCommonDeps();
    const mod = await import("./blogService");
    const result = await mod.fetchMemberInfoByName("6th Gen Relay");
    expect(result).toMatchObject({
      code: "40008",
      name: "6\u671F\u751F\u30EA\u30EC\u30FC",
      cate: "6\u671F\u751F",
    });
  });
});
