import { useEffect, useMemo, useState } from "react";
import { loadAllGraduatedMembers } from "../data/graduatedMembersLoader";
import { shouldUseLocalDB } from "../lib/localData";
import { fetchMemberListAPI, normalizeCurrentMembers } from "../services/memberService";
import type { CacheEntry, MemberDetail, MemberGenerationGroup } from "../../../shared/types";

const DIRECTORY_CACHE_MS = 1000 * 60 * 5;

export const GEN_ORDER = [
  "6期生",
  "5期生",
  "4期生",
  "3期生",
  "2期生",
  "1期生",
  "その他",
];

let currentMembersCache: CacheEntry<MemberDetail[]> | null = null;
let graduatedMembersCache: CacheEntry<MemberDetail[]> | null = null;

export function getMemberGeneration(member: MemberDetail) {
  return member.cate?.trim() || member.groupcode?.trim() || "その他";
}

export function useMemberDirectory(
  keyword: string,
  genFilter: string,
  showGraduated: boolean
) {
  const [members, setMembers] = useState<MemberDetail[]>([]);
  const [graduatedMembers, setGraduatedMembers] = useState<MemberDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const now = Date.now();
        const shouldReuseCurrent =
          currentMembersCache && now - currentMembersCache.ts < DIRECTORY_CACHE_MS;
        const shouldReuseGraduated =
          graduatedMembersCache && now - graduatedMembersCache.ts < DIRECTORY_CACHE_MS;

        if (shouldReuseCurrent && shouldReuseGraduated) {
          if (!cancelled) {
            setMembers(currentMembersCache?.data ?? []);
            setGraduatedMembers(graduatedMembersCache?.data ?? []);
          }
          return;
        }

        const [current, graduated] = await Promise.all([
          shouldReuseCurrent
            ? Promise.resolve(currentMembersCache?.data ?? [])
            : fetchMemberListAPI().then(normalizeCurrentMembers),
          shouldUseLocalDB()
            ? shouldReuseGraduated
              ? Promise.resolve(graduatedMembersCache?.data ?? [])
              : loadAllGraduatedMembers()
            : Promise.resolve([]),
        ]);

        currentMembersCache = {
          data: current,
          ts: Date.now(),
        };
        graduatedMembersCache = {
          data: graduated,
          ts: Date.now(),
        };

        if (!cancelled) {
          setMembers(current);
          setGraduatedMembers(graduated);
        }
      } catch (error) {
        console.error("Failed to load member directory:", error);
        if (!cancelled) {
          setMembers([]);
          setGraduatedMembers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleMembers = showGraduated ? graduatedMembers : members;

  const genList = useMemo(() => {
    const generationSet = new Set(
      visibleMembers.map(getMemberGeneration).filter(Boolean)
    );
    const ordered = GEN_ORDER.filter((generation) => generationSet.has(generation));
    const rest = Array.from(generationSet).filter(
      (generation) => !GEN_ORDER.includes(generation)
    );

    return ["ALL", ...ordered, ...rest];
  }, [visibleMembers]);

  const filteredMembers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return visibleMembers.filter((member) => {
      if (genFilter !== "ALL" && getMemberGeneration(member) !== genFilter) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const haystack =
        `${member.name} ${member.english_name ?? ""} ${member.kana ?? ""}`.toLowerCase();

      return haystack.includes(normalizedKeyword);
    });
  }, [genFilter, keyword, visibleMembers]);

  const groupedMembers = useMemo<MemberGenerationGroup[]>(() => {
    const generationMap = new Map<string, MemberDetail[]>();

    filteredMembers.forEach((member) => {
      const generation = getMemberGeneration(member);
      if (!generationMap.has(generation)) {
        generationMap.set(generation, []);
      }
      generationMap.get(generation)?.push(member);
    });

    const known = GEN_ORDER.filter((generation) => generationMap.has(generation)).map(
      (generation) => ({
        gen: generation,
        items: generationMap.get(generation) ?? [],
      })
    );

    const unknown = Array.from(generationMap.entries())
      .filter(([generation]) => !GEN_ORDER.includes(generation))
      .map(([gen, items]) => ({
        gen,
        items,
      }));

    return [...known, ...unknown].filter((group) => group.items.length > 0);
  }, [filteredMembers]);

  return {
    members,
    graduatedMembers,
    visibleMembers,
    filteredMembers,
    groupedMembers,
    genList,
    loading,
    shouldShowGraduatedToggle: shouldUseLocalDB() && graduatedMembers.length > 0,
  };
}
