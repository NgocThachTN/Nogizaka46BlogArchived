// BlogDetailPro.jsx — React JS + Ant Design Pro + DeepSeek Translate
import { useParams, useNavigate } from "react-router-dom";
import {
  PageContainer,
  ProCard,
  StatisticCard,
} from "@ant-design/pro-components";
import {
  Card,
  Typography,
  Space,
  Button,
  Spin,
  Avatar,
  Select,
  Tooltip,
  message,
  Divider,
  FloatButton,
  Calendar,
  Badge,
  Segmented,
} from "antd";
import {
  LeftOutlined,
  CalendarOutlined,
  ShareAltOutlined,
  EyeOutlined,
  LinkOutlined,
  ArrowUpOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { fetchBlogDetail } from "../services/blogService";
import BlogDetailMobile from "./BlogDetailMobile";

// ⚠️ IMPORT DeepSeek helpers bạn đã viết
// đổi path cho đúng chỗ bạn lưu file dịch:
import {
  translateJapaneseToEnglish,
  translateJapaneseToVietnamese,
} from "../api/GeminiTranslate";

const { Title, Text } = Typography;
dayjs.locale("ja");

const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

// size preset — big for JP reading
const SIZE_PRESETS = {
  sm: { px: 16, lh: 1.85, h1: 1.9, h2: 1.6, h3: 1.35 },
  md: { px: 20, lh: 2.0, h1: 2.0, h2: 1.7, h3: 1.45 },
  lg: { px: 24, lh: 2.1, h1: 2.15, h2: 1.85, h3: 1.6 },
  xl: { px: 28, lh: 2.2, h1: 2.35, h2: 2.0, h3: 1.7 },
  xxl: { px: 32, lh: 2.3, h1: 2.55, h2: 2.15, h3: 1.85 },
};

const t = {
  back: { ja: "一覧へ戻る", en: "Back to List", vi: "Quay lại Danh sách" },
  loading: { ja: "読み込み中...", en: "Loading...", vi: "Đang tải..." },
  notFound: {
    ja: "ブログが見つかりません",
    en: "Blog post not found",
    vi: "Không tìm thấy bài viết",
  },
  share: { ja: "シェア", en: "Share", vi: "Chia sẻ" },
  copied: {
    ja: "リンクをコピーしました",
    en: "Link copied",
    vi: "Đã sao chép liên kết",
  },
  nextPost: { ja: "次の記事", en: "Next Post", vi: "Bài tiếp theo" },
  openSource: { ja: "元ページ", en: "Original", vi: "Trang gốc" },
  toc: { ja: "目次", en: "Contents", vi: "Mục lục" },
  readTime: { ja: "読了目安", en: "Read time", vi: "Thời gian đọc" },
};

const LS_KEY_SIZE = "blog:jpFontSize";
const LS_KEY_TR_EN = "blog:tr:en";
const LS_KEY_TR_VI = "blog:tr:vi";
const LS_KEY_TTL_EN = "blog:trttl:en";
const LS_KEY_TTL_VI = "blog:trttl:vi";

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState("ja");
  const [readingMode, setReadingMode] = useState(true);
  const [fontSizeKey, setFontSizeKey] = useState(
    () => localStorage.getItem(LS_KEY_SIZE) || "md"
  );

  // translated caches
  const [trHtml, setTrHtml] = useState({ en: "", vi: "" });
  const [trTitle, setTrTitle] = useState({ en: "", vi: "" });
  const [translating, setTranslating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const contentRef = useRef(null);

  // Hàm để làm sạch kết quả hiển thị
  const cleanDisplayText = (text) => {
    if (!text) return "";
    return text
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .trim();
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      message.success(t.copied[language]);
    } catch {
      message.info(window.location.href);
    }
  };
  const onBack = () => navigate("/blog");

  // load blog
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchBlogDetail(id);
        console.log("Blog data loaded:", data); // Debug log
        if (!data) {
          message.error("Không thể tải nội dung blog. Vui lòng thử lại sau.");
          return;
        }
        if (!data.content) {
          message.warning("Blog không có nội dung.");
        }
        setBlog(data);
      } catch (e) {
        console.error("Error loading blog:", e);
        message.error("Lỗi khi tải blog: " + (e.message || "Không xác định"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // persist size
  useEffect(() => {
    localStorage.setItem(LS_KEY_SIZE, fontSizeKey);
  }, [fontSizeKey]);

  // table of contents & readtime
  const { toc, plainText } = useMemo(() => {
    if (!blog?.content) return { toc: [], plainText: "" };
    const temp = document.createElement("div");
    temp.innerHTML = blog.content;
    const headings = Array.from(temp.querySelectorAll("h1, h2, h3"));
    const list = headings.map((h, i) => {
      if (!h.id) h.id = `h-${i}-${(h.textContent || "").slice(0, 16)}`;
      return { id: h.id, text: h.textContent || "", level: h.tagName };
    });
    return { toc: list, plainText: temp.textContent || "" };
  }, [blog?.content]);

  const readMinutes = useMemo(() => {
    const n = plainText.length || 0;
    return Math.max(1, Math.ceil(n / 600));
  }, [plainText]);

  const blogDay = useMemo(() => {
    if (!blog?.date) return null;
    const d = dayjs(blog.date);
    return d.isValid() ? d : null;
  }, [blog?.date]);

  // Translate when language changes
  useEffect(() => {
    (async () => {
      if (!blog?.content || language === "ja") return;

      console.log("Starting translation for:", {
        language,
        contentLength: blog.content.length,
        title: blog.title,
      });

      // try get from localStorage cache per post id
      const keyHtml =
        (language === "en" ? LS_KEY_TR_EN : LS_KEY_TR_VI) + `:${id}`;
      const keyTtl =
        (language === "en" ? LS_KEY_TTL_EN : LS_KEY_TTL_VI) + `:${id}`;
      const cachedHtml = localStorage.getItem(keyHtml);
      const cachedTtl = localStorage.getItem(keyTtl);

      if (cachedHtml && cachedTtl) {
        console.log("Using cached translation");
        setTrHtml((s) => ({ ...s, [language]: cachedHtml }));
        setTrTitle((s) => ({ ...s, [language]: cachedTtl }));
        return;
      }

      try {
        setTranslating(true);
        console.log("Translating content...");

        // Translate title first
        const titleOut =
          language === "en"
            ? await translateJapaneseToEnglish(blog.title || "")
            : await translateJapaneseToVietnamese(blog.title || "");

        console.log("Title translated:", titleOut);

        // Đăng ký callback để cập nhật nội dung theo từng phần
        let translatedContent = "";
        const updateProgress = (translatedChunk, isLast) => {
          if (!translatedChunk) return;

          // Làm sạch chunk trước khi thêm vào
          const cleanedChunk = translatedChunk
            .replace(/```html/g, "")
            .replace(/```/g, "")
            .trim();

          translatedContent += cleanedChunk;
          setTrHtml((prevState) => {
            const newState = { ...prevState };
            newState[language] = translatedContent; // Sử dụng toàn bộ nội dung đã dịch sạch

            if (isLast) {
              localStorage.setItem(keyHtml, translatedContent);
              message.success("Dịch thành công!");
            }

            return newState;
          });
        };

        // Then translate content
        console.log("Starting content translation...");
        await (language === "en"
          ? translateJapaneseToEnglish(blog.content, updateProgress)
          : translateJapaneseToVietnamese(blog.content, updateProgress));

        console.log("Content translated, length:", translatedContent.length);

        // Kiểm tra kết quả dịch tiêu đề
        const safeTtl = (titleOut || "").trim();
        if (!safeTtl) {
          throw new Error("Không nhận được kết quả dịch tiêu đề");
        }

        // Lưu tiêu đề đã dịch
        setTrTitle((s) => ({ ...s, [language]: safeTtl }));
        localStorage.setItem(keyTtl, safeTtl);

        message.success("Dịch thành công!");
      } catch (err) {
        console.error("Translation failed:", err);
        message.error(err.message || "Lỗi dịch. Vui lòng thử lại sau.");
        // Giữ nguyên nội dung đã dịch được (nếu có)
      } finally {
        setTranslating(false);
      }
    })();
  }, [language, blog?.content, blog?.title, id]);

  // Pick title/content by language
  const displayTitle =
    language === "ja"
      ? blog?.title
      : cleanDisplayText(trTitle[language]) || blog?.title;

  const displayContent =
    language === "ja" || !trHtml[language]
      ? blog?.content
      : cleanDisplayText(trHtml[language]);

  // Render mobile view
  if (isMobile) {
    return (
      <BlogDetailMobile
        blog={blog}
        loading={loading}
        translating={translating}
        language={language}
        setLanguage={setLanguage}
        displayTitle={displayTitle}
        displayContent={displayContent}
      />
    );
  }

  // Desktop loading state
  if (loading) {
    return (
      <PageContainer header={{ title: t.loading[language] }}>
        <Card style={{ border: "none" }}>
          <Spin size="large" />
        </Card>
      </PageContainer>
    );
  }

  // Desktop not found state
  if (!blog) {
    return (
      <PageContainer header={{ title: t.notFound[language] }}>
        <Card style={{ textAlign: "center" }}>
          <Title level={4}>{t.notFound[language]}</Title>
          <Button type="primary" onClick={onBack} icon={<LeftOutlined />}>
            {t.back[language]}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const sz = SIZE_PRESETS[fontSizeKey] || SIZE_PRESETS.md;

  return (
    <PageContainer
      header={{
        title: (
          <Space direction="vertical" size={2} style={jpFont}>
            <Text type="secondary" style={{ letterSpacing: 2 }}>
              ブログ記事
            </Text>
            <Title level={2} style={{ margin: 0, lineHeight: 1.25 }}>
              {displayTitle}
            </Title>
          </Space>
        ),
        extra: [
          <Select
            key="lang"
            value={language}
            onChange={setLanguage}
            style={{ width: 120 }}
            options={[
              { value: "ja", label: "日本語" },
              { value: "en", label: "English" },
              { value: "vi", label: "Tiếng Việt" },
            ]}
          />,
          <Tooltip key="mode" title={readingMode ? "通常モード" : "読書モード"}>
            <Button
              icon={<EyeOutlined />}
              type={readingMode ? "default" : "primary"}
              onClick={() => setReadingMode((v) => !v)}
            />
          </Tooltip>,
          <Segmented
            key="seg-size"
            options={[
              { label: "小", value: "sm" },
              { label: "標準", value: "md" },
              { label: "大", value: "lg" },
              { label: "特大", value: "xl" },
              { label: "特特大", value: "xxl" },
            ]}
            value={fontSizeKey}
            onChange={(v) => setFontSizeKey(v)}
            style={{ marginLeft: 8 }}
          />,
          <Button key="share" icon={<ShareAltOutlined />} onClick={onShare}>
            {t.share[language]}
          </Button>,
          <Button key="back" icon={<LeftOutlined />} onClick={onBack}>
            {t.back[language]}
          </Button>,
        ],
      }}
      token={{ colorBgPageContainer: readingMode ? "#fafafa" : undefined }}
    >
      <ProCard ghost gutter={[16, 16]} wrap>
        {/* Main content */}
        <ProCard colSpan={{ xs: 24, md: 16, xl: 17 }} ghost>
          <Card
            style={{ borderRadius: 16, ...jpFont }}
            bodyStyle={{ padding: readingMode ? 32 : 24, position: "relative" }}
          >
            {/* small overlay spinner when translating */}
            {translating && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                  borderRadius: 16,
                }}
              >
                <Space>
                  <LoadingOutlined />
                  <span>
                    {language === "vi"
                      ? "Đang dịch..."
                      : language === "en"
                      ? "Translating..."
                      : "翻訳中..."}
                  </span>
                </Space>
              </div>
            )}

            <Space
              size={window.innerWidth < 768 ? 12 : 16}
              align="center"
              style={{
                marginBottom: window.innerWidth < 768 ? 8 : 12,
                width: "100%",
                justifyContent:
                  window.innerWidth < 768 ? "center" : "flex-start",
              }}
            >
              <Avatar
                src={
                  blog.memberImage ||
                  "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg"
                }
                size={window.innerWidth < 768 ? 56 : 64}
                style={{
                  border: "2px solid #fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <div
                style={{
                  textAlign: window.innerWidth < 768 ? "center" : "left",
                }}
              >
                <Text
                  strong
                  style={{ fontSize: window.innerWidth < 768 ? 15 : 16 }}
                >
                  {blog.author}
                </Text>
                <div
                  style={{
                    color: "#666",
                    marginTop: window.innerWidth < 768 ? 1 : 2,
                    fontSize: window.innerWidth < 768 ? 13 : 14,
                  }}
                >
                  <CalendarOutlined style={{ marginRight: 6 }} />
                  <Text>{blog.date}</Text>
                </div>
              </div>
            </Space>

            <Divider style={{ margin: "12px 0 20px" }} />

            {/* Content (JP/Translated) */}
            <div
              ref={contentRef}
              className="jp-prose"
              style={{
                fontSize: sz.px,
                lineHeight: sz.lh,
                letterSpacing: 0.3,
              }}
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          </Card>

          {/* Bottom nav */}
          <div
            style={{
              marginTop: window.innerWidth < 768 ? 12 : 16,
              display: "flex",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              gap: window.innerWidth < 768 ? "8px" : "12px",
            }}
          >
            <Button
              icon={<LeftOutlined />}
              onClick={onBack}
              style={{
                width: window.innerWidth < 768 ? "100%" : "auto",
                height: window.innerWidth < 768 ? "36px" : "32px",
              }}
            >
              {t.back[language]}
            </Button>
            {blog.nextPost && (
              <Button
                type="primary"
                onClick={() => navigate(`/blog/${blog.nextPost.id}`)}
                style={{
                  width: window.innerWidth < 768 ? "100%" : "auto",
                  height: window.innerWidth < 768 ? "36px" : "32px",
                }}
              >
                {t.nextPost[language]}
              </Button>
            )}
            {blog.originalUrl && (
              <Button
                icon={<LinkOutlined />}
                onClick={() => window.open(blog.originalUrl, "_blank")}
                style={{
                  width: window.innerWidth < 768 ? "100%" : "auto",
                  height: window.innerWidth < 768 ? "36px" : "32px",
                }}
              >
                {t.openSource[language]}
              </Button>
            )}
          </div>
        </ProCard>

        {/* Sidebar */}
        <ProCard
          colSpan={{ xs: 24, md: 8, xl: 7 }}
          ghost
          direction="column"
          gutter={[16, 16]}
        >
          <StatisticCard
            style={{ borderRadius: 16 }}
            statistic={{
              title: t.readTime[language],
              value: `${readMinutes} 分`,
            }}
          />

          <Card title="カレンダー" style={{ borderRadius: 16 }}>
            <Calendar
              fullscreen={false}
              value={blogDay || dayjs()}
              dateFullCellRender={(value) => {
                const isBlogDay = blogDay && value.isSame(blogDay, "date");
                return (
                  <div
                    style={{
                      height: 32,
                      lineHeight: "32px",
                      textAlign: "center",
                      borderRadius: 8,
                      fontWeight: isBlogDay ? 700 : 500,
                      background: isBlogDay
                        ? "rgba(109, 40, 217, 0.12)"
                        : undefined,
                      border: isBlogDay
                        ? "1px solid rgba(109,40,217,0.35)"
                        : "1px solid transparent",
                    }}
                  >
                    {value.date()}
                  </div>
                );
              }}
              cellRender={(current) => {
                const isBlogDay = blogDay && current.isSame(blogDay, "date");
                if (isBlogDay) {
                  return (
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", top: 2, right: 6 }}>
                        <Badge status="processing" />
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </Card>

          {toc.length > 0 && (
            <Card title={t.toc[language]} style={{ borderRadius: 16 }}>
              <Space direction="vertical" style={{ width: "100%" }} size={6}>
                {toc.map((h) => (
                  <Button
                    key={h.id}
                    type="text"
                    style={{
                      justifyContent: "flex-start",
                      paddingLeft:
                        h.level === "H1" ? 0 : h.level === "H2" ? 8 : 16,
                      ...jpFont,
                    }}
                    onClick={() => {
                      const el = document.getElementById(h.id);
                      if (el)
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                  >
                    {h.text}
                  </Button>
                ))}
              </Space>
            </Card>
          )}
        </ProCard>
      </ProCard>

      <FloatButton.BackTop
        icon={<ArrowUpOutlined />}
        style={{
          width: window.innerWidth < 768 ? 40 : 44,
          height: window.innerWidth < 768 ? 40 : 44,
          right: window.innerWidth < 768 ? 16 : 24,
          bottom: window.innerWidth < 768 ? 16 : 24,
        }}
      />

      {/* prose base */}
      <style>{`
        .jp-prose h1 { 
          font-weight: 700; 
          margin: ${
            window.innerWidth < 768 ? "0.7em 0 0.4em" : "0.9em 0 0.6em"
          }; 
          letter-spacing: ${window.innerWidth < 768 ? "-0.02em" : "normal"};
        }
        .jp-prose h2 { 
          font-weight: 700; 
          margin: ${
            window.innerWidth < 768 ? "0.7em 0 0.4em" : "0.9em 0 0.5em"
          }; 
          letter-spacing: ${window.innerWidth < 768 ? "-0.01em" : "normal"};
        }
        .jp-prose h3 { 
          font-weight: 700; 
          margin: ${
            window.innerWidth < 768 ? "0.7em 0 0.3em" : "0.9em 0 0.4em"
          };
        }
        .jp-prose p { 
          color: #374151; 
          margin: ${window.innerWidth < 768 ? "0.6em 0" : "0.75em 0"}; 
          text-align: justify; 
          line-height: ${window.innerWidth < 768 ? "1.6" : "inherit"};
        }
        .jp-prose a { 
          color: #6b21a8; 
          text-decoration: none;
          padding: ${window.innerWidth < 768 ? "2px 0" : "0"}; 
        }
        .jp-prose a:hover { text-decoration: underline; }
        .jp-prose img { 
          border-radius: ${window.innerWidth < 768 ? "8px" : "12px"}; 
          display: block; 
          margin: ${window.innerWidth < 768 ? "12px" : "16px"} auto; 
          max-width: 100%; 
          height: auto;
          box-shadow: ${
            window.innerWidth < 768
              ? "0 2px 6px rgba(0,0,0,0.1)"
              : "0 4px 12px rgba(0,0,0,0.1)"
          };
          border: 1px solid rgba(0,0,0,0.1);
        }
        .jp-prose img:active {
          transform: ${window.innerWidth < 768 ? "scale(0.98)" : "none"};
          transition: transform 0.2s ease;
        }
        .jp-prose blockquote { 
          border-left: 3px solid #e9d5ff; 
          background: #faf5ff; 
          padding: ${window.innerWidth < 768 ? "6px 10px" : "8px 12px"}; 
          border-radius: ${window.innerWidth < 768 ? "6px" : "8px"}; 
          color: #4b5563;
          font-size: ${window.innerWidth < 768 ? "0.95em" : "1em"};
        }
        .jp-prose strong { color: #111827; }
        .jp-prose ul, .jp-prose ol { 
          padding-left: ${window.innerWidth < 768 ? "1em" : "1.2em"}; 
          margin: ${window.innerWidth < 768 ? "0.5em 0" : "0.75em 0"};
        }
        .jp-prose li { 
          margin: ${window.innerWidth < 768 ? "0.3em 0" : "0.5em 0"};
        }
        .jp-prose code { 
          background: #f5f5f5; 
          border-radius: ${window.innerWidth < 768 ? "4px" : "6px"}; 
          padding: ${window.innerWidth < 768 ? "0 4px" : "0 6px"};
          font-size: ${window.innerWidth < 768 ? "0.9em" : "1em"};
        }
      `}</style>
      {/* dynamic heading scale */}
      <style>{`
        .jp-prose h1 { 
          font-size: ${
            window.innerWidth < 768
              ? SIZE_PRESETS[fontSizeKey].h1 * 0.85
              : SIZE_PRESETS[fontSizeKey].h1
          }em; 
        }
        .jp-prose h2 { 
          font-size: ${
            window.innerWidth < 768
              ? SIZE_PRESETS[fontSizeKey].h2 * 0.85
              : SIZE_PRESETS[fontSizeKey].h2
          }em; 
        }
        .jp-prose h3 { 
          font-size: ${
            window.innerWidth < 768
              ? SIZE_PRESETS[fontSizeKey].h3 * 0.85
              : SIZE_PRESETS[fontSizeKey].h3
          }em; 
        }
      `}</style>
    </PageContainer>
  );
}
