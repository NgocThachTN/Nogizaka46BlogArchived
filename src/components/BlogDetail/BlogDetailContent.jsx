import { useState, useCallback, useEffect, memo } from "react";
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

/**
 * Tách content body thành component riêng + memo
 * → tránh re-render (và re-trigger animation) khi state vocab thay đổi
 */
const BlogBody = memo(function BlogBody({ contentRef, displayContent, sz, language, isDark, onClick, onDoubleClick }) {
  return (
    <div
      ref={contentRef}
      className="jp-prose"
      style={{
        animation: "content-reveal 0.7s cubic-bezier(0.22,1,0.36,1) 0.6s both",
        fontSize: sz.px,
        lineHeight: `${Math.round(sz.px * sz.lh)}px`,
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
            className="diary-sheet"
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
                overflow: "hidden",
                minHeight: 600,
                transition: "all 0.3s ease",
                // Tạo stacking context riêng → tránh bị repaint khi overlay mở
                isolation: "isolate",
                willChange: "auto",

                // Paper texture lines
                backgroundImage: isDark
                    ? `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 115, 85, 0.2) calc(100% - 1px), rgba(139, 115, 85, 0.2) 100%)`
                    : `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 69, 19, 0.15) calc(100% - 1px), rgba(139, 69, 19, 0.15) 100%)`,
                backgroundSize: `100% ${sz.lh}em`,

                // Padding ensures text sits on lines
                paddingTop: `${sz.lh + (sz.lh - 1) / 2 + (language === "ja" ? 0 : 0.3)}em`,
                paddingRight: readingMode ? "8%" : 42,
                paddingBottom: readingMode ? 60 : 42,
                paddingLeft: readingMode ? "8%" : 42,
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
