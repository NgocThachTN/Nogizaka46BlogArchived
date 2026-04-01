import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useState, useTransition } from "react";
import { fetchAllBlogs } from "../services/blogService";
import { fetchMemberInfo, SPECIAL_RELAY_MEMBER } from "../../members/services/memberService";
import type { BlogSummary, CacheEntry, LanguageCode, MemberDetail } from "../../../shared/types";

type ScrollTarget = HTMLElement | null;

interface BlogListCacheEntry extends CacheEntry<BlogSummary[]> {}
interface MemberCacheEntry extends CacheEntry<MemberDetail | null> {}

const STALE_MS = 1000 * 60 * 5;

const blogListCache = new Map<string, BlogListCacheEntry>();
const memberCache = new Map<string, MemberCacheEntry>();
const scrollCache = new Map<string, number>();

function getScrollTargetPosition(scrollTarget: ScrollTarget) {
  if (scrollTarget) {
    return scrollTarget.scrollTop;
  }

  return window.scrollY;
}

function restoreScrollTargetPosition(scrollTarget: ScrollTarget, value: number) {
  if (scrollTarget) {
    scrollTarget.scrollTop = value;
    return;
  }

  window.scrollTo(0, value);
}

function filterBlogs(blogs: BlogSummary[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return blogs;
  }

  return blogs.filter((blog) =>
    `${blog.title} ${blog.author}`.toLowerCase().includes(normalizedQuery)
  );
}

export function useMemberBlogs(
  memberCode: string | undefined,
  language: LanguageCode,
  pageSize: number,
  scrollRef?: { current: HTMLElement | null }
) {
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<MemberDetail | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const [isPending, startTransition] = useTransition();

  useLayoutEffect(() => {
    if (!memberCode) {
      return;
    }

    const cachedBlogs = blogListCache.get(memberCode)?.data;
    const cachedMember = memberCache.get(memberCode)?.data;

    if (cachedBlogs?.length) {
      setBlogs(cachedBlogs);
      setLoading(false);
    }

    if (cachedMember) {
      setMemberInfo(cachedMember);
    }

    const cachedScroll = scrollCache.get(memberCode);
    if (typeof cachedScroll === "number") {
      requestAnimationFrame(() => {
        restoreScrollTargetPosition(scrollRef?.current ?? null, cachedScroll);
      });
    }
  }, [memberCode, scrollRef]);

  useEffect(() => {
    if (!memberCode) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        const now = Date.now();
        const cachedBlogs = blogListCache.get(memberCode);
        const cachedMember = memberCache.get(memberCode);
        const hasFreshBlogs = Boolean(cachedBlogs && now - cachedBlogs.ts < STALE_MS);
        const hasFreshMember = Boolean(cachedMember && now - cachedMember.ts < STALE_MS);

        if (!cachedBlogs?.data?.length) {
          setLoading(true);
        }

        setError(null);

        const memberPromise = hasFreshMember
          ? Promise.resolve(cachedMember?.data ?? null)
          : fetchMemberInfo(memberCode);

        let nextBlogs = cachedBlogs?.data ?? [];

        if (!hasFreshBlogs) {
          await fetchAllBlogs(memberCode, {
            signal: controller.signal,
            onProgress: (partialBlogs: BlogSummary[], isComplete: boolean) => {
              if (controller.signal.aborted || partialBlogs.length === 0) {
                return;
              }

              startTransition(() => {
                setBlogs(partialBlogs);
                setLoading(false);
              });

              if (isComplete) {
                nextBlogs = partialBlogs;
              }
            },
          });
        }

        const nextMember =
          (await memberPromise) ??
          (String(memberCode) === SPECIAL_RELAY_MEMBER.code ? SPECIAL_RELAY_MEMBER : null);

        if (!controller.signal.aborted) {
          blogListCache.set(memberCode, {
            data: nextBlogs,
            ts: Date.now(),
          });
          memberCache.set(memberCode, {
            data: nextMember,
            ts: Date.now(),
          });

          startTransition(() => {
            setBlogs(nextBlogs);
          });
          setMemberInfo(nextMember);
        }
      } catch (loadError) {
        if ((loadError as { name?: string }).name !== "AbortError") {
          console.error(loadError);
          setError(
            language === "ja"
              ? "エラーが発生しました"
              : language === "vi"
                ? "Đã xảy ra lỗi"
                : "An error occurred"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [language, memberCode]);

  useEffect(() => {
    if (!memberCode) {
      return;
    }

    const storeScrollPosition = () => {
      scrollCache.set(memberCode, getScrollTargetPosition(scrollRef?.current ?? null));
    };

    if (scrollRef?.current) {
      scrollRef.current.addEventListener("scroll", storeScrollPosition, { passive: true });
    } else {
      window.addEventListener("pagehide", storeScrollPosition);
      window.addEventListener("beforeunload", storeScrollPosition);
    }

    return () => {
      storeScrollPosition();
      if (scrollRef?.current) {
        scrollRef.current.removeEventListener("scroll", storeScrollPosition);
      } else {
        window.removeEventListener("pagehide", storeScrollPosition);
        window.removeEventListener("beforeunload", storeScrollPosition);
      }
    };
  }, [memberCode, scrollRef]);

  useEffect(() => {
    setPage(1);
  }, [deferredQuery]);

  useEffect(() => {
    if (memberInfo?.name) {
      document.title = `${memberInfo.name} - 乃木坂46ブログ`;
    } else {
      document.title = "乃木坂46ブログ";
    }

    return () => {
      document.title = "乃木坂46ブログ";
    };
  }, [memberInfo?.name]);

  const filteredBlogs = useMemo(() => filterBlogs(blogs, deferredQuery), [blogs, deferredQuery]);

  const currentBlogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBlogs.slice(start, start + pageSize);
  }, [filteredBlogs, page, pageSize]);

  const openBlog = (blogId: string | number, navigate: (path: string) => void) => {
    if (memberCode) {
      scrollCache.set(memberCode, getScrollTargetPosition(scrollRef?.current ?? null));
    }
    navigate(`/blog/${blogId}`);
  };

  const handlePageChange = (nextPage: number) => {
    if (memberCode) {
      scrollCache.set(memberCode, 0);
    }

    setPage(nextPage);

    const scrollTarget = scrollRef?.current ?? null;
    if (scrollTarget) {
      scrollTarget.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return {
    blogs,
    filteredBlogs,
    currentBlogs,
    loading,
    error,
    memberInfo,
    query,
    setQuery,
    page,
    setPage: handlePageChange,
    isPending,
    openBlog,
  };
}
