// BlogList.jsx — Ant Design Pro • Mobile-First Fast Render
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Spin,
  Empty,
  Pagination,
  Grid,
} from "antd";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
  useDeferredValue,
  useTransition,
} from "react";
import {
  fetchAllBlogs,
  fetchMemberInfo,
} from "../services/blogService";
import BlogCalendar from "./BlogCalendar";
import RecentBlogs from "./RecentBlogs";
import BlogListHeader from "./BlogList/Components/BlogListHeader";
import BlogListFilterBar from "./BlogList/Components/BlogListFilterBar";
import BlogCard from "./BlogList/Components/BlogCard";

const { Title } = Typography;
const { useBreakpoint } = Grid;

// Translation keys — UTF-8 chuẩn
const t = {
  noBlogs: {
    ja: "ブログが見つかりません",
    en: "No blogs found",
    vi: "Không tìm thấy blog",
  },
  loading: {
    ja: "読み込み中...",
    en: "Loading...",
    vi: "Đang tải...",
  },
  error: {
    ja: "エラーが発生しました",
    en: "An error occurred",
    vi: "Đã xảy ra lỗi",
  },
  retry: {
    ja: "再試行",
    en: "Retry",
    vi: "Thử lại",
  },
};

/** ---------- Simple in-memory cache ---------- **/
const _cache = {
  blogsByMember: new Map(), // key: memberCode -> { list, ts }
  memberByCode: new Map(), // key: memberCode -> { info, ts }
  scrollY: new Map(), // key: memberCode -> number
};
const STALE_MS = 1000 * 60 * 3; // 3 phút coi là "fresh"

