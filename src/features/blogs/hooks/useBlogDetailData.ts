import { useEffect, useMemo, useState } from "react";
import {
  fetchAllBlogs,
  fetchBlogDetail,
  getCachedBlogDetail,
  prefetchBlogDetail,
} from "../services/blogService";
import {
  fetchMemberInfo,
  fetchMemberInfoByName,
} from "../../members/services/memberService";
import { isIOS } from "../../../lib/utils/deviceDetection";
import type { BlogDetailData, BlogSummary, MemberDetail } from "../../../shared/types";

interface NavigationIds {
  prevId: string | null;
  nextId: string | null;
}

export function useBlogDetailData(blogId: string | undefined) {
  const [blog, setBlog] = useState<BlogDetailData | null>(null);
  const [memberInfo, setMemberInfo] = useState<MemberDetail | null>(null);
  const [memberBlogs, setMemberBlogs] = useState<BlogSummary[]>([]);
  const [memberBlogsLoading, setMemberBlogsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [navIds, setNavIds] = useState<NavigationIds>({
    prevId: null,
    nextId: null,
  });

  useEffect(() => {
    let cancelled = false;
    let sidebarRequestId = 0;
    let lastSidebarKey = "";

    const loadSidebarData = async (source: BlogDetailData) => {
      if (!source || cancelled) {
        return;
      }

      const sidebarKey = `${source.memberCode ?? ""}:${source.author ?? ""}`;
      if (sidebarKey && sidebarKey === lastSidebarKey) {
        return;
      }
      lastSidebarKey = sidebarKey;

      const requestId = ++sidebarRequestId;
      const initialCode = source.memberCode ? String(source.memberCode).trim() : "";
      const memberPromise = initialCode
        ? fetchMemberInfo(initialCode)
        : Promise.resolve(null);
      const initialBlogsPromise = initialCode
        ? fetchAllBlogs(initialCode).catch(() => [])
        : Promise.resolve([]);

      let nextMember = await memberPromise;
      if (!nextMember && source.author) {
        nextMember = await fetchMemberInfoByName(source.author);
      }

      if (!cancelled && requestId === sidebarRequestId) {
        setMemberInfo(nextMember);
      }

      const resolvedCode = nextMember?.code ? String(nextMember.code).trim() : initialCode;
      const nextBlogs =
        initialCode || !resolvedCode ? await initialBlogsPromise : await fetchAllBlogs(resolvedCode);

      if (!cancelled && requestId === sidebarRequestId) {
        setMemberBlogs(nextBlogs ?? []);
        setMemberBlogsLoading(false);
      }
    };

    const load = async () => {
      try {
        setMemberInfo(null);
        setMemberBlogs([]);
        setMemberBlogsLoading(true);

        const cached = blogId ? getCachedBlogDetail(blogId) : null;
        if (cached && !cancelled) {
          setBlog(cached as BlogDetailData);
          setLoading(false);
          void loadSidebarData(cached as BlogDetailData);
        } else {
          setLoading(true);
        }

        if (isIOS()) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        let nextBlog: BlogDetailData | null = null;
        let retryCount = 0;
        const maxRetries = isIOS() ? 3 : 2;

        while (retryCount < maxRetries && !nextBlog && blogId) {
          try {
            nextBlog = (await fetchBlogDetail(blogId)) as BlogDetailData | null;
            if (nextBlog) {
              break;
            }
          } catch (error) {
            console.warn(`Fetch attempt ${retryCount + 1} failed:`, error);
            retryCount += 1;
            if (retryCount < maxRetries) {
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retryCount) * 1000)
              );
            }
          }
        }

        if (!nextBlog || cancelled) {
          return;
        }

        setBlog(nextBlog);
        void loadSidebarData(nextBlog);
      } catch (error) {
        console.error("Error loading blog detail:", error);
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
  }, [blogId]);

  useEffect(() => {
    if (!blogId) {
      return;
    }

    window.scrollTo({ top: 0 });
  }, [blogId]);

  useEffect(() => {
    if (blog?.title) {
      document.title = `${blog.title} - 乃木坂46ブログ`;
    }

    return () => {
      document.title = "乃木坂46ブログ";
    };
  }, [blog?.title]);

  useEffect(() => {
    const loadNavigationIds = async () => {
      try {
        if (!blog?.id) {
          return;
        }

        let code = blog.memberCode;
        if (!code && blog.author) {
          const fallbackMember = await fetchMemberInfoByName(blog.author);
          code = fallbackMember?.code ? String(fallbackMember.code) : undefined;
        }

        if (!code) {
          return;
        }

        const list =
          blog.memberCode === code && memberBlogs.length > 0 ? memberBlogs : await fetchAllBlogs(code);

        const index = list.findIndex((item) => String(item.id) === String(blog.id));
        if (index === -1) {
          return;
        }

        const nextNewer = index > 0 ? String(list[index - 1]?.id ?? "") : null;
        const prevOlder = index < list.length - 1 ? String(list[index + 1]?.id ?? "") : null;

        setNavIds({
          prevId: prevOlder || null,
          nextId: nextNewer || null,
        });

        if (prevOlder) {
          void prefetchBlogDetail(prevOlder);
        }
        if (nextNewer) {
          void prefetchBlogDetail(nextNewer);
        }
      } catch (error) {
        console.error("Failed to compute prev/next ids:", error);
      }
    };

    void loadNavigationIds();
  }, [blog?.author, blog?.id, blog?.memberCode, memberBlogs]);

  const contentMeta = useMemo(() => {
    if (!blog?.content || typeof document === "undefined") {
      return {
        toc: [] as Array<{ id: string; text: string; level: string }>,
        plainText: "",
      };
    }

    const temp = document.createElement("div");
    temp.innerHTML = blog.content;
    const headings = Array.from(temp.querySelectorAll("h1, h2, h3"));
    const toc = headings.map((heading, index) => {
      if (!heading.id) {
        heading.id = `h-${index}-${(heading.textContent || "").slice(0, 16)}`;
      }

      return {
        id: heading.id,
        text: heading.textContent || "",
        level: heading.tagName,
      };
    });

    return {
      toc,
      plainText: temp.textContent || "",
    };
  }, [blog?.content]);

  return {
    blog,
    memberInfo,
    setMemberInfo,
    memberBlogs,
    memberBlogsLoading,
    loading,
    navIds,
    toc: contentMeta.toc,
    plainText: contentMeta.plainText,
  };
}
