import { Space } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import { t } from "./constants";

export default function ReadingTimeCard({ readMinutes, language, themeMode, isMobile }) {
    const isDark = themeMode === "dark";

    return (
        <div
            style={{
                borderRadius: 2,
                background: isDark
                    ? "rgba(36, 33, 29, 0.95)"
                    : "rgba(255, 255, 255, 0.9)",
                border: isDark
                    ? "1px solid rgba(207,191,166,0.2)"
                    : "1px solid rgba(0,0,0,0.05)",
                boxShadow: isDark
                    ? "0 4px 12px rgba(0,0,0,0.3)"
                    : "0 2px 8px rgba(0,0,0,0.05)",
                padding: "16px 20px",
                position: "relative",
            }}
        >
            {/* Header with icon */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                color: isDark ? "#d2a86a" : "#8b4513",
                borderBottom: `1px dashed ${isDark ? "rgba(207,191,166,0.2)" : "rgba(139, 69, 19, 0.1)"}`,
                paddingBottom: 8
            }}>
                <ReadOutlined style={{ fontSize: 16 }} />
                <span style={{
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: isDark ? "serif" : "'Yomogi', cursive",
                    letterSpacing: 0.5
                }}>
                    {t.readTime[language]}
                </span>
            </div>

            {/* Content - Stamp Style */}
            <div
                style={{
                    textAlign: "center",
                    position: "relative"
                }}
            >
                <div
                    style={{
                        fontSize: isMobile ? 28 : 36,
                        fontWeight: 700,
                        color: isDark ? "#f5ede0" : "#2d1b0e",
                        lineHeight: 1,
                        marginBottom: 4,
                        fontFamily: "'Playfair Display', serif"
                    }}
                >
                    {readMinutes}
                </div>
                <div
                    style={{
                        fontSize: isMobile ? 12 : 13,
                        color: isDark ? "#cfbfa6" : "#888",
                        fontWeight: 400,
                        letterSpacing: 1,
                        textTransform: "uppercase"
                    }}
                >
                    {t.minutes[language]}
                </div>

                {/* Decorative circle stamp effect */}
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%) rotate(-15deg)",
                    width: 60,
                    height: 60,
                    border: `2px solid ${isDark ? "rgba(210, 168, 106, 0.15)" : "rgba(139, 69, 19, 0.08)"}`,
                    borderRadius: "50%",
                    pointerEvents: "none"
                }} />
            </div>
        </div>
    );
}
