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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCachedBlogDetail } from "../services/blogService";

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
  displayContent, // HTML (JP/EN/VI) render ra
  prevId,
  nextId,
  fastGo,
  pendingNavId,
  navLock,
}) {
  const navigate = useNavigate();
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
    () => Number(localStorage.getItem(LS_FONT)) || 16
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

  useEffect(() => {
    localStorage.setItem(LS_FONT, String(fontSize));
  }, [fontSize]);

  // Handle content updates
  useEffect(() => {
    if (displayContent && !translating) {
      // Reset read progress immediately
      setReadPct(0);

      // Delay scroll to allow images to start loading
      const scrollToTop = () => {
        if (scrollWrapRef.current) {
          scrollWrapRef.current.scrollTop = 0;
        }
      };

      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToTop);
      });
    }
  }, [displayContent, translating]);

  const increaseFontSize = () => setFontSize((v) => Math.min(v + 2, 24));
  const decreaseFontSize = () => setFontSize((v) => Math.max(v - 2, 14));

  // Optimized HTML with lazy images
  const optimizedHtml = useMemo(() => {
    return optimizeHtmlForMobile(displayContent || blog?.content || "");
  }, [displayContent, blog?.content]);

  // Sticky TopBar
  const TopBar = useMemo(
    () => (
      <Affix offsetTop={0}>
        <div
          style={{
            ...jpFont,
            background: "#fff",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            padding: 8,
            // Ensure the TopBar stays above any scrolling content/overlays
            zIndex: 998,
            position: "relative",
          }}
        >
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
              {translating ? (
                <Tag
                  icon={<LoadingOutlined />}
                  color="processing"
                  style={{ marginRight: 6 }}
                >
                  {language === "vi"
                    ? "Đang dịch..."
                    : language === "en"
                    ? "Translating..."
                    : "翻訳中..."}
                </Tag>
              ) : (
                <Tag color="default" style={{ marginRight: 6 }}>
                  {language.toUpperCase()}
                </Tag>
              )}

              <Segmented
                size="small"
                value={language}
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
      </Affix>
    ),
    [
      language,
      translating,
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

  // Create a single throttled updater for scroll progress
  useEffect(() => {
    throttledUpdateRef.current = throttle(() => {
      const wrap = scrollWrapRef.current;
      if (!wrap) return;
      const total = wrap.scrollHeight - wrap.clientHeight;
      const scrolled = wrap.scrollTop;
      const lastTotal = lastTotalRef.current;
      const lastScrolled = lastScrolledRef.current;

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
    }, 100);
  }, []);

  // Optimized scroll handler using the stable throttled function
  const onScroll = useCallback(() => {
    if (throttledUpdateRef.current) {
      throttledUpdateRef.current();
    }
  }, []);

  // Handle image loading
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap) return;

    // Mark images as loaded when they finish loading
    const markImagesLoaded = () => {
      const images = wrap.getElementsByTagName("img");
      Array.from(images).forEach((img) => {
        if (img.complete) {
          img.setAttribute("data-loaded", "true");
        } else {
          img.onload = () => img.setAttribute("data-loaded", "true");
        }
      });
    };

    // Setup scroll handler
    wrap.addEventListener("scroll", onScroll, { passive: true });

    // Initialize
    onScroll();
    markImagesLoaded();

    // Cleanup
    return () => {
      wrap.removeEventListener("scroll", onScroll);
      const images = wrap.getElementsByTagName("img");
      Array.from(images).forEach((img) => {
        img.onload = null;
      });
    };
  }, [onScroll, displayContent]);

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
        {TopBar}
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
        {TopBar}
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
      {TopBar}

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
          /* Optimize for mobile scrolling */
          scrollBehavior: "auto",
          /* Hardware acceleration */
          transform: "translateZ(0)",
          willChange: "scroll-position",
          /* Prevent scroll jank */
          backfaceVisibility: "hidden",
          perspective: "1000px",
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
          {/* Title block */}
          <div style={{ padding: "0 12px" }}>
            <Card
              bordered={false}
              style={{
                margin: 0,
                padding: 0,
                background: "transparent",
                width: "100%",
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Title
                level={4}
                style={{
                  margin: 0,
                  lineHeight: 1.25,
                  letterSpacing: 0.2,
                  color: "#111827",
                }}
              >
                {blog.title}
              </Title>
              <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
                {blog.author} ・ {blog.date}
              </Text>
            </Card>

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
              value={language}
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

      {/* Floating buttons */}
      <FloatButton.Group
        shape="square"
        style={{ right: 12, bottom: 12, zIndex: 997 }}
      >
        <FloatButton
          icon={
            pendingNavId &&
            pendingNavId === prevId &&
            prevId &&
            !getCachedBlogDetail(prevId) ? (
              <LoadingOutlined />
            ) : (
              <span style={{ fontWeight: 700, fontSize: 16 }}>&lt;</span>
            )
          }
          onClick={() => (prevId && fastGo ? fastGo(prevId) : goBack())}
          tooltip={prevId ? "Bài trước" : "Quay lại"}
          disabled={navLock && !!prevId}
          style={navFabStyle}
        />
        {nextId ? (
          <FloatButton
            icon={
              pendingNavId &&
              pendingNavId === nextId &&
              !getCachedBlogDetail(nextId) ? (
                <LoadingOutlined />
              ) : (
                <span style={{ fontWeight: 700, fontSize: 16 }}>&gt;</span>
              )
            }
            onClick={() => fastGo && fastGo(nextId)}
            tooltip="Bài tiếp theo"
            disabled={!nextId || navLock}
            style={navFabStyle}
          />
        ) : null}
        <FloatButton
          icon={<TranslationOutlined />}
          tooltip="Dịch JP/EN/VI"
          onClick={() => setDrawerVisible(true)}
        />
        <FloatButton.BackTop
          target={() => scrollWrapRef.current}
          icon={<ArrowUpOutlined />}
          tooltip="Lên đầu"
        />
      </FloatButton.Group>

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

          /* Smooth touch interaction for mobile */
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }

          /* Allow text selection in content areas */
          .jp-prose, .jp-prose * {
            -webkit-user-select: text;
            -khtml-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
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
            /* Optimize for mobile touch */
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            /* Prevent selection and drag */
            -webkit-user-select: none;
            user-select: none;
            -webkit-user-drag: none;
            /* Smooth image loading and rendering */
            image-rendering: auto;
            image-rendering: -webkit-optimize-contrast;
            /* Prevent layout shifts during loading */
            aspect-ratio: attr(width) / attr(height);
            /* Hardware acceleration for smooth scrolling */
            transform: translateZ(0);
            will-change: transform;
            /* Prevent image jank during scroll */
            contain: layout style paint;
          }
          /* Preload space for images to prevent layout shifts */
          .jp-prose img:not([data-loaded]) {
            min-height: 200px;
            background: rgba(0,0,0,0.05);
          }
          .jp-prose p {
            margin: 0.85em 0;
            text-align: justify;
            line-height: 1.9;
            font-size: 16px;
            color: #1f2937;
          }
          .jp-prose h1 { font-size: 1.45em; margin: 0.9em 0 0.45em; font-weight: 700; color: #111827; }
          .jp-prose h2 { font-size: 1.28em; margin: 0.85em 0 0.4em; font-weight: 700; color: #111827; }
          .jp-prose h3 { font-size: 1.12em; margin: 0.8em 0 0.3em; font-weight: 600; color: #111827; }
          .jp-prose blockquote {
            border-left: 4px solid #e9d5ff; background: #faf5ff;
            padding: 12px 16px; border-radius: 8px; margin: 1em 0;
            font-size: 0.95em; color: #4b5563;
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
