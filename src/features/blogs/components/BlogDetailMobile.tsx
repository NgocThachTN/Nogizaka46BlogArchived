// BlogDetailMobile.jsx — Notebook Diary Edition
// Clean Android/iOS design with notebook aesthetic

// @ts-nocheck
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
  Divider,
  Skeleton,
  Select,
} from "antd";
import {
  LoadingOutlined,
  TranslationOutlined,
  ArrowUpOutlined,
  LeftOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  FontSizeOutlined,
  GlobalOutlined,
  BulbOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import {
  PageContainer,
  ProCard,
  ProSkeleton,
} from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useTransition,
  useCallback,
} from "react";
import {
  getCachedBlogDetail,
  getImageUrl,
  fetchMemberInfo,
  fetchMemberInfoByName,
} from "../services/blogService";
import { isIOS, isIOS18Plus, isIPhoneXS } from "../../../lib/utils/deviceDetection";
import { initKuroshiro, addFuriganaToHtml } from "../lib/furiganaHelper";
import {
  DEFAULT_READING_FONT_PRESET,
  getReadingFontFamily,
  LS_KEY_READING_FONT,
  READING_FONT_PRESETS,
} from "./BlogDetail/constants";
import ImageLightbox from "./BlogDetail/ImageLightbox";
import {
  BlogDetailMobileSkeleton,
  BlogDetailMobileTranslationSkeleton,
} from "../../../shared/components/PageSkeletons";

const { Title, Text } = Typography;

const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic','MS Gothic','MS PGothic','Meiryo','Droid Sans Japanese','sans-serif'",
  fontDisplay: "swap",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
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
  return (
    englishName.charAt(0).toUpperCase() + englishName.slice(1).toLowerCase()
  );
};

// Book-like serif fonts for reading content - Enhanced for Android
const bookFont = {
  ja: {
    fontFamily:
      "'Noto Serif JP','Source Han Serif JP','Source Han Serif','Yu Mincho','YuMincho','游明朝','Hiragino Mincho ProN','MS Mincho','MS PMincho','Meiryo','Droid Sans Japanese','Roboto','serif'",
    fontWeight: 400,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
    fontDisplay: "swap",
    fontFeatureSettings: "'palt' 1",
  },
  en: {
    fontFamily:
      "'Georgia','Cambria','Times New Roman','Roboto Slab','Roboto','Droid Serif','serif'",
    fontWeight: 400,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    fontDisplay: "swap",
  },
  vi: {
    fontFamily:
      "'Times New Roman','Georgia','Cambria','Roboto Slab','Roboto','Droid Serif','serif'",
    fontWeight: 400,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    fontDisplay: "swap",
  },
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

  try {
    return html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
      let newAttrs = attrs || "";

      // Basic optimizations for all devices
      if (!/\bloading=/.test(newAttrs)) newAttrs += ' loading="lazy"';
      if (!/\bdecoding=/.test(newAttrs)) newAttrs += ' decoding="async"';
      if (!/\breferrerpolicy=/.test(newAttrs))
        newAttrs += ' referrerpolicy="no-referrer"';

      // iOS-specific optimizations - enhanced for iOS 18 and iPhone XS
      if (isIOS()) {
        let iosStyles = [
          "max-width: 100%",
          "height: auto",
          "width: 100%",
          "-webkit-user-select: none",
          "-webkit-touch-callout: none",
          "-webkit-tap-highlight-color: transparent",
        ];

        // iOS 18+ specific optimizations
        if (isIOS18Plus()) {
          iosStyles.push(
            "content-visibility: auto",
            "-webkit-transform: translateZ(0)",
            "transform: translateZ(0)",
            "-webkit-backface-visibility: hidden",
            "backface-visibility: hidden"
          );
        }

        // iPhone XS specific optimizations
        if (isIPhoneXS()) {
          iosStyles.push(
            "image-rendering: -webkit-optimize-contrast",
            "image-rendering: crisp-edges"
          );
        }

        const finalIosStyles = iosStyles.join(";");

        // Add style attribute safely
        if (/\bstyle=["']([^"']*)["']/.test(newAttrs)) {
          newAttrs = newAttrs.replace(
            /\bstyle=["']([^"']*)["']/,
            (m, existing) => `style="${existing};${finalIosStyles}"`
          );
        } else {
          newAttrs += ` style="${finalIosStyles}"`;
        }

        // Essential iOS attributes
        newAttrs += ' draggable="false"';

        // iOS 18+ specific attributes
        if (isIOS18Plus()) {
          newAttrs += ' loading="eager"'; // Force eager loading for iOS 18
        }
      }

      return `<img${newAttrs}>`;
    });
  } catch (error) {
    console.warn("Error optimizing HTML for mobile:", error);
    return html; // Return original HTML if optimization fails
  }
}

