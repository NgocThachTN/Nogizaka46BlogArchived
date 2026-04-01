// @ts-nocheck
import React from "react";
import { Typography, Space, Button, Badge, Tooltip } from "antd";
import { ProCard } from "@ant-design/pro-components";
import {
    CalendarOutlined,
    HeartOutlined,
    ReadOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { getImageUrl } from "../../../services/blogService";

const { Title } = Typography;

// Translation keys
const t = {
    readMore: {
        ja: "続きを読む",
        en: "Read More",
        vi: "Đọc thêm",
    },
};

const BlogCard = ({
    blog,
    index,
    language,
    themeMode,
    screens,
    onOpen,
}) => {
    // Ensure language is valid, fallback to "ja"
    const currentLanguage = ["ja", "en", "vi"].includes(language)
        ? language
        : "ja";

    return (
        <ProCard
            hoverable={!screens.xs} // tắt hover trên mobile cho nhẹ
            bordered
            style={{
                borderRadius: 12,
                // contain layout/paint giúp trình duyệt tối ưu composite
                contain: "content",
                willChange: "transform",
                height: "100%", // đảm bảo tất cả card có cùng chiều cao
                display: "flex",
                flexDirection: "column",
                background:
                    themeMode === "dark"
                        ? "rgba(36, 33, 29, 0.9)"
                        : "rgba(253, 246, 227, 0.9)",
            }}
            bodyStyle={{
                padding: 12,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden", // Tránh tràn nội dung
            }}
            onClick={() => onOpen(blog.id)}
            className="blog-card"
        >
            {/* Thumbnail */}
            <div
                style={{
                    position: "relative",
                    height: screens.xs ? 148 : 190,
                    overflow: "hidden",
                    borderRadius: "12px", // Bo cả 4 góc đồng đều
                    background: themeMode === "dark" ? "#1e1c19" : "#f5f6fa",
                    marginBottom: 12,
                    flexShrink: 0, // Không cho phép thu nhỏ
                }}
            >
                {blog.thumbnail ? (
                    <img
                        src={getImageUrl(blog.thumbnail, {
                            w: screens.xs ? 640 : 960,
                        })}
                        srcSet={[
                            `${getImageUrl(blog.thumbnail, { w: 480 })} 480w`,
                            `${getImageUrl(blog.thumbnail, { w: 640 })} 640w`,
                            `${getImageUrl(blog.thumbnail, { w: 960 })} 960w`,
                            `${getImageUrl(blog.thumbnail, { w: 1280 })} 1280w`,
                        ].join(", ")}
                        sizes={
                            screens.xs
                                ? "(max-width: 576px) 100vw, 640px"
                                : "33vw"
                        }
                        alt={blog.title}
                        loading={index === 0 ? "eager" : "lazy"}
                        // ảnh eager đầu tiên để cảm giác "vào là thấy", còn lại lazy
                        decoding="async"
                        fetchpriority={index === 0 ? "high" : "low"}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform .25s",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                                themeMode === "dark"
                                    ? "linear-gradient(135deg, #2a2826 0%, #1e1c19 100%)"
                                    : "linear-gradient(135deg, #f5f6fa 0%, #e8eaf0 100%)",
                            color: themeMode === "dark" ? "#888" : "#999",
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ marginBottom: 8, opacity: 0.5 }}
                        >
                            <path
                                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                                fill="currentColor"
                            />
                        </svg>
                        <span>No Image</span>
                    </div>
                )}
                <div style={{ position: "absolute", top: 8, left: 8 }}>
                    <Badge
                        count={
                            <Space size={4} style={{ fontSize: 12 }}>
                                <CalendarOutlined />
                                {blog.date}
                            </Space>
                        }
                        style={{
                            background:
                                themeMode === "dark"
                                    ? "rgba(255,255,255,.15)"
                                    : "rgba(0,0,0,.55)",
                            color: themeMode === "dark" ? "#f5ede0" : "#fff",
                            padding: "3px 8px",
                            borderRadius: 999,
                        }}
                    />
                </div>
            </div>

            {/* Meta */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0, // Cho phép flex item thu nhỏ
                }}
            >
                <Tooltip title={blog.title}>
                    <Title
                        level={5}
                        style={{
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: "2.4em",
                            lineHeight: 1.25,
                            marginBottom: 12,
                            flexShrink: 0,
                            color: themeMode === "dark" ? "#f5ede0" : undefined,
                        }}
                    >
                        {blog.title}
                    </Title>
                </Tooltip>

                {/* Action Buttons */}
                <div style={{ marginTop: "auto", width: "100%" }}>
                    <Space
                        style={{
                            width: "100%",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "nowrap", // Không wrap để tránh tràn
                        }}
                        size={[8, 8]}
                    >
                        {/* Left side - View and Like buttons */}
                        <Space size={4} style={{ flexShrink: 1, minWidth: 0 }}>
                            <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined />}
                                style={{
                                    padding: "4px 6px",
                                    fontSize: 11,
                                    height: 24,
                                    minWidth: "auto",
                                    flexShrink: 0,
                                }}
                            >
                                {screens.xs ? "" : "閲覧"}
                            </Button>
                            <Button
                                type="text"
                                size="small"
                                icon={<HeartOutlined />}
                                style={{
                                    padding: "4px 6px",
                                    fontSize: 11,
                                    height: 24,
                                    minWidth: "auto",
                                    flexShrink: 0,
                                }}
                            >
                                {screens.xs ? "" : "いいね"}
                            </Button>
                        </Space>

                        {/* Right side - Read More button */}
                        <Button
                            type="primary"
                            size="small"
                            icon={<ReadOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpen(blog.id);
                            }}
                            style={{
                                flexShrink: 0,
                                minWidth: screens.xs ? 50 : 70,
                                fontSize: 11,
                                height: 24,
                                padding: "0 8px",
                                background:
                                    themeMode === "dark" ? "#9c6b3f" : undefined,
                            }}
                        >
                            {screens.xs ? "読む" : t.readMore[currentLanguage]}
                        </Button>
                    </Space>
                </div>
            </div>
        </ProCard>
    );
};

export default BlogCard;