export default function BlogList({
  language = "ja",
  setLanguage,
  themeMode,
  setThemeMode,
}) {
  // Ensure language is valid, fallback to "ja"
  const currentLanguage = ["ja", "en", "vi"].includes(language)
    ? language
    : "ja";
  const navigate = useNavigate();
  const { memberCode } = useParams();
  const screens = useBreakpoint();

  // PAGE_SIZE: 9 bài mỗi trang (3 bài mỗi hàng x 3 hàng)
  const PAGE_SIZE = 9;

  const [blogs, setBlogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tìm kiếm mượt: defer + debounce
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);

  const [page, setPage] = useState(1);
  const [memberInfo, setMemberInfo] = useState(null);

  const abortRef = useRef(null);

  // Chuyển state nặng sang background để không block thread (mượt trên mobile)
  const [isPending, startTransition] = useTransition();

  // ---- Render instantly from cache (nếu có) ----
  useLayoutEffect(() => {
    const b = _cache.blogsByMember.get(memberCode);
    const m = _cache.memberByCode.get(memberCode);

    if (b?.list?.length) {
      setBlogs(b.list);
      setFiltered(b.list);
      setLoading(false); // không show spinner khi quay lại
    }
    if (m?.info) setMemberInfo(m.info);

    // Khôi phục vị trí cuộn
    const y = _cache.scrollY.get(memberCode);
    if (typeof y === "number") {
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [memberCode]);

  // ---- Load + revalidate với incremental loading ----
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const load = async (revalidateOnly = false) => {
      try {
        const now = Date.now();
        const cachedB = _cache.blogsByMember.get(memberCode);
        const cachedM = _cache.memberByCode.get(memberCode);
        const isFreshB = cachedB && now - cachedB.ts < STALE_MS;
        const isFreshM = cachedM && now - cachedM.ts < STALE_MS;

        // If cache is fresh, use it and skip loading
        if (isFreshB && isFreshM) {
          setLoading(false);
          return;
        }

        // Show loading only if no cache
        if (!revalidateOnly && !cachedB?.list?.length) {
          setLoading(true);
        }
        setError(null);

        // Fetch member info first (faster, parallel)
        const memberPromise = isFreshM
          ? Promise.resolve(cachedM.info)
          : fetchMemberInfo(memberCode, { signal: controller.signal });

        // Fetch blogs with progress callback for incremental updates
        let blogsData = [];
        if (isFreshB) {
          blogsData = cachedB.list;
        } else {
          // Use progress callback to update UI as data arrives
          await fetchAllBlogs(memberCode, {
            signal: controller.signal,
            onProgress: (partialBlogs, isComplete) => {
              if (!controller.signal.aborted && partialBlogs.length > 0) {
                startTransition(() => {
                  setBlogs(partialBlogs);
                  setFiltered(
                    deferredQ
                      ? partialBlogs.filter((f) =>
                        (f.title + f.author)
                          .toLowerCase()
                          .includes(deferredQ.toLowerCase())
                      )
                      : partialBlogs
                  );
                });

                // Hide loading spinner after first batch
                if (partialBlogs.length > 0) {
                  setLoading(false);
                }
              }

              if (isComplete) {
                blogsData = partialBlogs;
              }
            },
          });
        }

        const member = await memberPromise;

        if (!controller.signal.aborted) {
          // Final update
          startTransition(() => {
            if (blogsData.length > 0) {
              setBlogs(blogsData);
              setFiltered(
                deferredQ
                  ? blogsData.filter((f) =>
                    (f.title + f.author)
                      .toLowerCase()
                      .includes(deferredQ.toLowerCase())
                  )
                  : blogsData
              );
            }
          });
          setMemberInfo(member);

          // Update cache
          if (blogsData.length > 0) {
            _cache.blogsByMember.set(memberCode, {
              list: blogsData,
              ts: Date.now(),
            });
          }
          if (member) {
            _cache.memberByCode.set(memberCode, {
              info: member,
              ts: Date.now(),
            });
          }
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setError(t.error[currentLanguage]);
        }
      } finally {
        if (!abortRef.current?.signal.aborted) setLoading(false);
      }
    };

    const hasCache = !!_cache.blogsByMember.get(memberCode)?.list?.length;
    load(hasCache);

    return () => controller.abort();
  }, [memberCode, deferredQ, currentLanguage]);

  // Lưu vị trí cuộn trước khi rời trang
  useEffect(() => {
    const onStore = () => _cache.scrollY.set(memberCode, window.scrollY);
    window.addEventListener("pagehide", onStore);
    window.addEventListener("beforeunload", onStore);
    return () => {
      onStore();
      window.removeEventListener("pagehide", onStore);
      window.removeEventListener("beforeunload", onStore);
    };
  }, [memberCode]);

  // Update page title when member info changes
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

  // Debounce nhập liệu (200ms) để hạn chế filter liên tục
  useEffect(() => {
    const h = setTimeout(() => {
      const kw = q.trim().toLowerCase();
      startTransition(() => {
        if (!kw) {
          setFiltered(blogs);
        } else {
          setFiltered(
            blogs.filter(
              (b) =>
                b.title.toLowerCase().includes(kw) ||
                b.author.toLowerCase().includes(kw)
            )
          );
        }
        setPage(1);
      });
    }, 200);
    return () => clearTimeout(h);
  }, [q, blogs]);

  const current = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, PAGE_SIZE]);

  const onOpen = (id) => {
    _cache.scrollY.set(memberCode, window.scrollY);
    navigate(`/blog/${id}`);
  };

  // ====== RENDER ======

  if (loading && !blogs.length) {
    return (
      <PageContainer header={false}>
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" tip={t.loading[currentLanguage]} />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer header={false}>
        <ProCard
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Title level={4} type="danger">
            {error}
          </Title>
          <Button type="primary" onClick={() => window.location.reload()}>
            {t.retry[currentLanguage]}
          </Button>
        </ProCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={false}
      token={{
        paddingBlockPageContainerContent: 0,
        paddingInlinePageContainerContent: screens.xs ? 12 : 24,
      }}
    >
      <ProCard ghost gutter={[16, 16]} wrap>
        {/* Main Content */}
        <ProCard
          colSpan={{ xs: 24, md: 16, xl: 17 }}
          ghost
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* COMPACT HERO (nhẹ trên mobile) */}
            <BlogListHeader
              memberInfo={memberInfo}
              language={language}
              setLanguage={setLanguage}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              screens={screens}
            />

            {/* FILTER ROW */}
            <BlogListFilterBar
              language={language}
              themeMode={themeMode}
              screens={screens}
              q={q}
              setQ={setQ}
              filteredCount={filtered.length}
              isPending={isPending}
            />

            {/* LIST */}
            {current.length === 0 ? (
              <ProCard
                bordered
                style={{
                  borderRadius: 14,
                  minHeight: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    themeMode === "dark"
                      ? "rgba(36, 33, 29, 0.85)"
                      : "rgba(253, 246, 227, 0.8)",
                }}
              >
                <Empty
                  description={
                    q ? t.noBlogs[currentLanguage] : t.noBlogs[currentLanguage]
                  }
                />
              </ProCard>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
                width: "100%"
              }}>
                {current.map((blog, idx) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    index={idx}
                    language={language}
                    themeMode={themeMode}
                    screens={screens}
                    onOpen={onOpen}
                  />
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {filtered.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Pagination
                  current={page}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  onChange={(p) => {
                    _cache.scrollY.set(memberCode, 0); // sang page mới thì về top
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  showSizeChanger={false}
                  size={screens.xs ? "small" : "default"}
                />
              </div>
            )}
          </div>
        </ProCard>

        {/* Sidebar */}
        <ProCard
          colSpan={{ xs: 24, md: 8, xl: 7 }}
          ghost
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Blog Calendar */}
            <BlogCalendar
              blogs={blogs}
              memberInfo={memberInfo}
              onBlogClick={onOpen}
              isMobile={screens.xs}
              language={language}
              themeMode={themeMode}
            />

            {/* Recent Blogs */}
            <RecentBlogs
              blogs={blogs}
              onBlogClick={onOpen}
              isMobile={screens.xs}
              language={language}
              themeMode={themeMode}
              maxItems={5}
            />
          </div>
        </ProCard>
      </ProCard>

      {/* Hover effect và responsive layout */}
      <style>{`
        @media (hover:hover) {
          .blog-card:hover img { transform: scale(1.03); }
        }
        
        .blog-card img {
          border-radius: 12px;
        }
        
        /* Đảm bảo card layout không bị tràn */
        .blog-card .ant-pro-card-body {
          overflow: hidden;
        }
        
        /* Responsive text cho mobile */
        @media (max-width: 576px) {
          .blog-card .ant-typography {
            font-size: 14px !important;
          }
          
          .blog-card .ant-btn {
            font-size: 10px !important;
            padding: 2px 4px !important;
            height: 20px !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
