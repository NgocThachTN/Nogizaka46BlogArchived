// BlogListMobile.jsx — Notebook Diary Edition
// Notebook style blog list with "diary entry" styled items

import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  Skeleton,
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
  BulbOutlined,
  MoonOutlined,
  ArrowLeftOutlined,
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
} from "react";
import {
  fetchAllBlogs,
  getImageUrl,
  fetchMemberInfo,
} from "../services/blogService";
import { BlogListMobileSkeleton } from "./PageSkeletons";

const { Title, Text } = Typography;

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

export default function BlogListMobile({
  language = "ja",
  setLanguage,
  themeMode = "light",
  setThemeMode,
}) {
  // Ensure language is valid, fallback to "ja"
  const currentLanguage = ["ja", "en", "vi"].includes(language)
    ? language
    : "ja";
  const navigate = useNavigate();
  const { memberCode } = useParams();
  const location = useLocation();

  const [blogs, setBlogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(new Set());

  // Tìm kiếm mượt: defer + debounce
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);

  const [page, setPage] = useState(1);
  const [memberInfo, setMemberInfo] = useState(null);

  const abortRef = useRef(null);
  const PAGE_SIZE = 8;
  const imageObserverRef = useRef(null);
  const scrollWrapRef = useRef(null);

  // Chuyển state nặng sang background để không block thread
  const [isPending, startTransition] = useTransition();

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
    // 1. Disable browser scroll restoration
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const renderCachedContent = async () => {
      const b = _cache.blogsByMember.get(memberCode);
      const m = _cache.memberByCode.get(memberCode);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

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
        setMemberInfo(m.info);
      }

      // Restore scroll if exists
      if (scrollWrapRef.current) {
        scrollWrapRef.current.scrollTop = 0;
      }
    };

    renderCachedContent();
  }, [memberCode, location.pathname]);

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

        // Fetch member info FIRST and IMMEDIATELY if not cached
        if (!isFreshM) {
          fetchMemberInfo(memberCode, { signal: controller.signal })
            .then((member) => {
              if (!controller.signal.aborted && member) {
                setMemberInfo(member);
                _cache.memberByCode.set(memberCode, {
                  info: member,
                  ts: Date.now(),
                });
              }
            })
            .catch((err) => {
              if (err.name !== "AbortError") {
                console.warn("Early member fetch failed:", err);
              }
            });
        }

        const fetchWithTimeout = (promise, timeout = 60000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), timeout)
            ),
          ]);
        };


        // Fetch member info first (faster)
        const memberPromise = isFreshM
          ? Promise.resolve(cachedM.info)
          : fetchWithTimeout(
            fetchMemberInfo(memberCode, { signal: controller.signal }),
            30000
          );

        // Fetch blogs with incremental loading
        let blogsData = [];
        if (isFreshB) {
          blogsData = cachedB.list;
        } else {
          await fetchWithTimeout(
            fetchAllBlogs(memberCode, {
              signal: controller.signal,
              onProgress: (partialBlogs, isComplete) => {
                if (!controller.signal.aborted && partialBlogs.length > 0) {
                  startTransition(() => {
                    setBlogs(partialBlogs);
                    setFiltered(partialBlogs);
                    setLoading(false);
                  });
                }

                if (isComplete) {
                  blogsData = partialBlogs;
                }
              },
            }),
            60000
          );
        }

        const member = await memberPromise;
        let finalMember = member;

        // Handling Member 6 fallback
        if (!finalMember && String(memberCode) === "40008") {
          finalMember = {
            code: "40008",
            name: "6期生リレー",
            cate: "6期生",
            groupcode: "6期生",
            graduation: "NO",
          };
        }

        // Blogs fallback
        let finalBlogs = blogsData;
        if (!finalBlogs || finalBlogs.length === 0) {
          // Fallback logic omitted for brevity
        }

        if (!controller.signal.aborted) {
          _cache.blogsByMember.set(memberCode, {
            list: finalBlogs,
            ts: Date.now(),
            loading: false,
          });
          _cache.memberByCode.set(memberCode, {
            info: finalMember,
            ts: Date.now(),
          });

          // iOS-specific state updates
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
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
    load(hasCache);

    return () => controller.abort();
  }, [memberCode, deferredQ, currentLanguage]);

  // Debounce nhập liệu
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
    const result = filtered.slice(start, start + PAGE_SIZE);
    return result;
  }, [filtered, page, PAGE_SIZE]);


  const onOpen = (id) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    _cache.scrollY.set(memberCode, scrollWrapRef.current?.scrollTop || 0);
    navigate(`/blog/${id}`);
  };

  // Preload images cho trang hiện tại
  useEffect(() => {
    current.forEach((blog, idx) => {
      if (idx < 3 && blog.thumbnail) {
        const img = new Image();
        img.src = getImageUrl(blog.thumbnail, { w: 480 });
        _cache.imageCache.set(img.src, { loaded: true });
      }
    });
  }, [current]);

  // Diary List Item Component
  const DiaryListItem = ({ blog, index }) => {
    return (
      <div
        onClick={() => onOpen(blog.id)}
        style={{
          marginBottom: 24,
          position: "relative",
          cursor: "pointer",
        }}
      >
        {/* Date Tab Left */}
        <div style={{
          position: "absolute",
          left: -24,
          top: 10,
          background: themeMode === "dark" ? "#8b5a2b" : "#fdf6e3",
          border: "1px solid rgba(139,69,19,0.3)",
          borderRight: "none",
          borderRadius: "4px 0 0 4px",
          padding: "4px 4px 4px 8px",
          zIndex: 2,
          boxShadow: "-2px 2px 4px rgba(0,0,0,0.05)",
          writingMode: "vertical-rl",
          textOrientation: "upright",
          fontSize: 11,
          color: "#8b5a2b",
          fontFamily: "'Mali', cursive, sans-serif",
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {blog.date?.split("/").slice(1).join("/")}
        </div>

        {/* Paper Card */}
        <div style={{
          background: themeMode === "dark" ? "#2a2520" : "#fff",
          border: themeMode === "dark" ? "1px solid rgba(207,191,166,0.2)" : "1px solid rgba(0,0,0,0.08)",
          borderRadius: 2,
          boxShadow: themeMode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(139,69,19,0.08)",
          overflow: "hidden",
          position: "relative",
        }}>
          {/* Image Section */}
          <div style={{
            height: 180,
            background: "#e0e0e0",
            position: "relative",
            overflow: "hidden"
          }}>
            <img
              src={getImageUrl(blog.thumbnail, { w: 480 }) || "https://via.placeholder.com/600x320/f0f0f0/666666?text=No+Image"}
              alt={blog.title}
              loading={index < 2 ? "eager" : "lazy"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.5s ease",
              }}
            />
            {/* Tape visual */}
            <div style={{
              position: "absolute",
              top: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 100,
              height: 30,
              background: "rgba(255,255,255,0.4)",
              backdropFilter: "blur(2px)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              zIndex: 10
            }} />
          </div>

          {/* Content Section */}
          <div style={{ padding: "16px 20px" }}>
            <Title level={4} style={{
              margin: "0 0 8px 0",
              fontSize: 18,
              color: themeMode === "dark" ? "#f5ede0" : "#2c2c2c",
              fontFamily: "'Yomogi', cursive, sans-serif",
              lineHeight: 1.4
            }}>
              {blog.title}
            </Title>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <Space size={4} style={{ fontSize: 13, color: themeMode === "dark" ? "#cfbfa6" : "#8b5a2b", fontFamily: "'Mali', cursive" }}>
                <CalendarOutlined /> {blog.date}
              </Space>
              <Button type="text" style={{ color: "#8b5a2b", fontFamily: "'Mali', cursive", fontSize: 13 }}>
                Read Entry →
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if ((loading || isPending) && !blogs.length) {
    return (
      <div
        ref={scrollWrapRef}
        className="diary-paper notebook-container no-scrollbar"
        style={{
          width: "100%",
          minHeight: "100vh",
          height: "100dvh",
          padding: 0,
          margin: 0,
          position: "relative",
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: themeMode === "dark" ? "#1c1a17" : "#fdf6e3",
          display: "block",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          overscrollBehavior: "none",
        }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div
          className="notebook-binding"
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: -10,
            width: 30,
            backgroundSize: "8px 30px",
            zIndex: 50,
          }}
        ></div>
        <BlogListMobileSkeleton themeMode={themeMode} />
      </div>
    );
  }

  // ====== RENDER ======

  return (
    <div
      ref={scrollWrapRef}
      className="diary-paper notebook-container no-scrollbar"
      style={{
        width: "100%",
        minHeight: "100vh",
        height: "100dvh",
        padding: 0,
        margin: 0,
        position: "relative",
        overflowY: "auto",
        overflowX: "hidden",
        backgroundColor: themeMode === "dark" ? "#1c1a17" : "#fdf6e3",
        display: "block",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE and Edge
        overscrollBehavior: "none", // Prevent rubber-banding black bar
      }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Visual binding effect - thinner for mobile */}
      <div
        className="notebook-binding"
        style={{
          position: "fixed", // Fixed to viewport
          top: 0,
          bottom: 0,
          left: -10,
          width: 30,
          backgroundSize: "8px 30px",
          zIndex: 50,
        }}
      ></div>

      {/* Header - Sticky Note Style */}
      <div
        style={{
          background:
            themeMode === "dark"
              ? "rgba(36, 33, 29, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          borderBottom:
            themeMode === "dark"
              ? "1px dashed rgba(207,191,166,0.3)"
              : "1px dashed rgba(139, 69, 19, 0.3)",
          zIndex: 100,
          position: "relative", // Ensure z-index works to sit above red margin line
          padding: "12px 16px 12px 12px", // Adjusted left padding
          flexShrink: 0,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
          <Space align="center">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/members")}
              style={{
                color: "#8b5a2b",
                marginRight: 4
              }}
            />
            <Avatar
              size={40}
              src={memberInfo?.img}
              style={{ border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
            />
            <div style={{ marginLeft: 8 }}>
              <Text strong style={{ display: "block", fontSize: 16, color: themeMode === "dark" ? "#f5ede0" : "#5c4033", fontFamily: "'Yomogi', cursive", lineHeight: 1.2 }}>
                {memberInfo?.name}
              </Text>
              <Text style={{ fontSize: 11, color: themeMode === "dark" ? "#cfbfa6" : "#8b5a2b", fontFamily: "'Mali', cursive", textTransform: "uppercase" }}>
                {currentLanguage === "ja" ? "ブログ" : "Diary Entries"}
              </Text>
            </div>
          </Space>

          <Space>
            {setThemeMode && (
              <Button
                type="text"
                onClick={() =>
                  setThemeMode(themeMode === "dark" ? "light" : "dark")
                }
                style={{ borderRadius: 10, flexShrink: 0, color: "#8b5a2b" }}
                icon={
                  themeMode === "dark" ? <BulbOutlined /> : <MoonOutlined />
                }
              />
            )}
          </Space>
        </Space>

        {/* Search */}
        <div style={{ marginTop: 12 }}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "#8b5a2b" }} />}
            placeholder={
              currentLanguage === "ja"
                ? "ブログを検索..."
                : "Search entries..."
            }
            value={q}
            onChange={(e) => setQ(e.target.value)}
            size="middle"
            style={{
              borderRadius: 20,
              background:
                themeMode === "dark"
                  ? "rgba(0,0,0,0.2)"
                  : "rgba(255,255,255,0.6)",
              border:
                themeMode === "dark"
                  ? "1px solid rgba(207,191,166,0.25)"
                  : "1px solid rgba(139, 69, 19, 0.2)",
              width: "100%",
              fontFamily: "'Mali', cursive",
              fontSize: 13
            }}
          />
        </div>
      </div>

      {/* Content List */}
      <div
        className="no-scrollbar"
        style={{
          padding: "20px 20px 80px 40px", // Left padding for binding + tabs
          background:
            themeMode === "dark"
              ? "linear-gradient(to bottom, #2a2520 0%, #24211d 100%)"
              : "linear-gradient(to bottom, #FFF9E6 0%, #FFF5D6 100%)",
        }}
      >
        {/* Paper Texture Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            backgroundImage:
              themeMode === "dark"
                ? `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 115, 85, 0.05) calc(100% - 1px), rgba(139, 115, 85, 0.05) 100%)`
                : `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 69, 19, 0.05) calc(100% - 1px), rgba(139, 69, 19, 0.05) 100%)`,
            backgroundSize: `100% 24px`,
            opacity: 0.5,
            zIndex: 0
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#8b5a2b" }}>
              <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              <div style={{ marginTop: 16 }}>No entries found</div>
            </div>
          ) : (
            <>
              {current.map((blog, idx) => (
                <DiaryListItem key={blog.id} blog={blog} index={idx} />
              ))}

              {/* Pagination */}
              {filtered.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 24, paddingBottom: 40 }}>
                  <Pagination
                    current={page}
                    total={filtered.length}
                    pageSize={PAGE_SIZE}
                    onChange={(p) => {
                      setPage(p);
                      if (scrollWrapRef.current) {
                        scrollWrapRef.current.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    showSizeChanger={false}
                    size="small"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
