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
  MenuOutlined,
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

export default function BlogDetailMobile({
  blog,
  loading,
  translating,
  language,
  setLanguage, // parent truyền xuống, đổi 'ja' | 'en' | 'vi' sẽ trigger dịch
  displayContent, // HTML (JP/EN/VI) render ra
}) {
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem(LS_FONT)) || 16
  );

  // progress đọc (%)
  const [readPct, setReadPct] = useState(0);
  const scrollWrapRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(LS_FONT, String(fontSize));
  }, [fontSize]);

  const increaseFontSize = () => setFontSize((v) => Math.min(v + 2, 24));
  const decreaseFontSize = () => setFontSize((v) => Math.max(v - 2, 14));

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
            zIndex: 10,
          }}
        >
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => navigate("/blog")}
            />
            <Space>
              {/* trạng thái dịch */}
              {translating ? (
                <Tag
                  icon={<LoadingOutlined />}
                  color="processing"
                  style={{ marginRight: 6 }}
                >
                  {language === "vi"
                    ? "Đang dịch"
                    : language === "en"
                    ? "Translating"
                    : "翻訳中"}
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
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
              />
            </Space>
          </Space>
        </div>
      </Affix>
    ),
    [language, translating, navigate, setLanguage]
  );

  // Optimized scroll handler with throttle and cached dimensions
  const onScroll = useCallback(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap) return;

    // Cache scroll dimensions
    let lastTotal = wrap.scrollHeight - wrap.clientHeight;
    let lastScrolled = wrap.scrollTop;
    let lastPct = 0;

    const updateProgress = () => {
      const total = wrap.scrollHeight - wrap.clientHeight;
      const scrolled = wrap.scrollTop;

      // Only update if there's a significant change
      if (
        Math.abs(total - lastTotal) > 1 ||
        Math.abs(scrolled - lastScrolled) > 1
      ) {
        const pct =
          total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;

        // Avoid unnecessary updates
        if (Math.abs(pct - lastPct) > 0.5) {
          setReadPct(pct);
          lastPct = pct;
        }

        lastTotal = total;
        lastScrolled = scrolled;
      }
    };

    // Throttle updates to max 10 times per second
    requestAnimationFrame(() => {
      throttle(updateProgress, 100)();
    });
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
      }}
      style={{ padding: 0, margin: 0, background: "#fff" }}
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
        }}
      >
        <ProCard
          ghost
          style={{ background: "#fff", padding: 0, ...jpFont }}
          bodyStyle={{ padding: "12px 12px 80px", margin: 0 }}
        >
          {/* Translation status is now shown in the header */}

          {/* Title block */}
          <Card
            bordered={false}
            style={{ margin: 0, padding: 0, background: "transparent" }}
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
            }}
            dangerouslySetInnerHTML={{ __html: displayContent || "" }}
          />
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
      <FloatButton.Group shape="square" style={{ right: 12, bottom: 12 }}>
        <FloatButton
          icon={<LeftOutlined />}
          onClick={() => navigate("/blog")}
          tooltip="Quay lại"
        />
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
              background:
                "linear-gradient(90deg, rgba(147,51,234,1) 0%, rgba(99,102,241,1) 100%)",
              transform: `translateX(${readPct - 100}%)`,
              willChange: "transform",
              transition: "transform 0.1s ease-out",
            }}
          />
        </div>
      </Affix>

      {/* Full-bleed overrides */}
      <style>{`
          html, body, #root { height: 100%; background: #fff; }
          body { margin: 0; padding: 0; }
          .ant-pro-page-container { padding-inline: 0 !important; }
          .ant-pro-page-container-children-container,
          .ant-pro-grid-content { margin: 0 !important; padding: 0 !important; }
          .ant-card { background: #fff; }
  
          .jp-prose img {
            border-radius: 12px;
            margin: 14px auto;
            max-width: 100%;
            height: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.06);
            contain: paint;
            content-visibility: auto;
            will-change: transform;
            transform: translateZ(0);
            aspect-ratio: attr(width) / attr(height);
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
