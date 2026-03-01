// BlogDetail.jsx — Refactored with smaller components
import { useParams, useNavigate } from "react-router-dom";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import { Card, Typography, Spin, Button, FloatButton, message, notification } from "antd";
import { LeftOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import {
  fetchBlogDetail,
  fetchAllBlogs,
  fetchMemberInfo,
  fetchMemberInfoByName,
  getCachedBlogDetail,
  prefetchBlogDetail,
} from "../services/blogService";
import { isIOS } from "../utils/deviceDetection";
import BlogDetailMobile from "./BlogDetailMobile";
import MemberProfile from "./MemberProfile";
import {
  translateJapaneseToEnglish,
  translateJapaneseToVietnamese,
  translateTitleToVietnamese,
} from "../api/GeminiTranslate";
import { initKuroshiro, addFuriganaToHtml } from "../utils/furiganaHelper";

// Import new components
import BlogDetailHeader from "./BlogDetail/BlogDetailHeader";
import BlogDetailContent from "./BlogDetail/BlogDetailContent";
import BlogDetailSidebar from "./BlogDetail/BlogDetailSidebar";
import BlogStyles from "./BlogDetail/BlogStyles";
import { useBlogNavigation } from "./BlogDetail/useBlogNavigation";
import {
  SIZE_PRESETS,
  LS_KEY_SIZE,
  LS_KEY_TR_EN,
  LS_KEY_TR_VI,
  LS_KEY_TTL_EN,
  LS_KEY_TTL_VI,
  t,
  cleanDisplayText,
} from "./BlogDetail/constants";

const { Title } = Typography;
dayjs.locale("ja");

export default function BlogDetail({
  language: propLanguage,
  setLanguage: propSetLanguage,
  themeMode,
  setThemeMode,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [memberBlogs, setMemberBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState(propLanguage || "ja");
  const [readingMode, _SET_READING_MODE] = useState(false);
  const [tategaki, setTategaki] = useState(false);
  const prevReadingMode = useRef(false);

  // Auto-enable reading mode when tategaki is on
  useEffect(() => {
    if (tategaki) {
      prevReadingMode.current = readingMode;
      _SET_READING_MODE(true);
    } else {
      _SET_READING_MODE(prevReadingMode.current);
    }
  }, [tategaki]);

  const [fontSizeKey, setFontSizeKey] = useState(
    () => localStorage.getItem(LS_KEY_SIZE) || "sm"
  );

  // translated caches
  const [trHtml, setTrHtml] = useState({ en: "", vi: "" });
  const [trTitle, setTrTitle] = useState({ en: "", vi: "" });
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Furigana states
  const [showFurigana, setShowFurigana] = useState(false);
  const [furiganaContent, setFuriganaContent] = useState("");
  const [furiganaLoading, setFuriganaLoading] = useState(false);
  const [kuroshiroReady, setKuroshiroReady] = useState(false);
  const [kuroshiroInitializing, setKuroshiroInitializing] = useState(false);

  const [navIds, setNavIds] = useState({ prevId: null, nextId: null });

  const contentRef = useRef(null);
  const currentBlogIdRef = useRef(id); // Track current blog ID for translation cancellation

  // Use navigation hook
  const { fastGo, onHoverPrefetch, navLock, pendingNavId } = useBlogNavigation(navigate, navIds);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset translation state when blog changes
  useEffect(() => {
    if (currentBlogIdRef.current !== id) {
      setTranslating(false);
      setTrHtml({ en: "", vi: "" });
      setTrTitle({ en: "", vi: "" });
      currentBlogIdRef.current = id;
    }
  }, [id]);

  // Scroll to top when blog ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  // Update page title when blog changes
  useEffect(() => {
    if (blog?.title) {
      document.title = `${blog.title} - 乃木坂46ブログ`;
    }
    return () => {
      document.title = "乃木坂46ブログ";
    };
  }, [blog?.title]);

  // Back
  const onBack = () => {
    navigate("/members");
  };

  // Back to member blogs
  const onBackToMemberBlogs = () => {
    const code = blog?.memberCode || memberInfo?.code;
    if (code) {
      navigate(`/blogs/${code}`);
    } else {
      console.warn("No member code available for navigation");
    }
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
    let isCancelled = false;

    (async () => {
      try {
        const cached = getCachedBlogDetail(id);
        if (cached && !isCancelled) {
          setBlog(cached);
          setLoading(false);
        } else {
          setLoading(true);
        }

        // Thêm delay nhỏ cho iOS để tránh race condition
        if (isIOS()) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Fetch blog detail với retry cho iOS
        let data = null;
        let retryCount = 0;
        const maxRetries = isIOS() ? 3 : 2;

        while (retryCount < maxRetries && !data) {
          try {
            data = await fetchBlogDetail(id);
            if (data) break;
          } catch (error) {
            console.warn(`Fetch attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retryCount) * 1000)
              );
            }
          }
        }

        if (!data) {
          if (!isCancelled) {
            notification.error({
              message: "Lỗi tải nội dung",
              description: "Không thể tải nội dung blog. Vui lòng thử lại sau.",
              placement: "topRight",
              duration: 4,
            });
          }
          return;
        }
        if (!data.content && !isCancelled) {
          notification.warning({
            message: "Cảnh báo",
            description: "Blog không có nội dung.",
            placement: "topRight",
            duration: 3,
          });
        }
        if (!isCancelled) {
          setBlog(data);
        }

        // Member info với error handling cho iOS
        let member = null;
        try {
          if (data.memberCode) member = await fetchMemberInfo(data.memberCode);
          if (!member && data.author)
            member = await fetchMemberInfoByName(data.author);
        } catch (memberError) {
          console.warn("Failed to fetch member info:", memberError);
        }
        if (!isCancelled) {
          setMemberInfo(member);
        }

        // Fetch member blogs for calendar với error handling
        if (member?.code && !isCancelled) {
          try {
            const blogs = await fetchAllBlogs(member.code);
            if (!isCancelled) {
              setMemberBlogs(blogs || []);
            }
          } catch (e) {
            console.error("Failed to fetch member blogs:", e);
          }
        }
      } catch (e) {
        console.error("Error loading blog:", e);
        if (!isCancelled) {
          notification.error({
            message: "Lỗi hệ thống",
            description: "Lỗi khi tải blog. Vui lòng thử lại sau.",
            placement: "topRight",
            duration: 4,
          });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
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

        let list = await fetchAllBlogs(code);

        // Fallback: If no blogs found, try direct API call
        if (!Array.isArray(list) || list.length === 0) {
          try {
            const response = await fetch(
              `https://www.nogizaka46.com/s/n46/api/diary/MEMBER/list?ct=${code}&callback=res`
            );
            const text = await response.text();
            const jsonStr = text.replace(/^res\(/, "").replace(/\);?$/, "");
            const api = JSON.parse(jsonStr);
            if (api.data && Array.isArray(api.data)) {
              list = api.data;
            }
          } catch (fallbackError) {
            console.warn("Fallback API also failed:", fallbackError);
          }
        }

        if (!Array.isArray(list) || list.length === 0) return;

        const index = list.findIndex((b) => String(b.id) === String(blog.id));
        if (index === -1) return;

        const nextNewer = index > 0 ? list[index - 1]?.id : null;
        const prevOlder = index < list.length - 1 ? list[index + 1]?.id : null;

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

      const currentBlogId = id;

      const keyHtml =
        (language === "en" ? LS_KEY_TR_EN : LS_KEY_TR_VI) + `:${currentBlogId}`;
      const keyTtl =
        (language === "en" ? LS_KEY_TTL_EN : LS_KEY_TTL_VI) +
        `:${currentBlogId}`;
      const cachedHtml = localStorage.getItem(keyHtml);
      const cachedTtl = localStorage.getItem(keyTtl);

      if (cachedHtml && cachedTtl) {
        if (currentBlogId === id) {
          setTrHtml((s) => ({ ...s, [language]: cachedHtml }));
          setTrTitle((s) => ({ ...s, [language]: cachedTtl }));
        }
        return;
      }

      try {
        setTranslating(true);
        setTranslationProgress(0);

        if (currentBlogId !== id) {
          setTranslating(false);
          setTranslationProgress(0);
          return;
        }

        // Translate title
        let titleOut = "";
        if (language === "en") {
          titleOut = await translateJapaneseToEnglish(blog.title || "");
        } else {
          titleOut = await translateTitleToVietnamese(blog.title || "");
        }

        if (currentBlogId !== id) {
          setTranslating(false);
          setTranslationProgress(0);
          return;
        }

        setTranslationProgress(20);

        // Chunk callback
        let translatedContent = "";
        let chunkCount = 0;
        const updateProgress = (translatedChunk, isLast) => {
          if (!translatedChunk) return;
          if (currentBlogId !== id) return;

          const cleaned = translatedChunk
            .replace(/```html/g, "")
            .replace(/```/g, "")
            .trim();
          translatedContent += cleaned;
          chunkCount++;

          const contentProgress = Math.min(20 + chunkCount * 15, 80);
          setTranslationProgress(contentProgress);

          if (isLast && currentBlogId === id) {
            setTrHtml((prev) => ({ ...prev, [language]: translatedContent }));
            localStorage.setItem(keyHtml, translatedContent);
            setTranslationProgress(100);
          }
        };

        // Translate content
        if (language === "en") {
          await translateJapaneseToEnglish(blog.content, updateProgress);
        } else {
          await translateJapaneseToVietnamese(blog.content, updateProgress);
        }

        if (currentBlogId === id) {
          const safeTtl = (titleOut || "").trim();
          if (safeTtl) {
            setTrTitle((s) => ({ ...s, [language]: safeTtl }));
            localStorage.setItem(keyTtl, safeTtl);
          }
          setTranslationProgress(100);
          notification.success({
            message: "Dịch thuật thành công",
            description: `Nội dung đã được dịch sang ${language === "en" ? "tiếng Anh" : "tiếng Việt"
              }`,
            placement: "topRight",
            duration: 3,
          });
        }
      } catch (err) {
        console.error("Translation failed:", err);
        if (currentBlogId === id) {
          notification.error({
            message: "Lỗi dịch thuật",
            description: "Không thể dịch nội dung. Vui lòng thử lại sau.",
            placement: "topRight",
            duration: 4,
          });
        }
      } finally {
        if (currentBlogId === id) {
          setTranslating(false);
          setTranslationProgress(0);
        }
      }
    })();
  }, [language, blog?.content, blog?.title, id]);

  // Handle furigana toggle - init on-demand
  useEffect(() => {
    (async () => {
      if (!blog?.content || language !== "ja") {
        setShowFurigana(false);
        setFuriganaContent("");
        return;
      }

      if (showFurigana && !furiganaContent) {
        try {
          setFuriganaLoading(true);

          // Init Kuroshiro nếu chưa ready
          if (!kuroshiroReady && !kuroshiroInitializing) {
            setKuroshiroInitializing(true);

            try {
              await initKuroshiro();
              setKuroshiroReady(true);
            } catch (initError) {
              console.error("Failed to initialize Kuroshiro:", initError);
              message.error(
                "Không thể khởi tạo công cụ furigana. Vui lòng thử lại."
              );
              setShowFurigana(false);
              setFuriganaLoading(false);
              setKuroshiroInitializing(false);
              return;
            }
            setKuroshiroInitializing(false);
          }

          // Add timeout để tránh block vô hạn
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Furigana timeout")), 30000)
          );

          const furiganaPromise = addFuriganaToHtml(blog.content);
          const furiganaHtml = await Promise.race([
            furiganaPromise,
            timeoutPromise,
          ]);

          setFuriganaContent(furiganaHtml);
        } catch (error) {
          console.error("Failed to generate furigana:", error);
          message.warning("Không thể tạo furigana. Vui lòng thử lại sau.");
          setShowFurigana(false);
        } finally {
          setFuriganaLoading(false);
        }
      }
    })();
  }, [
    showFurigana,
    blog?.content,
    kuroshiroReady,
    language,
    furiganaContent,
    kuroshiroInitializing,
  ]);

  // Reset furigana when blog changes
  useEffect(() => {
    setShowFurigana(false);
    setFuriganaContent("");
  }, [id]);

  // Display title/content by language
  const displayTitle =
    language === "ja"
      ? blog?.title
      : cleanDisplayText(trTitle[language]) || blog?.title;

  const displayContent =
    language === "ja" || translating || !trHtml[language]
      ? showFurigana && furiganaContent
        ? furiganaContent
        : blog?.content
      : cleanDisplayText(trHtml[language]);

  const sz = SIZE_PRESETS[fontSizeKey] || SIZE_PRESETS.md;

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
        setMemberInfo={setMemberInfo}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />
    );
  }

  // Desktop loading
  if (loading) {
    return (
      <div
        className="diary-paper notebook-container"
        style={{
          minHeight: "100vh",
          padding: "40px",
          paddingLeft: "60px",
        }}
      >
        <div className="notebook-binding" style={{ left: 0 }}></div>
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Spin size="large" />
          <span style={{ opacity: 0.5, fontSize: 14 }}>{t.loading[language]}</span>
        </div>
      </div>
    );
  }

  // Not found
  if (!blog) {
    return (
      <div
        className="diary-paper notebook-container"
        style={{
          minHeight: "100vh",
          padding: "40px",
          paddingLeft: "60px",
        }}
      >
        <div className="notebook-binding" style={{ left: 0 }}></div>
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Title level={4}>{t.notFound[language]}</Title>
          <Button type="primary" onClick={onBack} icon={<LeftOutlined />}>
            {t.back[language]}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="diary-paper notebook-container"
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "40px",
        paddingLeft: "60px", // Space for binding
      }}
    >
      {/* Visual binding effect */}
      <div className="notebook-binding" style={{ left: 0 }}></div>

      <div key={blog?.id} style={{ maxWidth: readingMode ? 1600 : 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", transition: "max-width 0.3s ease" }}>
        {/* Header - Sticky Note Style */}
        <div className="sticky-note" style={{ transform: "rotate(-0.5deg)", zIndex: 10, animation: "sticky-drop 0.55s cubic-bezier(0.34,1.3,0.64,1) both" }}>
          <div style={{
            background: themeMode === "dark" ? "rgba(36, 33, 29, 0.95)" : "rgba(255, 255, 255, 0.9)",
            borderRadius: "2px",
            padding: "16px 24px"
          }}>
            <BlogDetailHeader
              language={language}
              setLanguage={setLanguage}
              propSetLanguage={propSetLanguage}
              navIds={navIds}
              fastGo={fastGo}
              pendingNavId={pendingNavId}
              navLock={navLock}
              onBack={onBack}
              onBackToMemberBlogs={onBackToMemberBlogs}
              onShare={onShare}
              showFurigana={showFurigana}
              setShowFurigana={setShowFurigana}
              furiganaLoading={furiganaLoading}
              kuroshiroInitializing={kuroshiroInitializing}
              blog={blog}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              fontSizeKey={fontSizeKey}
              setFontSizeKey={setFontSizeKey}
              translating={translating}
              onHoverPrefetch={onHoverPrefetch}
              // Pass reading mode toggle to header if needed, or keeping it separate
              readingMode={readingMode}
              setReadingMode={_SET_READING_MODE}
              tategaki={tategaki}
              setTategaki={setTategaki}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", justifyContent: "center" }}>
          {/* Left Sidebar - Member Profile (Pinned Photo Style) */}
          {memberInfo && !readingMode && (
            <div
              style={{
                width: 300,
                flexShrink: 0,
                transform: "rotate(-1.5deg)",
                zIndex: 5,
                position: "sticky",
                top: 20,
                animation: "pin-swing 0.65s cubic-bezier(0.34,1.2,0.64,1) 0.1s both",
              }}
            >
              <MemberProfile
                memberInfo={memberInfo}
                themeMode={themeMode}
                language={language}
              />
            </div>
          )}

          {/* Main Content - Paper content */}
          <div style={{
            flex: 1,
            minWidth: 0,
            maxWidth: readingMode ? "100%" : undefined,
            transition: "all 0.3s ease",
            animation: "diary-open 0.65s cubic-bezier(0.22,1,0.36,1) 0.08s both",
          }}>
            <BlogDetailContent
              blog={blog}
              displayTitle={displayTitle}
              displayContent={displayContent}
              language={language}
              themeMode={themeMode}
              fontSizeKey={fontSizeKey}
              sz={sz}
              readingMode={readingMode}
              contentRef={contentRef}
              translating={translating}
              translationProgress={translationProgress}
              tategaki={tategaki}
            />
          </div>

          {/* Right Sidebar - Stacked Notes */}
          {!readingMode && (
            <div
              style={{
                width: 320,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                position: "sticky",
                top: 20,
                animation: "notes-slide-in 0.55s cubic-bezier(0.22,1,0.36,1) 0.2s both",
              }}
            >
              <BlogDetailSidebar
                toc={toc}
                readMinutes={readMinutes}
                memberBlogs={memberBlogs}
                memberInfo={memberInfo}
                onBlogClick={(blogId) => navigate(`/blog/${blogId}`)}
                language={language}
                themeMode={themeMode}
                isMobile={isMobile}
              />
            </div>
          )}
        </div>
      </div>

      <FloatButton.BackTop
        icon={<ArrowUpOutlined />}
        style={{
          width: 60,
          height: 60,
          right: 24,
          bottom: 24,
        }}
      />

      {/* Styles */}
      <BlogStyles
        themeMode={themeMode}
        fontSizeKey={fontSizeKey}
        language={language}
        sz={sz}
      />
    </div>
  );
}
