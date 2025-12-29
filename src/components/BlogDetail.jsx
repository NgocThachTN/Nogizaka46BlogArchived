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
  Progress,
  notification,
} from "antd";
import {
  LeftOutlined,
  CalendarOutlined,
  ShareAltOutlined,
  LinkOutlined,
  ArrowUpOutlined,
  LoadingOutlined,
  RightOutlined,
  ReadOutlined,
  GlobalOutlined,
  BulbOutlined,
  MoonOutlined,
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
import { isIOS } from "../utils/deviceDetection";
import BlogDetailMobile from "./BlogDetailMobile";
import BlogCalendar from "./BlogCalendar";
import MemberProfile from "./MemberProfile";
import RecentBlogs from "./RecentBlogs";
import {
  translateJapaneseToEnglish,
  translateJapaneseToVietnamese,
  translateTitleToVietnamese,
} from "../api/GeminiTranslate";
import {
  initKuroshiro,
  addFuriganaToHtml,
} from "../utils/furiganaHelper";

const { Title, Text } = Typography;
dayjs.locale("ja");

const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

// Helper function to format English name (capitalize and reverse order)
const formatEnglishName = (englishName) => {
  if (!englishName) return englishName;

  // Split by space (e.g., "ikeda eisa" -> ["ikeda", "eisa"])
  const parts = englishName.trim().toLowerCase().split(/\s+/);

  if (parts.length === 2) {
    // Capitalize first letter of each part
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    // Reverse order: last name first, first name last (eisa ikeda -> Eisa Ikeda)
    return `${capitalize(parts[1])} ${capitalize(parts[0])}`;
  }

  // If not 2 parts, just capitalize first letter
  return englishName.charAt(0).toUpperCase() + englishName.slice(1).toLowerCase();
};

// Diary-style handwriting fonts for journal-like reading experience
// IMPORTANT: Yomogi must be first priority for Japanese handwriting style
// Patrick Hand SC provides CJK support as fallback
const bookFont = {
  ja: {
    fontFamily:
      "'Yomogi', 'Patrick Hand SC', 'Zen Kurenaido', 'Noto Serif JP', 'Source Han Serif JP', '游明朝', 'Yu Mincho', serif",
    fontWeight: 400,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
    fontDisplay: "swap",
    fontFeatureSettings: "'palt' 1",
  },
  en: {
    fontFamily:
      "'Mali', 'Caveat', 'Yomogi', 'Georgia', serif",
    fontWeight: 500,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    fontDisplay: "swap",
  },
  vi: {
    fontFamily:
      "'Mali', 'Patrick Hand SC', 'Caveat', 'Times New Roman', 'Georgia', serif",
    fontWeight: 500,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    fontDisplay: "swap",
  },
};

// Diary paper line height in pixels - text will align to these lines
const DIARY_LINE_HEIGHT = 32;

// size preset — big for JP reading (increased ~20% to replace zoom:1.2)
const SIZE_PRESETS = {
  sm: { px: 24, lh: 1.9, h1: 2.0, h2: 1.7, h3: 1.45 },
  md: { px: 26, lh: 2.1, h1: 2.2, h2: 1.85, h3: 1.6 },
  lg: { px: 30, lh: 2.2, h1: 2.4, h2: 2.0, h3: 1.75 },
  xl: { px: 34, lh: 2.3, h1: 2.6, h2: 2.15, h3: 1.85 },
  xxl: { px: 38, lh: 2.4, h1: 2.8, h2: 2.3, h3: 2.0 },
};

const t = {
  back: { ja: "一覧へ戻る", en: "Back to List", vi: "Quay lại Danh sách" },
  backToMemberBlogs: { ja: "メンバーのブログ一覧", en: "Member's Blogs", vi: "Blog của thành viên" },
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
  minutes: { ja: "分", en: "min", vi: "phút" },
  blogArticle: { ja: "ブログ記事", en: "Blog Article", vi: "Tiêu Đề Blog" },
  furigana: { ja: "ふりがな", en: "Furigana", vi: "Phiên âm" },
  furiganaOn: { ja: "ふりがな表示中", en: "Furigana ON", vi: "Đang hiển thị" },
  furiganaOff: { ja: "ふりがな非表示", en: "Furigana OFF", vi: "Đã tắt" },
  fontSizes: {
    sm: { ja: "小", en: "Small", vi: "Nhỏ" },
    md: { ja: "標準", en: "Normal", vi: "Chuẩn" },
    lg: { ja: "大", en: "Large", vi: "Lớn" },
    xl: { ja: "特大", en: "X-Large", vi: "Rất lớn" },
    xxl: { ja: "特特大", en: "XX-Large", vi: "Cực lớn" },
  },
};

const LS_KEY_SIZE = "blog:jpFontSize";
const LS_KEY_TR_EN = "blog:tr:en";
const LS_KEY_TR_VI = "blog:tr:vi";
const LS_KEY_TTL_EN = "blog:trttl:en";
const LS_KEY_TTL_VI = "blog:trttl:vi";

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
  const [readingMode, _SET_READING_MODE] = useState(true);
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

  // KHÔNG tự động initialize Kuroshiro - chỉ khi user click
  // useEffect bị comment để tránh block loading
  // Kuroshiro sẽ được init khi user click nút furigana

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
      console.warn('No member code available for navigation');
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
        const maxRetries = isIOS() ? 3 : 2; // Tăng retry cho production

        while (retryCount < maxRetries && !data) {
          try {
            data = await fetchBlogDetail(id);
            if (data) break;
          } catch (error) {
            console.warn(`Fetch attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount < maxRetries) {
              // Exponential backoff cho iOS
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
          // Không block UI nếu không fetch được member info
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
            // Không block UI nếu không fetch được member blogs
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
          setPendingNavId(null);
          setNavLock(false);
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

        console.log("BlogDetail: Computing prev/next for blog:", {
          blogId: blog.id,
          memberCode: blog.memberCode,
          author: blog.author,
        });

        let code = blog?.memberCode;
        if (!code && blog?.author) {
          console.log(
            "BlogDetail: No memberCode, trying to fetch by author:",
            blog.author
          );
          const m = await fetchMemberInfoByName(blog.author);
          code = m?.code;
          console.log("BlogDetail: Fetched member by name:", m);
        }

        if (!code) {
          console.log(
            "BlogDetail: No member code found, cannot compute navigation"
          );
          return;
        }

        console.log("BlogDetail: Fetching blogs for member code:", code);
        let list = await fetchAllBlogs(code);
        console.log("BlogDetail: Fetched blogs:", list?.length || 0);

        // Fallback: If no blogs found, try direct API call
        if (!Array.isArray(list) || list.length === 0) {
          console.log(
            "BlogDetail: No blogs found, trying fallback API call..."
          );
          try {
            const response = await fetch(
              `https://www.nogizaka46.com/s/n46/api/diary/MEMBER/list?ct=${code}&callback=res`
            );
            const text = await response.text();
            const jsonStr = text.replace(/^res\(/, "").replace(/\);?$/, "");
            const api = JSON.parse(jsonStr);
            if (api.data && Array.isArray(api.data)) {
              list = api.data;
              console.log("BlogDetail: Fallback API found blogs:", list.length);
            }
          } catch (fallbackError) {
            console.warn(
              "BlogDetail: Fallback API also failed:",
              fallbackError
            );
          }
        }

        if (!Array.isArray(list) || list.length === 0) {
          console.log("BlogDetail: No blogs found for member code:", code);
          return;
        }

        const index = list.findIndex((b) => String(b.id) === String(blog.id));
        console.log(
          "BlogDetail: Found blog at index:",
          index,
          "out of",
          list.length
        );

        if (index === -1) {
          console.log("BlogDetail: Blog not found in list");
          return;
        }

        const nextNewer = index > 0 ? list[index - 1]?.id : null; // Next
        const prevOlder = index < list.length - 1 ? list[index + 1]?.id : null; // Prev

        console.log("BlogDetail: Navigation IDs:", {
          prevId: prevOlder,
          nextId: nextNewer,
        });
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
        setTranslationProgress(0);

        // Check if blog ID changed before starting translation
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

        // Check if blog ID changed after title translation
        if (currentBlogId !== id) {
          setTranslating(false);
          setTranslationProgress(0);
          return;
        }

        // Update progress after title translation
        setTranslationProgress(20);

        // Chunk callback
        let translatedContent = "";
        let chunkCount = 0;
        const updateProgress = (translatedChunk, isLast) => {
          if (!translatedChunk) return;

          // Check if blog ID changed during translation
          if (currentBlogId !== id) return;

          const cleaned = translatedChunk
            .replace(/```html/g, "")
            .replace(/```/g, "")
            .trim();
          translatedContent += cleaned;
          chunkCount++;

          // Update progress based on chunks (20% + 60% for content)
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

        // Final check before setting results
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

      // Chỉ xử lý khi user bật furigana
      if (showFurigana && !furiganaContent) {
        try {
          setFuriganaLoading(true);

          // Init Kuroshiro nếu chưa ready
          if (!kuroshiroReady && !kuroshiroInitializing) {
            setKuroshiroInitializing(true);
            console.log("Initializing Kuroshiro on-demand...");

            try {
              await initKuroshiro();
              setKuroshiroReady(true);
              console.log("Kuroshiro initialized successfully");
            } catch (initError) {
              console.error("Failed to initialize Kuroshiro:", initError);
              message.error("Không thể khởi tạo công cụ furigana. Vui lòng thử lại.");
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
          const furiganaHtml = await Promise.race([furiganaPromise, timeoutPromise]);

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
  }, [showFurigana, blog?.content, kuroshiroReady, language, furiganaContent, kuroshiroInitializing]);

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
        setMemberInfo={setMemberInfo}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
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
      contentWidth="Fluid"
      header={{
        title: "乃木坂46ブログ",
        style: { paddingInline: 16, paddingBlock: 8 },
        extra: (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}>
            <Button key="back" icon={<LeftOutlined />} onClick={onBack}>
              {t.back[language]}
            </Button>
            <Button key="member-blogs" onClick={onBackToMemberBlogs} type="default">
              {t.backToMemberBlogs[language]}
            </Button>

            {/* PREV (only render when prevId exists) */}
            {navIds.prevId && (
              <Tooltip key="prev" title={t.prevPost[language]}>
                <Button
                  icon={
                    pendingNavId &&
                      pendingNavId === navIds.prevId &&
                      !getCachedBlogDetail(navIds.prevId) ? (
                      <LoadingOutlined />
                    ) : (
                      <LeftOutlined />
                    )
                  }
                  loading={
                    pendingNavId === navIds.prevId &&
                    !getCachedBlogDetail(navIds.prevId)
                  }
                  onClick={() => fastGo(navIds.prevId)}
                  onMouseEnter={() => onHoverPrefetch(navIds.prevId)}
                  disabled={
                    navLock ||
                    (pendingNavId === navIds.prevId &&
                      !getCachedBlogDetail(navIds.prevId))
                  }
                />
              </Tooltip>
            )}

            {/* NEXT (render only when nextId exists; kèm spinner nhỏ nếu đang pending & chưa cache) */}
            {navIds.nextId && (
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
                  loading={
                    pendingNavId === navIds.nextId &&
                    !getCachedBlogDetail(navIds.nextId)
                  }
                  onClick={() => fastGo(navIds.nextId)}
                  onMouseEnter={() => onHoverPrefetch(navIds.nextId)}
                  disabled={navLock}
                />
              </Tooltip>
            )}

            <Select
              key="lang"
              value={language}
              onChange={(value) => {
                setLanguage(value);
                if (propSetLanguage) propSetLanguage(value);
              }}
              style={{ width: 150, minWidth: 120 }}
              loading={translating}
              disabled={translating}
              options={[
                {
                  value: "ja",
                  label: (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <GlobalOutlined
                        style={{ color: "#666", fontSize: "14px" }}
                      />
                      日本語
                    </span>
                  ),
                },
                {
                  value: "en",
                  label: (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <GlobalOutlined
                        style={{ color: "#666", fontSize: "14px" }}
                      />
                      English
                    </span>
                  ),
                },
                {
                  value: "vi",
                  label: (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <GlobalOutlined
                        style={{ color: "#666", fontSize: "14px" }}
                      />
                      Tiếng Việt
                    </span>
                  ),
                },
              ]}
            />
            {language === "ja" && (
              <Tooltip
                key="furigana-toggle"
                title={showFurigana ? t.furiganaOn[language] : t.furiganaOff[language]}
              >
                <Button
                  type={showFurigana ? "primary" : "default"}
                  loading={furiganaLoading || kuroshiroInitializing}
                  onClick={() => setShowFurigana(!showFurigana)}
                  disabled={furiganaLoading || kuroshiroInitializing || !blog?.content}
                >
                  {t.furigana[language]}
                </Button>
              </Tooltip>
            )}
            {setThemeMode && (
              <Button
                key="theme"
                type="text"
                size="middle"
                onClick={() =>
                  setThemeMode(themeMode === "dark" ? "light" : "dark")
                }
                icon={themeMode === "dark" ? <BulbOutlined /> : <MoonOutlined />}
                aria-label="Toggle dark mode"
                title={themeMode === "dark" ? "Light" : "Dark"}
              />
            )}

            <Segmented
              key="seg-size"
              options={[
                { label: t.fontSizes.sm[language], value: "sm" },
                { label: t.fontSizes.md[language], value: "md" },
                { label: t.fontSizes.lg[language], value: "lg" },
                { label: t.fontSizes.xl[language], value: "xl" },
                { label: t.fontSizes.xxl[language], value: "xxl" },
              ]}
              value={fontSizeKey}
              onChange={(v) => setFontSizeKey(v)}
            />

            <Button key="share" icon={<ShareAltOutlined />} onClick={onShare}>
              {t.share[language]}
            </Button>
          </div>
        ),
      }}
      token={{ colorBgPageContainer: readingMode ? "#fafafa" : undefined }}
    >
      <ProCard ghost gutter={[16, 16]} wrap>
        {/* Left Sidebar - Member Profile */}
        {memberInfo && (
          <ProCard
            colSpan={{ xs: 24, sm: 24, md: 5, lg: 4, xl: 4 }}
            ghost
            style={{
              position: "sticky",
              top: 16,
              alignSelf: "flex-start",
            }}
          >
            <MemberProfile memberInfo={memberInfo} themeMode={themeMode} language={language} />
          </ProCard>
        )}

        {/* Main content */}
        <ProCard
          colSpan={{
            xs: 24,
            sm: 24,
            md: memberInfo ? 14 : 18,
            lg: memberInfo ? 15 : 18,
            xl: memberInfo ? 16 : 18,
          }}
          ghost
        >
          <Card
            className="diary-paper"
            style={{
              borderRadius: 16,
              background:
                themeMode === "dark"
                  ? "linear-gradient(to bottom, #2a2520 0%, #24211d 100%)"
                  : "linear-gradient(to bottom, #FFF9E6 0%, #FFF5D6 100%)",
              boxShadow: themeMode === "dark"
                ? "0 4px 24px rgba(0,0,0,0.4), inset 0 0 60px rgba(139, 115, 85, 0.05)"
                : "0 4px 24px rgba(139, 69, 19, 0.15), inset 0 0 60px rgba(139, 69, 19, 0.03)",
              border: themeMode === "dark"
                ? "1px solid rgba(139, 115, 85, 0.2)"
                : "1px solid rgba(139, 69, 19, 0.15)",
              position: "relative",
              overflow: "hidden",
              ...jpFont,
            }}
            bodyStyle={{
              // Padding-top must be a multiple of line-height for proper alignment
              // Using em units to prevent sub-pixel rounding drift over long posts
              // Formula: LineHeight (1 unit) + Offset (Half-leading) + Font Specific Baseline Correction
              paddingTop: `${sz.lh + (sz.lh - 1) / 2 + (language === "ja" ? 0 : 0.3)}em`,
              paddingRight: readingMode ? 56 : 42,
              paddingBottom: readingMode ? 56 : 42,
              paddingLeft: readingMode ? 56 : 42,
              position: "relative",

              // Use linear-gradient + background-size to create repeating lines
              // This relies on the browser to repeat the 1-unit tile perfecty
              backgroundImage: themeMode === "dark"
                ? `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 115, 85, 0.2) calc(100% - 1px), rgba(139, 115, 85, 0.2) 100%)`
                : `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 69, 19, 0.15) calc(100% - 1px), rgba(139, 69, 19, 0.15) 100%)`,

              // Size is exactly equal to Line Height in ems
              backgroundSize: `100% ${sz.lh}em`,
            }}
          >
            {/* Overlay translating */}
            {translating && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    themeMode === "dark"
                      ? "rgba(28,26,23,0.9)"
                      : "rgba(255,255,255,0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                  borderRadius: 16,
                  backdropFilter: "blur(3px)",
                }}
              >
                <ProCard
                  style={{
                    textAlign: "center",
                    borderRadius: 16,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                    border: "1px solid rgba(109, 40, 217, 0.15)",
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #faf7ff 100%)",
                    maxWidth: 320,
                    width: "90%",
                  }}
                  bodyStyle={{ padding: "32px 24px" }}
                >
                  <Space direction="vertical" align="center" size={20}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Spin
                        size="large"
                        indicator={
                          <LoadingOutlined
                            style={{ fontSize: 28, color: "#6d28d9" }}
                            spin
                          />
                        }
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          fontSize: 16,
                          color: "#6d28d9",
                          fontWeight: 600,
                        }}
                      >
                        {translationProgress}%
                      </div>
                    </div>

                    <div>
                      <Progress
                        percent={translationProgress}
                        strokeColor={{
                          "0%": "#6d28d9",
                          "50%": "#8b5cf6",
                          "100%": "#a855f7",
                        }}
                        trailColor="#f3f4f6"
                        size="small"
                        style={{
                          width: 240,
                          marginBottom: 12,
                        }}
                        showInfo={false}
                      />
                    </div>
                  </Space>
                </ProCard>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "flex-end", // Align bottom of date with title roughly
                justifyContent: "space-between", // Spread Date and Title
                marginBottom: window.innerWidth < 768 ? 16 : 24,
                width: "100%",
                padding: "0 4px", // Slight padding
              }}
            >
              {/* Journal Date - Left Side */}
              <div
                style={{
                  color: themeMode === "dark" ? "#b8a586" : "#666",
                  fontSize: window.innerWidth < 768 ? 16 : 18,
                  fontFamily: bookFont[language].fontFamily,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <CalendarOutlined style={{ marginRight: 8 }} />
                <span style={{ fontFamily: bookFont[language].fontFamily }}>{blog.date}</span>
              </div>

              {/* Blog Title - Right Side */}
              <div
                style={{
                  textAlign: "right",
                  maxWidth: "70%",
                }}
              >
                {/* REMOVED style={jpFont} to prevent font override */}
                <Space direction="vertical" size={2}>
                  <Text
                    type="secondary"
                    style={{
                      letterSpacing: 2,
                      fontSize: 13,
                      textTransform: "uppercase",
                      fontFamily: bookFont[language].fontFamily
                    }}
                  >
                    {t.blogArticle[language]}
                  </Text>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      lineHeight: 1.3,
                      fontSize: window.innerWidth < 768 ? 18 : 22,
                      wordWrap: "break-word",
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                      fontFamily: bookFont[language].fontFamily,
                      fontWeight: language === "ja" ? 400 : 700,
                    }}
                  >
                    {displayTitle}
                  </Title>
                </Space>
              </div>
            </div>

            <Divider
              style={{
                margin: "19px 0 29px",
                borderColor:
                  themeMode === "dark" ? "rgba(207,191,166,0.2)" : undefined,
              }}
            />

            {/* Content */}
            <div
              ref={contentRef}
              className="jp-prose"
              style={{
                fontSize: sz.px,
                lineHeight: `${Math.round(sz.px * sz.lh)}px`, // Force integer px line-height
                letterSpacing: language === "ja" ? 0.5 : 0.3,
                color: themeMode === "dark" ? "#f5ede0" : undefined,

                // CRITICAL FIX: Robust text wrapping for CJK + Emojis
                overflowWrap: "anywhere",   // Prevents overflow by breaking long strings/urls anywhere if needed
                wordBreak: "normal",        // Use normal CJK breaking rules
                lineBreak: "strict",        // Strict Japanese kinsoku shori (prevent bad line breaks)
                whiteSpace: "pre-wrap",     // Preserve whitespace/newlines from API content

                textAlign: "left",
                ...bookFont[language],
              }}
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          </Card>

          {/* Bottom nav (tối giản) */}
          <Space style={{ marginTop: 14 }} wrap>
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
          colSpan={{
            xs: 24,
            sm: 24,
            md: memberInfo ? 5 : 6,
            lg: memberInfo ? 5 : 6,
            xl: memberInfo ? 4 : 6,
          }}
          ghost
          direction="column"
          gutter={[0, 16]}
          style={{
            position: "sticky",
            top: 16,
            alignSelf: "flex-start",

          }}
        >
          {/* Reading Time Estimate */}
          <ProCard
            title={
              <Space size={4}>
                <ReadOutlined style={{ fontSize: 16 }} />
                <span style={{ fontSize: 17 }}>{t.readTime[language]}</span>
              </Space>
            }
            style={{
              borderRadius: 12,
              background:
                themeMode === "dark"
                  ? "rgba(36, 33, 29, 0.85)"
                  : "rgba(253, 246, 227, 0.8)",
              border:
                themeMode === "dark"
                  ? "1px solid rgba(207,191,166,0.25)"
                  : "1px solid rgba(139, 69, 19, 0.2)",
              boxShadow:
                themeMode === "dark"
                  ? "0 2px 8px rgba(0,0,0,0.35)"
                  : "0 2px 8px rgba(139, 69, 19, 0.1)",
            }}
            bodyStyle={{ padding: isMobile ? 12 : 17 }}
          >
            <div
              style={{
                textAlign: "center",
                padding: isMobile ? "14px 0" : "19px 0",
                background:
                  themeMode === "dark"
                    ? "linear-gradient(135deg, rgba(28,26,23,0.9) 0%, rgba(36,33,29,0.9) 100%)"
                    : "linear-gradient(135deg, rgba(253, 246, 227, 0.9) 0%, rgba(244, 241, 232, 0.9) 100%)",
                borderRadius: 10,
                border:
                  themeMode === "dark"
                    ? "1px solid rgba(207,191,166,0.25)"
                    : "1px solid rgba(139, 69, 19, 0.2)",
                boxShadow:
                  themeMode === "dark"
                    ? "0 2px 8px rgba(0,0,0,0.35)"
                    : "0 2px 8px rgba(139, 69, 19, 0.1)",
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? 22 : 34,
                  fontWeight: 700,
                  color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                  marginBottom: 2,
                  textShadow:
                    themeMode === "dark"
                      ? "0 1px 2px rgba(0,0,0,0.4)"
                      : "0 1px 2px rgba(139, 69, 19, 0.1)",
                }}
              >
                {readMinutes}
              </div>
              <div
                style={{
                  fontSize: isMobile ? 12 : 16,
                  color: themeMode === "dark" ? "#cfbfa6" : "#5d4e37",
                  fontWeight: 500,
                  letterSpacing: 0.5,
                }}
              >
                {t.minutes[language]}
              </div>
            </div>
          </ProCard>

          {toc.length > 0 && (
            <Card
              title={
                <span style={{ fontSize: 17 }}>{t.toc[language]}</span>
              }
              style={{
                borderRadius: 12,
                background:
                  themeMode === "dark"
                    ? "rgba(36, 33, 29, 0.85)"
                    : "rgba(253, 246, 227, 0.8)",
                border:
                  themeMode === "dark"
                    ? "1px solid rgba(207,191,166,0.25)"
                    : "1px solid rgba(139, 69, 19, 0.2)",
                boxShadow:
                  themeMode === "dark"
                    ? "0 2px 8px rgba(0,0,0,0.35)"
                    : "0 2px 8px rgba(139, 69, 19, 0.1)",
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Space direction="vertical" style={{ width: "100%" }} size={5}>
                {toc.map((h) => (
                  <Button
                    key={h.id}
                    type="text"
                    size="small"
                    style={{
                      justifyContent: "flex-start",
                      paddingLeft:
                        h.level === "H1" ? 0 : h.level === "H2" ? 7 : 14,
                      fontSize: 16,
                      height: "auto",
                      padding: "7px 12px",
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
            language={language}
            themeMode={themeMode}
          />

          {/* Recent Blogs */}
          <div style={{ marginTop: 16 }}>
            <RecentBlogs
              blogs={memberBlogs}
              onBlogClick={(blogId) => navigate(`/blog/${blogId}`)}
              isMobile={isMobile}
              language={language}
              themeMode={themeMode}
              maxItems={5}
            />
          </div>
        </ProCard>
      </ProCard >

      <FloatButton.BackTop
        icon={<ArrowUpOutlined />}
        style={{
          width: window.innerWidth < 768 ? 44 : 60,
          height: window.innerWidth < 768 ? 44 : 60,
          right: window.innerWidth < 768 ? 16 : 24,
          bottom: window.innerWidth < 768 ? 16 : 24,
        }}
      />

      {/* prose base */}
      <style>{`
        /* Furigana (Ruby) Styling */
        .jp-prose ruby {
          ruby-position: over;
          ruby-align: center;
        }
        .jp-prose rt {
          font-size: 0.5em;
          line-height: 1.2;
          color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"};
          font-weight: 400;
          letter-spacing: 0.05em;
          user-select: none;
          -webkit-user-select: none;
        }
        .jp-prose rp {
          display: none;
        }
        .jp-prose ruby > span {
          display: inline-block;
        }
        .jp-prose * {
          max-width: 100%;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          box-sizing: border-box !important;
        }
        /* Force override inline styles with higher specificity */
        .jp-prose p,
        .jp-prose p.p1,
        .jp-prose p.p2,
        .jp-prose p.p3,
        .jp-prose p[style*="font-size"],
        .jp-prose p[class*="p"] { 
          color: ${themeMode === "dark" ? "#f5ede0" : "#374151"} !important; 
          /* Use exact line-height in pixels to match ruled lines */
          margin: 0 !important;
          padding: 0 !important;
          text-align: left !important; 
          font-size: ${sz.px}px !important;
          line-height: ${Math.round(sz.px * sz.lh)}px !important;
          letter-spacing: ${language === "ja" ? "0.05em" : "0.02em"} !important;
          word-spacing: ${language === "ja" ? "0.1em" : "0.05em"};
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          font-stretch: normal !important;
          font-family: ${bookFont[language].fontFamily} !important;
        }
        /* Extra spacing between paragraphs - use multiple of line height */
        .jp-prose p + p,
        .jp-prose br + p {
          margin-top: ${Math.round(sz.px * sz.lh)}px !important;
        }
        .jp-prose div[dir="auto"],
        .jp-prose div[style*="font-size"] { 
          font-size: ${sz.px}px !important;
          line-height: ${Math.round(sz.px * sz.lh)}px !important;
        }
        .jp-prose span,
        .jp-prose span.s1,
        .jp-prose span.s2,
        .jp-prose span[class*="s"],
        .jp-prose span[style*="font-size"],
        .jp-prose span[style*="UICTFontTextStyleBody"] {
          font-size: ${sz.px}px !important;
          line-height: ${Math.round(sz.px * sz.lh)}px !important;
          font-family: ${bookFont[language].fontFamily} !important;
          color: ${themeMode === "dark" ? "#f5ede0" : "#374151"} !important;
        }
        /* Override UICTFontTextStyleBody specifically */
        .jp-prose *[style*="UICTFontTextStyleBody"] {
          font-family: ${bookFont[language].fontFamily} !important;
          font-size: ${sz.px}px !important;
          line-height: ${Math.round(sz.px * sz.lh)}px !important;
        }
        .jp-prose h1 { 
          font-weight: 600; 
          margin: ${window.innerWidth < 768 ? "0.7em 0 0.4em" : "0.9em 0 0.6em"}; 
          letter-spacing: ${window.innerWidth < 768 ? "-0.02em" : language === "ja" ? "0.05em" : "normal"};
        }
        .jp-prose h2 { 
          font-weight: 600; 
          margin: ${window.innerWidth < 768 ? "0.7em 0 0.4em" : "0.9em 0 0.5em"}; 
          letter-spacing: ${window.innerWidth < 768 ? "-0.01em" : language === "ja" ? "0.05em" : "normal"};
        }
        .jp-prose h3 { 
          font-weight: 600; 
          margin: ${window.innerWidth < 768 ? "0.7em 0 0.3em" : "0.9em 0 0.4em"};
          letter-spacing: ${language === "ja" ? "0.05em" : "normal"};
        }
        .jp-prose a { 
          color: ${themeMode === "dark" ? "#d2a86a" : "#6b21a8"}; 
          text-decoration: none; 
          border-bottom: 1px dotted ${themeMode === "dark" ? "#d2a86a" : "#6b21a8"};
          word-break: break-all;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        .jp-prose a:hover { 
          border-bottom-style: solid;
        }
        .jp-prose img { 
          /* Polaroid style image */
          display: block; 
          margin: ${window.innerWidth < 768 ? "24px" : "32px"} auto; 
          max-width: ${window.innerWidth < 768 ? "85%" : "75%"}; 
          height: auto;
          /* White polaroid frame */
          padding: ${window.innerWidth < 768 ? "8px 8px 24px 8px" : "12px 12px 40px 12px"};
          background: ${themeMode === "dark" ? "#f5f0e6" : "#ffffff"};
          border-radius: 2px;
          /* Polaroid shadow and slight rotation */
          box-shadow: ${themeMode === "dark"
          ? "0 4px 12px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)"
          : "0 4px 12px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)"
        };
          transform: rotate(-1deg);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: none !important;
        }
        .jp-prose img:nth-child(even) {
          transform: rotate(1.5deg);
        }
        .jp-prose img:nth-child(3n) {
          transform: rotate(-0.5deg);
        }
        .jp-prose img:hover {
          transform: rotate(0deg) scale(1.02);
          box-shadow: ${themeMode === "dark"
          ? "0 8px 20px rgba(0,0,0,0.6), 0 12px 32px rgba(0,0,0,0.4)"
          : "0 8px 20px rgba(0,0,0,0.2), 0 12px 32px rgba(0,0,0,0.15)"
        };
        }
        .jp-prose div, .jp-prose span {
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
      `}</style>
      {/* dynamic heading scale */}
      <style>{`
        .jp-prose h1 { 
          font-size: ${window.innerWidth < 768
          ? SIZE_PRESETS[fontSizeKey].h1 * 0.85
          : SIZE_PRESETS[fontSizeKey].h1
        }em; 
        }
        .jp-prose h2 { 
          font-size: ${window.innerWidth < 768
          ? SIZE_PRESETS[fontSizeKey].h2 * 0.85
          : SIZE_PRESETS[fontSizeKey].h2
        }em; 
        }
        .jp-prose h3 { 
          font-size: ${window.innerWidth < 768
          ? SIZE_PRESETS[fontSizeKey].h3 * 0.85
          : SIZE_PRESETS[fontSizeKey].h3
        }em; 
        }
      `}</style>
      {/* Override PageContainer header max-width */}
      <style>{`
        /* Force full width for PageContainer and Header */
        .ant-pro-page-container,
        div.ant-pro-page-container,
        [class*="ant-pro-page-container"] {
          width: 100% !important;
          max-width: 100% !important;
          padding: 16px !important;
          box-sizing: border-box !important;
        }
        .ant-pro-page-container-warp,
        div.ant-pro-page-container-warp {
          width: 100% !important;
          max-width: 100% !important;
          padding-inline: 0 !important;
        }
        .ant-page-header,
        div.ant-page-header,
        header.ant-page-header,
        .ant-pro-page-container .ant-page-header {
          width: calc(100% - 32px) !important;
          max-width: calc(100% - 32px) !important;
          min-width: 0 !important;
          margin: 12px 16px 16px 16px !important;
          padding: 14px 20px !important;
          background: ${themeMode === "dark" ? "rgba(36, 33, 29, 0.85)" : "rgba(253, 246, 227, 0.8)"} !important;
          border: 1px solid ${themeMode === "dark" ? "rgba(207,191,166,0.25)" : "rgba(139, 69, 19, 0.2)"} !important;
          border-radius: 12px !important;
          box-shadow: ${themeMode === "dark" ? "0 2px 8px rgba(0,0,0,0.35)" : "0 2px 8px rgba(139, 69, 19, 0.1)"} !important;
          box-sizing: border-box !important;
        }
        .ant-page-header-heading,
        .ant-page-header .ant-page-header-heading {
          width: 100% !important;
          max-width: 100% !important;
          display: flex !important;
          flex-wrap: nowrap !important;
          justify-content: space-between !important;
          align-items: center !important;
          gap: 16px !important;
        }
        .ant-page-header-heading-left,
        .ant-page-header .ant-page-header-heading-left {
          flex: 0 0 auto !important;
          margin-right: 0 !important;
          min-width: auto !important;
        }
        .ant-page-header-heading-title,
        .ant-page-header .ant-page-header-heading-title {
          margin-right: 0 !important;
          padding-right: 8px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          white-space: nowrap !important;
          flex-shrink: 0 !important;
        }
        .ant-page-header-heading-extra,
        .ant-page-header .ant-page-header-heading-extra {
          margin: 0 !important;
          flex: 1 1 auto !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 6px !important;
          flex-wrap: wrap !important;
          min-width: 0 !important;
        }
        .ant-page-header-heading-extra > * {
          flex-shrink: 1 !important;
        }
        /* Button styling for consistency */
        .ant-page-header-heading-extra .ant-btn {
          height: 34px !important;
          padding: 4px 14px !important;
          font-size: 13px !important;
          border-radius: 8px !important;
          border: 1px solid ${themeMode === "dark" ? "rgba(207,191,166,0.3)" : "rgba(139, 69, 19, 0.25)"} !important;
          background: ${themeMode === "dark" ? "rgba(28, 26, 23, 0.6)" : "rgba(255, 255, 255, 0.7)"} !important;
          color: ${themeMode === "dark" ? "#cfbfa6" : "#5d4e37"} !important;
          transition: all 0.2s ease !important;
        }
        .ant-page-header-heading-extra .ant-btn:hover {
          background: ${themeMode === "dark" ? "rgba(210, 168, 106, 0.15)" : "rgba(139, 69, 19, 0.1)"} !important;
          border-color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
        }
        .ant-page-header-heading-extra .ant-btn-primary {
          background: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          border-color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          color: ${themeMode === "dark" ? "#1c1a17" : "#fff"} !important;
        }
        .ant-page-header-heading-extra .ant-btn-primary:hover {
          background: ${themeMode === "dark" ? "#e0bc82" : "#a0522d"} !important;
          border-color: ${themeMode === "dark" ? "#e0bc82" : "#a0522d"} !important;
        }
        .ant-page-header-heading-extra .ant-btn-icon-only {
          width: 34px !important;
          padding: 4px 0 !important;
        }
        .ant-page-header-heading-extra .ant-select {
          min-width: 130px !important;
        }
        .ant-page-header-heading-extra .ant-select .ant-select-selector {
          height: 34px !important;
          border-radius: 8px !important;
          border: 1px solid ${themeMode === "dark" ? "rgba(207,191,166,0.3)" : "rgba(139, 69, 19, 0.25)"} !important;
          background: ${themeMode === "dark" ? "rgba(28, 26, 23, 0.6)" : "rgba(255, 255, 255, 0.7)"} !important;
        }
        .ant-page-header-heading-extra .ant-select:hover .ant-select-selector {
          border-color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
        }
        .ant-page-header-heading-extra .ant-segmented {
          height: 34px !important;
          border-radius: 8px !important;
          background: ${themeMode === "dark" ? "rgba(28, 26, 23, 0.6)" : "rgba(255, 255, 255, 0.7)"} !important;
          border: 1px solid ${themeMode === "dark" ? "rgba(207,191,166,0.3)" : "rgba(139, 69, 19, 0.25)"} !important;
          padding: 2px !important;
        }
        .ant-page-header-heading-extra .ant-segmented-item {
          padding: 0 12px !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          color: ${themeMode === "dark" ? "#cfbfa6" : "#5d4e37"} !important;
        }
        .ant-page-header-heading-extra .ant-segmented-item-selected {
          background: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          color: ${themeMode === "dark" ? "#1c1a17" : "#fff"} !important;
        }
        .ant-pro-page-container-children-content {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 16px 16px 16px !important;
        }
        /* Fix for narrow header on initial load */
        div[class*="ant-pro-page-container"] {
          width: 100% !important;
        }
      `}</style>
    </PageContainer >
  );
}
