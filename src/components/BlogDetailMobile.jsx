// BlogDetailMobile.jsx — Full-bleed mobile reader (Ant Design Pro)
// Clean Android design with always-visible navigation and author bars

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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useTransition,
} from "react";
import {
  getCachedBlogDetail,
  getImageUrl,
  fetchMemberInfo,
  fetchMemberInfoByName,
} from "../services/blogService";
import { isIOS, isIOS18Plus, isIPhoneXS } from "../utils/deviceDetection";

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

  // iOS member loader - removed as we now use fetchMemberInfo for all member IDs

  // Removed unused navTopBtnStyle

  // Removed unused isHeaderVisible
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
        setRetryCount(0); // Reset retry count for new blog
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

  // Optimized HTML with lazy images - sử dụng cached content
  const optimizedHtml = useMemo(() => {
    const content = cachedDisplayContent || blog?.content || "";

    // iOS Safari specific debugging
    if (isIOS()) {
      console.log("iOS BlogDetailMobile - Content processing:", {
        hasCachedContent: !!cachedDisplayContent,
        hasBlogContent: !!blog?.content,
        contentLength: content.length,
        language: cachedLanguage,
        translating,
        iosVersion: isIOS18Plus() ? "18+" : "17-",
        device: isIPhoneXS() ? "iPhone XS" : "Other iPhone",
        userAgent: navigator.userAgent,
        // Debug author and title info
        hasBlog: !!blog,
        blogId: blog?.id,
        blogTitle: blog?.title,
        blogAuthor: blog?.author,
        hasMemberInfo: !!memberInfo,
        memberInfoName: memberInfo?.name,
        displayTitle: displayTitle || "No title",
        hasDisplayTitle: !!displayTitle,
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
  ]);

  // Fixed Navigation Bar (always visible) - Clean Android design
  const NavigationBar = useMemo(
    () => (
      <Affix offsetTop={0}>
        <div
          style={{
            ...jpFont,
            background:
              themeMode === "dark"
                ? "rgba(28,26,23,0.95)"
                : "rgba(253, 246, 227, 0.95)",
            borderBottom:
              themeMode === "dark"
                ? "1px solid rgba(207,191,166,0.2)"
                : "1px solid rgba(0,0,0,0.08)",
            zIndex: 999,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div style={{ padding: "6px 8px" }}>
            <Space
              align="center"
              style={{ width: "100%", justifyContent: "space-between" }}
            >
              {/* Left side - Navigation */}
              <Space size="small">
                <Button
                  type="text"
                  size="small"
                  icon={<HomeOutlined />}
                  onClick={() => navigate("/members")}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background:
                      themeMode === "dark"
                        ? "rgba(36,33,29,0.8)"
                        : "rgba(255, 255, 255, 0.6)",
                    border:
                      themeMode === "dark"
                        ? "1px solid rgba(207,191,166,0.2)"
                        : "1px solid rgba(0,0,0,0.08)",
                    color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                  }}
                />
                {prevId && (
                  <Button
                    type="text"
                    size="small"
                    disabled={!prevId || navLock}
                    onClick={() => fastGo && fastGo(prevId)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.6)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      color: "#8b4513",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {pendingNavId &&
                    pendingNavId === prevId &&
                    !getCachedBlogDetail(prevId) ? (
                      <LoadingOutlined style={{ fontSize: 12 }} />
                    ) : (
                      "‹"
                    )}
                  </Button>
                )}
                {nextId && (
                  <Button
                    type="text"
                    size="small"
                    disabled={!nextId || navLock}
                    onClick={() => fastGo && fastGo(nextId)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "rgba(139, 69, 19, 0.1)",
                      border: "1px solid rgba(139, 69, 19, 0.2)",
                      color: "#8b4513",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {pendingNavId &&
                    pendingNavId === nextId &&
                    !getCachedBlogDetail(nextId) ? (
                      <LoadingOutlined style={{ fontSize: 12 }} />
                    ) : (
                      "›"
                    )}
                  </Button>
                )}
              </Space>

              {/* Center - Language selection */}
              <div
                style={{ flex: 1, display: "flex", justifyContent: "center" }}
              >
                <Segmented
                  size="small"
                  value={cachedLanguage}
                  onChange={(val) => setLanguage(val)}
                  options={[
                    { label: "JPN", value: "ja" },
                    { label: "ENG", value: "en" },
                    { label: "VN", value: "vi" },
                  ]}
                  style={{
                    background:
                      themeMode === "dark"
                        ? "rgba(36,33,29,0.8)"
                        : "rgba(255, 255, 255, 0.6)",
                    border:
                      themeMode === "dark"
                        ? "1px solid rgba(207,191,166,0.2)"
                        : "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 8,
                  }}
                />
              </div>

              {/* Right side - Settings */}
              <Space size="small">
                {setThemeMode && (
                  <Button
                    type="text"
                    size="small"
                    onClick={() =>
                      setThemeMode(themeMode === "dark" ? "light" : "dark")
                    }
                    icon={
                      themeMode === "dark" ? <BulbOutlined /> : <MoonOutlined />
                    }
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background:
                        themeMode === "dark"
                          ? "rgba(36,33,29,0.8)"
                          : "rgba(255, 255, 255, 0.6)",
                      border:
                        themeMode === "dark"
                          ? "1px solid rgba(207,191,166,0.2)"
                          : "1px solid rgba(0,0,0,0.08)",
                      color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                    }}
                  />
                )}
                {/* Translation status */}
                {translating || isPending ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "4px 8px",
                      background:
                        themeMode === "dark"
                          ? "#9c6b3f"
                          : "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)",
                      borderRadius: 6,
                      color: "white",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    <LoadingOutlined
                      spin
                      style={{ marginRight: 4, fontSize: 10 }}
                    />
                    {cachedLanguage === "vi"
                      ? "Dịch"
                      : cachedLanguage === "en"
                      ? "Trans"
                      : "翻訳"}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "4px 8px",
                      background: "rgba(255, 255, 255, 0.6)",
                      borderRadius: 6,
                      border: "1px solid rgba(0,0,0,0.08)",
                      color: "#8b4513",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {cachedLanguage?.toUpperCase?.() || "JA"}
                  </div>
                )}

                <Button
                  type="text"
                  size="small"
                  icon={<FontSizeOutlined />}
                  onClick={() => setDrawerVisible(true)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background:
                      themeMode === "dark"
                        ? "rgba(36,33,29,0.8)"
                        : "rgba(255, 255, 255, 0.6)",
                    border:
                      themeMode === "dark"
                        ? "1px solid rgba(207,191,166,0.2)"
                        : "1px solid rgba(0,0,0,0.08)",
                    color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                  }}
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
      navigate,
      themeMode,
      setThemeMode,
    ]
  );

  // Author Bar (always visible - clean design)
  const AuthorBar = useMemo(
    () => (
      <div
        style={{
          ...jpFont,
          background:
            themeMode === "dark"
              ? "linear-gradient(135deg, rgba(28,26,23,0.95) 0%, rgba(36,33,29,0.95) 100%)"
              : "linear-gradient(135deg, rgba(253, 246, 227, 0.95) 0%, rgba(244, 241, 232, 0.95) 100%)",
          borderBottom:
            themeMode === "dark"
              ? "1px solid rgba(207,191,166,0.2)"
              : "1px solid rgba(139, 69, 19, 0.15)",
          zIndex: 998,
          position: "fixed",
          top: 44,
          left: 0,
          right: 0,
          width: "100%",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          margin: 0,
          borderRadius: 0,
          boxShadow:
            themeMode === "dark"
              ? "0 2px 8px rgba(0,0,0,0.35)"
              : "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
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
                    border:
                      themeMode === "dark"
                        ? "1px solid rgba(207,191,166,0.2)"
                        : "1px solid #fff",
                    boxShadow:
                      themeMode === "dark"
                        ? "0 1px 4px rgba(0,0,0,0.35)"
                        : "0 1px 4px rgba(0,0,0,0.1)",
                  }}
                />
                <div>
                  <Text
                    strong
                    style={{
                      color: themeMode === "dark" ? "#f5ede0" : "#3c2415",
                      fontSize: "13px",
                    }}
                  >
                    {memberInfo?.name || blog?.author || "Unknown Author"}
                  </Text>
                  <div
                    style={{
                      color: themeMode === "dark" ? "#cfbfa6" : "#5d4e37",
                      marginTop: 1,
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <CalendarOutlined
                      style={{ marginRight: 4, fontSize: "10px" }}
                    />
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
                    color: themeMode === "dark" ? "#f5ede0" : "#3c2415",
                    fontSize: "12px",
                    lineHeight: 1.2,
                    display: "block",
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  {displayTitle || blog?.title || "Loading title..."}
                </Text>
              </div>

              {/* Info Button - Right Side */}
              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => setDrawerVisible(true)}
                style={{
                  color: themeMode === "dark" ? "#cfbfa6" : "#5d4e37",
                  flexShrink: 0,
                  padding: "4px 6px",
                  height: "auto",
                }}
              />
            </>
          )}
        </div>
      </div>
    ),
    [blog, displayTitle, memberInfo, themeMode]
  );

  // Simple scroll handler - keep header always visible
  const handleScroll = useCallback(() => {
    // Keep header always visible - no auto-hide functionality
    // Removed setIsHeaderVisible call
  }, []);

  // Setup scroll handlers - simplified
  useEffect(() => {
    const wrap = scrollWrapRef.current;
    if (!wrap) return;

    // Keep header always visible
    handleScroll();

    return () => {
      // Cleanup not needed for simple handler
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

  // iOS-specific: Force content load if stuck
  useEffect(() => {
    if (isIOS() && blog?.content && !cachedDisplayContent && !loading) {
      console.log("iOS: Force loading content after timeout");
      const timeout = setTimeout(() => {
        if (!cachedDisplayContent && blog?.content) {
          console.log("iOS: Setting cached content from force load");
          setCachedDisplayContent(blog.content);
        }
      }, 1000); // Reduced timeout to 1 second

      return () => clearTimeout(timeout);
    }
  }, [blog?.content, cachedDisplayContent, loading]);

  // Additional iOS fix: Force set content immediately if available
  useEffect(() => {
    if (isIOS() && blog?.content && !cachedDisplayContent && !loading) {
      console.log("iOS: Immediate content set");
      setCachedDisplayContent(blog.content);
    }
  }, [blog?.content, cachedDisplayContent, loading]);

  // Load memberInfo for all member IDs (not just iOS)
  useEffect(() => {
    if (blog?.id && !memberInfo && !loading) {
      console.log("Missing memberInfo, attempting to load...");
      console.log(
        "Blog memberCode:",
        blog.memberCode,
        "Type:",
        typeof blog.memberCode
      );
      console.log("Blog author:", blog.author);
      console.log("isIOS():", isIOS());

      const timeout = setTimeout(async () => {
        try {
          let member = null;

          // Try to load by memberCode first
          if (blog.memberCode) {
            console.log("Trying to load by memberCode:", blog.memberCode);
            member = await fetchMemberInfo(blog.memberCode);
            console.log("fetchMemberInfo result:", member);
          }

          // Fallback to loading by author name
          if (!member && blog.author) {
            console.log("Trying to load by author name:", blog.author);
            member = await fetchMemberInfoByName(blog.author);
            console.log("fetchMemberInfoByName result:", member);
          }

          // iOS-specific fallback for any member ID that fails
          if (!member && isIOS()) {
            console.log(
              "iOS fallback: Attempting to load member info directly"
            );
            try {
              const response = await fetch(
                "https://www.nogizaka46.com/s/n46/api/list/member?callback=res"
              );
              const text = await response.text();
              const jsonStr = text.replace(/^res\(/, "").replace(/\);?$/, "");
              const api = JSON.parse(jsonStr);
              const fallbackMember = api.data.find(
                (m) => String(m.code) === String(blog.memberCode)
              );

              if (fallbackMember) {
                console.log("iOS fallback: Found member:", fallbackMember);
                member = fallbackMember;
              } else if (
                blog.memberCode === "40008" ||
                blog.author?.includes("6期生")
              ) {
                console.log("iOS fallback: Creating special member for 40008");
                member = {
                  code: "40008",
                  name: "6期生リレー",
                  cate: "6期生",
                  groupcode: "6期生",
                  graduation: "NO",
                };
              }
            } catch (fallbackError) {
              console.warn(
                "iOS fallback: Failed to load member info:",
                fallbackError
              );
            }
          }

          if (member) {
            console.log("Successfully loaded memberInfo:", member);
            if (setMemberInfo) {
              setMemberInfo(member);
            } else {
              console.warn(
                "setMemberInfo not provided, cannot update memberInfo"
              );
            }
          } else {
            console.log("Failed to load memberInfo");
          }
        } catch (error) {
          console.warn("Failed to load memberInfo:", error);
        }
      }, 2000); // 2 second timeout

      return () => clearTimeout(timeout);
    }
  }, [
    blog?.id,
    memberInfo,
    loading,
    blog?.author,
    blog?.memberCode,
    setMemberInfo,
  ]);

  // Loading skeleton
  if (loading) {
    console.log("iOS BlogDetailMobile: Loading state -", {
      loading,
      hasBlog: !!blog,
      blogId: blog?.id,
    });
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
          background:
            themeMode === "dark" ? "#141311" : "rgba(253, 246, 227, 0.8)",
        }}
      >
        {NavigationBar}
        {AuthorBar}
        <ProCard
          ghost
          style={{
            minHeight: "100dvh",
            background:
              themeMode === "dark" ? "#1c1a17" : "rgba(253, 246, 227, 0.8)",
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
    console.log("iOS BlogDetailMobile: No blog -", {
      loading,
      hasBlog: !!blog,
      blogId: blog?.id,
    });
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
          background:
            themeMode === "dark" ? "#141311" : "rgba(253, 246, 227, 0.8)",
        }}
      >
        {NavigationBar}
        {AuthorBar}
        <ProCard
          ghost
          style={{
            minHeight: "100dvh",
            background:
              themeMode === "dark" ? "#1c1a17" : "rgba(253, 246, 227, 0.8)",
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

  // iOS fallback: Show content even without memberInfo
  if (isIOS() && blog?.content && !memberInfo && !loading) {
    console.log("iOS: Showing content without memberInfo -", {
      hasBlog: !!blog,
      hasContent: !!blog?.content,
      hasMemberInfo: !!memberInfo,
      loading,
      cachedDisplayContent: !!cachedDisplayContent,
    });
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
          background:
            themeMode === "dark" ? "#141311" : "rgba(253, 246, 227, 0.8)",
          height: "100dvh",
          maxHeight: "100dvh",
          width: "100vw",
          maxWidth: "100%",
          overflow: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          WebkitOverflowScrolling: "touch",
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        {NavigationBar}

        {/* Simplified Author Bar for iOS fallback */}
        <div
          style={{
            ...jpFont,
            background:
              themeMode === "dark"
                ? "linear-gradient(135deg, rgba(28,26,23,0.95) 0%, rgba(36,33,29,0.95) 100%)"
                : "linear-gradient(135deg, rgba(253, 246, 227, 0.95) 0%, rgba(244, 241, 232, 0.95) 100%)",
            borderBottom: "1px solid rgba(139, 69, 19, 0.15)",
            zIndex: 998,
            position: "fixed",
            top: 44,
            left: 0,
            right: 0,
            width: "100%",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            margin: 0,
            borderRadius: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              margin: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
            }}
          >
            <Space align="center" size="small">
              <Avatar
                src="https://via.placeholder.com/300x300?text=No+Image"
                size={32}
                style={{
                  border: "1px solid #fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                }}
              />
              <div>
                <Text strong style={{ color: "#3c2415", fontSize: "13px" }}>
                  {blog?.author || "Unknown Author"}
                </Text>
                <div
                  style={{
                    color: themeMode === "dark" ? "#cfbfa6" : "#5d4e37",
                    marginTop: 1,
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <CalendarOutlined
                    style={{ marginRight: 4, fontSize: "10px" }}
                  />
                  <Text>{blog?.date || "Unknown Date"}</Text>
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
                  color: themeMode === "dark" ? "#f5ede0" : "#3c2415",
                  fontSize: "12px",
                  lineHeight: 1.2,
                  display: "block",
                  wordWrap: "break-word",
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                }}
              >
                {displayTitle || blog?.title || "Loading title..."}
              </Text>
            </div>

            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => setDrawerVisible(true)}
              style={{
                color: themeMode === "dark" ? "#cfbfa6" : "#5d4e37",
                flexShrink: 0,
                padding: "4px 6px",
                height: "auto",
              }}
            />
          </div>
        </div>

        {/* scroll container */}
        <div
          ref={scrollWrapRef}
          style={{
            height: "calc(100dvh - 84px)",
            maxHeight: "calc(100dvh - 84px)",
            overflow: "auto",
            background:
              themeMode === "dark" ? "#1c1a17" : "rgba(253, 246, 227, 0.8)",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "none",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            width: "100%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            touchAction: "pan-y",
            paddingTop: 0,
            marginTop: "84px",
            marginBottom: 0,
            flexShrink: 1,
            WebkitBackfaceVisibility: "hidden",
            WebkitTransform: "translate3d(0,0,0)",
            transform: "translate3d(0,0,0)",
            willChange: "transform",
            contain: "paint layout style",
          }}
        >
          <ProCard
            ghost
            style={{
              background:
                themeMode === "dark"
                  ? "rgba(36,33,29,0.85)"
                  : "rgba(253, 246, 227, 0.8)",
              padding: 0,
              flex: 1,
              width: "100%",
              maxWidth: "100%",
              ...jpFont,
              position: "relative",
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
            bodyStyle={{
              padding: "0 0 0",
              margin: 0,
              width: "100%",
            }}
          >
            {/* Content */}
            <div
              style={{
                padding: "12px 12px 0 12px",
                WebkitTransform: "translateZ(0)",
                transform: "translateZ(0)",
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
              }}
            >
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
                  WebkitTransform: "translateZ(0)",
                  transform: "translateZ(0)",
                  WebkitBackfaceVisibility: "hidden",
                  backfaceVisibility: "hidden",
                  color: themeMode === "dark" ? "#f5ede0" : undefined,
                }}
                dangerouslySetInnerHTML={{
                  __html: optimizedHtml,
                }}
              />
            </div>
          </ProCard>
        </div>
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
        background:
          themeMode === "dark" ? "#141311" : "rgba(253, 246, 227, 0.8)",
        height: "100dvh",
        maxHeight: "100dvh",
        width: "100vw",
        maxWidth: "100%",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        /* iOS Safari specific fixes */
        WebkitOverflowScrolling: "touch",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
      {NavigationBar}
      {AuthorBar}

      {/* scroll container */}
      <div
        ref={scrollWrapRef}
        style={{
          height: "calc(100dvh - 84px)", // Trừ đi chiều cao của cả NavigationBar và AuthorBar
          maxHeight: "calc(100dvh - 84px)",
          overflow: "auto",
          background:
            themeMode === "dark" ? "#1c1a17" : "rgba(253, 246, 227, 0.8)",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "none",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          touchAction: "pan-y",
          paddingTop: 0, // Đã tính trong height
          marginTop: "84px",
          marginBottom: 0,
          flexShrink: 1,
          WebkitBackfaceVisibility: "hidden",
          WebkitTransform: "translate3d(0,0,0)",
          transform: "translate3d(0,0,0)",
          willChange: "transform",
          contain: "paint layout style",
          /* iOS Safari specific fixes - removed duplicate keys */
        }}
      >
        <ProCard
          ghost
          style={{
            background:
              themeMode === "dark"
                ? "rgba(36,33,29,0.85)"
                : "rgba(253, 246, 227, 0.8)",
            padding: 0,
            flex: 1,
            width: "100%",
            maxWidth: "100%",
            ...jpFont,
            position: "relative",
            /* iOS Safari specific fixes */
            WebkitTransform: "translateZ(0)",
            transform: "translateZ(0)",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
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
                background:
                  themeMode === "dark"
                    ? "rgba(28,26,23,0.95)"
                    : "rgba(253, 246, 227, 0.95)",
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
                    <LoadingOutlined
                      style={{ fontSize: 24, color: "#8b4513" }}
                      spin
                    />
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
          <div
            style={{
              padding: "12px 12px 0 12px",
              /* iOS Safari specific fixes */
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
          >
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
                /* iOS Safari specific fixes */
                WebkitTransform: "translateZ(0)",
                transform: "translateZ(0)",
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
              }}
              dangerouslySetInnerHTML={{
                __html: optimizedHtml,
              }}
            />

            {/* iOS Fallback - Show loading message if content is empty */}
            {isIOS() && !optimizedHtml && !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#666",
                  fontSize: "16px",
                }}
              >
                <LoadingOutlined style={{ fontSize: 24, marginBottom: 16 }} />
                <div>Đang tải nội dung...</div>
                <div style={{ fontSize: "14px", marginTop: 8, color: "#999" }}>
                  Nếu nội dung không hiển thị, vui lòng thử tải lại trang
                </div>
                <div style={{ fontSize: "12px", marginTop: 8, color: "#ccc" }}>
                  Debug:{" "}
                  {blog?.content
                    ? `Content: ${blog.content.length} chars`
                    : "No content"}{" "}
                  | {memberInfo ? `Author: ${memberInfo.name}` : "No author"} |{" "}
                  {displayTitle
                    ? `Title: ${displayTitle.substring(0, 20)}...`
                    : "No title"}
                </div>
                {retryCount < 3 && (
                  <Button
                    type="primary"
                    size="small"
                    style={{ marginTop: 16 }}
                    onClick={() => {
                      setRetryCount((prev) => prev + 1);
                      // Force refresh content
                      if (blog?.content) {
                        setCachedDisplayContent(blog.content);
                      }
                    }}
                  >
                    Thử lại ({retryCount}/3)
                  </Button>
                )}
                <Button
                  type="default"
                  size="small"
                  style={{ marginTop: 8, marginLeft: 8 }}
                  onClick={() => {
                    // Force reload the page
                    window.location.reload();
                  }}
                >
                  Tải lại trang
                </Button>
              </div>
            )}
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
        afterOpenChange={() => {
          // Header is always visible now
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
            background: ${themeMode === "dark" ? "#141311" : "#fdf6e3"};
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
            background: ${themeMode === "dark" ? "#24211d" : "#fdf6e3"};
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
            box-shadow: ${
              themeMode === "dark"
                ? "0 4px 12px rgba(0,0,0,0.45)"
                : "0 4px 12px rgba(0,0,0,0.08)"
            };
            border: 1px solid ${
              themeMode === "dark"
                ? "rgba(207,191,166,0.2)"
                : "rgba(0,0,0,0.06)"
            };
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
            background: ${
              themeMode === "dark"
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.05)"
            };
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
            color: ${themeMode === "dark" ? "#f5ede0" : "#1f2937"};
          }
          .jp-prose h1 { font-size: 1.6em; margin: 0.9em 0 0.45em; font-weight: 700; color: ${
            themeMode === "dark" ? "#f7e6c8" : "#111827"
          }; }
          .jp-prose h2 { font-size: 1.4em; margin: 0.85em 0 0.4em; font-weight: 700; color: ${
            themeMode === "dark" ? "#f7e6c8" : "#111827"
          }; }
          .jp-prose h3 { font-size: 1.25em; margin: 0.8em 0 0.3em; font-weight: 600; color: ${
            themeMode === "dark" ? "#f7e6c8" : "#111827"
          }; }
          .jp-prose blockquote {
            border-left: 4px solid ${
              themeMode === "dark" ? "#9c6b3f" : "#e9d5ff"
            }; background: ${
        themeMode === "dark" ? "rgba(156,107,63,0.12)" : "#faf5ff"
      };
            padding: 12px 16px; border-radius: 8px; margin: 1em 0;
            font-size: 1.05em; color: ${
              themeMode === "dark" ? "#cfbfa6" : "#4b5563"
            };
          }
          .jp-prose a { color: ${
            themeMode === "dark" ? "#d2a86a" : "#9333ea"
          }; text-decoration: none; }
          .jp-prose a:hover { text-decoration: underline; }
          .jp-prose ul, .jp-prose ol { padding-left: 1.2em; margin: 0.8em 0; }
          .jp-prose li { margin: 0.4em 0; color: ${
            themeMode === "dark" ? "#eae2d3" : "#374151"
          }; }
          .jp-prose strong { color: ${
            themeMode === "dark" ? "#f7e6c8" : "#111827"
          }; font-weight: 600; }
          
          /* iOS Safari specific fixes */
          @media screen and (-webkit-min-device-pixel-ratio: 0) {
            .ant-pro-page-container {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
              -webkit-backface-visibility: hidden;
              backface-visibility: hidden;
            }
            
            .ant-pro-card {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
              -webkit-backface-visibility: hidden;
              backface-visibility: hidden;
            }
            
            .jp-prose {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
              -webkit-backface-visibility: hidden;
              backface-visibility: hidden;
            }
          }
          
          /* iOS 18+ specific optimizations */
          @supports (content-visibility: auto) {
            .jp-prose img {
              content-visibility: auto;
              contain-intrinsic-size: 200px;
            }
          }
          
          /* iPhone XS specific optimizations */
          @media screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) {
            .jp-prose img {
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
          }
        `}</style>
    </PageContainer>
  );
}
