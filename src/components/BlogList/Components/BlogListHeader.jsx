import React from "react";
import { Typography, Space, Avatar, Select, Button } from "antd";
import { ProCard } from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";
import {
    GlobalOutlined,
    BulbOutlined,
    MoonOutlined,
    ArrowLeftOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Translation keys
const t = {
    memberBlogs: {
        ja: "メンバーブログ",
        en: "Member Blogs",
        vi: "Blog thành viên",
    },
    blogArticle: {
        ja: "ブログ記事",
        en: "Blog Article",
        vi: "Bài viết blog",
    },
    loading: {
        ja: "読み込み中...",
        en: "Loading...",
        vi: "Đang tải...",
    },
    backToHome: {
        ja: "ホームに戻る",
        en: "Back to Home",
        vi: "Về trang chủ",
    },
};

const BlogListHeader = ({
    memberInfo,
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    screens,
}) => {
    // Ensure language is valid, fallback to "ja"
    const currentLanguage = ["ja", "en", "vi"].includes(language)
        ? language
        : "ja";
    
    const navigate = useNavigate();

    return (
        <ProCard
            bordered
            style={{
                borderRadius: 16,
                background:
                    themeMode === "dark"
                        ? "rgba(36, 33, 29, 0.85)"
                        : "rgba(253, 246, 227, 0.8)",
                marginTop: 0,
            }}
            bodyStyle={{ padding: screens.xs ? 12 : 18 }}
        >
            <div style={{ position: "relative", width: "100%" }}>
                <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/members")}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        borderRadius: 10,
                        color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                        borderColor: themeMode === "dark" ? "rgba(207,191,166,0.3)" : "rgba(139, 69, 19, 0.3)",
                        background: themeMode === "dark" ? "rgba(36,33,29,0.5)" : "rgba(253, 246, 227, 0.5)",
                    }}
                    aria-label={t.backToHome[currentLanguage]}
                    title={t.backToHome[currentLanguage]}
                >
                    {!screens.xs && t.backToHome[currentLanguage]}
                </Button>
                <Space
                    direction={screens.xs ? "vertical" : "horizontal"}
                    align="center"
                    style={{ width: "100%", justifyContent: "center" }}
                    size={screens.xs ? 8 : 16}
                >
                    <Avatar
                    size={screens.xs ? 52 : 64}
                    src={
                        memberInfo?.img ||
                        "https://via.placeholder.com/300x300?text=No+Image"
                    }
                    style={
                        screens.xs ? {} : { boxShadow: "0 6px 16px rgba(0,0,0,0.08)" }
                    }
                />
                <Space direction="vertical" align="center" size={2}>
                    <Title level={3} style={{ margin: 0, lineHeight: 1 }}>
                        {t.memberBlogs[currentLanguage]}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        {memberInfo?.name || t.loading[currentLanguage]}{" "}
                        {t.blogArticle[currentLanguage]}
                    </Text>
                    {(setLanguage || setThemeMode) && (
                        <Space size={6} align="center" style={{ marginTop: 8 }}>
                            {setLanguage && (
                                <Select
                                    value={language}
                                    onChange={setLanguage}
                                    size="small"
                                    style={{ width: 140 }}
                                    options={[
                                        {
                                            value: "ja",
                                            label: (
                                                <span
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                    }}
                                                >
                                                    <GlobalOutlined
                                                        style={{ color: "#666", fontSize: "12px" }}
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
                                                        gap: "4px",
                                                    }}
                                                >
                                                    <GlobalOutlined
                                                        style={{ color: "#666", fontSize: "12px" }}
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
                                                        gap: "4px",
                                                    }}
                                                >
                                                    <GlobalOutlined
                                                        style={{ color: "#666", fontSize: "12px" }}
                                                    />
                                                    Tiếng Việt
                                                </span>
                                            ),
                                        },
                                    ]}
                                />
                            )}
                            {setThemeMode && (
                                <Button
                                    size="small"
                                    type="text"
                                    onClick={() =>
                                        setThemeMode(themeMode === "dark" ? "light" : "dark")
                                    }
                                    icon={
                                        themeMode === "dark" ? (
                                            <BulbOutlined />
                                        ) : (
                                            <MoonOutlined />
                                        )
                                    }
                                    aria-label="Toggle dark mode"
                                    title={themeMode === "dark" ? "Light" : "Dark"}
                                />
                            )}
                        </Space>
                    )}
                </Space>
            </Space>
            </div>
        </ProCard>
    );
};

export default BlogListHeader;
