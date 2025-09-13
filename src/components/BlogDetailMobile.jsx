// BlogDetailMobile.jsx — Full-bleed mobile reader (Ant Design Pro)
// Auto-hide AuthorBar trên Android + nút ẩn/hiện thủ công. Đã fix jank khi ẩn thủ công.

import {
  Typography,
  Space,
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
  HomeOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  FontSizeOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PushpinOutlined,
  PushpinFilled,
} from "@ant-design/icons";
import { PageContainer, ProCard, ProSkeleton } from "@ant-design/pro-components";
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

// Android detection
const isAndroid = () =>
  typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent || "");

// throttle helper
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

const _mobileCache = {
  blogContent: new Map(),
  scrollPosition: new Map(),
  imageCache: new Map(),
};

function optimizeHtmlForMobile(html) {
  if (!html) return html;
  return html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    let newAttrs = attrs || "";
    if (!/\bloading=/.test(newAttrs)) newAttrs += ' loading="lazy"';
    if (!/\bdecoding=/.test(newAttrs)) newAttrs += ' decoding="async"';
    if (!/\breferrerpolicy=/.test(newAttrs))
      newAttrs += ' referrerpolicy="no-referrer"';
    if (isIOS() && !/\bstyle=/.test(newAttrs)) {
      newAttrs += ' style="max-width: 100%; height: auto;"';
    }
    return `<img${newAttrs}>`;
  });
}

