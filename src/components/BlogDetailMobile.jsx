// BlogDetailMobile.jsx — Full-bleed mobile reader (Ant Design Pro)
// Đã xoá: nút ẩn/hiện thủ công AuthorBar + progress bar dưới cùng.
// Giữ: Auto-hide AuthorBar trên Android (kéo xuống ẩn, kéo lên hiện) + nút bật/tắt auto-hide.

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
  GlobalOutlined,
  PushpinOutlined,
  PushpinFilled,
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
import { isIOS } from "../utils/deviceDetection";

// Android detection (nhẹ, đủ xài)
const isAndroid = () =>
  typeof navigator !== "undefined" &&
  /Android/i.test(navigator.userAgent || "");

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

    // iOS-specific optimizations
    if (isIOS()) {
      if (!/\bstyle=/.test(newAttrs)) {
        newAttrs += ' style="max-width: 100%; height: auto;"';
      }
    }

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

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem(LS_FONT)) || 18
  );

  const navTopBtnStyle = useMemo(
    () => ({
      width: 32,
      height: 32,
      borderRadius: 10,
      background: "rgba(253, 246, 227, 0.8)",
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

  // Header visibility state for scroll-based hiding
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollWrapRef = useRef(null);

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
      _mobileCache.blogContent.delete(blog.id);

      _mobileCache.blogContent.set(blog.id, {
        content: blog.content,
        displayContent,
        language,
        ts: Date.now(),
      });

      setCachedDisplayContent(displayContent);
      setCachedLanguage(language);

      // Force scroll to top immediately for new content
      if (scrollWrapRef.current) {
        scrollWrapRef.current.style.scrollBehavior = "auto";
        scrollWrapRef.current.scrollTop = 0;
        requestAnimationFrame(() => {
          if (scrollWrapRef.current) {
            scrollWrapRef.current.style.scrollBehavior = "smooth";
          }
        });
      }

      // Simple image handling - no delays or complex logic
      if (scrollWrapRef.current) {
        const images = scrollWrapRef.current.getElementsByTagName("img");
        Array.from(images).forEach((img) => {
          img.style.opacity = "1";
          img.style.transition = "none";
        });
      }
    }
  }, [displayContent, translating, language, blog?.id, blog?.content]);

  // ---- Force clear content when displayContent changes from parent ----
  useEffect(() => {
    if (displayContent && blog?.id) {
      setCachedDisplayContent(displayContent);
      setCachedLanguage(language);
      _mobileCache.blogContent.delete(blog.id);
    }
  }, [displayContent, language, blog?.id]);

  // Lưu vị trí cuộn trước khi rời trang (chỉ khi không phải content mới)
  useEffect(() => {
    if (!blog?.id) return;

    const onStore = () => {
      if (scrollWrapRef.current) {
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

  // Fixed Navigation Bar (always visible)
  const NavigationBar = useMemo(
    () => (
      <Affix offsetTop={0}>
        <div
          style={{
            ...jpFont,
            background: "rgba(253, 246, 227, 0.8)",
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
                    icon={<LoadingOutlined spin />}
                    color="processing"
                    style={{
                      marginRight: 6,
                      background:
                        "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)",
                      border: "none",
                      color: "white",
                      fontWeight: 500,
                    }}
                  >
                    {cachedLanguage === "vi"
                      ? "Dịch"
                      : cachedLanguage === "en"
                      ? "Trans"
                      : "翻訳"}
                  </Tag>
                ) : (
                  <Tag color="default" style={{ marginRight: 6 }}>
                    {cachedLanguage?.toUpperCase?.() || "JA"}
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
        <ProCard
          size="small"
          style={{
            ...jpFont,
            background:
              isHeaderVisible
                ? "linear-gradient(135deg, rgba(253, 246, 227, 0.9) 0%, rgba(244, 241, 232, 0.9) 100%)"
                : "linear-gradient(135deg, rgba(253, 246, 227, 0) 0%, rgba(244, 241, 232, 0) 100%)",
            borderBottom:
              isHeaderVisible
                ? "1px solid rgba(139, 69, 19, 0.2)"
                : "1px solid rgba(139, 69, 19, 0)",
            zIndex: 998,
            position: "fixed",
            top: 48,
            left: 0,
            right: 0,
            width: "100%",
            transform: isHeaderVisible ? "translateY(0)" : "translateY(-100%)",
            transition: isHeaderVisible
              ? "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out, visibility 0.3s ease-out, background 0.3s ease-out, border-color 0.3s ease-out"
              : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.2s ease-in, visibility 0.2s ease-in, background 0.2s ease-in, border-color 0.2s ease-in",
            willChange: "transform, opacity, background, border-color",
            visibility: isHeaderVisible ? "visible" : "hidden",
            opacity: isHeaderVisible ? 1 : 0,
            margin: 0,
            borderRadius: 0,
            boxShadow: "none",
          }}
          bodyStyle={{
            padding: "6px 12px",
            margin: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          {blog && (
            <>
              {/* Author Info - Left Side */}
              <Space
                align="center"
                style={{ flex: "0 0 auto", maxWidth: "50%" }}
                size="small"
              >
                <Avatar
                  src={
                    getImageUrl(memberInfo?.img) ||
                    getImageUrl(blog?.memberImage) ||
                    "https://via.placeholder.com/300x300?text=No+Image"
                  }
                  size={32}
                  style={{
                    border: "1px solid #fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  }}
                />
                <div>
                  <Text strong style={{ color: "#3c2415", fontSize: "13px" }}>
                    {memberInfo?.name || blog.author}
                  </Text>
                  <div
                    style={{
                      color: "#5d4e37",
                      marginTop: 1,
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <CalendarOutlined style={{ marginRight: 4, fontSize: "10px" }} />
                    <Text>{blog.date}</Text>
                  </div>
                </div>
              </Space>

              {/* Blog Title - Center/Right Side */}
              <div
                style={{
                  flex: 1,
                  textAlign: "right",
                  paddingLeft: 8,
                  paddingRight: 4,
                  minWidth: 0,
                }}
              >
                <Text
                  strong
                  style={{
                    color: "#3c2415",
                    fontSize: "12px",
                    lineHeight: 1.2,
                    display: "block",
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
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
                style={{
                  color: "#5d4e37",
                  flexShrink: 0,
                  padding: "4px 6px",
                  height: "auto",
                }}
              />
            </>
          )}
        </ProCard>
      </Affix>
    ),
    [blog, displayTitle, memberInfo, isHeaderVisible]
  );

  // Android-optimized scroll handler
  const lastScrollTime = useRef(0);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = useCallback(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap) return;

    // Chỉ auto-hide trên Android
    if (!isAndroid()) return;

    const currentScrollY = wrap.scrollTop;
    const currentTime = Date.now();

    // Debounce scroll events
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    if (!isScrolling) {
      setIsScrolling(true);
      lastScrollTime.current = currentTime;
      return;
    }

    // Only process if enough time has passed
    if (currentTime - lastScrollTime.current < 50) return;

    const scrollDifference = currentScrollY - (lastScrollY.current || 0);

    if (Math.abs(scrollDifference) > 5) {
      // Kéo xuống → ẨN, Kéo lên → HIỆN
      if (scrollDifference > 0) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;
    }
  }, [isScrolling]);

  // Setup scroll handlers
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap) return;

    const combinedScrollHandler = () => {
      // Update header visibility (Android)
      handleScroll();
    };

    wrap.addEventListener("scroll", combinedScrollHandler, { passive: true });
    wrap.addEventListener("wheel", combinedScrollHandler, { passive: true });

    // Initialize once
    combinedScrollHandler();

    return () => {
      wrap.removeEventListener("scroll", combinedScrollHandler);
      wrap.removeEventListener("wheel", combinedScrollHandler);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleScroll]);

  // Simple image handling - no complex logic
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap || !cachedDisplayContent) return;

    const images = wrap.getElementsByTagName("img");
    Array.from(images).forEach((img) => {
      img.style.opacity = "1";
      img.style.transition = "none"; // Disable transitions
    });
  }, [cachedDisplayContent]);

  // Loading skeleton
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
        style={{
          padding: 0,
          margin: 0,
          background: "rgba(253, 246, 227, 0.8)",
        }}
      >
        {NavigationBar}
        {AuthorBar}
        <ProCard
          ghost
          style={{
            minHeight: "100dvh",
            background: "rgba(253, 246, 227, 0.8)",
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
        style={{
          padding: 0,
          margin: 0,
          background: "rgba(253, 246, 227, 0.8)",
        }}
      >
        {NavigationBar}
        {AuthorBar}
        <ProCard
          ghost
          style={{
            minHeight: "100dvh",
            background: "rgba(253, 246, 227, 0.8)",
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
        background: "rgba(253, 246, 227, 0.8)",
        minHeight: "100dvh",
        width: "100vw",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {NavigationBar}
      {AuthorBar}

      {/* scroll container */}
      <div
        ref={scrollWrapRef}
        style={{
          height: "100dvh",
          overflow: "auto",
          background: "rgba(253, 246, 227, 0.8)",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          touchAction: "pan-y",
          paddingTop: isHeaderVisible ? "88px" : "48px",
          transition: "padding-top 0.3s ease",
        }}
      >
        <ProCard
          ghost
          style={{
            background: "rgba(253, 246, 227, 0.8)",
            padding: 0,
            flex: 1,
            width: "100%",
            maxWidth: "100%",
            ...jpFont,
            position: "relative",
          }}
          bodyStyle={{
            padding: "0 0 0",
            margin: 0,
            width: "100%",
          }}
        >
          {/* Translation Loading Overlay */}
          {translating && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(253, 246, 227, 0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                backdropFilter: "blur(3px)",
              }}
            >
              <ProCard
                style={{
                  textAlign: "center",
                  borderRadius: 16,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                  border: "1px solid rgba(139, 69, 19, 0.2)",
                  background:
                    "linear-gradient(135deg, rgba(253, 246, 227, 0.95) 0%, rgba(244, 241, 232, 0.95) 100%)",
                  margin: "0 16px",
                  maxWidth: 280,
                  width: "90%",
                }}
                bodyStyle={{ padding: "24px 20px" }}
              >
                <Space direction="vertical" align="center" size={16}>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LoadingOutlined style={{ fontSize: 24, color: "#8b4513" }} spin />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        color: "#8b4513",
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      {cachedLanguage === "vi"
                        ? "Đang xử lý..."
                        : cachedLanguage === "en"
                        ? "Processing..."
                        : "処理中..."}
                    </div>
                  </div>
                </Space>
              </ProCard>
            </div>
          )}

          {/* Content - Title moved to author section */}
          <div style={{ padding: "12px 12px 0 12px" }}>
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
                paddingBottom: "20px",
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
        afterOpenChange={(open) => {
          // Khi mở Drawer, giữ hiện Header; đóng lại thì để logic cuộn lo.
          if (open) {
            setIsHeaderVisible(true);
          }
        }}
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
          
          /* iOS-specific optimizations */
          body {
            -webkit-overflow-scrolling: touch;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Prevent iOS zoom on double tap */
          * {
            touch-action: manipulation;
          }

          /* Minimal touch optimization */
          * {
            -webkit-tap-highlight-color: transparent;
          }

          html, body, #root { 
            height: 100%; 
            min-height: 100vh;
            min-height: 100dvh;
            background: #fdf6e3;
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
            background: #fdf6e3;
            width: 100% !important;
          }
          .ant-pro-card {
            margin: 0 !important;
            padding: 0 !important;
          }
          .ant-pro-card-body {
            margin: 0 !important;
            padding: 0 !important;
          }
          .jp-prose img {
            border-radius: 12px;
            margin: 14px auto;
            max-width: 100%;
            height: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.06);
            display: block;
            /* Minimal CSS to prevent jank */
            pointer-events: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-user-drag: none;
            user-select: none;
            /* Simple hardware acceleration */
            transform: translateZ(0);
            /* No transitions or complex properties */
            opacity: 1;
            background: rgba(0,0,0,0.05);
            /* iOS-specific optimizations */
            -webkit-backface-visibility: hidden;
            -webkit-transform: translateZ(0);
            -webkit-perspective: 1000;
            /* Prevent iOS zoom on double tap */
            touch-action: manipulation;
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
