// BlogDetailPro.jsx — Ant Design Pro • Ultra-fast Prev/Next (cache-first, prefetch, transition)
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
  LinkOutlined,
  ArrowUpOutlined,
  LoadingOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useTransition,
} from "react";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import {
  fetchBlogDetail,
  fetchAllBlogs,
  fetchMemberInfo,
  fetchMemberInfoByName,
  getImageUrl,
  getCachedBlogDetail,
  prefetchBlogDetail,
} from "../services/blogService";
import BlogDetailMobile from "./BlogDetailMobile";
import BlogCalendar from "./BlogCalendar";
import {
  translateJapaneseToEnglish,
  translateJapaneseToVietnamese,
  translateTitleToVietnamese,
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
  prevPost: { ja: "前の記事", en: "Previous", vi: "Bài trước" },
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
  const [memberInfo, setMemberInfo] = useState(null);
  const [memberBlogs, setMemberBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState("ja");
  const [readingMode, _SET_READING_MODE] = useState(true);
  const [fontSizeKey, setFontSizeKey] = useState(
    () => localStorage.getItem(LS_KEY_SIZE) || "md"
  );

  // translated caches
  const [trHtml, setTrHtml] = useState({ en: "", vi: "" });
  const [trTitle, setTrTitle] = useState({ en: "", vi: "" });
  const [translating, setTranslating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [navIds, setNavIds] = useState({ prevId: null, nextId: null });
  const [navLock, setNavLock] = useState(false);
  const [pendingNavId, setPendingNavId] = useState(null); // hiển thị spinner nhỏ ở header khi chưa có cache
  const [_IS_PENDING, startTransition] = useTransition();

  const contentRef = useRef(null);
  const currentBlogIdRef = useRef(id); // Track current blog ID for translation cancellation

  // cleanup helpers
  const cleanDisplayText = (text) =>
    (text || "")
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .trim();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset translation state when blog changes
  useEffect(() => {
    if (currentBlogIdRef.current !== id) {
      // Blog changed - reset all translation state
      setTranslating(false);
      setTrHtml({ en: "", vi: "" });
      setTrTitle({ en: "", vi: "" });
      currentBlogIdRef.current = id;
    }
  }, [id]);

  // Back
  const onBack = () => {
    const backTo = blog?.memberCode ? `/blogs/${blog.memberCode}` : "/";
    navigate(backTo);
  };

  // Share
  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      message.success(t.copied[language]);
    } catch {
      message.info(window.location.href);
    }
  };

  // load blog (cache-first then revalidate)
  useEffect(() => {
    (async () => {
      try {
        const cached = getCachedBlogDetail(id);
        if (cached) {
          setBlog(cached);
          setLoading(false);
        } else {
          setLoading(true);
        }

        const data = await fetchBlogDetail(id);
        if (!data) {
          message.error("Không thể tải nội dung blog. Vui lòng thử lại sau.");
          return;
        }
        if (!data.content) {
          message.warning("Blog không có nội dung.");
        }
        setBlog(data);

        // Member info
        let member = null;
        if (data.memberCode) member = await fetchMemberInfo(data.memberCode);
        if (!member && data.author)
          member = await fetchMemberInfoByName(data.author);
        setMemberInfo(member);

        // Fetch member blogs for calendar
        if (member?.code) {
          try {
            const blogs = await fetchAllBlogs(member.code);
            setMemberBlogs(blogs || []);
          } catch (e) {
            console.error("Failed to fetch member blogs:", e);
          }
        }
      } catch (e) {
        console.error("Error loading blog:", e);
        message.error("Lỗi khi tải blog.");
      } finally {
        setLoading(false);
        setPendingNavId(null);
        setNavLock(false);
      }
    })();
  }, [id]);

  // persist size
  useEffect(() => {
    localStorage.setItem(LS_KEY_SIZE, fontSizeKey);
  }, [fontSizeKey]);

  // Compute prev/next ids
  useEffect(() => {
    (async () => {
      try {
        if (!blog?.id) return;

        let code = blog?.memberCode;
        if (!code && blog?.author) {
          const m = await fetchMemberInfoByName(blog.author);
          code = m?.code;
        }
        if (!code) return;

        const list = await fetchAllBlogs(code);
        if (!Array.isArray(list) || list.length === 0) return;

        const index = list.findIndex((b) => String(b.id) === String(blog.id));
        if (index === -1) return;

        const nextNewer = index > 0 ? list[index - 1]?.id : null; // Next
        const prevOlder = index < list.length - 1 ? list[index + 1]?.id : null; // Prev
        setNavIds({ prevId: prevOlder || null, nextId: nextNewer || null });

        // Prefetch neighbors
        if (prevOlder) prefetchBlogDetail(prevOlder);
        if (nextNewer) prefetchBlogDetail(nextNewer);
      } catch (e) {
        console.error("Failed to compute prev/next", e);
      }
    })();
  }, [blog?.memberCode, blog?.author, blog?.id]);

  // TOC & read time
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

  // Translate when language changes
  useEffect(() => {
    (async () => {
      if (!blog?.content || language === "ja") return;

      // Check if blog ID changed during translation
      const currentBlogId = id;

      const keyHtml =
        (language === "en" ? LS_KEY_TR_EN : LS_KEY_TR_VI) + `:${currentBlogId}`;
      const keyTtl =
        (language === "en" ? LS_KEY_TTL_EN : LS_KEY_TTL_VI) +
        `:${currentBlogId}`;
      const cachedHtml = localStorage.getItem(keyHtml);
      const cachedTtl = localStorage.getItem(keyTtl);

      if (cachedHtml && cachedTtl) {
        // Check if blog ID is still the same before setting cached content
        if (currentBlogId === id) {
          setTrHtml((s) => ({ ...s, [language]: cachedHtml }));
          setTrTitle((s) => ({ ...s, [language]: cachedTtl }));
        }
        return;
      }

      try {
        setTranslating(true);

        // Check if blog ID changed before starting translation
        if (currentBlogId !== id) {
          setTranslating(false);
          return;
        }

        // Translate title
        let titleOut = "";
        if (language === "en") {
          titleOut = await translateJapaneseToEnglish(blog.title || "");
        } else {
          titleOut = await translateTitleToVietnamese(blog.title || "");
        }

        // Check if blog ID changed after title translation
        if (currentBlogId !== id) {
          setTranslating(false);
          return;
        }

        // Chunk callback
        let translatedContent = "";
        const updateProgress = (translatedChunk, isLast) => {
          if (!translatedChunk) return;

          // Check if blog ID changed during translation
          if (currentBlogId !== id) return;

          const cleaned = translatedChunk
            .replace(/```html/g, "")
            .replace(/```/g, "")
            .trim();
          translatedContent += cleaned;

          if (isLast && currentBlogId === id) {
            setTrHtml((prev) => ({ ...prev, [language]: translatedContent }));
            localStorage.setItem(keyHtml, translatedContent);
          }
        };

        // Translate content
        if (language === "en") {
          await translateJapaneseToEnglish(blog.content, updateProgress);
        } else {
          await translateJapaneseToVietnamese(blog.content, updateProgress);
        }

        // Final check before setting results
        if (currentBlogId === id) {
          const safeTtl = (titleOut || "").trim();
          if (safeTtl) {
            setTrTitle((s) => ({ ...s, [language]: safeTtl }));
            localStorage.setItem(keyTtl, safeTtl);
          }
          message.success("Dịch thành công!");
        }
      } catch (err) {
        console.error("Translation failed:", err);
        if (currentBlogId === id) {
          message.error("Lỗi dịch. Vui lòng thử lại sau.");
        }
      } finally {
        if (currentBlogId === id) {
          setTranslating(false);
        }
      }
    })();
  }, [language, blog?.content, blog?.title, id]);

  // Display title/content by language
  const displayTitle =
    language === "ja"
      ? blog?.title
      : cleanDisplayText(trTitle[language]) || blog?.title;

  const displayContent =
    language === "ja" || translating || !trHtml[language]
      ? blog?.content
      : cleanDisplayText(trHtml[language]);

  // ---- SPEED-FOCUSED NAVIGATION ----
  const fastGo = useCallback(
    (targetId) => {
      if (!targetId || navLock) return;
      setNavLock(true);

      const cachedNext = getCachedBlogDetail(targetId);

      // Có cache → render ngay (optimistic)
      if (cachedNext) {
        setPendingNavId(null);
        setBlog(cachedNext);
        // cuộn lên đầu để cảm giác chuyển trang tức thì
        window.scrollTo({ top: 0, behavior: "instant" });
        // điều hướng "nhẹ" để đồng bộ URL nhưng không chặn UI
        startTransition(() => navigate(`/blog/${targetId}`));
        // prefetch hàng xóm của target để lần sau nhanh
        prefetchBlogDetail(targetId);
        // Thả khoá nhẹ
        setTimeout(() => setNavLock(false), 180);
        return;
      }

      // Chưa có cache → hiển thị spinner nhỏ ở header, vẫn phản hồi ngay lập tức
      setPendingNavId(targetId);
      startTransition(() => navigate(`/blog/${targetId}`));
      // fetch nền sẽ setBlog trong effect [id]
      setTimeout(() => setNavLock(false), 280);
    },
    [navigate, navLock, startTransition]
  );

  // prefetch khi hover nút
  const onHoverPrefetch = (postId) => {
    if (postId) prefetchBlogDetail(postId);
  };

  // Keyboard ← →
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft" && navIds.prevId) fastGo(navIds.prevId);
      if (e.key === "ArrowRight" && navIds.nextId) fastGo(navIds.nextId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navIds.prevId, navIds.nextId, fastGo]);

  // Mobile
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
        prevId={navIds.prevId}
        nextId={navIds.nextId}
        fastGo={fastGo}
        pendingNavId={pendingNavId}
        navLock={navLock}
        memberInfo={memberInfo}
      />
    );
  }

  // Desktop loading
  if (loading) {
    return (
      <PageContainer header={{ title: t.loading[language] }}>
        <Card style={{ border: "none" }}>
          <Spin size="large" />
        </Card>
      </PageContainer>
    );
  }

  // Not found
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
        title: "乃木坂46ブログ",
        extra: [
          <Button key="back" icon={<LeftOutlined />} onClick={onBack}>
            {t.back[language]}
          </Button>,

          // PREV
          <Tooltip key="prev" title={t.prevPost[language]}>
            <Button
              icon={<LeftOutlined />}
              onClick={() => fastGo(navIds.prevId)}
              onMouseEnter={() => onHoverPrefetch(navIds.prevId)}
              disabled={!navIds.prevId || navLock}
            />
          </Tooltip>,

          // NEXT (kèm spinner nhỏ nếu đang pending & chưa cache)
          <Tooltip key="next" title={t.nextPost[language]}>
            <Button
              type="primary"
              icon={
                pendingNavId &&
                pendingNavId === navIds.nextId &&
                !getCachedBlogDetail(navIds.nextId) ? (
                  <LoadingOutlined />
                ) : (
                  <RightOutlined />
                )
              }
              onClick={() => fastGo(navIds.nextId)}
              onMouseEnter={() => onHoverPrefetch(navIds.nextId)}
              disabled={!navIds.nextId || navLock}
            />
          </Tooltip>,

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
            {/* Overlay translating */}
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
                  backdropFilter: "blur(1.5px)",
                }}
              >
                <Space direction="vertical" align="center">
                  <Spin indicator={<LoadingOutlined spin />} />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {language === "vi"
                      ? "Đang dịch nội dung..."
                      : language === "en"
                      ? "Translating content..."
                      : "翻訳中..."}
                  </Text>
                </Space>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: window.innerWidth < 768 ? 8 : 12,
                width: "100%",
              }}
            >
              {/* Author Info - Left Side */}
              <Space
                size={window.innerWidth < 768 ? 12 : 16}
                align="center"
                style={{
                  justifyContent:
                    window.innerWidth < 768 ? "center" : "flex-start",
                }}
              >
                <Avatar
                  src={
                    getImageUrl(memberInfo?.img) ||
                    getImageUrl(blog?.memberImage) ||
                    "https://via.placeholder.com/300x300?text=No+Image"
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
                    {memberInfo?.name || blog.author}
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

              {/* Blog Title - Right Side */}
              <div
                style={{
                  textAlign: "right",
                  maxWidth: "50%",
                  minWidth: 0,
                }}
              >
                <Space direction="vertical" size={2} style={jpFont}>
                  <Text
                    type="secondary"
                    style={{ letterSpacing: 2, fontSize: 12 }}
                  >
                    ブログ記事
                  </Text>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      lineHeight: 1.25,
                      fontSize: window.innerWidth < 768 ? 16 : 18,
                      wordWrap: "break-word",
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                    }}
                  >
                    {displayTitle}
                  </Title>
                </Space>
              </div>
            </div>

            <Divider style={{ margin: "12px 0 20px" }} />

            {/* Content */}
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

          {/* Bottom nav (tối giản) */}
          <Space style={{ marginTop: 12 }} wrap>
            {blog.originalUrl && (
              <Button
                icon={<LinkOutlined />}
                onClick={() => window.open(blog.originalUrl, "_blank")}
              >
                {t.openSource[language]}
              </Button>
            )}
          </Space>
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

          {/* Blog Calendar */}
          <BlogCalendar
            blogs={memberBlogs}
            memberInfo={memberInfo}
            onBlogClick={(blogId) => navigate(`/blog/${blogId}`)}
            isMobile={isMobile}
          />
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
        .jp-prose a { color: #6b21a8; text-decoration: none; }
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
