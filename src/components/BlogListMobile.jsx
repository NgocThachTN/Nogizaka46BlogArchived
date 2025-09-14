// BlogListMobile.jsx — Ant Design Pro • Mobile-First Japanese Style
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Spin,
  Empty,
  Button,
  Avatar,
  Input,
  Space,
  Divider,
  Pagination,
  Tooltip,
  Badge,
  Tag,
  Card,
  Affix,
  Row,
  Col,
  Statistic,
  Select,
} from "antd";
import {
  CalendarOutlined,
  HeartOutlined,
  ReadOutlined,
  EyeOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BookOutlined,
  StarOutlined,
  GlobalOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  PageContainer,
  ProCard,
  StatisticCard,
  ProSkeleton,
} from "@ant-design/pro-components";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
  useDeferredValue,
  useTransition,
  useCallback,
} from "react";
import {
  fetchAllBlogs,
  getImageUrl,
  fetchMemberInfo,
  getCachedBlogDetail,
  prefetchBlogDetail,
} from "../services/blogService";
// Removed iosMemberLoader import - using unified fetchMemberInfo approach

const { Title, Text } = Typography;

// Translation keys removed - using inline translations to avoid hoisting issues

/** Japanese color palette - Purple theme */
const colors = {
  primary: "#8b4513", // Brown (book theme)
  secondary: "#a0522d", // Dark brown
  accent: "#d2691e", // Orange accent
  success: "#4caf50", // Green
  warning: "#ff9800", // Amber
  error: "#f44336", // Red
  info: "#2196f3", // Blue
  text: "#3c2415", // Dark brown text
  textSecondary: "#5d4e37", // Medium brown
  background: "#fdf6e3", // Cream background
  surface: "rgba(253, 246, 227, 0.8)", // Cream surface
  border: "rgba(139, 69, 19, 0.2)", // Brown border
  shadow: "rgba(139, 69, 19, 0.1)", // Brown shadow
};

/** JP font - Japanese style */
const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif",
  fontWeight: 400,
  letterSpacing: "0.02em",
};

/** Enhanced in-memory cache with performance optimizations */
const _cache = {
  blogsByMember: new Map(), // key: memberCode -> { list, ts, loading }
  memberByCode: new Map(), // key: memberCode -> { info, ts }
  scrollY: new Map(), // key: memberCode -> number
  imageCache: new Map(), // key: imageUrl -> { loaded: boolean }
};
const STALE_MS = 1000 * 60 * 5; // 5 phút coi là "fresh"
const CACHE_LIMIT = 50; // Giới hạn cache để tránh memory leak

