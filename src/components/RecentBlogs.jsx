// RecentBlogs.jsx — Recent blogs component for member
import { useNavigate } from "react-router-dom";
import {
    Typography,
    Space,
    Button,
    Tooltip,
    Card,
} from "antd";
import {
    CalendarOutlined,
    ReadOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import { getImageUrl } from "../services/blogService";

const { Title, Text } = Typography;

const jpFont = {
    fontFamily:
        "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

// Translation keys
const t = {
    recentPosts: {
        ja: "最近の投稿",
        en: "Recent Posts",
        vi: "Bài viết gần đây",
    },
    readMore: {
        ja: "続きを読む",
        en: "Read More",
        vi: "Đọc thêm",
    },
    noRecentPosts: {
        ja: "最近の投稿はありません",
        en: "No recent posts",
        vi: "Không có bài viết gần đây",
    },
};

const RecentBlogs = ({
    blogs = [],
    onBlogClick,
    isMobile = false,
    language = "ja",
    themeMode = "light",
    maxItems = 5,
}) => {
    const navigate = useNavigate();

    // Get the most recent blogs
    const recentBlogs = blogs.slice(0, maxItems);
    const isDark = themeMode === "dark";

    if (!blogs || blogs.length === 0) {
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
                    padding: isMobile ? 12 : 20,
                    textAlign: "center"
                }}
            >
                <Text type="secondary" style={{ fontSize: 13, fontFamily: "'Playfair Display', serif" }}>
                    {t.noRecentPosts[language]}
                </Text>
            </div>
        );
    }

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
                padding: isMobile ? 12 : 20,
                position: "relative"
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                borderBottom: `1px dashed ${isDark ? "rgba(207,191,166,0.2)" : "rgba(139, 69, 19, 0.1)"}`,
                paddingBottom: 12
            }}>
                <ClockCircleOutlined style={{ fontSize: 16, color: isDark ? "#d2a86a" : "#8b4513" }} />
                <span style={{
                    fontSize: 16,
                    fontWeight: 600,
                    fontFamily: isDark ? "serif" : "'Yomogi', cursive",
                    color: isDark ? "#d2a86a" : "#8b4513"
                }}>
                    {t.recentPosts[language]}
                </span>
            </div>

            <Space direction="vertical" style={{ width: "100%" }} size={12}>
                {recentBlogs.map((blog, index) => (
                    <div
                        key={blog.id}
                        onClick={() => {
                            if (onBlogClick) {
                                onBlogClick(blog.id);
                            } else {
                                navigate(`/blog/${blog.id}`);
                            }
                        }}
                        style={{
                            display: "flex",
                            gap: 12,
                            padding: "8px",
                            borderRadius: 4,
                            cursor: "pointer",
                            transition: "background 0.2s",
                            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                            position: "relative",
                            // Add a subtle paper line separator except for the last item
                            borderBottom: index < recentBlogs.length - 1
                                ? `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}`
                                : "none"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(139, 69, 19, 0.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
                    >
                        {/* Thumbnail - Polaroid Style */}
                        {blog.thumbnail && (
                            <div
                                style={{
                                    width: isMobile ? 50 : 56,
                                    height: isMobile ? 50 : 56,
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    flexShrink: 0,
                                    background: themeMode === "dark" ? "#1e1c19" : "#fff",
                                    padding: 3,
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    transform: `rotate(${index % 2 === 0 ? '-1deg' : '1deg'})`
                                }}
                            >
                                <img
                                    src={getImageUrl(blog.thumbnail, { w: 160 })}
                                    alt={blog.title}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: 1
                                    }}
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <Tooltip title={blog.title}>
                                <Text
                                    strong
                                    style={{
                                        fontSize: isMobile ? 12 : 14,
                                        fontFamily: "'Playfair Display', serif",
                                        lineHeight: 1.3,
                                        color: themeMode === "dark" ? "#f5ede0" : "#2c2c2c",
                                        marginBottom: 4,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    {blog.title}
                                </Text>
                            </Tooltip>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <span style={{
                                    fontSize: 11,
                                    color: isDark ? "#cfbfa6" : "#888",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                }}>
                                    <CalendarOutlined style={{ fontSize: 10 }} />
                                    {blog.date}
                                </span>

                                <span style={{
                                    fontSize: 10,
                                    color: isDark ? "#d2a86a" : "#8b4513",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2
                                }}>
                                    <ReadOutlined style={{ fontSize: 10 }} />
                                    {/* {t.readMore[language]} */}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </Space>
        </div>
    );
};

export default RecentBlogs;

