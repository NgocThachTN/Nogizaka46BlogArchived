import axios from "axios";
import { fetchWithProxy } from "../../../lib/api/proxy";
import { getUserAgent, shouldUseProxy } from "../../../lib/utils/deviceDetection";
import { loadGraduatedMember } from "../data/graduatedMembersLoader";
import { shouldUseLocalDB } from "../lib/localData";
import type { CacheEntry, MemberDetail, MemberSummary } from "../../../shared/types";

const BASE_URL = "https://www.nogizaka46.com";
const MEMBER_LIST_PATH = "/s/n46/api/list/member";
const MEMBER_CACHE_MS = 1000 * 60 * 10;
const RELAY_MEMBER_CODE = "40008";

let cachedMemberList: CacheEntry<MemberSummary[]> | null = null;

export const SPECIAL_RELAY_MEMBER: MemberSummary = {
  code: RELAY_MEMBER_CODE,
  name: "6期生リレー",
  cate: "6期生",
  groupcode: "6期生",
  graduation: "NO",
};

export function parseMemberListResponse(memberData: unknown): MemberSummary[] {
  if (Array.isArray(memberData)) {
    return memberData as MemberSummary[];
  }

  if (
    memberData &&
    typeof memberData === "object" &&
    Array.isArray((memberData as { data?: unknown[] }).data)
  ) {
    return (memberData as { data: MemberSummary[] }).data;
  }

  if (typeof memberData !== "string") {
    throw new Error("Invalid member list response type");
  }

  const trimmed = memberData.trim();
  const jsonStr = trimmed.startsWith("res(")
    ? trimmed.replace(/^res\(/, "").replace(/\);?$/, "")
    : trimmed;
  const api = JSON.parse(jsonStr) as { data?: MemberSummary[] } | MemberSummary[];

  if (Array.isArray(api)) {
    return api;
  }

  if (Array.isArray(api.data)) {
    return api.data;
  }

  throw new Error("Member list payload missing data array");
}

async function requestMemberList() {
  if (shouldUseProxy()) {
    try {
      return await fetchWithProxy(MEMBER_LIST_PATH, { callback: "res" });
    } catch {
      const response = await axios.get(`${BASE_URL}${MEMBER_LIST_PATH}?callback=res`, {
        responseType: "text",
        headers: { "User-Agent": getUserAgent() },
      });
      return response.data;
    }
  }

  const response = await axios.get(`${BASE_URL}${MEMBER_LIST_PATH}?callback=res`, {
    responseType: "text",
    headers: { "User-Agent": getUserAgent() },
  });

  return response.data;
}

export async function fetchMemberListAPI() {
  const now = Date.now();
  if (cachedMemberList && now - cachedMemberList.ts < MEMBER_CACHE_MS) {
    return cachedMemberList.data;
  }

  const memberData = await requestMemberList();
  const parsedMembers = parseMemberListResponse(memberData);
  cachedMemberList = {
    data: parsedMembers,
    ts: now,
  };

  return parsedMembers;
}

export async function prefetchMemberInfo() {
  try {
    await fetchMemberListAPI();
  } catch {
    // Ignore prefetch failures.
  }
}

export async function fetchMemberInfo(memberCode: string | number | undefined | null) {
  try {
    const normalizedCode = String(memberCode ?? "").trim();
    if (!normalizedCode) {
      return null;
    }

    if (shouldUseLocalDB()) {
      const graduatedMember = await loadGraduatedMember(normalizedCode);
      if (graduatedMember) {
        return graduatedMember as MemberDetail;
      }
    }

    if (normalizedCode === RELAY_MEMBER_CODE || normalizedCode === `${RELAY_MEMBER_CODE}.0`) {
      return SPECIAL_RELAY_MEMBER;
    }

    const members = await fetchMemberListAPI();
    return members.find((member) => String(member.code).trim() === normalizedCode) ?? null;
  } catch (error) {
    console.error("Error fetching member info:", error);
    return null;
  }
}

export async function fetchMemberInfoByName(memberName: string | undefined | null) {
  try {
    const normalizedName = String(memberName ?? "").trim();
    if (!normalizedName) {
      return null;
    }

    if (
      normalizedName === SPECIAL_RELAY_MEMBER.name ||
      normalizedName === "6th Gen Relay" ||
      normalizedName.includes("6期生")
    ) {
      return SPECIAL_RELAY_MEMBER;
    }

    const members = await fetchMemberListAPI();
    const normalize = (value: string | undefined) => (value ?? "").replace(/\s+/g, "").trim();
    const target = normalize(normalizedName);

    return members.find((member) => normalize(String(member.name)) === target) ?? null;
  } catch (error) {
    console.error("Error fetching member by name:", error);
    return null;
  }
}

export function normalizeCurrentMembers(members: MemberSummary[]) {
  const activeMembers = members.filter((member) => member.graduation === "NO");
  const normalized = activeMembers.map((member) => ({
    ...member,
    img: member.img || "https://via.placeholder.com/300x300?text=No+Image",
  }));

  return [...normalized, SPECIAL_RELAY_MEMBER];
}
