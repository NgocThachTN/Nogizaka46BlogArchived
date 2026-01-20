import { ProCard } from "@ant-design/pro-components";
import { Space } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import { t } from "./constants";

export default function ReadingTimeCard({ readMinutes, language, themeMode, isMobile }) {
    return (
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
    );
}
