import React from "react";
import { Typography, Space, Select, Segmented } from "antd";
import { GlobalOutlined, BulbOutlined, MoonOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";

const { Title, Text } = Typography;

// Translation keys
const t = {
    blogTitle: {
        ja: "乃木坂46 ブログ",
        en: "Nogizaka46 Blog",
        vi: "Nogizaka46 Blog ",
    },
    generation: { ja: "期生", en: "Generation", vi: "Thế hệ" },
    totalBlogs: {
        ja: "総ブログ数",
        en: "Total Members",
        vi: "Tổng Số Thành Viên",
    },
};

const MemberListHeader = ({
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    memberCount,
    bookFont,
}) => {
    // Ensure language is valid, fallback to "ja"
    const currentLanguage = ["ja", "en", "vi"].includes(language)
        ? language
        : "ja";

    return (
        <ProCard
            bordered
            style={{
                borderRadius: 14,
                background:
                    themeMode === "dark"
                        ? "rgba(36, 33, 29, 0.85)"
                        : "rgba(253, 246, 227, 0.8)",
                border: themeMode === "dark"
                    ? "1px solid rgba(139, 115, 85, 0.2)"
                    : "1px solid rgba(139, 69, 19, 0.15)",
                boxShadow: themeMode === "dark"
                    ? "0 4px 12px rgba(0,0,0,0.3)"
                    : "0 4px 12px rgba(139, 69, 19, 0.1)",
            }}
        >
            <Space
                style={{ width: "100%", justifyContent: "space-between" }}
                align="center"
            >
                <Space direction="vertical" size={2}>
                    <Title level={2} style={{
                        margin: 0,
                        color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                        fontFamily: bookFont?.[currentLanguage]?.fontFamily,
                        fontWeight: 700
                    }}>
                        {t.blogTitle[currentLanguage]}
                    </Title>
                    <Text type="secondary" style={{
                        fontSize: 14,
                        fontFamily: bookFont?.[currentLanguage]?.fontFamily,
                        color: themeMode === "dark" ? "#cfbfa6" : "#5d4e37",
                    }}>
                        {t.generation[currentLanguage]} •{" "}
                        {t.totalBlogs[currentLanguage]}: {memberCount}
                    </Text>
                </Space>
                <Space>
                    {setLanguage && (
                        <Select
                            value={language}
                            onChange={setLanguage}
                            style={{ width: 140 }}
                            options={[
                                {
                                    value: "ja",
                                    label: (
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            <GlobalOutlined
                                                style={{ color: "#666", fontSize: "14px" }}
                                            />
                                            日本語
                                        </span>
                                    ),
                                },
                                {
                                    value: "en",
                                    label: (
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            <GlobalOutlined
                                                style={{ color: "#666", fontSize: "14px" }}
                                            />
                                            English
                                        </span>
                                    ),
                                },
                                {
                                    value: "vi",
                                    label: (
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            <GlobalOutlined
                                                style={{ color: "#666", fontSize: "14px" }}
                                            />
                                            Tiếng Việt
                                        </span>
                                    ),
                                },
                            ]}
                        />
                    )}
                    {setThemeMode && (
                        <Segmented
                            size="middle"
                            value={themeMode}
                            onChange={(v) => setThemeMode(v)}
                            options={[
                                { label: "Light", value: "light", icon: <BulbOutlined /> },
                                { label: "Dark", value: "dark", icon: <MoonOutlined /> },
                            ]}
                        />
                    )}
                </Space>
            </Space>
        </ProCard>
    );
};

export default MemberListHeader;
