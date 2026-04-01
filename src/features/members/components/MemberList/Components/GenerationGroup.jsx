import React from "react";
import { Space, Tag, List } from "antd";
import { StarOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import MemberCard from "./MemberCard";

// Translation keys
const t = {
    other: { ja: "その他", en: "Other", vi: "Khác" },
};

const GenerationGroup = ({ gen, items, language, themeMode, onMemberClick, bookFont }) => {
    // Ensure language is valid, fallback to "ja"
    const currentLanguage = ["ja", "en", "vi"].includes(language)
        ? language
        : "ja";
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

    const fontStyle = {
        fontFamily: bookFont?.[currentLanguage]?.fontFamily,
    };

    return (
        <div key={gen} style={{ marginBottom: 40 }}>
            {/* Generation Title as a Section Header */}
            <div style={{
                borderBottom: themeMode === "dark" ? "2px solid #8b7355" : "2px solid #d4c5a9",
                marginBottom: 24,
                paddingBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 12
            }}>
                <StarOutlined style={{ color: themeMode === "dark" ? "#d2a86a" : "#8b4513", fontSize: 24 }} />
                <span style={{
                    ...fontStyle,
                    fontWeight: 700,
                    fontSize: 28,
                    color: themeMode === "dark" ? "#d2a86a" : "#8b4513"
                }}>
                    {gen === "その他"
                        ? t.other[currentLanguage]
                        : gen
                            .replace(
                                "期生",
                                currentLanguage === "ja"
                                    ? "期生"
                                    : currentLanguage === "en"
                                        ? " Gen"
                                        : " Thế hệ"
                            )
                            .replace(
                                /^(\d+)\s*(Gen|Thế hệ)$/,
                                currentLanguage === "en" ? "Gen $1" : "Thế hệ $1"
                            )}
                </span>
                <Tag color={themeMode === "dark" ? "#d2a86a" : "purple"} style={{ marginLeft: "auto", opacity: 0.8 }}>
                    {safeItems.length} Members
                </Tag>
            </div>

            {/* List với grid 5 cột trên desktop */}
            <List
                grid={{
                    gutter: 32, // Increased gutter for rotated cards
                    xs: 2,
                    sm: 3,
                    md: 4,
                    lg: 5,
                    xl: 5,
                    xxl: 5,
                }}
                dataSource={safeItems}
                renderItem={(m) => (
                    <List.Item key={m.code}>
                        <div className="member-card-wrapper" style={{ height: "100%" }}>
                        <MemberCard
                            member={m}
                            language={language}
                            themeMode={themeMode}
                            onClick={() => onMemberClick(m.code)}
                            bookFont={bookFont}
                        />
                        </div>
                    </List.Item>
                )}
            />
        </div>
    );
};

export default GenerationGroup;
