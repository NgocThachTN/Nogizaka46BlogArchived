// @ts-nocheck
import { useState, useCallback, useEffect, memo, useRef, useMemo } from "react";
import { Typography, Space, Button } from "antd";
import { CalendarOutlined, LinkOutlined, BookOutlined } from "@ant-design/icons";
import { getReadingFontFamily, t } from "./constants";
import ImageLightbox from "./ImageLightbox";
import VocabPopup from "./VocabPopup";
import VocabPanel from "./VocabPanel";
import SelectionTooltip from "./SelectionTooltip";
import { isJapanese, getSavedVocab } from "../../lib/jishoService";
import { BlogDetailTranslationSkeleton } from "../../../../shared/components/PageSkeletons";

const { Title, Text } = Typography;

const BlogBody = memo(function BlogBody({ contentRef, displayContent, sz, language, isDark, onClick, onDoubleClick, tategaki, readingFontFamily }) {
    const wrapperRef = useRef(null);
    const innerRef = useRef(null);
    const grandParentRef = useRef(null);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [snappedWidth, setSnappedWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const [viewportH, setViewportH] = useState(() => window.innerHeight);
    const lineH = Math.round(sz.px * sz.lh);

    useEffect(() => {
        if (!tategaki) {
            setPage(0);
            setTotalPages(1);
            setSnappedWidth(0);
            setContentWidth(0);
            return;
        }

        const resizeSnapper = () => {
            if (!grandParentRef.current) return;
            const availableW = grandParentRef.current.clientWidth;
            // Snap to exact multiple of lineH to prevent text columns from bleeding
            const snapped = Math.floor(availableW / lineH) * lineH;
            setSnappedWidth(snapped);
            setViewportH(prev => {
                const h = window.innerHeight;
                return Math.abs(h - prev) > 80 ? h : prev;
            });
        };

        let resizeTimer = null;
        const debouncedResizeSnapper = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resizeSnapper, 200);
        };

        resizeSnapper();
        window.addEventListener("resize", debouncedResizeSnapper);

        let ro = null;
        if (grandParentRef.current) {
            ro = new ResizeObserver(() => {
                debouncedResizeSnapper();
            });
            ro.observe(grandParentRef.current);
        }

        return () => {
            window.removeEventListener("resize", debouncedResizeSnapper);
            if (ro) ro.disconnect();
            clearTimeout(resizeTimer);
        };
    }, [tategaki, lineH]);

    useEffect(() => {
        if (!tategaki || !snappedWidth) return;

        const inner = innerRef.current;
        if (!inner) return;

        const updateDimensions = () => {
            const currentScrollW = inner.scrollWidth;
            if (currentScrollW > 0) {
                setContentWidth(currentScrollW);
                const pages = Math.max(1, Math.ceil(currentScrollW / snappedWidth));
                setTotalPages(pages);
                setPage(p => Math.min(p, pages - 1));
            }
        };

        // Do not use ResizeObserver on `inner` in vertical-rl with max-content width!
        // It causes an infinite layout thrashing loop in Chrome because measuring scrollWidth
        // affects max-content which re-triggers the observer.
        // Initial measurements for text, but images handled in a separate effect
        const t1 = setTimeout(updateDimensions, 50);
        const t2 = setTimeout(updateDimensions, 400);
        const t3 = setTimeout(updateDimensions, 1000);

        // Re-measure when window resizes (since height changes, affecting vertical text flow width)
        let resizeTimer;
        const handleWindowResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateDimensions, 200);
        };
        window.addEventListener("resize", handleWindowResize);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(resizeTimer);
            window.removeEventListener("resize", handleWindowResize);
        };
    }, [tategaki, snappedWidth, displayContent, sz]);

    useEffect(() => {
        if (!tategaki) return;
        const inner = innerRef.current;
        if (!inner) return;

        const imgs = Array.from(inner.querySelectorAll("img"));

        const lockDimensions = (img) => {
            if (img.clientWidth && img.clientHeight) {
                // Lock the physical footprint. If texture drops, layout won't thrash.
                img.style.minWidth = img.clientWidth + 'px';
                img.style.minHeight = img.clientHeight + 'px';
            }
        };

        imgs.forEach(img => {
            if (img.complete) {
                lockDimensions(img);
            } else {
                img.addEventListener("load", () => lockDimensions(img), { once: true });
            }
        });
    }, [displayContent, tategaki, snappedWidth]);

    const goNext = useCallback(() => setPage(p => Math.min(p + 1, totalPages - 1)), [totalPages]);
    const goPrev = useCallback(() => setPage(p => Math.max(p - 1, 0)), []);

    useEffect(() => {
        if (!tategaki) return;
        const handleKey = (e) => {
            if (e.key === "ArrowLeft") { goNext(); e.preventDefault(); }
            else if (e.key === "ArrowRight") { goPrev(); e.preventDefault(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [tategaki, goNext, goPrev]);

    const processedContent = useMemo(() => {
        if (!tategaki) return displayContent;
        // Strip lazy loading and async decoding from the raw HTML string BEFORE it mounts
        // Because if it mounts as lazy, the browser sets up an IntersectionObserver that fires mid-transition,
        // causing the image to blank out and flash white during page turns.
        return displayContent
            .replace(/loading=["']lazy["']/gi, 'loading="eager"')
            .replace(/decoding=["']async["']/gi, 'decoding="sync"');
    }, [displayContent, tategaki]);

    if (tategaki) {
        const pageH = Math.max(400, viewportH - 280) + "px";
        const offsetPx = page * snappedWidth;

        return (
            <div style={{ position: "relative", width: "100%", padding: "0 24px" }} ref={grandParentRef}>
                <div
                    ref={wrapperRef}
                    style={{
                        width: snappedWidth || "100%",
                        margin: "0 auto",
                        height: pageH,
                        overflow: "hidden",
                        position: "relative",
                        writingMode: "horizontal-tb", // Protect transform from vertical-rl bugs
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            height: "100%",
                            display: "flex",
                            flexDirection: "row-reverse", // Native right-to-left layout direction
                            transform: `translateX(${offsetPx}px) translateZ(0)`,
                            willChange: "transform",
                            transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        }}
                    >
                        <div
                            ref={(node) => {
                                innerRef.current = node;
                                if (contentRef) contentRef.current = node;
                            }}
                            className="jp-prose tategaki-text"
                            style={{
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                                height: "100%",
                                width: "max-content",
                                fontSize: sz.px,
                                lineHeight: `${lineH}px`,
                                letterSpacing: 0.5,
                                color: isDark ? "#f5ede0" : "#2c2c2c",
                                fontFamily: readingFontFamily,
                                textAlign: "left",
                                "--blog-detail-font-family": readingFontFamily,
                            }}
                            onClick={onClick}
                            onDoubleClick={onDoubleClick}
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />
                    </div>
                </div>

                {/* Page controls */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    marginTop: 20,
                }}>
                    <button
                        onClick={goPrev}
                        disabled={page <= 0}
                        aria-label="前のページ"
                        style={{
                            width: 44, height: 44,
                            borderRadius: "50%",
                            border: `1px solid ${isDark ? "rgba(210,168,106,0.35)" : "rgba(139,69,19,0.25)"}`,
                            background: isDark ? "rgba(210,168,106,0.08)" : "rgba(139,69,19,0.05)",
                            color: page <= 0 ? (isDark ? "#444" : "#ccc") : (isDark ? "#d2a86a" : "#8B4513"),
                            cursor: page <= 0 ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20, fontWeight: 700,
                            transition: "all 0.2s",
                            opacity: page <= 0 ? 0.4 : 1,
                        }}
                    >
                        ▶
                    </button>
                    <span style={{
                        fontFamily: "'Noto Serif JP', serif",
                        fontSize: 15,
                        color: isDark ? "#b8a586" : "#8B4513",
                        letterSpacing: 2,
                        userSelect: "none",
                    }}>
                        {page + 1} / {totalPages} 頁
                    </span>
                    <button
                        onClick={goNext}
                        disabled={page >= totalPages - 1}
                        aria-label="次のページ"
                        style={{
                            width: 44, height: 44,
                            borderRadius: "50%",
                            border: `1px solid ${isDark ? "rgba(210,168,106,0.35)" : "rgba(139,69,19,0.25)"}`,
                            background: isDark ? "rgba(210,168,106,0.08)" : "rgba(139,69,19,0.05)",
                            color: page >= totalPages - 1 ? (isDark ? "#444" : "#ccc") : (isDark ? "#d2a86a" : "#8B4513"),
                            cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20, fontWeight: 700,
                            transition: "all 0.2s",
                            opacity: page >= totalPages - 1 ? 0.4 : 1,
                        }}
                    >
                        ◀
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={contentRef}
            className="jp-prose"
            style={{
                animation: "content-reveal 0.45s ease 0.15s both",
                fontSize: sz.px,
                lineHeight: `${lineH}px`,
                letterSpacing: language === "ja" ? 0.5 : 0.3,
                color: isDark ? "#f5ede0" : "#2c2c2c",
                fontFamily: readingFontFamily,
                overflowWrap: "anywhere",
                wordBreak: "normal",
                lineBreak: "strict",
                whiteSpace: "normal",
                textAlign: "left",
                "--blog-detail-font-family": readingFontFamily,
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            dangerouslySetInnerHTML={{ __html: displayContent }}
        />
    );
});

export default function BlogDetailContent({
    blog,
    displayTitle,
    displayContent,
    language,
    themeMode,
    fontSizeKey,
    sz,
    readingFontPreset,
    readingMode,
    contentRef,
    translating,
    translationProgress,
    tategaki,
}) {
    const isDark = themeMode === "dark";
    const readingFontFamily = getReadingFontFamily(readingFontPreset, language);

    // --- Lightbox state ---
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState("");
    const [allImages, setAllImages] = useState([]);

    // Thu thập tất cả ảnh trong content khi displayContent thay đổi
    useEffect(() => {
        if (!contentRef?.current) return;
        const imgs = Array.from(contentRef.current.querySelectorAll("img"))
            .map(img => img.src)
            .filter(Boolean);
        setAllImages(imgs);
    }, [displayContent, contentRef]);

    const handleContentClick = useCallback((e) => {
        const target = e.target;
        if (target.tagName === "IMG" && target.src) {
            setLightboxUrl(target.src);
            setLightboxOpen(true);
        }
    }, []);

    // --- Vocabulary (tra từ) state ---
    const [vocabWord, setVocabWord] = useState("");
    const [vocabAnchorRect, setVocabAnchorRect] = useState(null);
    const [vocabOpen, setVocabOpen] = useState(false);
    const [vocabPanelOpen, setVocabPanelOpen] = useState(false);
    const [vocabRefreshKey, setVocabRefreshKey] = useState(0);
    const [savedCount, setSavedCount] = useState(() => getSavedVocab().length);

    // Double-click trên text → tra từ tiếng Nhật
    const handleContentDblClick = useCallback((e) => {
        if (e.target.tagName === "IMG") return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const selected = selection.toString().trim();
        if (!selected || selected.length > 20) return; // Không tra cụm quá dài
        if (!isJapanese(selected)) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setVocabWord(selected);
        setVocabAnchorRect({ ...rect.toJSON() });
        setVocabOpen(true);
    }, []);

    // Callback từ SelectionTooltip khi user nhấn "Tra từ"
    const openVocabFromSelection = useCallback((word, rect) => {
        if (!word) return;
        setVocabWord(word);
        setVocabAnchorRect(rect);
        setVocabOpen(true);
    }, []);

    return (
        <>
            <div
                className={`diary-sheet${tategaki ? " tategaki-mode" : ""}`}
                style={{
                    borderRadius: tategaki ? 6 : 4,
                    background: isDark
                        ? "linear-gradient(180deg, rgba(40,35,31,0.98) 0%, rgba(29,26,24,0.98) 100%)"
                        : "linear-gradient(180deg, rgba(255,252,245,0.98) 0%, rgba(252,247,238,0.98) 100%)",
                    boxShadow: isDark
                        ? "0 18px 48px rgba(0,0,0,0.34)"
                        : "0 20px 48px rgba(124, 90, 45, 0.14)",
                    border: isDark
                        ? "1px solid rgba(198, 171, 133, 0.16)"
                        : "1px solid rgba(166, 128, 78, 0.14)",
                    position: "relative",
                    overflow: tategaki ? "visible" : "hidden",
                    minHeight: tategaki ? undefined : 600,
                    transition: "all 0.3s ease",
                    isolation: "isolate",
                    willChange: "auto",

                    // Paper texture lines — vertical lines for tategaki, horizontal for normal
                    // Padding
                    paddingTop: tategaki ? 32 : (window.innerWidth < 768 ? 28 : 36),
                    paddingRight: tategaki ? 32 : (readingMode ? "7%" : (window.innerWidth < 768 ? 22 : 40)),
                    paddingBottom: tategaki ? 32 : (readingMode ? 56 : (window.innerWidth < 768 ? 28 : 38)),
                    paddingLeft: tategaki ? 32 : (readingMode ? "7%" : (window.innerWidth < 768 ? 22 : 40)),
                }}
            >
                {translating && language !== "ja" ? (
                    <BlogDetailTranslationSkeleton
                        themeMode={themeMode}
                        translationProgress={translationProgress}
                        showHeader
                    />
                ) : (
                    <>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "space-between",
                                flexWrap: "nowrap",
                                gap: window.innerWidth < 768 ? 12 : 20,
                                marginBottom: window.innerWidth < 768 ? 16 : 20,
                                width: "100%",
                                padding: 0,
                                animation: "ink-appear 0.35s ease both",
                            }}
                        >
                            {/* Journal Date */}
                            <div
                                style={{
                                    color: isDark ? "#c6b28f" : "#7f6a53",
                                    fontSize: window.innerWidth < 768 ? 13 : 14,
                                    fontFamily: readingFontFamily,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 12px",
                                    borderRadius: 999,
                                    background: isDark ? "rgba(198,178,143,0.08)" : "rgba(160,121,70,0.08)",
                                    border: isDark ? "1px solid rgba(198,178,143,0.12)" : "1px solid rgba(160,121,70,0.12)",
                                }}
                            >
                                <CalendarOutlined />
                                <span style={{ fontFamily: readingFontFamily }}>
                                    {blog.date}
                                </span>
                            </div>

                            {/* Blog Title */}
                            <div style={{ textAlign: "right", maxWidth: "70%", flex: "0 1 70%", minWidth: 0, marginLeft: "auto" }}>
                                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                                    <Text
                                        style={{
                                            color: isDark ? "#bca885" : "#8e7556",
                                            letterSpacing: 1.6,
                                            fontSize: 11,
                                            textTransform: "uppercase",
                                            fontFamily: "system-ui, sans-serif",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {t.blogArticle[language]}
                                    </Text>
                                    <Title
                                        level={3}
                                        style={{
                                            margin: 0,
                                            lineHeight: 1.4,
                                            fontSize: window.innerWidth < 768 ? 21 : 28,
                                            wordWrap: "break-word",
                                            wordBreak: "break-word",
                                            whiteSpace: "normal",
                                            color: isDark ? "#f7f0e4" : "#2f2418",
                                            fontFamily: readingFontFamily,
                                            fontWeight: language === "ja" ? 600 : 700,
                                            maxWidth: "100%",
                                        }}
                                    >
                                        {displayTitle}
                                    </Title>
                                </Space>
                            </div>
                        </div>

                        {/* Animated ink divider */}
                        <div style={{
                            margin: window.innerWidth < 768 ? "16px 0 24px" : "18px 0 28px",
                            height: 1,
                            background: isDark
                                ? "linear-gradient(90deg, rgba(198,178,143,0.3) 0%, rgba(198,178,143,0.08) 100%)"
                                : "linear-gradient(90deg, rgba(160,121,70,0.26) 0%, rgba(160,121,70,0.08) 100%)",
                            transformOrigin: "left center",
                            animation: "line-draw 0.35s ease 0.1s both",
                        }} />

                        <BlogBody
                            contentRef={contentRef}
                            displayContent={displayContent}
                            sz={sz}
                            language={language}
                            isDark={isDark}
                            onClick={handleContentClick}
                            onDoubleClick={handleContentDblClick}
                            tategaki={tategaki}
                            readingFontFamily={readingFontFamily}
                        />
                    </>
                )}

                {/* Footer + vocab button */}
                <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {/* Nút mở từ điển */}
                    <button
                        onClick={() => setVocabPanelOpen(true)}
                        title="Từ vựng đã lưu"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 999,
                            border: isDark ? "1px solid rgba(198,178,143,0.18)" : "1px solid rgba(160,121,70,0.16)",
                            background: isDark ? "rgba(198,178,143,0.08)" : "rgba(160,121,70,0.08)",
                            color: isDark ? "#dcc49e" : "#7a5a39",
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "system-ui, sans-serif",
                            fontWeight: 600,
                            transition: "all 0.2s ease",
                            position: "relative",
                        }}
                    >
                        <BookOutlined style={{ fontSize: 13 }} />
                        単語帳
                        {savedCount > 0 && (
                            <span style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                minWidth: 16,
                                height: 16,
                                borderRadius: 8,
                                background: isDark ? "#d2a86a" : "#8B4513",
                                color: isDark ? "#1e1a15" : "#fff",
                                fontSize: 9,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 3px",
                                fontFamily: "system-ui, sans-serif",
                            }}>
                                {savedCount}
                            </span>
                        )}
                    </button>

                    {blog.originalUrl && (
                        <Button
                            type="text"
                            icon={<LinkOutlined />}
                            onClick={() => window.open(blog.originalUrl, "_blank")}
                            style={{
                                color: isDark ? "#999" : "#666",
                                fontSize: 12
                            }}
                        >
                            {t.openSource[language]}
                        </Button>
                    )}
                </div>
            </div>

            {/* Image Lightbox */}
            <ImageLightbox
                open={lightboxOpen}
                imageUrl={lightboxUrl}
                allImages={allImages}
                themeMode={themeMode}
                onClose={() => setLightboxOpen(false)}
            />

            {/* Vocabulary popup (tra từ khi double-click) */}
            {vocabOpen && (
                <VocabPopup
                    word={vocabWord}
                    anchorRect={vocabAnchorRect}
                    themeMode={themeMode}
                    onClose={() => setVocabOpen(false)}
                    onSaved={() => {
                        setVocabRefreshKey((k) => k + 1);
                        setSavedCount(getSavedVocab().length);
                    }}
                />
            )}

            {/* Selection tooltip — bôi text → nút Dịch / Tra từ */}
            <SelectionTooltip
                containerRef={contentRef}
                themeMode={themeMode}
                language={language}
                onVocabLookup={openVocabFromSelection}
                vocabOpen={vocabOpen}
            />

            {/* Vocabulary panel (danh sách từ đã lưu) */}
            <VocabPanel
                open={vocabPanelOpen}
                themeMode={themeMode}
                refreshKey={vocabRefreshKey}
                onClose={() => {
                    setVocabPanelOpen(false);
                    setSavedCount(getSavedVocab().length);
                }}
            />
        </>
    );
}
