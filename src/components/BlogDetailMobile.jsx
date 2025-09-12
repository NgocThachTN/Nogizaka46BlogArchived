// BlogDetailMobile.jsx — Full-bleed mobile reader (Ant Design Pro)
// Giữ nguyên bố cục, nâng UX: ProSkeleton, progress đọc, ngôn ngữ JP/EN/VI, A-/A+, Drawer info.
import {
  Typography,
  Space,
  FloatButton,
  Drawer,
  Segmented,
  Affix,
  Button,
  Card,
  Tag,
  Avatar,
} from "antd";
import {
  LoadingOutlined,
  TranslationOutlined,
  ArrowUpOutlined,
  LeftOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  FontSizeOutlined,
} from "@ant-design/icons";
import {
  PageContainer,
  ProCard,
  ProSkeleton,
} from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useTransition,
} from "react";
import { getCachedBlogDetail, getImageUrl } from "../services/blogService";

// Utility function for throttle
function throttle(func, limit) {
  let inThrottle;
  let lastRan;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(inThrottle);
      inThrottle = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

const { Title, Text } = Typography;

const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

const LS_FONT = "mblog:fontSize";

/** ---------- Simple in-memory cache for mobile optimization ---------- **/
const _mobileCache = {
  blogContent: new Map(), // key: blogId -> { content, displayContent, language, ts }
  scrollPosition: new Map(), // key: blogId -> number
  imageCache: new Map(), // key: src -> { loaded: boolean, ts }
};
const CACHE_STALE_MS = 1000 * 60 * 5; // 5 phút

// Inject performance attributes into HTML for mobile rendering
function optimizeHtmlForMobile(html) {
  if (!html) return html;
  return html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    let newAttrs = attrs || "";
    if (!/\bloading=/.test(newAttrs)) newAttrs += ' loading="lazy"';
    if (!/\bdecoding=/.test(newAttrs)) newAttrs += ' decoding="async"';
    if (!/\breferrerpolicy=/.test(newAttrs))
      newAttrs += ' referrerpolicy="no-referrer"';
    return `<img${newAttrs}>`;
  });
}

