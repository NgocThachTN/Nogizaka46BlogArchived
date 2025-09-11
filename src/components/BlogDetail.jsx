// BlogDetailPro.jsx — React JS + Ant Design Pro (No watermark + Calendar sidebar)
import { useParams, useNavigate } from "react-router-dom";
import {
  PageContainer,
  ProCard,
  StatisticCard,
  ProDescriptions,
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
  Tag,
  Divider,
  FloatButton,
  Calendar,
  Badge,
} from "antd";
import {
  LeftOutlined,
  CalendarOutlined,
  ShareAltOutlined,
  EyeOutlined,
  FontSizeOutlined,
  LinkOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { fetchBlogDetail } from "../services/blogService";

// i18n
const t = {
  back: { ja: "一覧へ戻る", en: "Back to List", vi: "Quay lại Danh sách" },
  loading: { ja: "読み込み中...", en: "Loading...", vi: "Đang tải..." },
  notFound: { ja: "ブログが見つかりません", en: "Blog post not found", vi: "Không tìm thấy bài viết" },
  share: { ja: "シェア", en: "Share", vi: "Chia sẻ" },
  copied: { ja: "リンクをコピーしました", en: "Link copied", vi: "Đã sao chép liên kết" },
  tags: { ja: "タグ", en: "Tags", vi: "Thẻ" },
  author: { ja: "メンバー", en: "Member", vi: "Thành viên" },
  published: { ja: "公開日", en: "Published", vi: "Ngày đăng" },
  readingMode: { ja: "読書モード", en: "Reading Mode", vi: "Chế độ đọc" },
  normalMode: { ja: "通常モード", en: "Normal Mode", vi: "Bình thường" },
  nextPost: { ja: "次の記事", en: "Next Post", vi: "Bài tiếp theo" },
  openSource: { ja: "元ページ", en: "Original", vi: "Trang gốc" },
  toc: { ja: "目次", en: "Contents", vi: "Mục lục" },
  readTime: { ja: "読了目安", en: "Read time", vi: "Thời gian đọc" },
};

const { Title, Text } = Typography;
dayjs.locale("ja");

const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

const FONT_SIZES = { sm: 16, md: 18, lg: 20 };

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("ja");
  const [readingMode, setReadingMode] = useState(true);
  const [fontSizeKey, setFontSizeKey] = useState("md");
  const contentRef = useRef(null);

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      message.success(t.copied[language]);
    } catch {
      message.info(window.location.href);
    }
  };

  const onBack = () => navigate("/blog");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchBlogDetail(id);
        setBlog(data);
      } catch (e) {
        console.error("Error loading blog:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Build TOC + plain text for read time
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

  // ~600 JP chars/min
  const readMinutes = useMemo(() => {
    const n = plainText.length || 0;
    return Math.max(1, Math.ceil(n / 600));
  }, [plainText]);

  // Parse blog date once
  const blogDay = useMemo(() => {
    if (!blog?.date) return null;
    const d = dayjs(blog.date);
    return d.isValid() ? d : null;
  }, [blog?.date]);

  if (loading) {
    return (
      <PageContainer header={{ title: t.loading[language] }}>
        <Card style={{ border: "none" }}>
          <Spin size="large" />
        </Card>
      </PageContainer>
    );
  }

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

  const fontPx = FONT_SIZES[fontSizeKey] || FONT_SIZES.md;

  return (
    <PageContainer
      header={{
        title: (
          <Space direction="vertical" size={2} style={jpFont}>
            <Text type="secondary" style={{ letterSpacing: 2 }}>ブログ記事</Text>
            <Title level={2} style={{ margin: 0, lineHeight: 1.25 }}>{blog.title}</Title>
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
          <Tooltip key="mode" title={readingMode ? t.normalMode[language] : t.readingMode[language]}>
            <Button
              icon={<EyeOutlined />}
              type={readingMode ? "primary" : "default"}
              onClick={() => setReadingMode(v => !v)}
            />
          </Tooltip>,
          <Select
            key="font"
            value={fontSizeKey}
            onChange={setFontSizeKey}
            style={{ width: 140 }}
            options={[
              { value: "sm", label: "字小さめ" },
              { value: "md", label: "標準" },
              { value: "lg", label: "字大きめ" },
            ]}
            suffixIcon={<FontSizeOutlined />}
          />,
          <Button key="share" icon={<ShareAltOutlined />} onClick={onShare}>
            {t.share[language]}
          </Button>,
          <Button key="back" icon={<LeftOutlined />} onClick={onBack}>
            {t.back[language]}
          </Button>,
        ],
      }}
      // ❌ No watermark anymore
      token={{ colorBgPageContainer: readingMode ? "#fafafa" : undefined }}
    >
      <ProCard ghost gutter={[16, 16]} wrap>
        {/* Main content */}
        <ProCard colSpan={{ xs: 24, md: 16, xl: 17 }} ghost>
          <Card style={{ borderRadius: 16, ...jpFont }} bodyStyle={{ padding: readingMode ? 32 : 24 }}>
            <Space size={16} align="center" style={{ marginBottom: 12 }}>
              <Avatar
                src={
                  blog.memberImage ||
                  "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg"
                }
                size={64}
              />
              <div>
                <Text strong style={{ fontSize: 16 }}>{blog.author}</Text>
                <div style={{ color: "#666", marginTop: 2 }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  <Text>{blog.date}</Text>
                </div>
              </div>
            </Space>

            <Divider style={{ margin: "12px 0 20px" }} />

            {/* Content */}
            <div
              ref={contentRef}
              className="jp-prose"
              style={{
                fontSize: fontPx,
                lineHeight: readingMode ? 1.95 : 1.8,
                letterSpacing: 0.2,
              }}
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </Card>

          {/* Bottom nav */}
          <Space style={{ marginTop: 16 }}>
            <Button icon={<LeftOutlined />} onClick={onBack}>{t.back[language]}</Button>
            {blog.nextPost && (
              <Button type="primary" onClick={() => navigate(`/blog/${blog.nextPost.id}`)}>
                {t.nextPost[language]}
              </Button>
            )}
            {blog.originalUrl && (
              <Button icon={<LinkOutlined />} onClick={() => window.open(blog.originalUrl, "_blank")}>
                {t.openSource[language]}
              </Button>
            )}
          </Space>
        </ProCard>

        {/* Side column with Calendar */}
        <ProCard colSpan={{ xs: 24, md: 8, xl: 7 }} ghost direction="column" gutter={[16, 16]}>
          <StatisticCard
            style={{ borderRadius: 16 }}
            statistic={{ title: t.readTime[language], value: `${readMinutes} 分` }}
          />

          <Card title="カレンダー" style={{ borderRadius: 16 }}>
            <Calendar
              fullscreen={false}
              value={blogDay || dayjs()}
              // highlight the blog date cell
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
                      background: isBlogDay ? "rgba(109, 40, 217, 0.12)" : undefined,
                      border: isBlogDay ? "1px solid rgba(109,40,217,0.35)" : "1px solid transparent",
                    }}
                  >
                    {value.date()}
                  </div>
                );
              }}
              // little dot badge on the blog day
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

          <Card title={t.tags[language]} style={{ borderRadius: 16 }}>
            <Space wrap>
              <Tag color="purple">ブログ</Tag>
              {blog.tags?.map((tag, i) => (
                <Tag key={i} bordered>{tag}</Tag>
              ))}
            </Space>
          </Card>

          {/* TOC */}
          {toc.length > 0 && (
            <Card title={t.toc[language]} style={{ borderRadius: 16 }}>
              <Space direction="vertical" style={{ width: "100%" }} size={6}>
                {toc.map((h) => (
                  <Button
                    key={h.id}
                    type="text"
                    style={{
                      justifyContent: "flex-start",
                      paddingLeft: h.level === "H1" ? 0 : h.level === "H2" ? 8 : 16,
                      ...jpFont,
                    }}
                    onClick={() => {
                      const el = document.getElementById(h.id);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {h.text}
                  </Button>
                ))}
              </Space>
            </Card>
          )}

          {/* Member mini card */}
          <ProDescriptions title={t.author[language]} column={1} style={{ borderRadius: 16 }}>
            <ProDescriptions.Item label="">
              <Space>
                <Avatar
                  src={
                    blog.memberImage ||
                    "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg"
                  }
                  size={48}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{blog.author}</div>
                  <div style={{ color: "#999", marginTop: 4 }}>
                    {t.published[language]}: {blog.date}
                  </div>
                </div>
              </Space>
            </ProDescriptions.Item>
          </ProDescriptions>
        </ProCard>
      </ProCard>

      {/* Back to top */}
      <FloatButton.BackTop icon={<ArrowUpOutlined />} />

      {/* Minimal JP prose styles */}
      <style>{`
        .jp-prose h1 { font-size: 1.8em; margin: 0.8em 0 0.5em; font-weight: 700; }
        .jp-prose h2 { font-size: 1.5em; margin: 0.9em 0 0.5em; font-weight: 700; }
        .jp-prose h3 { font-size: 1.25em; margin: 0.9em 0 0.4em; font-weight: 700; }
        .jp-prose p { color: #374151; margin: 0.6em 0; text-align: justify; }
        .jp-prose a { color: #6b21a8; text-decoration: none; }
        .jp-prose a:hover { text-decoration: underline; }
        .jp-prose img { border-radius: 12px; display: block; margin: 16px auto; max-width: 100%; }
        .jp-prose blockquote { border-left: 3px solid #e9d5ff; background: #faf5ff; padding: 8px 12px; border-radius: 8px; color: #4b5563; }
        .jp-prose strong { color: #111827; }
        .jp-prose ruby { font-size: 0.95em; }
        .jp-prose rt { font-size: 0.65em; color: #6b7280; }
        .jp-prose ul { padding-left: 1.2em; }
        .jp-prose ol { padding-left: 1.2em; }
        .jp-prose code { background: #f5f5f5; border-radius: 6px; padding: 0 6px; }
      `}</style>
    </PageContainer>
  );
}