export default function BlogListMobile({ language = "ja", setLanguage }) {
  // Ensure language is valid, fallback to "ja"
  const currentLanguage = ["ja", "en", "vi"].includes(language)
    ? language
    : "ja";
  const navigate = useNavigate();
  const { memberCode } = useParams();

  const [blogs, setBlogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(new Set());

  // Navigation state for blog navigation
  const [navIds, setNavIds] = useState(new Map()); // key: blogId -> { prevId, nextId }
  const [navLock, setNavLock] = useState(false);
  const [pendingNavId, setPendingNavId] = useState(null);

  // Tìm kiếm mượt: defer + debounce
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);

  const [page, setPage] = useState(1);
  const [memberInfo, setMemberInfo] = useState(null);

  // iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  console.log(
    "BlogListMobile - iOS detected:",
    isIOS,
    "User Agent:",
    navigator.userAgent
  );

  // Debug member info for all platforms
  useEffect(() => {
    console.log("BlogListMobile - Member info debug:", {
      memberCode,
      hasMemberInfo: !!memberInfo,
      memberInfoName: memberInfo?.name,
      memberInfoImg: memberInfo?.img,
      loading,
      error,
      isIOS,
    });
  }, [memberInfo, loading, error, memberCode, isIOS]);

  // This useEffect is removed - member info loading is now handled in the main load function
  // to ensure consistent behavior for all member IDs

  const abortRef = useRef(null);
  const PAGE_SIZE = 8; // Tăng số lượng để giảm pagination
  const imageObserverRef = useRef(null);

  // Chuyển state nặng sang background để không block thread
  const [, startTransition] = useTransition();

  // Cache cleanup để tránh memory leak
  useEffect(() => {
    const cleanup = () => {
      if (_cache.blogsByMember.size > CACHE_LIMIT) {
        const entries = Array.from(_cache.blogsByMember.entries());
        entries.sort((a, b) => b[1].ts - a[1].ts);
        const toDelete = entries.slice(CACHE_LIMIT);
        toDelete.forEach(([key]) => _cache.blogsByMember.delete(key));
      }
    };

    const interval = setInterval(cleanup, 60000); // Cleanup mỗi phút
    return () => clearInterval(interval);
  }, []);

  // ---- Render instantly from cache with iOS optimizations ----
  useLayoutEffect(() => {
    const renderCachedContent = async () => {
      const b = _cache.blogsByMember.get(memberCode);
      const m = _cache.memberByCode.get(memberCode);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      // iOS Safari: More aggressive delay to prevent layout issues
      if (isIOS) {
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Force iOS Safari to recalculate layout
        document.body.style.transform = "translateZ(0)";
        requestAnimationFrame(() => {
          document.body.style.transform = "none";
        });
      }

      if (b?.list?.length) {
        // Force immediate state update for iOS
        if (isIOS) {
          setBlogs(b.list);
          setFiltered(b.list);
          setLoading(false);
        } else {
          startTransition(() => {
            setBlogs(b.list);
            setFiltered(b.list);
            setLoading(false);
          });
        }
      }

      if (m?.info) {
        if (isIOS) {
          // iOS: More delay for member info
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        setMemberInfo(m.info);
      }

      // Restore scroll position with iOS optimization
      const y = _cache.scrollY.get(memberCode);
      if (typeof y === "number") {
        if (isIOS) {
          // iOS: More aggressive scroll restoration
          setTimeout(() => {
            window.scrollTo({
              top: y,
              behavior: "auto",
            });
            // Force iOS to update scroll position
            document.documentElement.scrollTop = y;
            document.body.scrollTop = y;
          }, 200);
        } else {
          requestAnimationFrame(() => window.scrollTo(0, y));
        }
      }
    };

    renderCachedContent();
  }, [memberCode]);

  // ---- Load + revalidate với iOS optimizations ----
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

        // Immediately set cached content if available
        if (cachedB?.list?.length) {
          startTransition(() => {
            setBlogs(cachedB.list);
            setFiltered(cachedB.list);
          });
        }
        if (cachedM?.info) {
          setMemberInfo(cachedM.info);
        }

        // If both caches are fresh, skip loading
        if (isFreshB && isFreshM) {
          setLoading(false);
          return;
        }

        // Show loading only if no cache available
        if (!revalidateOnly && !cachedB?.list?.length) {
          setLoading(true);
        }
        setError(null);

        // iOS Safari specific delay and optimizations
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          // Add more delay for iOS to stabilize
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Force layout recalc on iOS with multiple techniques
          document.body.style.willChange = "transform";
          document.body.style.transform = "translateZ(0)";
          requestAnimationFrame(() => {
            document.body.style.willChange = "auto";
            document.body.style.transform = "none";
            // Force iOS Safari to repaint
            document.body.offsetHeight;
          });
        }

        // Fetch song song với timeout
        const fetchWithTimeout = (promise, timeout = 100000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), timeout)
            ),
          ]);
        };

        console.log(
          "BlogListMobile: Starting fetch for memberCode:",
          memberCode
        );
        console.log("isFreshB:", isFreshB, "isFreshM:", isFreshM);
        console.log("cachedB exists:", !!cachedB, "cachedM exists:", !!cachedM);

        const [all, member] = await Promise.all([
          isFreshB
            ? Promise.resolve(cachedB.list)
            : fetchWithTimeout(
                fetchAllBlogs(memberCode, { signal: controller.signal }),
                80000
              ),
          isFreshM
            ? Promise.resolve(cachedM.info)
            : fetchWithTimeout(
                fetchMemberInfo(memberCode, { signal: controller.signal }),
                50000
              ),
        ]);

        console.log(
          "BlogListMobile: Fetch results - blogs:",
          all?.length || 0,
          "member:",
          !!member
        );

        // Enhanced fallback for member info (all platforms)
        let finalMember = member;
        if (!finalMember) {
          console.log(
            "BlogListMobile: No member info from fetchMemberInfo, trying fallback..."
          );

          if (String(memberCode) === "40008") {
            console.log("BlogListMobile: Creating special member for 40008");
            finalMember = {
              code: "40008",
              name: "6期生リレー",
              cate: "6期生",
              groupcode: "6期生",
              graduation: "NO",
            };
          } else {
            // Try to get member info from direct API call
            try {
              console.log(
                "BlogListMobile: Trying direct API call for member:",
                memberCode
              );
              const response = await fetch(
                "https://www.nogizaka46.com/s/n46/api/list/member?callback=res"
              );
              const text = await response.text();
              const jsonStr = text.replace(/^res\(/, "").replace(/\);?$/, "");
              const api = JSON.parse(jsonStr);
              finalMember = api.data.find(
                (m) => String(m.code) === String(memberCode)
              );
              console.log("BlogListMobile: Direct API result:", finalMember);
            } catch (fallbackError) {
              console.warn(
                "BlogListMobile: Direct API fallback failed:",
                fallbackError
              );
            }
          }
        }

        // Enhanced fallback for blogs if empty (all platforms)
        let finalBlogs = all;
        if (!finalBlogs || finalBlogs.length === 0) {
          console.log("BlogListMobile: No blogs found, trying fallback...");
          try {
            // Try direct API call for blogs
            const response = await fetch(
              `https://www.nogizaka46.com/s/n46/api/diary/MEMBER/list?ct=${memberCode}&callback=res`
            );
            const text = await response.text();
            const jsonStr = text.replace(/^res\(/, "").replace(/\);?$/, "");
            const api = JSON.parse(jsonStr);
            if (api.data && Array.isArray(api.data)) {
              finalBlogs = api.data;
              console.log(
                "BlogListMobile: Found fallback blogs:",
                finalBlogs.length
              );
            }
          } catch (fallbackError) {
            console.warn(
              "BlogListMobile: Fallback blogs fetch failed:",
              fallbackError
            );
          }
        }

        if (!controller.signal.aborted) {
          // Cập nhật cache trước khi set state
          _cache.blogsByMember.set(memberCode, {
            list: finalBlogs,
            ts: Date.now(),
            loading: false,
          });
          _cache.memberByCode.set(memberCode, {
            info: finalMember,
            ts: Date.now(),
          });

          console.log(
            "BlogListMobile: Setting state - blogs:",
            finalBlogs?.length || 0,
            "member:",
            !!finalMember
          );

          // iOS-specific state updates
          if (isIOS) {
            setBlogs(finalBlogs || []);
            setFiltered(
              deferredQ
                ? (finalBlogs || []).filter((f) =>
                    (f.title + f.author)
                      .toLowerCase()
                      .includes(deferredQ.toLowerCase())
                  )
                : finalBlogs || []
            );
            setMemberInfo(finalMember);

            // Force iOS to update the DOM
            setTimeout(() => {
              document.body.offsetHeight;
            }, 50);
          } else {
            startTransition(() => {
              setBlogs(finalBlogs || []);
              setFiltered(
                deferredQ
                  ? (finalBlogs || []).filter((f) =>
                      (f.title + f.author)
                        .toLowerCase()
                        .includes(deferredQ.toLowerCase())
                    )
                  : finalBlogs || []
              );
            });
            setMemberInfo(finalMember);
          }
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setError(
            currentLanguage === "ja"
              ? "エラーが発生しました"
              : currentLanguage === "vi"
              ? "Đã xảy ra lỗi"
              : "An error occurred"
          );
        }
      } finally {
        if (!abortRef.current?.signal.aborted) setLoading(false);
      }
    };

    const hasCache = !!_cache.blogsByMember.get(memberCode)?.list?.length;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // iOS Safari: Always try to load fresh data if no cache
    if (isIOS && !hasCache) {
      // Force a fresh load for iOS
      setTimeout(() => {
        load(false);
      }, 100);
    } else {
      load(hasCache);
    }

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

  // Calculate navigation IDs when blogs change
  useEffect(() => {
    if (blogs.length > 0) {
      calculateNavigationIds(blogs);
    }
  }, [blogs, calculateNavigationIds]);

  // Debounce nhập liệu
  useEffect(() => {
    const h = setTimeout(() => {
      const kw = q.trim().toLowerCase();
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        // iOS Safari: Direct state update without transition
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

        // Force iOS to update
        setTimeout(() => {
          document.body.offsetHeight;
        }, 10);
      } else {
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
      }
    }, 200);
    return () => clearTimeout(h);
  }, [q, blogs]);

  const current = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const result = filtered.slice(start, start + PAGE_SIZE);
    console.log(
      "BlogListMobile: Current blogs to render:",
      result.length,
      "from filtered:",
      filtered.length,
      "total blogs:",
      blogs.length
    );
    return result;
  }, [filtered, page, PAGE_SIZE, blogs.length]);

  // const newestDate = useMemo(
  //   () => (blogs[0]?.date ? blogs[0].date : "-"),
  //   [blogs]
  // );

  // Calculate navigation IDs for all blogs
  const calculateNavigationIds = useCallback((blogList) => {
    const newNavIds = new Map();

    console.log(
      "BlogListMobile: Calculating navigation IDs for",
      blogList.length,
      "blogs"
    );

    blogList.forEach((blog, index) => {
      // In blog list, index 0 is newest, higher index is older
      // prevId = older blog (higher index)
      // nextId = newer blog (lower index)
      const prevId =
        index < blogList.length - 1 ? blogList[index + 1]?.id : null; // Older blog
      const nextId = index > 0 ? blogList[index - 1]?.id : null; // Newer blog

      newNavIds.set(blog.id, { prevId, nextId });

      // Debug log for first few blogs
      if (index < 3) {
        console.log(
          `BlogListMobile: Blog ${index} (${blog.id}) - prevId: ${prevId}, nextId: ${nextId}`
        );
      }
    });

    setNavIds(newNavIds);
  }, []);

  // Fast navigation function
  const fastGo = useCallback(
    (blogId) => {
      if (navLock || !blogId) return;

      console.log("BlogListMobile: Navigating to blog", blogId);

      setNavLock(true);
      setPendingNavId(blogId);

      // Save current scroll position
      _cache.scrollY.set(memberCode, window.scrollY);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        // iOS Safari: Add small delay to ensure state is saved
        setTimeout(() => {
          navigate(`/blog/${blogId}`);
          setNavLock(false);
          setPendingNavId(null);
        }, 50);
      } else {
        navigate(`/blog/${blogId}`);
        setNavLock(false);
        setPendingNavId(null);
      }
    },
    [navigate, memberCode, navLock]
  );

  const onOpen = (id) => {
    fastGo(id);
  };

  // Lazy loading cho images
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src && !_cache.imageCache.get(src)) {
              img.src = src;
              _cache.imageCache.set(src, { loaded: true });
              setImagesLoaded((prev) => new Set([...prev, src]));
            }
          }
        });
      },
      { rootMargin: "50px" }
    );

    imageObserverRef.current = observer;
    return () => observer.disconnect();
  }, []);

  // Preload images cho trang hiện tại
  useEffect(() => {
    current.forEach((blog, idx) => {
      if (idx < 3 && blog.thumbnail) {
        // Preload 3 ảnh đầu
        const img = new Image();
        img.src = getImageUrl(blog.thumbnail, { w: 480 });
        _cache.imageCache.set(img.src, { loaded: true });
      }
    });
  }, [current]);

  // ====== RENDER ======

  if (loading && !blogs.length) {
    return (
      <PageContainer
        header={false}
        token={{
          paddingInlinePageContainerContent: 0,
          paddingBlockPageContainerContent: 0,
        }}
        style={{
          background: `linear-gradient(135deg, ${colors.background} 0%, #f5f5f5 100%)`,
          minHeight: "100dvh",
          /* iOS Safari specific */
          WebkitOverflowScrolling: "touch",
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
        }}
      >
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <ProCard
            style={{
              background: colors.surface,
              borderRadius: 20,
              boxShadow: `0 4px 20px ${colors.shadow}`,
              /* iOS Safari specific */
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
            }}
          >
            <Space direction="vertical" align="center" size={16}>
              <Spin size="large" />
              <Text style={{ ...jpFont, color: colors.textSecondary }}>
                {currentLanguage === "ja"
                  ? "読み込み中..."
                  : currentLanguage === "vi"
                  ? "Đang tải..."
                  : "Loading..."}
              </Text>
              {isIOS && (
                <Text
                  style={{
                    ...jpFont,
                    color: colors.textSecondary,
                    fontSize: 12,
                  }}
                >
                  iOS Safari detected - Loading...
                </Text>
              )}
            </Space>
          </ProCard>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        header={false}
        token={{
          paddingInlinePageContainerContent: 0,
          paddingBlockPageContainerContent: 0,
        }}
        style={{
          background: `linear-gradient(135deg, ${colors.background} 0%, #f5f5f5 100%)`,
          minHeight: "100dvh",
          /* iOS Safari specific */
          WebkitOverflowScrolling: "touch",
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
        }}
      >
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <ProCard
            style={{
              background: colors.surface,
              borderRadius: 20,
              boxShadow: `0 4px 20px ${colors.shadow}`,
              textAlign: "center",
              /* iOS Safari specific */
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
            }}
          >
            <Space direction="vertical" align="center" size={16}>
              <Title level={4} style={{ color: colors.error, ...jpFont }}>
                {error}
              </Title>
              {isIOS && (
                <Text
                  style={{
                    ...jpFont,
                    color: colors.textSecondary,
                    fontSize: 12,
                  }}
                >
                  iOS Safari detected - Error occurred
                </Text>
              )}
              <Button
                type="primary"
                onClick={() => window.location.reload()}
                style={{
                  background: colors.primary,
                  borderColor: colors.primary,
                  borderRadius: 12,
                }}
              >
                {currentLanguage === "ja"
                  ? "再試行"
                  : currentLanguage === "vi"
                  ? "Thử lại"
                  : "Retry"}
              </Button>
            </Space>
          </ProCard>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={false}
      token={{
        paddingInlinePageContainerContent: 0,
        paddingBlockPageContainerContent: 0,
      }}
      style={{
        background: `linear-gradient(135deg, ${colors.background} 0%, #f5f5f5 100%)`,
        minHeight: "100dvh",
        padding: 0,
        margin: 0,
        /* iOS Safari specific */
        WebkitOverflowScrolling: "touch",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
      }}
    >
      {/* Sticky Hero - Japanese style */}
      <Affix offsetTop={0}>
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.surface} 0%, #f8f9fa 100%)`,
            borderBottom: `2px solid ${colors.primary}20`,
            width: "100%",
            zIndex: 998,
            boxShadow: `0 2px 20px ${colors.shadow}`,
            /* iOS Safari specific */
            WebkitTransform: "translateZ(0)",
            transform: "translateZ(0)",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        >
          <ProCard
            ghost
            bodyStyle={{ padding: "16px 20px" }}
            style={{
              ...jpFont,
              width: "100%",
              maxWidth: "100%",
            }}
          >
            {/* Header with member info */}
            <div style={{ marginBottom: 16 }}>
              <Space
                style={{ width: "100%", justifyContent: "space-between" }}
                align="center"
              >
                <Space>
                  <Avatar
                    size={48}
                    src={
                      memberInfo?.img ||
                      "https://via.placeholder.com/300x300?text=No+Image"
                    }
                    style={{
                      boxShadow: `0 4px 12px ${colors.shadow}`,
                      border: `2px solid ${colors.primary}20`,
                    }}
                  />
                  <Space direction="vertical" size={2}>
                    <Text
                      style={{
                        ...jpFont,
                        letterSpacing: 2,
                        fontSize: 11,
                        color: colors.textSecondary,
                        textTransform: "uppercase",
                        fontWeight: 500,
                      }}
                    >
                      {currentLanguage === "ja"
                        ? "ブログ記事"
                        : currentLanguage === "vi"
                        ? "Bài viết blog"
                        : "Blog Article"}
                    </Text>
                    <Title
                      level={4}
                      style={{
                        ...jpFont,
                        margin: 0,
                        lineHeight: 1.2,
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: 700,
                      }}
                    >
                      {memberInfo?.name ||
                        (memberCode
                          ? `Member ${memberCode}`
                          : currentLanguage === "ja"
                          ? "読み込み中..."
                          : currentLanguage === "vi"
                          ? "Đang tải..."
                          : "Loading...")}
                    </Title>
                    {!memberInfo && (
                      <div style={{ marginTop: 4 }}>
                        <Text
                          style={{
                            ...jpFont,
                            fontSize: 10,
                            color: colors.textSecondary,
                            fontStyle: "italic",
                          }}
                        >
                          Debug: MemberCode {memberCode} -{" "}
                          {loading ? "Loading..." : "No member info"}
                        </Text>
                        <Space size={4}>
                          <Button
                            type="link"
                            size="small"
                            onClick={async () => {
                              try {
                                console.log(
                                  "Manual retry triggered for memberCode:",
                                  memberCode
                                );
                                // Use fetchMemberInfo for all member IDs, not just iOS
                                const member = await fetchMemberInfo(
                                  memberCode
                                );

                                if (member) {
                                  console.log(
                                    "Manual retry successful:",
                                    member
                                  );
                                  setMemberInfo(member);
                                } else {
                                  console.log(
                                    "Manual retry failed - no member data returned"
                                  );
                                }
                              } catch (error) {
                                console.warn(
                                  "Manual retry failed with error:",
                                  error
                                );
                              }
                            }}
                            style={{
                              padding: 0,
                              height: "auto",
                              fontSize: 10,
                              color: colors.primary,
                            }}
                          >
                            Retry Now
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => {
                              console.log(
                                "Force reset for memberCode:",
                                memberCode
                              );
                              // Clear cache and force reload
                              _cache.memberByCode.delete(memberCode);
                              setMemberInfo(null);
                            }}
                            style={{
                              padding: 0,
                              height: "auto",
                              fontSize: 10,
                              color: colors.error,
                            }}
                          >
                            Reset
                          </Button>
                        </Space>
                      </div>
                    )}
                  </Space>
                </Space>
                <Space>
                  <Statistic
                    value={filtered.length}
                    valueStyle={{
                      color: colors.primary,
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                    prefix={<BookOutlined />}
                    suffix={language === "ja" ? "件" : ""}
                  />
                  {setLanguage && (
                    <Select
                      value={language}
                      onChange={setLanguage}
                      size="small"
                      style={{ width: 120 }}
                      options={[
                        {
                          value: "ja",
                          label: (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <GlobalOutlined
                                style={{ color: "#666", fontSize: "12px" }}
                              />
                              日
                            </span>
                          ),
                        },
                        {
                          value: "en",
                          label: (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <GlobalOutlined
                                style={{ color: "#666", fontSize: "12px" }}
                              />
                              EN
                            </span>
                          ),
                        },
                        {
                          value: "vi",
                          label: (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <GlobalOutlined
                                style={{ color: "#666", fontSize: "12px" }}
                              />
                              VI
                            </span>
                          ),
                        },
                      ]}
                    />
                  )}
                </Space>
              </Space>
            </div>

            {/* Search */}
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: colors.primary }} />}
              placeholder={
                currentLanguage === "ja"
                  ? "ブログを検索..."
                  : currentLanguage === "vi"
                  ? "Tìm kiếm blog..."
                  : "Search blogs..."
              }
              value={q}
              onChange={(e) => setQ(e.target.value)}
              size="large"
              style={{
                borderRadius: 16,
                background: colors.surface,
                border: `2px solid ${colors.border}`,
                width: "100%",
                boxShadow: `0 2px 8px ${colors.shadow}`,
              }}
            />
          </ProCard>
        </div>
      </Affix>

      {/* Content */}
      <div
        style={{
          padding: "12px 16px 80px",
          contain: "layout paint style",
          width: "100%",
          maxWidth: "100%",
          minHeight: "calc(100dvh - 120px)",
          /* iOS Safari specific */
          WebkitOverflowScrolling: "touch",
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
        }}
      >
        {(() => {
          console.log(
            "BlogListMobile: Render check - current.length:",
            current.length,
            "loading:",
            loading,
            "blogs.length:",
            blogs.length,
            "filtered.length:",
            filtered.length
          );
          return current.length === 0;
        })() ? (
          <Card
            style={{
              borderRadius: 20,
              background: colors.surface,
              boxShadow: `0 4px 20px ${colors.shadow}`,
              textAlign: "center",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              /* iOS Safari specific */
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
            }}
          >
            <Empty
              description={
                <Text style={{ ...jpFont, color: colors.textSecondary }}>
                  {currentLanguage === "ja"
                    ? "ブログが見つかりません"
                    : currentLanguage === "vi"
                    ? "Không tìm thấy blog"
                    : "No blogs found"}
                </Text>
              }
            />
          </Card>
        ) : (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {current.map((blog, idx) => (
              <Card
                key={blog.id}
                hoverable
                onClick={() => onOpen(blog.id)}
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  background: `linear-gradient(135deg, ${colors.surface} 0%, #f8f9fa 100%)`,
                  boxShadow: `0 2px 12px ${colors.shadow}`,
                  border: `1px solid ${colors.border}`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  contain: "layout paint style",
                  /* iOS Safari specific */
                  WebkitTransform: "translateZ(0)",
                  transform: "translateZ(0)",
                  WebkitBackfaceVisibility: "hidden",
                  backfaceVisibility: "hidden",
                }}
                bodyStyle={{ padding: 0 }}
              >
                <div
                  style={{ display: "flex", height: 120, position: "relative" }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      position: "relative",
                      background: `linear-gradient(135deg, ${colors.background}, #f0f0f0)`,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={
                        blog.thumbnail
                          ? getImageUrl(blog.thumbnail, { w: 480 })
                          : "https://via.placeholder.com/600x320/f0f0f0/666666?text=No+Image"
                      }
                      data-src={
                        blog.thumbnail
                          ? getImageUrl(blog.thumbnail, { w: 480 })
                          : undefined
                      }
                      alt={blog.title}
                      loading={idx < 2 ? "eager" : "lazy"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                        filter: imagesLoaded.has(
                          getImageUrl(blog.thumbnail, { w: 480 })
                        )
                          ? "none"
                          : "blur(2px)",
                      }}
                      onLoad={() => {
                        if (blog.thumbnail) {
                          const src = getImageUrl(blog.thumbnail, { w: 480 });
                          setImagesLoaded((prev) => new Set([...prev, src]));
                        }
                      }}
                      ref={(img) => {
                        if (img && imageObserverRef.current && idx >= 2) {
                          imageObserverRef.current.observe(img);
                        }
                      }}
                    />

                    {/* Date badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: colors.primary,
                        color: colors.surface,
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 600,
                        boxShadow: `0 2px 8px ${colors.primary}40`,
                        zIndex: 2,
                      }}
                    >
                      <CalendarOutlined style={{ marginRight: 2 }} />
                      {blog.date}
                    </div>

                    {/* Read icon overlay */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        background: "rgba(255,255,255,0.9)",
                        borderRadius: 50,
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                      }}
                    >
                      <ReadOutlined
                        style={{ fontSize: 12, color: colors.primary }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      flex: 1,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minWidth: 0,
                    }}
                  >
                    <div>
                      <Text
                        strong
                        style={{
                          ...jpFont,
                          fontSize: 15,
                          lineHeight: 1.4,
                          display: "block",
                          marginBottom: 4,
                          color: colors.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                        }}
                      >
                        {blog.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          display: "block",
                          color: colors.textSecondary,
                          marginBottom: 8,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      ></Text>
                    </div>

                    <Space size={[4, 4]} wrap>
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        style={{
                          color: colors.primary,
                          fontSize: 11,
                          height: 24,
                          padding: "0 8px",
                        }}
                      >
                        閲覧
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        icon={<HeartOutlined />}
                        style={{
                          color: colors.accent,
                          fontSize: 11,
                          height: 24,
                          padding: "0 8px",
                        }}
                      >
                        いいね
                      </Button>

                      {/* Navigation buttons */}
                      {(() => {
                        const blogNav = navIds.get(blog.id);
                        if (!blogNav || (!blogNav.prevId && !blogNav.nextId))
                          return null;

                        return (
                          <Space size={2}>
                            {blogNav.prevId && (
                              <Button
                                type="text"
                                size="small"
                                disabled={navLock}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fastGo(blogNav.prevId);
                                }}
                                onMouseEnter={() =>
                                  prefetchBlogDetail(blogNav.prevId)
                                }
                                style={{
                                  color: colors.primary,
                                  fontSize: 10,
                                  height: 20,
                                  padding: "0 4px",
                                  minWidth: 18,
                                  background: "rgba(139, 69, 19, 0.1)",
                                  border: "1px solid rgba(139, 69, 19, 0.2)",
                                  borderRadius: 4,
                                }}
                                title={
                                  currentLanguage === "ja"
                                    ? "前の記事"
                                    : currentLanguage === "vi"
                                    ? "Bài trước"
                                    : "Previous"
                                }
                              >
                                {pendingNavId === blogNav.prevId &&
                                !getCachedBlogDetail(blogNav.prevId) ? (
                                  <LoadingOutlined style={{ fontSize: 8 }} />
                                ) : (
                                  "‹"
                                )}
                              </Button>
                            )}
                            {blogNav.nextId && (
                              <Button
                                type="text"
                                size="small"
                                disabled={navLock}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fastGo(blogNav.nextId);
                                }}
                                onMouseEnter={() =>
                                  prefetchBlogDetail(blogNav.nextId)
                                }
                                style={{
                                  color: colors.primary,
                                  fontSize: 10,
                                  height: 20,
                                  padding: "0 4px",
                                  minWidth: 18,
                                  background: "rgba(139, 69, 19, 0.1)",
                                  border: "1px solid rgba(139, 69, 19, 0.2)",
                                  borderRadius: 4,
                                }}
                                title={
                                  currentLanguage === "ja"
                                    ? "次の記事"
                                    : currentLanguage === "vi"
                                    ? "Bài sau"
                                    : "Next"
                                }
                              >
                                {pendingNavId === blogNav.nextId &&
                                !getCachedBlogDetail(blogNav.nextId) ? (
                                  <LoadingOutlined style={{ fontSize: 8 }} />
                                ) : (
                                  "›"
                                )}
                              </Button>
                            )}
                          </Space>
                        );
                      })()}
                    </Space>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            <Pagination
              current={page}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                _cache.scrollY.set(memberCode, 0);
                setPage(p);

                if (isIOS) {
                  // iOS Safari: More aggressive scroll to top
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "auto" });
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                  }, 50);
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              showSizeChanger={false}
              size="small"
              style={{
                background: colors.surface,
                padding: "8px 16px",
                borderRadius: 16,
                boxShadow: `0 2px 8px ${colors.shadow}`,
                /* iOS Safari specific */
                WebkitTransform: "translateZ(0)",
                transform: "translateZ(0)",
              }}
            />
          </div>
        )}
      </div>

      {/* Styles - Japanese Design System */}
      <style>{`
        /* Full-bleed mobile overrides */
        html, body, #root { 
          height: 100%; 
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(135deg, rgba(253, 246, 227, 0.9) 0%, rgba(244, 241, 232, 0.9) 100%);
          margin: 0;
          padding: 0;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          font-family: 'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif;
          /* iOS Safari specific fixes */
          -webkit-overflow-scrolling: touch;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          /* Force hardware acceleration on iOS */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        body { 
          margin: 0; 
          padding: 0;
          overscroll-behavior: none;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          /* iOS Safari specific */
          -webkit-overflow-scrolling: touch;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          /* Prevent iOS zoom */
          touch-action: manipulation;
        }
        #root {
          display: flex;
          flex-direction: column;
        }
        .ant-pro-page-container { 
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
          min-height: 100vh !important;
          min-height: 100dvh !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .ant-pro-page-container-children-container {
          flex: 1 !important;
          margin: 0 !important; 
          padding: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
        }

        /* Japanese Card styles */
        .ant-card { 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          width: 100% !important;
          max-width: 100% !important;
          border-radius: 16px !important;
        }
        .ant-card:hover { 
          transform: translateY(-2px) scale(1.01); 
          box-shadow: 0 8px 25px rgba(156, 39, 176, 0.15) !important; 
        }

        /* Japanese Input */
        .ant-input {
          border-radius: 16px !important;
          border: 2px solid #e0e0e0 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
        }
        .ant-input:focus {
          border-color: #9c27b0 !important;
          box-shadow: 0 4px 12px rgba(156, 39, 176, 0.2) !important;
        }

        /* Japanese Button */
        .ant-btn {
          border-radius: 12px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .ant-btn:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }

        /* Japanese Pagination */
        .ant-pagination {
          background: transparent !important;
        }
        .ant-pagination-item {
          border-radius: 8px !important;
          border: 1px solid #e0e0e0 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .ant-pagination-item-active {
          background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%) !important;
          border-color: #9c27b0 !important;
          color: white !important;
        }

        /* Mobile image perf */
        img[loading="lazy"] { 
          content-visibility: auto; 
          contain-intrinsic-size: 120px 120px; 
        }
        
        /* Performance optimizations */
        .ant-card {
          contain: layout paint style;
          will-change: transform;
          /* iOS Safari specific */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        
        /* Smooth image loading */
        img {
          transition: filter 0.3s ease, transform 0.3s ease;
          /* iOS Safari specific */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        
        /* Optimize scrolling */
        .ant-pro-page-container-children-container {
          contain: layout paint;
          /* iOS Safari specific */
          -webkit-overflow-scrolling: touch;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        /* Hide scrollbars */
        *::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Touch optimization */
        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Japanese typography */
        .ant-typography {
          font-family: 'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif !important;
        }

        /* Smooth animations */
        * {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* iOS Safari specific fixes */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          .ant-card {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
          
          .ant-pro-page-container {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
          
          .ant-pagination {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
        }
      `}</style>
    </PageContainer>
  );
}