export default function BlogDetailMobile({
  blog,
  loading,
  translating,
  language,
  setLanguage, // parent truyền xuống, đổi 'ja' | 'en' | 'vi' sẽ trigger dịch
  displayTitle, // Title (JP/EN/VI) render ra
  displayContent, // HTML (JP/EN/VI) render ra
  prevId,
  nextId,
  fastGo,
  pendingNavId,
  navLock,
  memberInfo, // Add memberInfo prop
}) {
  const navigate = useNavigate();

  // Mobile-optimized state management
  const [isPending] = useTransition();
  const [cachedDisplayContent, setCachedDisplayContent] =
    useState(displayContent);
  const [cachedLanguage, setCachedLanguage] = useState(language);

  // Track previous blog ID to detect blog changes
  const prevBlogIdRef = useRef(blog?.id);

  const goBack = useCallback(() => {
    if (prevId) {
      navigate(`/blog/${prevId}`);
    } else {
      const backTo = blog?.memberCode
        ? `/blogs/${blog.memberCode}`
        : "/members";
      navigate(backTo);
    }
  }, [navigate, blog?.memberCode, prevId]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem(LS_FONT)) || 18
  );

  // Styled nav buttons (Ant Design Pro vibe)
  const navFabStyle = useMemo(
    () => ({
      width: 44,
      height: 44,
      borderRadius: 12,
      background: "#fff",
      color: "#111",
      border: "1px solid rgba(0,0,0,0.06)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }),
    []
  );
  const navTopBtnStyle = useMemo(
    () => ({
      width: 32,
      height: 32,
      borderRadius: 10,
      background: "#fff",
      color: "#111",
      border: "1px solid rgba(0,0,0,0.06)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: 16,
      padding: 0,
    }),
    []
  );

  // progress đọc (%)
  const [readPct, setReadPct] = useState(0);
  const scrollWrapRef = useRef(null);
  const lastTotalRef = useRef(0);
  const lastScrolledRef = useRef(0);
  const lastPctRef = useRef(0);
  const throttledUpdateRef = useRef(null);

  // Header visibility state for scroll-based hiding
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show

  useEffect(() => {
    localStorage.setItem(LS_FONT, String(fontSize));
  }, [fontSize]);

  // ---- Clear old content immediately when blog changes ----
  useLayoutEffect(() => {
    if (blog?.id) {
      // Detect if blog ID changed
      const blogChanged = prevBlogIdRef.current !== blog.id;

      if (blogChanged) {
        // Blog changed - clear everything immediately
        setCachedDisplayContent(null);
        setCachedLanguage(language);
        prevBlogIdRef.current = blog.id;

        // Reset scroll position when switching blogs
        if (scrollWrapRef.current) {
          scrollWrapRef.current.scrollTop = 0;
        }

        // Clear ALL cache to prevent showing old content
        _mobileCache.blogContent.clear();

        // Show original content immediately - don't wait for translation
        if (blog?.content) {
          setCachedDisplayContent(blog.content);
        }

        // Force reset read progress
        setReadPct(0);
      } else {
        // Same blog - check if we have valid cache
        const cached = _mobileCache.blogContent.get(blog.id);
        if (
          cached?.displayContent &&
          cached?.language === language &&
          cached?.content === blog?.content
        ) {
          // Use cached content
          setCachedDisplayContent(cached.displayContent);
          setCachedLanguage(cached.language);
        } else {
          // Clear cache and show original content
          _mobileCache.blogContent.delete(blog.id);
          if (blog?.content) {
            setCachedDisplayContent(blog.content);
          }
        }
      }
    }
  }, [blog?.id, language, blog?.content]);

  // ---- Cache management và smooth updates ----
  useEffect(() => {
    if (displayContent && !translating && blog?.id) {
      // Clear any existing cache for this blog first to prevent stale content
      _mobileCache.blogContent.delete(blog.id);

      // Cache new content với timestamp
      _mobileCache.blogContent.set(blog.id, {
        content: blog.content,
        displayContent,
        language,
        ts: Date.now(),
      });

      // Update cached state immediately (not in transition) to prevent flicker
      setCachedDisplayContent(displayContent);
      setCachedLanguage(language);

      // Reset read progress
      setReadPct(0);

      // Force scroll to top immediately for new content
      if (scrollWrapRef.current) {
        // Disable smooth scrolling temporarily
        scrollWrapRef.current.style.scrollBehavior = "auto";
        scrollWrapRef.current.scrollTop = 0;

        // Re-enable smooth scrolling after scroll
        requestAnimationFrame(() => {
          if (scrollWrapRef.current) {
            scrollWrapRef.current.style.scrollBehavior = "smooth";
          }
        });
      }

      // Ensure images are visible after content change
      setTimeout(() => {
        if (scrollWrapRef.current) {
          const images = scrollWrapRef.current.getElementsByTagName("img");
          Array.from(images).forEach((img) => {
            img.style.opacity = "1";
            img.style.transition = "opacity 0.3s ease";
          });
        }
      }, 100);
    }
  }, [displayContent, translating, language, blog?.id, blog?.content]);

  // ---- Force clear content when displayContent changes from parent ----
  useEffect(() => {
    if (displayContent && blog?.id) {
      // This ensures that when parent provides new displayContent,
      // we immediately show it instead of cached content
      setCachedDisplayContent(displayContent);
      setCachedLanguage(language);

      // Clear any existing cache for this blog to prevent conflicts
      _mobileCache.blogContent.delete(blog.id);
    }
  }, [displayContent, language, blog?.id]);

  // Lưu vị trí cuộn trước khi rời trang (chỉ khi không phải content mới)
  useEffect(() => {
    if (!blog?.id) return;

    const onStore = () => {
      if (scrollWrapRef.current) {
        // Chỉ lưu scroll position nếu content đã ổn định
        const cached = _mobileCache.blogContent.get(blog.id);
        if (cached && cached.language === language) {
          _mobileCache.scrollPosition.set(
            blog.id,
            scrollWrapRef.current.scrollTop
          );
        }
      }
    };

    // Debounce scroll position saving
    let saveTimeout = null;
    const debouncedSave = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(onStore, 500);
    };

    const wrap = scrollWrapRef.current;
    if (wrap) {
      wrap.addEventListener("scroll", debouncedSave, { passive: true });
    }

    window.addEventListener("pagehide", onStore);
    window.addEventListener("beforeunload", onStore);

    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      if (wrap) {
        wrap.removeEventListener("scroll", debouncedSave);
      }
      onStore();
      window.removeEventListener("pagehide", onStore);
      window.removeEventListener("beforeunload", onStore);
    };
  }, [blog?.id, language]);

  const increaseFontSize = () => setFontSize((v) => Math.min(v + 2, 30));
  const decreaseFontSize = () => setFontSize((v) => Math.max(v - 2, 16));

  // Optimized HTML with lazy images - sử dụng cached content
  const optimizedHtml = useMemo(() => {
    return optimizeHtmlForMobile(cachedDisplayContent || blog?.content || "");
  }, [cachedDisplayContent, blog?.content]);

  // Debug logging
  console.log("BlogDetailMobile - displayTitle:", displayTitle);
  console.log("BlogDetailMobile - blog.title:", blog?.title);
  console.log("BlogDetailMobile - blog:", blog);

  // Fixed Navigation Bar (always visible)
  const NavigationBar = useMemo(
    () => (
      <Affix offsetTop={0}>
        <div
          style={{
            ...jpFont,
            background: "#fff",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            zIndex: 999,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
          }}
        >
          <div style={{ padding: "8px 12px" }}>
            <Space
              align="center"
              style={{ width: "100%", justifyContent: "space-between" }}
            >
              <Space>
                <Button
                  type="text"
                  icon={<HomeOutlined />}
                  onClick={() => navigate("/members")}
                />
                {prevId ? (
                  <Button
                    type="default"
                    size="small"
                    style={navTopBtnStyle}
                    disabled={!prevId || navLock}
                    onClick={() => fastGo && fastGo(prevId)}
                  >
                    {pendingNavId &&
                    pendingNavId === prevId &&
                    !getCachedBlogDetail(prevId) ? (
                      <LoadingOutlined />
                    ) : (
                      "<"
                    )}
                  </Button>
                ) : null}
                {nextId ? (
                  <Button
                    type="primary"
                    size="small"
                    style={navTopBtnStyle}
                    disabled={!nextId || navLock}
                    onClick={() => fastGo && fastGo(nextId)}
                  >
                    {pendingNavId &&
                    pendingNavId === nextId &&
                    !getCachedBlogDetail(nextId) ? (
                      <LoadingOutlined />
                    ) : (
                      ">"
                    )}
                  </Button>
                ) : null}
              </Space>
              <Space>
                {/* trạng thái dịch */}
                {translating || isPending ? (
                  <Tag
                    icon={<LoadingOutlined />}
                    color="processing"
                    style={{ marginRight: 6 }}
                  >
                    {cachedLanguage === "vi"
                      ? "Đang dịch..."
                      : cachedLanguage === "en"
                      ? "Translating..."
                      : "翻訳中..."}
                  </Tag>
                ) : (
                  <Tag color="default" style={{ marginRight: 6 }}>
                    {cachedLanguage.toUpperCase()}
                  </Tag>
                )}

                <Segmented
                  size="small"
                  value={cachedLanguage}
                  onChange={(val) => setLanguage(val)}
                  options={[
                    { label: "日", value: "ja" },
                    { label: "EN", value: "en" },
                    { label: "VI", value: "vi" },
                  ]}
                />
                <Button
                  type="text"
                  icon={<FontSizeOutlined />}
                  onClick={() => setDrawerVisible(true)}
                />
              </Space>
            </Space>
          </div>
        </div>
      </Affix>
    ),
    [
      cachedLanguage,
      translating,
      isPending,
      prevId,
      setLanguage,
      nextId,
      fastGo,
      pendingNavId,
      navLock,
      navTopBtnStyle,
      navigate,
    ]
  );

  // Author Bar (scroll-hideable)
  const AuthorBar = useMemo(
    () => (
      <Affix offsetTop={48}>
        <div
          style={{
            ...jpFont,
            background: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            zIndex: 998,
            position: "fixed",
            top: 48,
            left: 0,
            right: 0,
            width: "100%",
            // Add smooth transition for show/hide
            transform: isHeaderVisible ? "translateY(0)" : "translateY(-100%)",
            transition: "transform 0.3s ease-in-out",
            willChange: "transform",
          }}
        >
          {blog && (
            <div
              style={{
                padding: "8px 12px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "14px",
              }}
            >
              {/* Author Info - Left Side */}
              <Space
                align="center"
                style={{ flex: "0 0 auto", maxWidth: "45%" }}
              >
                <Avatar
                  src={
                    getImageUrl(memberInfo?.img) ||
                    getImageUrl(blog?.memberImage) ||
                    "https://via.placeholder.com/300x300?text=No+Image"
                  }
                  size={40}
                  style={{
                    border: "2px solid #fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <div>
                  <Text strong style={{ color: "#111827", fontSize: "15px" }}>
                    {memberInfo?.name || blog.author}
                  </Text>
                  <div
                    style={{
                      color: "#666",
                      marginTop: 1,
                      fontSize: "12px",
                    }}
                  >
                    <CalendarOutlined style={{ marginRight: 6 }} />
                    <Text>{blog.date}</Text>
                  </div>
                </div>
              </Space>

              {/* Blog Title - Center/Right Side */}
              <div
                style={{
                  flex: 1,
                  textAlign: "right",
                  paddingLeft: 12,
                  paddingRight: 8,
                  minWidth: 0, // Allow text to shrink
                }}
              >
                <Text
                  strong
                  style={{
                    color: "#111827",
                    fontSize: "13px",
                    lineHeight: 1.2,
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayTitle || blog?.title || "Không có title"}
                </Text>
              </div>

              {/* Info Button - Right Side */}
              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => setDrawerVisible(true)}
                style={{ color: "#666", flexShrink: 0 }}
              />
            </div>
          )}
        </div>
      </Affix>
    ),
    [blog, displayTitle, memberInfo, isHeaderVisible, setDrawerVisible]
  );

  // Create a single throttled updater for scroll progress and header visibility
  useEffect(() => {
    throttledUpdateRef.current = throttle(() => {
      const wrap = scrollWrapRef.current;
      if (!wrap) return;
      const total = wrap.scrollHeight - wrap.clientHeight;
      const scrolled = wrap.scrollTop;
      const lastTotal = lastTotalRef.current;
      const lastScrolled = lastScrolledRef.current;

      // Update read progress
      if (
        Math.abs(total - lastTotal) > 1 ||
        Math.abs(scrolled - lastScrolled) > 1
      ) {
        const pct =
          total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
        if (Math.abs(pct - lastPctRef.current) > 0.5) {
          setReadPct(pct);
          lastPctRef.current = pct;
        }
        lastTotalRef.current = total;
        lastScrolledRef.current = scrolled;
      }

      // Handle header visibility based on scroll direction
      const currentScrollY = scrolled;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

      if (scrollDifference > scrollThreshold) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
          // Scrolling down and past 50px - hide header
          setIsHeaderVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up - show header
          setIsHeaderVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    }, 100);
  }, [scrollThreshold]);

  // Optimized scroll handler using the stable throttled function
  const onScroll = useCallback(() => {
    if (throttledUpdateRef.current) {
      throttledUpdateRef.current();
    }
  }, []);

  // Simple image loading - chỉ đảm bảo ảnh hiển thị
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap) return;

    // Setup scroll handler
    wrap.addEventListener("scroll", onScroll, { passive: true });

    // Initialize
    onScroll();

    // Cleanup
    return () => {
      wrap.removeEventListener("scroll", onScroll);
    };
  }, [onScroll]);

  // Separate effect for image visibility - chỉ chạy khi content thay đổi
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap || !cachedDisplayContent) return;

    // Đảm bảo ảnh hiển thị sau khi content load
    const ensureImagesVisible = () => {
      const images = wrap.getElementsByTagName("img");
      Array.from(images).forEach((img) => {
        // Chỉ set nếu chưa được set
        if (img.style.opacity !== "1") {
          img.style.opacity = "1";
          img.style.transition = "opacity 0.3s ease";
        }
      });
    };

    // Delay để đảm bảo DOM đã render xong
    const timeoutId = setTimeout(ensureImagesVisible, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [cachedDisplayContent]);

  // Loading skeleton (ngon hơn Spin)
  if (loading) {
    return (
      <PageContainer
        header={false}
        ghost
        token={{
          paddingInlinePageContainerContent: 0,
          paddingBlockPageContainerContent: 0,
          paddingInlinePageContainer: 0,
        }}
        style={{ padding: 0, margin: 0, background: "#fff" }}
      >
        {NavigationBar}
        {AuthorBar}
        <ProCard
          ghost
          style={{
            minHeight: "100dvh",
            background: "#fff",
            padding: 0,
            ...jpFont,
          }}
          bodyStyle={{ padding: 12, margin: 0 }}
        >
          <ProSkeleton type="list" />
        </ProCard>
      </PageContainer>
    );
  }

  if (!blog) {
    return (
      <PageContainer
        header={false}
        ghost
        token={{
          paddingInlinePageContainerContent: 0,
          paddingBlockPageContainerContent: 0,
          paddingInlinePageContainer: 0,
        }}
        style={{ padding: 0, margin: 0, background: "#fff" }}
      >
        {NavigationBar}
        {AuthorBar}
        <ProCard
          ghost
          style={{
            minHeight: "100dvh",
            background: "#fff",
            padding: 0,
            ...jpFont,
          }}
          bodyStyle={{ padding: 16, margin: 0 }}
        >
          <Card bordered={false} style={{ textAlign: "center" }}>
            <Title level={4}>
              {language === "vi"
                ? "Không tìm thấy bài viết"
                : language === "en"
                ? "Blog post not found"
                : "ブログが見つかりません"}
            </Title>
          </Card>
        </ProCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={false}
      ghost
      token={{
        paddingInlinePageContainerContent: 0,
        paddingBlockPageContainerContent: 0,
        paddingInlinePageContainer: 0,
        pageContainer: {
          paddingBlock: 0,
          paddingInline: 0,
        },
      }}
      style={{
        padding: 0,
        margin: 0,
        background: "#fff",
        minHeight: "100dvh",
        width: "100vw",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {NavigationBar}
      {AuthorBar}

      {/* scroll container để bắt progress */}
      <div
        ref={scrollWrapRef}
        style={{
          height: "100dvh",
          overflow: "auto",
          background: "#fff",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          touchAction: "pan-y",
          paddingTop: "96px", // Add padding to account for fixed navigation bar (48px) + author bar (48px)
        }}
      >
        <ProCard
          ghost
          style={{
            background: "#fff",
            padding: 0,
            flex: 1,
            width: "100%",
            maxWidth: "100%",
            ...jpFont,
          }}
          bodyStyle={{
            padding: "0 0 80px",
            margin: 0,
            width: "100%",
          }}
        >
          {/* Content - Title moved to author section */}
          <div style={{ padding: "12px" }}>
            {/* Nội dung */}
            <div
              className="jp-prose"
              style={{
                fontSize,
                lineHeight: 1.9,
                transition: "font-size 0.2s ease",
                width: "100%",
                maxWidth: "100%",
                overflowWrap: "break-word",
                wordWrap: "break-word",
                hyphens: "auto",
              }}
              dangerouslySetInnerHTML={{
                __html: optimizedHtml,
              }}
            />
          </div>
        </ProCard>
      </div>

      {/* Drawer thông tin & cài đặt */}
      <Drawer
        title={
          <Space>
            <InfoCircleOutlined />
            <span>Thông tin & Cài đặt</span>
          </Space>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={320}
        styles={{ body: { paddingTop: 8 } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Card title="Ngôn ngữ" size="small" bordered>
            <Segmented
              block
              value={cachedLanguage}
              onChange={(val) => setLanguage(val)}
              options={[
                { label: "Nhật", value: "ja" },
                { label: "English", value: "en" },
                { label: "Tiếng Việt", value: "vi" },
              ]}
            />
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              Chọn EN/VI để dịch trực tiếp.
            </Text>
          </Card>

          <Card title="Cỡ chữ" size="small" bordered>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ textAlign: "center", fontSize: 16 }}>
                Hiện tại: {fontSize}px
              </div>
              <Space style={{ width: "100%", justifyContent: "center" }}>
                <Button onClick={decreaseFontSize}>A-</Button>
                <Button type="primary" onClick={increaseFontSize}>
                  A+
                </Button>
              </Space>
            </Space>
          </Card>

          {blog?.date && (
            <Card title="Ngày đăng" size="small" bordered>
              <Space>
                <CalendarOutlined />
                <Text>{blog.date}</Text>
              </Space>
            </Card>
          )}

          {blog?.originalUrl && (
            <Card title="Liên kết" size="small" bordered>
              <a
                href={blog.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#9333ea" }}
              >
                Xem bài viết gốc
              </a>
            </Card>
          )}
        </Space>
      </Drawer>

      {/* Progress đọc ở mép dưới màn hình */}
      <Affix offsetBottom={0}>
        <div
          style={{
            height: 3,
            width: "100%",
            background: "rgba(0,0,0,0.06)",
            willChange: "transform",
            transform: "translateZ(0)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background: "#1677ff",
              transform: `translateX(${readPct - 100}%)`,
              willChange: "transform",
              transition: "transform 0.1s ease-out",
            }}
          />
        </div>
      </Affix>

      {/* Full-bleed overrides */}
      <style>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          *::-webkit-scrollbar {
            display: none;
          }
          
          /* Hide scrollbar for IE, Edge and Firefox */
          * {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }

          /* Minimal touch optimization */
          * {
            -webkit-tap-highlight-color: transparent;
          }

          html, body, #root { 
            height: 100%; 
            min-height: 100vh;
            min-height: 100dvh;
            background: #fff;
            margin: 0;
            padding: 0;
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden;
          }
          body { 
            margin: 0; 
            padding: 0;
            overscroll-behavior: none;
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
          .ant-pro-grid-content { 
            margin: 0 !important; 
            padding: 0 !important;
            width: 100% !important;
          }
          .ant-card { 
            background: #fff;
            width: 100% !important;
          }
          .jp-prose img {
            border-radius: 12px;
            margin: 14px auto;
            max-width: 100%;
            height: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.06);
            display: block;
            /* Completely disable image interaction to prevent jank */
            pointer-events: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-user-drag: none;
            user-select: none;
            /* Force hardware acceleration */
            transform: translateZ(0);
            will-change: transform;
            /* Prevent any touch interference */
            touch-action: none;
          }
          /* Ensure images are always visible */
          .jp-prose img {
            opacity: 1 !important;
            transition: opacity 0.3s ease;
            min-height: 200px;
            background: rgba(0,0,0,0.05);
          }
          .jp-prose p {
            margin: 0.85em 0;
            text-align: justify;
            line-height: 1.9;
            font-size: 20px;
            color: #1f2937;
          }
          .jp-prose h1 { font-size: 1.6em; margin: 0.9em 0 0.45em; font-weight: 700; color: #111827; }
          .jp-prose h2 { font-size: 1.4em; margin: 0.85em 0 0.4em; font-weight: 700; color: #111827; }
          .jp-prose h3 { font-size: 1.25em; margin: 0.8em 0 0.3em; font-weight: 600; color: #111827; }
          .jp-prose blockquote {
            border-left: 4px solid #e9d5ff; background: #faf5ff;
            padding: 12px 16px; border-radius: 8px; margin: 1em 0;
            font-size: 1.05em; color: #4b5563;
          }
          .jp-prose a { color: #9333ea; text-decoration: none; }
          .jp-prose a:hover { text-decoration: underline; }
          .jp-prose ul, .jp-prose ol { padding-left: 1.2em; margin: 0.8em 0; }
          .jp-prose li { margin: 0.4em 0; color: #374151; }
          .jp-prose strong { color: #111827; font-weight: 600; }
        `}</style>
    </PageContainer>
  );
}