export default function BlogDetailMobile({
  blog,
  loading,
  translating,
  translationProgress,
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
  setMemberInfo, // Add setMemberInfo prop for iOS updates
  themeMode = "light",
  setThemeMode,
}) {
  const navigate = useNavigate();

  // Back to member blogs - Enhanced with multiple fallbacks
  const onBackToMemberBlogs = useCallback(() => {
    // Try multiple sources for member code
    const code =
      blog?.memberCode ||
      memberInfo?.code ||
      blog?.arti_code || // API response field
      blog?.artiCode; // Alternative field name

    if (code) {
      console.log("Navigating to member blogs with code:", code);
      navigate(`/blogs/${code}`);
    } else {
      // Fallback: Go to member list if no code available
      console.warn("No member code available, navigating to member list");
      navigate("/members");
    }
  }, [blog, memberInfo, navigate]);

  // Mobile-optimized state management
  const [isPending] = useTransition();
  const [cachedDisplayContent, setCachedDisplayContent] =
    useState(displayContent);
  const [cachedLanguage, setCachedLanguage] = useState(language);
  const [retryCount, setRetryCount] = useState(0);

  // Track previous blog ID to detect blog changes
  const prevBlogIdRef = useRef(blog?.id);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem(LS_FONT)) || 18
  );
  const [readingFontPreset, setReadingFontPreset] = useState(
    () => localStorage.getItem(LS_KEY_READING_FONT) || DEFAULT_READING_FONT_PRESET
  );

  // Furigana states
  const [showFurigana, setShowFurigana] = useState(false);
  const [furiganaContent, setFuriganaContent] = useState("");
  const [furiganaLoading, setFuriganaLoading] = useState(false);
  const [kuroshiroReady, setKuroshiroReady] = useState(false);
  const [kuroshiroInitializing, setKuroshiroInitializing] = useState(false);

  // --- Lightbox ---
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState("");
  const [allImages, setAllImages] = useState([]);

  const scrollWrapRef = useRef(null);

  const handleMobileContentClick = useCallback((e) => {
    const target = e.target;
    if (target.tagName === "IMG" && target.src) {
      // Thu thập tất cả ảnh hiện tại trong content
      const imgs = Array.from(
        scrollWrapRef.current?.querySelectorAll(".jp-prose img") || []
      ).map(img => img.src).filter(Boolean);
      setAllImages(imgs);
      setLightboxUrl(target.src);
      setLightboxOpen(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_FONT, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(LS_KEY_READING_FONT, readingFontPreset);
  }, [readingFontPreset]);

  // ---- Clear old content immediately when blog changes ----
  useLayoutEffect(() => {
    if (blog?.id) {
      // Detect if blog ID changed
      const blogChanged = prevBlogIdRef.current !== blog.id;

      if (blogChanged) {
        // Blog changed - clear everything immediately
        setCachedDisplayContent(null);
        setCachedLanguage(language);
        setRetryCount(0); // Reset retry count for new blog
        setShowFurigana(false); // Reset furigana when blog changes
        setFuriganaContent("");
        prevBlogIdRef.current = blog.id;

        // Reset scroll position when switching blogs
        if (scrollWrapRef.current) {
          scrollWrapRef.current.scrollTop = 0;
        }

        // Clear ALL cache to prevent showing old content
        _mobileCache.blogContent.clear();

        // Show original content immediately - simplified for iOS
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

  // ---- Cache management và smooth updates with iOS optimizations ----
  useEffect(() => {
    if (displayContent && !translating && blog?.id) {
      // Clear old cache immediately
      _mobileCache.blogContent.delete(blog.id);

      // Update cache with new content
      _mobileCache.blogContent.set(blog.id, {
        content: blog.content,
        displayContent,
        language,
        ts: Date.now(),
      });

      // Simplified content update for iOS
      setCachedDisplayContent(displayContent);
      setCachedLanguage(language);

      // Force scroll to top with iOS optimizations
      if (scrollWrapRef.current) {
        if (isIOS()) {
          // iOS smooth scroll workaround
          scrollWrapRef.current.style.overflow = "hidden";
          scrollWrapRef.current.scrollTop = 0;
          setTimeout(() => {
            if (scrollWrapRef.current) {
              scrollWrapRef.current.style.overflow = "auto";
              scrollWrapRef.current.style.WebkitOverflowScrolling = "touch";
            }
          }, 100);
        } else {
          scrollWrapRef.current.style.scrollBehavior = "auto";
          scrollWrapRef.current.scrollTop = 0;
          requestAnimationFrame(() => {
            if (scrollWrapRef.current) {
              scrollWrapRef.current.style.scrollBehavior = "smooth";
            }
          });
        }
      }

      // Enhanced image handling for iOS
      if (scrollWrapRef.current) {
        const images = scrollWrapRef.current.getElementsByTagName("img");
        Array.from(images).forEach((img) => {
          img.style.opacity = "1";
          img.style.transition = "none";

          // iOS specific image optimizations
          if (isIOS()) {
            img.style.transform = "translateZ(0)";
            img.style.backfaceVisibility = "hidden";
            img.style.webkitBackfaceVisibility = "hidden";

            // iPhone XS specific optimizations
            if (isIPhoneXS()) {
              img.style.imageRendering = "crisp-edges";
              img.style.webkitImageRendering = "optimize-contrast";
            }
          }
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

          if (!kuroshiroReady && !kuroshiroInitializing) {
            setKuroshiroInitializing(true);
            try {
              await initKuroshiro();
              setKuroshiroReady(true);
              setKuroshiroInitializing(false);
              console.log("Kuroshiro initialized successfully");
            } catch (initError) {
              console.error("Failed to initialize Kuroshiro:", initError);
              setShowFurigana(false);
              setFuriganaLoading(false);
              setKuroshiroInitializing(false);
              return;
            }
          }

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

  // Optimized HTML with lazy images
  const optimizedHtml = useMemo(() => {
    const content =
      showFurigana && furiganaContent
        ? furiganaContent
        : cachedDisplayContent || blog?.content || "";

    if (isIOS()) {
      console.log("iOS BlogDetailMobile - Content processing:", {
        contentLength: content.length,
        language: cachedLanguage,
        translating,
        hasBlog: !!blog,
      });
    }

    return optimizeHtmlForMobile(content);
  }, [
    cachedDisplayContent,
    cachedLanguage,
    translating,
    blog,
    displayTitle,
    memberInfo,
    showFurigana,
    furiganaContent,
  ]);

  const readingFontFamily = useMemo(
    () => getReadingFontFamily(readingFontPreset, cachedLanguage || language),
    [readingFontPreset, cachedLanguage, language]
  );

  // Setup scroll handlers and hide browser address bar on mount
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap) return;

    const hideBrowserBar = () => {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          window.scrollTo(0, 1);
          setTimeout(() => {
            if (wrap) {
              wrap.scrollTop = 0;
            }
          }, 100);
        }, 100);
      }
    };

    hideBrowserBar();
    window.addEventListener("resize", hideBrowserBar);
    return () => {
      window.removeEventListener("resize", hideBrowserBar);
    };
  }, []);

  // Simple image handling
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap || !cachedDisplayContent) return;

    const images = wrap.getElementsByTagName("img");
    Array.from(images).forEach((img) => {
      img.style.opacity = "1";
      img.style.transition = "none";
    });
  }, [cachedDisplayContent]);

  // iOS-specific: Force content load if stuck
  useEffect(() => {
    if (isIOS() && blog?.content && !cachedDisplayContent && !loading) {
      const timeout = setTimeout(() => {
        if (!cachedDisplayContent && blog?.content) {
          setCachedDisplayContent(blog.content);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [blog?.content, cachedDisplayContent, loading]);

  // iOS fix: Force set content immediately if available
  useEffect(() => {
    if (isIOS() && blog?.content && !cachedDisplayContent && !loading) {
      setCachedDisplayContent(blog.content);
    }
  }, [blog?.content, cachedDisplayContent, loading]);

  // Load memberInfo for all member IDs
  useEffect(() => {
    if (blog?.id && !memberInfo && !loading) {
      const timeout = setTimeout(async () => {
        try {
          let member = null;
          if (blog.memberCode) {
            member = await fetchMemberInfo(blog.memberCode);
          }
          if (!member && blog.author) {
            member = await fetchMemberInfoByName(blog.author);
          }
          if (!member && isIOS()) {
            // Fallback logic omitted for brevity, assuming standard fetch works or parent handles it
          }

          if (member && setMemberInfo) {
            setMemberInfo(member);
          }
        } catch (error) {
          console.warn("Failed to load memberInfo:", error);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [blog?.id, memberInfo, loading, blog?.author, blog?.memberCode, setMemberInfo]);


  // ---- New Notebook Render Structure ----
  if (loading && !blog && !displayTitle && !displayContent) {
    return <BlogDetailMobileSkeleton themeMode={themeMode} />;
  }

  return (
    <div
      className="diary-paper notebook-container"
      style={{
        width: "100%",
        minHeight: "100vh",
        height: "100dvh",
        padding: 0,
        margin: 0,
        position: "relative",
        overflowX: "hidden",
        backgroundColor: themeMode === "dark" ? "#1c1a17" : "#fdf6e3",
        display: "flex",
        flexDirection: "column",
        /* iOS Safari specific fixes */
        WebkitOverflowScrolling: "touch",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        overscrollBehavior: "none", // Prevent bounce/rubber-banding to hide black background
      }}
    >
      <style>{`
        /* Hide the red margin line for mobile full-width view */
        .diary-paper.notebook-container::before {
          display: none !important;
        }
      `}</style>

      {/* Visual binding effect - thinner for mobile */}
      <div
        className="notebook-binding"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: -10, // Hide part of it off-screen for mobile
          width: 30,
          backgroundSize: "8px 30px",
          zIndex: 50,
        }}
      ></div>

      {/* Navigation Bar - Sticky Note / Tape Style */}
      <div
        style={{
          ...jpFont,
          background:
            themeMode === "dark"
              ? "rgba(36, 33, 29, 0.95)"
              : "rgba(255, 255, 255, 0.95)", // More opaque for mobile readabilty
          borderBottom:
            themeMode === "dark"
              ? "1px dashed rgba(207,191,166,0.3)"
              : "1px dashed rgba(139, 69, 19, 0.3)", // Dashed line for notebook feel
          zIndex: 100,
          flexShrink: 0,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: themeMode === "dark"
            ? "0 2px 10px rgba(0,0,0,0.2)"
            : "0 2px 10px rgba(139, 69, 19, 0.05)",
        }}
      >
        <div style={{ padding: "8px 12px", paddingLeft: 12 }}> {/* Adjusted left padding */}
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between", gap: 8 }}
          >
            {/* Left side - Navigation */}
            <Space size={4}>
              <Button
                type="text"
                size="middle"
                icon={<HomeOutlined />}
                onClick={() => navigate("/members")}
                style={{
                  color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                }}
              />
              <Button
                type="text"
                size="middle"
                icon={<UnorderedListOutlined />}
                onClick={onBackToMemberBlogs}
                style={{
                  color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                }}
              />
              {(prevId || nextId) && (
                <div style={{
                  background: themeMode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(139,69,19,0.05)",
                  borderRadius: 20,
                  padding: "2px 4px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  {prevId && (
                    <Button
                      type="text"
                      size="small"
                      disabled={navLock}
                      onClick={() => fastGo && fastGo(prevId)}
                      style={{
                        color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                        fontWeight: "bold",
                      }}
                    >
                      {pendingNavId === prevId && !getCachedBlogDetail(prevId) ? <LoadingOutlined /> : "‹"}
                    </Button>
                  )}
                  {prevId && nextId && (
                    <span style={{
                      margin: "0 4px",
                      height: "12px",
                      width: "1px",
                      background: themeMode === "dark" ? "rgba(210,168,106,0.3)" : "rgba(139,69,19,0.2)",
                      display: "inline-block"
                    }} />
                  )}
                  {nextId && (
                    <Button
                      type="text"
                      size="small"
                      disabled={navLock}
                      onClick={() => fastGo && fastGo(nextId)}
                      style={{
                        color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                        fontWeight: "bold",
                      }}
                    >
                      {pendingNavId === nextId && !getCachedBlogDetail(nextId) ? <LoadingOutlined /> : "›"}
                    </Button>
                  )}
                </div>
              )}
            </Space>

            {/* Right side - Lang & Settings */}
            <Space size={4}>
              {/* Language Segmented Control - Minimal */}
              <Segmented
                size="small"
                value={cachedLanguage}
                onChange={(val) => setLanguage(val)}
                options={[
                  { label: "JP", value: "ja" },
                  { label: "EN", value: "en" },
                  { label: "VI", value: "vi" },
                ]}
                style={{
                  background: themeMode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(139,69,19,0.1)",
                  color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                  marginRight: 4
                }}
              />

              {cachedLanguage === "ja" && (
                <Button
                  type="text"
                  size="middle"
                  onClick={() => setShowFurigana(!showFurigana)}
                  style={{
                    color: showFurigana ? (themeMode === "dark" ? "#d2a86a" : "#8b4513") : "rgba(139,69,19,0.4)",
                    background: showFurigana ? (themeMode === "dark" ? "rgba(210,168,106,0.1)" : "rgba(139,69,19,0.1)") : "transparent",
                    fontWeight: "bold",
                    padding: "4px 8px"
                  }}
                >
                  ふ
                </Button>
              )}

              <Button
                type="text"
                size="middle"
                icon={<FontSizeOutlined />}
                onClick={() => setDrawerVisible(true)}
                style={{ color: themeMode === "dark" ? "#d2a86a" : "#8b4513" }}
              />
            </Space>
          </Space>
        </div>
      </div>

      {/* Translation Loading Overlay */}
      {translating && cachedLanguage === "ja" && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            right: 0,
            zIndex: 90,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{
            background: themeMode === "dark" ? "rgba(36, 33, 29, 0.95)" : "rgba(255, 255, 255, 0.95)",
            padding: "8px 16px",
            borderRadius: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "1px dashed rgba(139, 69, 19, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <LoadingOutlined spin style={{ color: "#8b4513" }} />
            <Text style={{ color: "#8b4513", fontSize: 13 }}>
              {cachedLanguage === "vi" ? "Đang dịch..." : "Translating..."}
            </Text>
          </div>
        </div>
      )}

      {/* Main Content Area - Diary Sheet */}
      <div
        ref={scrollWrapRef}
        className="diary-sheet-mobile"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px 12px 80px 12px", // Minimal padding (12px) for full width reading
          position: "relative",
          backgroundColor: themeMode === "dark" ? "#2a2520" : "#FFF9E6",
          backgroundImage:
            themeMode === "dark"
              ? `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 115, 85, 0.1) calc(100% - 1px), rgba(139, 115, 85, 0.1) 100%), linear-gradient(to bottom, #2a2520 0%, #24211d 100%)`
              : `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 69, 19, 0.2) calc(100% - 1px), rgba(139, 69, 19, 0.2) 100%), linear-gradient(to bottom, #FFF9E6 0%, #FFF5D6 100%)`,
          backgroundSize: `100% ${fontSize * 1.9}px, 100% 100%`,
          backgroundRepeat: "repeat, no-repeat",
          backgroundAttachment: "local",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "none", // Prevent rubber-banding black bar
        }}
      >

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header Info (Title, Date, Member) */}
          {/* Header Info (Title, Date, Member) */}
          <div style={{
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: `2px dashed ${themeMode === "dark" ? "rgba(207,191,166,0.2)" : "rgba(139,69,19,0.15)"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16
          }}>
            {/* Left: Avatar & Name */}
            <div style={{ flexShrink: 0 }}>
              {memberInfo ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Avatar
                    src={getImageUrl(memberInfo.img) || null}
                    size={56}
                    style={{
                      border: "3px solid #fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      marginBottom: 8
                    }}
                  />
                  <div style={{ textAlign: "center" }}>
                    <Text strong style={{ display: "block", fontSize: 13, lineHeight: 1.2, color: themeMode === "dark" ? "#f5ede0" : "#5c4033", ...jpFont, maxWidth: 80 }}>
                      {memberInfo.name}
                    </Text>
                  </div>
                </div>
              ) : blog?.author ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Avatar
                    src={getImageUrl(blog?.memberImage) || null}
                    size={56}
                    style={{
                      border: "3px solid #fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      marginBottom: 8
                    }}
                  />
                  <div style={{ textAlign: "center" }}>
                    <Text strong style={{ display: "block", fontSize: 13, lineHeight: 1.2, color: themeMode === "dark" ? "#f5ede0" : "#5c4033", ...jpFont, maxWidth: 80 }}>
                      {blog.author}
                    </Text>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right: Title & Date */}
            <div style={{ flex: 1, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              {loading && !displayTitle && !blog?.title ? (
                <Skeleton active paragraph={false} title={{ width: '100%' }} style={{ marginTop: 16, marginBottom: 8 }} />
              ) : (
                <Title level={3} style={{
                  margin: "12px 0 8px 0",
                  fontSize: 20,
                  color: themeMode === "dark" ? "#f5ede0" : "#3c2415",
                  fontFamily: readingFontFamily,
                  fontWeight: language === "ja" ? 600 : 700,
                  lineHeight: 1.3
                }}>
                  {displayTitle || blog?.title || "No Title"}
                </Title>
              )}

              <div style={{ display: "flex", alignItems: "center", color: themeMode === "dark" ? "#8b7e66" : "#8b5a2b", fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 6 }} />
                <span style={{ fontFamily: readingFontFamily }}>{blog?.date}</span>
              </div>
            </div>
          </div>

          {/* Loading / Error States */}
          {loading && !displayContent && (
            <div style={{ padding: "24px 0" }}>
              <Skeleton active title={false} paragraph={{ rows: 4, width: ['100%', '100%', '80%', '60%'] }} />
              <div style={{ margin: "24px 0" }}>
                <Skeleton.Image active style={{ width: '100%', height: 200, display: 'block' }} />
              </div>
              <Skeleton active title={false} paragraph={{ rows: 6, width: ['100%', '100%', '100%', '90%', '80%', '40%'] }} />
            </div>
          )}

          {!loading && !blog && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#8b4513" }}>
              <InfoCircleOutlined style={{ fontSize: 32, marginBottom: 16 }} />
              <div>Blog not found</div>
            </div>
          )}

          {/* Blog Content */}
          {translating && cachedLanguage !== "ja" ? (
            <BlogDetailMobileTranslationSkeleton
              themeMode={themeMode}
              translationProgress={translationProgress}
            />
          ) : (
            <div
              className="jp-prose"
              style={{
                fontSize: fontSize,
                lineHeight: 1.9,
                color: themeMode === "dark" ? "#f5ede0" : "#2c2c2c",
                fontFamily: readingFontFamily,
                "--blog-detail-font-family": readingFontFamily,
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                // Align text to the background grid
                // lineHeight must match backgroundSize in the overlay
              }}
              onClick={handleMobileContentClick}
              dangerouslySetInnerHTML={{ __html: optimizedHtml }}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: 60, textAlign: "center", paddingBottom: 40, borderTop: "1px dashed rgba(139,69,19,0.2)", paddingTop: 20 }}>
          {blog?.originalUrl && (
            <Button
              type="link"
              icon={<GlobalOutlined />}
              target="_blank"
              href={blog.originalUrl}
              style={{ color: "#8b4513" }}
            >
              Open Original Source
            </Button>
          )}
          <div style={{ marginTop: 10 }}>
            <Button
              shape="round"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (scrollWrapRef.current) scrollWrapRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Back to Top
            </Button>
          </div>
        </div>
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
        width={300}
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
          </Card>

          <Card title="Cỡ chữ" size="small" bordered>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span>A</span>
              <span style={{ fontSize: 24 }}>A</span>
            </div>
            <Segmented
              block
              value={fontSize}
              onChange={setFontSize}
              options={[14, 16, 18, 20, 24]}
            />
          </Card>

          <Card title="Font Ä‘á»c" size="small" bordered>
            <Select
              value={readingFontPreset}
              onChange={setReadingFontPreset}
              style={{ width: "100%" }}
              options={Object.entries(READING_FONT_PRESETS).map(([value, preset]) => ({
                value,
                label: preset.label?.[cachedLanguage] || preset.label?.ja,
              }))}
            />
          </Card>

          {setThemeMode && (
            <Card title="Giao diện" size="small" bordered>
              <Segmented
                block
                value={themeMode}
                onChange={setThemeMode}
                options={[
                  { label: "Sáng", value: "light", icon: <BulbOutlined /> },
                  { label: "Tối", value: "dark", icon: <MoonOutlined /> }
                ]}
              />
            </Card>
          )}

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

      {/* Global & Prose Styles */}
      <style>{`
          /* Hide scrollbar for clean reading */
          .diary-sheet-mobile::-webkit-scrollbar {
            display: none;
          }
          .diary-sheet-mobile {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .jp-prose img {
            border-radius: 8px;
            margin: 16px auto;
            max-width: 100%;
            height: auto !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 4px solid #fff;
            transform: rotate(-1deg);
          }
           .jp-prose img:nth-child(even) {
            transform: rotate(1deg);
          }

          .jp-prose p {
             margin: 0;
          }
          
          /* Blockquote style */
           .jp-prose blockquote {
            border-left: 3px solid #d2a86a;
            margin: 1.5em 0;
            padding: 0.5em 1em;
            background: rgba(210, 168, 106, 0.1);
            font-style: italic;
          }
        `}</style>

      {/* Image Lightbox */}
      <ImageLightbox
        open={lightboxOpen}
        imageUrl={lightboxUrl}
        allImages={allImages}
        themeMode={themeMode}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
