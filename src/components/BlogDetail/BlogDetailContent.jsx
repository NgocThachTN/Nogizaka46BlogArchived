import { Card, Typography, Space, Divider, Button } from "antd";
import { CalendarOutlined, LinkOutlined } from "@ant-design/icons";
import { jpFont, bookFont, t } from "./constants";
import TranslationOverlay from "./TranslationOverlay";

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
    return (
        <Card
            className="diary-paper"
            style={{
                borderRadius: 16,
                background:
                    themeMode === "dark"
                        ? "linear-gradient(to bottom, #2a2520 0%, #24211d 100%)"
                        : "linear-gradient(to bottom, #FFF9E6 0%, #FFF5D6 100%)",
                boxShadow:
                    themeMode === "dark"
                        ? "0 4px 24px rgba(0,0,0,0.4), inset 0 0 60px rgba(139, 115, 85, 0.05)"
                        : "0 4px 24px rgba(139, 69, 19, 0.15), inset 0 0 60px rgba(139, 69, 19, 0.03)",
                border:
                    themeMode === "dark"
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
                backgroundImage:
                    themeMode === "dark"
                        ? `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 115, 85, 0.2) calc(100% - 1px), rgba(139, 115, 85, 0.2) 100%)`
                        : `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(139, 69, 19, 0.15) calc(100% - 1px), rgba(139, 69, 19, 0.15) 100%)`,

                // Size is exactly equal to Line Height in ems
                backgroundSize: `100% ${sz.lh}em`,
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
                    <span style={{ fontFamily: bookFont[language].fontFamily }}>
                        {blog.date}
                    </span>
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
                    overflowWrap: "anywhere", // Prevents overflow by breaking long strings/urls anywhere if needed
                    wordBreak: "normal", // Use normal CJK breaking rules
                    lineBreak: "strict", // Strict Japanese kinsoku shori (prevent bad line breaks)
                    whiteSpace: "pre-wrap", // Preserve whitespace/newlines from API content

                    textAlign: "left",
                    ...bookFont[language],
                }}
                dangerouslySetInnerHTML={{ __html: displayContent }}
            />

            {/* Bottom nav (tối giản) */}
            <div style={{ marginTop: 28 }}>
                {blog.originalUrl && (
                    <Button
                        icon={<LinkOutlined />}
                        onClick={() => window.open(blog.originalUrl, "_blank")}
                    >
                        {t.openSource[language]}
                    </Button>
                )}
            </div>
        </Card>
    );
}
