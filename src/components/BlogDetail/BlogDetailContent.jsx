import { useState, useCallback, useEffect, memo, useRef } from "react";
import { Typography, Space, Button } from "antd";
import { CalendarOutlined, LinkOutlined, BookOutlined } from "@ant-design/icons";
import { bookFont, t } from "./constants";
import TranslationOverlay from "./TranslationOverlay";
import ImageLightbox from "./ImageLightbox";
import VocabPopup from "./VocabPopup";
import VocabPanel from "./VocabPanel";
import SelectionTooltip from "./SelectionTooltip";
import { isJapanese, getSavedVocab } from "../../utils/jishoService";

const { Title, Text } = Typography;

const BlogBody = memo(function BlogBody({ contentRef, displayContent, sz, language, isDark, onClick, onDoubleClick, tategaki }) {
    const wrapperRef = useRef(null);
    const innerRef = useRef(null);
    const grandParentRef = useRef(null);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [snappedWidth, setSnappedWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
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
        };

        resizeSnapper();
        window.addEventListener("resize", resizeSnapper);

        let ro = null;
        if (grandParentRef.current) {
            ro = new ResizeObserver(() => {
                resizeSnapper();
            });
            ro.observe(grandParentRef.current);
        }

        return () => {
            window.removeEventListener("resize", resizeSnapper);
            if (ro) ro.disconnect();
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

        const ro = new ResizeObserver(() => {
            updateDimensions();
        });
        ro.observe(inner);

        const t1 = setTimeout(updateDimensions, 50);
        const t2 = setTimeout(updateDimensions, 300);

        return () => {
            ro.disconnect();
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [tategaki, snappedWidth, displayContent, sz]);

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

    if (tategaki) {
        const pageH = "calc(100vh - 280px)";
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
                            position: "absolute",
                            right: 0,
                            top: 0,
                            transform: `translateX(${offsetPx}px)`,
                            transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                            fontSize: sz.px,
                            lineHeight: `${lineH}px`,
                            letterSpacing: 0.5,
                            color: isDark ? "#f5ede0" : "#2c2c2c",
                            fontFamily: `${bookFont[language].fontFamily}, "Noto Serif JP", serif`,
                            textAlign: "justify",
                        }}
                        onClick={onClick}
                        onDoubleClick={onDoubleClick}
                        dangerouslySetInnerHTML={{ __html: displayContent }}
                    />
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
                animation: "content-reveal 0.7s cubic-bezier(0.22,1,0.36,1) 0.6s both",
                fontSize: sz.px,
                lineHeight: `${lineH}px`,
                letterSpacing: language === "ja" ? 0.5 : 0.3,
                color: isDark ? "#f5ede0" : "#2c2c2c",
                fontFamily: `${bookFont[language].fontFamily}, "Noto Serif JP", serif`,
                overflowWrap: "anywhere",
                wordBreak: "normal",
                lineBreak: "strict",
                whiteSpace: "normal",
                textAlign: "left",
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
    readingMode,
    contentRef,
    translating,
    translationProgress,
    tategaki,
}) {
    const isDark = themeMode === "dark";

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
                    borderRadius: 2,
                    background: isDark
                        ? "linear-gradient(to bottom, #2a2520 0%, #24211d 100%)"
                        : "linear-gradient(to bottom, #FFF9E6 0%, #FFF5D6 100%)",
                    boxShadow: isDark
                        ? "0 4px 24px rgba(0,0,0,0.4), inset 0 0 60px rgba(139, 115, 85, 0.05)"
                        : "0 4px 24px rgba(139, 69, 19, 0.15), inset 0 0 60px rgba(139, 69, 19, 0.03)",
                    border: isDark
                        ? "1px solid rgba(139, 115, 85, 0.2)"
                        : "1px solid rgba(139, 69, 19, 0.15)",
                    position: "relative",
                    overflow: tategaki ? "visible" : "hidden",
                    minHeight: tategaki ? undefined : 600,
                    transition: "all 0.3s ease",
                    isolation: "isolate",
                    willChange: "auto",

                    // Paper texture lines — vertical lines for tategaki, horizontal for normal
                    backgroundImage: tategaki
                        ? (isDark
                            ? `linear-gradient(to right, transparent 0%, transparent calc(100% - 1px), rgba(139, 115, 85, 0.2) calc(100% - 1px), rgba(139, 115, 85, 0.2) 100%)`
                            : `linear-gradient(to right, transparent 0%, transparent calc(100% - 1px), rgba(139, 69, 19, 0.15) calc(100% - 1px), rgba(139, 69, 19, 0.15) 100%)`)
                        : (isDark
                            ? `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 115, 85, 0.2) calc(100% - 1px), rgba(139, 115, 85, 0.2) 100%)`
                            : `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 69, 19, 0.15) calc(100% - 1px), rgba(139, 69, 19, 0.15) 100%)`),
                    backgroundSize: tategaki ? `${sz.lh}em 100%` : `100% ${sz.lh}em`,

                    // Padding
                    paddingTop: tategaki ? 32 : `${sz.lh + (sz.lh - 1) / 2 + (language === "ja" ? 0 : 0.3)}em`,
                    paddingRight: tategaki ? 32 : (readingMode ? "8%" : 42),
                    paddingBottom: tategaki ? 32 : (readingMode ? 60 : 42),
                    paddingLeft: tategaki ? 32 : (readingMode ? "8%" : 42),
                }}
            >
                {/* Overlay translating */}
                <TranslationOverlay
                    translating={translating}
                    translationProgress={translationProgress}
                    themeMode={themeMode}
                />

                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        marginBottom: window.innerWidth < 768 ? 16 : 24,
                        width: "100%",
                        padding: "0 4px",
                        animation: "ink-appear 0.5s ease 0.35s both",
                    }}
                >
                    {/* Journal Date */}
                    <div
                        style={{
                            color: isDark ? "#b8a586" : "#666",
                            fontSize: window.innerWidth < 768 ? 16 : 18,
                            fontFamily: bookFont[language].fontFamily,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        <span style={{ fontFamily: bookFont[language].fontFamily }}>
                            {blog.date}
                        </span>
                    </div>

                    {/* Blog Title */}
                    <div style={{ textAlign: "right", maxWidth: "70%" }}>
                        <Space direction="vertical" size={2}>
                            <Text
                                type="secondary"
                                style={{
                                    letterSpacing: 2,
                                    fontSize: 13,
                                    textTransform: "uppercase",
                                    fontFamily: bookFont[language].fontFamily,
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

                {/* Animated ink divider */}
                <div style={{
                    margin: "19px 0 29px",
                    height: 1,
                    background: isDark ? "rgba(207,191,166,0.2)" : "rgba(139, 69, 19, 0.15)",
                    transformOrigin: "left center",
                    animation: "line-draw 0.6s cubic-bezier(0.22,1,0.36,1) 0.5s both",
                }} />

                {/* Content Body */}
                <BlogBody
                    contentRef={contentRef}
                    displayContent={displayContent}
                    sz={sz}
                    language={language}
                    isDark={isDark}
                    onClick={handleContentClick}
                    onDoubleClick={handleContentDblClick}
                    tategaki={tategaki}
                />

                {/* Footer + vocab button */}
                <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {/* Nút mở từ điển */}
                    <button
                        onClick={() => setVocabPanelOpen(true)}
                        title="Từ vựng đã lưu"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 12px",
                            borderRadius: 20,
                            border: isDark ? "1px solid rgba(210,168,106,0.3)" : "1px solid rgba(139,69,19,0.25)",
                            background: isDark ? "rgba(210,168,106,0.1)" : "rgba(139,69,19,0.06)",
                            color: isDark ? "#d2a86a" : "#8B4513",
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "'Mali', 'Caveat', serif",
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
