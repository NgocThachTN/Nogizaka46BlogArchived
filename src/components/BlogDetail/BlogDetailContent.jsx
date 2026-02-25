import { useState, useCallback, useEffect } from "react";
import { Typography, Space, Button } from "antd";
import { CalendarOutlined, LinkOutlined } from "@ant-design/icons";
import { bookFont, t } from "./constants";
import TranslationOverlay from "./TranslationOverlay";
import ImageLightbox from "./ImageLightbox";

const { Title, Text } = Typography;

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
                onClick={handleContentClick}
                dangerouslySetInnerHTML={{ __html: displayContent }}
            />

            {/* Footer */}
            <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
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
        </>
    );
}