export default function BlogDetailMobile({
  blog,
  loading,
  translating,
  language,
  setLanguage,
  displayTitle,
  displayContent,
  prevId,
  nextId,
  fastGo,
  pendingNavId,
  navLock,
  memberInfo,
}) {
  const navigate = useNavigate();

  const [isPending] = useTransition();
  const [cachedDisplayContent, setCachedDisplayContent] = useState(displayContent);
  const [cachedLanguage, setCachedLanguage] = useState(language);

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

  // đọc %
  const [readPct, setReadPct] = useState(0);
  const scrollWrapRef = useRef(null);
  const lastTotalRef = useRef(0);
  const lastScrolledRef = useRef(0);
  const lastPctRef = useRef(0);
  const throttledUpdateRef = useRef(null);

  // header state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Auto-hide và ẩn thủ công
  const [autoHideHeader, setAutoHideHeader] = useState(true);
  const [manuallyHidden, setManuallyHidden] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_FONT, String(fontSize));
  }, [fontSize]);

  // Blog change → reset, không giật
  useLayoutEffect(() => {
    if (!blog?.id) return;
    const blogChanged = prevBlogIdRef.current !== blog.id;

    if (blogChanged) {
      setCachedDisplayContent(null);
      setCachedLanguage(language);
      prevBlogIdRef.current = blog.id;

      if (scrollWrapRef.current) {
        const el = scrollWrapRef.current;
        el.style.scrollBehavior = "auto";
        el.scrollTop = 0;
        requestAnimationFrame(() => {
          if (el) el.style.scrollBehavior = "smooth";
        });
      }

      _mobileCache.blogContent.clear();

      if (blog?.content) setCachedDisplayContent(blog.content);
      setReadPct(0);

      // Giữ trạng thái header ổn định theo manualHidden
      setIsHeaderVisible(!manuallyHidden);
    } else {
      const cached = _mobileCache.blogContent.get(blog.id);
      if (
        cached?.displayContent &&
        cached?.language === language &&
        cached?.content === blog?.content
      ) {
        setCachedDisplayContent(cached.displayContent);
        setCachedLanguage(cached.language);
      } else {
        _mobileCache.blogContent.delete(blog.id);
        if (blog?.content) setCachedDisplayContent(blog.content);
      }
    }
  }, [blog?.id, language, blog?.content, manuallyHidden]);

  // Cache + smooth update
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
      setReadPct(0);

      if (scrollWrapRef.current) {
        const el = scrollWrapRef.current;
        el.style.scrollBehavior = "auto";
        el.scrollTop = 0;
        requestAnimationFrame(() => {
          if (el) el.style.scrollBehavior = "smooth";
        });
      }

      if (scrollWrapRef.current) {
        const images = scrollWrapRef.current.getElementsByTagName("img");
        Array.from(images).forEach((img) => {
          img.style.opacity = "1";
          img.style.transition = "none";
        });
      }
    }
  }, [displayContent, translating, language, blog?.id, blog?.content]);

  // Force show parent displayContent ngay khi tới
  useEffect(() => {
    if (displayContent && blog?.id) {
      setCachedDisplayContent(displayContent);
      setCachedLanguage(language);
      _mobileCache.blogContent.delete(blog.id);
    }
  }, [displayContent, language, blog?.id]);

  // Lưu scroll pos (nhẹ)
  useEffect(() => {
    if (!blog?.id) return;

    const onStore = () => {
      if (!scrollWrapRef.current) return;
      const cached = _mobileCache.blogContent.get(blog.id);
      if (cached && cached.language === language) {
        _mobileCache.scrollPosition.set(blog.id, scrollWrapRef.current.scrollTop);
      }
    };

    let saveTimeout = null;
    const debouncedSave = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(onStore, 500);
    };

    const wrap = scrollWrapRef.current;
    if (wrap) wrap.addEventListener("scroll", debouncedSave, { passive: true });

    window.addEventListener("pagehide", onStore);
    window.addEventListener("beforeunload", onStore);

    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      if (wrap) wrap.removeEventListener("scroll", debouncedSave);
      onStore();
      window.removeEventListener("pagehide", onStore);
      window.removeEventListener("beforeunload", onStore);
    };
  }, [blog?.id, language]);

  const increaseFontSize = () => setFontSize((v) => Math.min(v + 2, 30));
  const decreaseFontSize = () => setFontSize((v) => Math.max(v - 2, 16));

  const optimizedHtml = useMemo(() => {
    return optimizeHtmlForMobile(cachedDisplayContent || blog?.content || "");
  }, [cachedDisplayContent, blog?.content]);

  // Nav bar (có nút ẩn thủ công + auto-hide toggle)
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

                {/* Ẩn/hiện thủ công: loại bỏ hoàn toàn AuthorBar để khỏi reflow */}
                <Button
                  type="text"
                  onClick={() => {
                    setManuallyHidden((v) => !v);
                    // Khi ẩn thủ công → header coi như “không hiện”
                    setIsHeaderVisible((prev) => (prev ? false : prev));
                  }}
                  title={manuallyHidden ? "Hiện thanh tác giả" : "Ẩn thanh tác giả"}
                  icon={manuallyHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                />

                {/* Auto-hide toggle (Android) */}
                {isAndroid() && (
                  <Button
                    type="text"
                    onClick={() => setAutoHideHeader((v) => !v)}
                    title={
                      autoHideHeader
                        ? "Tắt auto-hide khi cuộn"
                        : "Bật auto-hide khi cuộn"
                    }
                    icon={autoHideHeader ? <PushpinFilled /> : <PushpinOutlined />}
                    disabled={manuallyHidden} // đang ẩn thủ công thì khoá toggle cho rõ ràng
                  />
                )}
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
      manuallyHidden,
      autoHideHeader,
    ]
  );

  // AuthorBar — nếu manuallyHidden thì KHÔNG render (fix jank Affix)
  const AuthorBar = useMemo(() => {
    if (manuallyHidden) return null;
    return (
      <Affix offsetTop={48}>
        <ProCard
          size="small"
          style={{
            ...jpFont,
            background: isHeaderVisible
              ? "linear-gradient(135deg, rgba(253, 246, 227, 0.9) 0%, rgba(244, 241, 232, 0.9) 100%)"
              : "linear-gradient(135deg, rgba(253, 246, 227, 0) 0%, rgba(244, 241, 232, 0) 100%)",
            borderBottom: isHeaderVisible
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
    );
  }, [blog, displayTitle, memberInfo, isHeaderVisible, manuallyHidden]);

  // progress
  useEffect(() => {
    throttledUpdateRef.current = throttle(() => {
      const wrap = scrollWrapRef.current;
      if (!wrap) return;
      const total = wrap.scrollHeight - wrap.clientHeight;
      const scrolled = wrap.scrollTop;
      const lastTotal = lastTotalRef.current;
      const lastScrolled = lastScrolledRef.current;

      if (Math.abs(total - lastTotal) > 1 || Math.abs(scrolled - lastScrolled) > 1) {
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

  // Android auto-hide scroll
  const lastScrollTime = useRef(0);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = useCallback(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap) return;

    // Không auto-hide nếu: không Android / tắt auto-hide / đang ẩn thủ công
    if (!isAndroid() || !autoHideHeader || manuallyHidden) return;

    const currentScrollY = wrap.scrollTop;
    const currentTime = Date.now();

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setIsScrolling(false), 150);

    if (!isScrolling) {
      setIsScrolling(true);
      lastScrollTime.current = currentTime;
      return;
    }
    if (currentTime - lastScrollTime.current < 50) return;

    const dy = currentScrollY - (lastScrollY.current || 0);
    if (Math.abs(dy) > 5) {
      // xuống → ẩn, lên → hiện
      setIsHeaderVisible(dy <= 0);
      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;
    }
  }, [isScrolling, autoHideHeader, manuallyHidden]);

  // listeners
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap) return;

    const combined = () => {
      if (throttledUpdateRef.current) throttledUpdateRef.current();
      handleScroll();
    };

    wrap.addEventListener("scroll", combined, { passive: true });
    wrap.addEventListener("wheel", combined, { passive: true });

    combined();

    return () => {
      wrap.removeEventListener("scroll", combined);
      wrap.removeEventListener("wheel", combined);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [handleScroll]);

  // đảm bảo ảnh ko transition
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap || !cachedDisplayContent) return;
    const images = wrap.getElementsByTagName("img");
    Array.from(images).forEach((img) => {
      img.style.opacity = "1";
      img.style.transition = "none";
    });
  }, [cachedDisplayContent]);

  if (loading) {
    return (
      <PageContainer header={false} ghost token={{ paddingInlinePageContainer: 0 }} style={{ padding: 0, margin: 0, background: "rgba(253, 246, 227, 0.8)" }}>
        {NavigationBar}
        {AuthorBar}
        <ProCard ghost style={{ minHeight: "100dvh", background: "rgba(253, 246, 227, 0.8)", padding: 0, ...jpFont }} bodyStyle={{ padding: 12, margin: 0 }}>
          <ProSkeleton type="list" />
        </ProCard>
      </PageContainer>
    );
  }

  if (!blog) {
    return (
      <PageContainer header={false} ghost token={{ paddingInlinePageContainer: 0 }} style={{ padding: 0, margin: 0, background: "rgba(253, 246, 227, 0.8)" }}>
        {NavigationBar}
        {AuthorBar}
        <ProCard ghost style={{ minHeight: "100dvh", background: "rgba(253, 246, 227, 0.8)", padding: 0, ...jpFont }} bodyStyle={{ padding: 16, margin: 0 }}>
          <Card bordered={false} style={{ textAlign: "center" }}>
            <Title level={4}>
              {language === "vi" ? "Không tìm thấy bài viết" : language === "en" ? "Blog post not found" : "ブログが見つかりません"}
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
        pageContainer: { paddingBlock: 0, paddingInline: 0 },
      }}
      style={{ padding: 0, margin: 0, background: "rgba(253, 246, 227, 0.8)", minHeight: "100dvh", width: "100vw", maxWidth: "100%", overflow: "hidden" }}
    >
      {NavigationBar}
      {AuthorBar}

      {/* scroll container */}
      <div
        ref={scrollWrapRef}
        style={{
          height: "calc(100dvh - 3px)",
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
          paddingTop: manuallyHidden ? "48px" : isHeaderVisible ? "88px" : "48px",
          transition: manuallyHidden ? "none" : "padding-top 0.2s ease",
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
          bodyStyle={{ padding: "0 0 0", margin: 0, width: "100%" }}
        >
          {/* overlay dịch */}
          {translating && (
            <ProCard
              style={{
                position: "absolute",
                inset: 0,
                textAlign: "center",
                borderRadius: 0,
                boxShadow: "none",
                border: "none",
                background:
                  "linear-gradient(135deg, rgba(253, 246, 227, 0.95) 0%, rgba(244, 241, 232, 0.95) 100%)",
                zIndex: 10,
              }}
              bodyStyle={{ padding: "24px 20px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Space direction="vertical" align="center" size={16}>
                <LoadingOutlined style={{ fontSize: 24, color: "#8b4513" }} spin />
                <div style={{ fontSize: 16, color: "#8b4513", fontWeight: 600 }}>
                  {cachedLanguage === "vi" ? "Đang xử lý..." : cachedLanguage === "en" ? "Processing..." : "処理中..."}
                </div>
              </Space>
            </ProCard>
          )}

          {/* content */}
          <div style={{ padding: "12px 12px 0 12px" }}>
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
              dangerouslySetInnerHTML={{ __html: optimizedHtml }}
            />
          </div>
        </ProCard>
      </div>

      {/* Drawer */}
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
          if (open) setIsHeaderVisible(true);
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
              <div style={{ textAlign: "center", fontSize: 16 }}>Hiện tại: {fontSize}px</div>
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

      {/* progress dưới */}
      <Affix offsetBottom={0}>
        <div
          style={{
            height: 3,
            width: "100%",
            background: "rgba(139, 69, 19, 0.1)",
            willChange: "transform",
            transform: "translateZ(0)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background: "#8b4513",
              transform: `translateX(${readPct - 100}%)`,
              willChange: "transform",
              transition: "transform 0.1s ease-out",
            }}
          />
        </div>
      </Affix>

      <style>{`
        *::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        body { -webkit-overflow-scrolling: touch; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; margin:0; padding:0; overscroll-behavior:none; }
        html, body, #root { height:100%; min-height:100dvh; background:#fdf6e3; margin:0; padding:0; width:100%; max-width:100vw; overflow-x:hidden; }
        #root { display:flex; flex-direction:column; }
        .ant-pro-page-container, .ant-pro-grid-content { padding:0 !important; margin:0 !important; width:100% !important; }
        .ant-pro-page-container { min-height:100dvh !important; display:flex !important; flex-direction:column !important; }
        .ant-pro-page-container-children-container { flex:1 !important; margin:0 !important; padding:0 !important; width:100% !important; max-width:100vw !important; }
        .ant-card { background:#fdf6e3; width:100% !important; }
        .ant-pro-card, .ant-pro-card-body { margin:0 !important; padding:0 !important; }
        .jp-prose img {
          border-radius:12px; margin:14px auto; max-width:100%; height:auto;
          box-shadow:0 4px 12px rgba(0,0,0,0.08); border:1px solid rgba(0,0,0,0.06);
          display:block; pointer-events:none; -webkit-user-drag:none; user-select:none;
          transform:translateZ(0); opacity:1; background:rgba(0,0,0,0.05);
          -webkit-backface-visibility:hidden; -webkit-transform:translateZ(0); -webkit-perspective:1000;
        }
        .jp-prose p { margin:0.85em 0; text-align:justify; line-height:1.9; font-size:20px; color:#1f2937; }
        .jp-prose h1 { font-size:1.6em; margin:0.9em 0 0.45em; font-weight:700; color:#111827; }
        .jp-prose h2 { font-size:1.4em; margin:0.85em 0 0.4em; font-weight:700; color:#111827; }
        .jp-prose h3 { font-size:1.25em; margin:0.8em 0 0.3em; font-weight:600; color:#111827; }
        .jp-prose blockquote { border-left:4px solid #e9d5ff; background:#faf5ff; padding:12px 16px; border-radius:8px; margin:1em 0; font-size:1.05em; color:#4b5563; }
        .jp-prose a { color:#9333ea; text-decoration:none; }
        .jp-prose a:hover { text-decoration:underline; }
        .jp-prose ul, .jp-prose ol { padding-left:1.2em; margin:0.8em 0; }
        .jp-prose li { margin:0.4em 0; color:#374151; }
        .jp-prose strong { color:#111827; font-weight:600; }
      `}</style>
    </PageContainer>
  );
}
