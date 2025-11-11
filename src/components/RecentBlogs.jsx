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

    if (!blogs || blogs.length === 0) {
        return (
            <Card
                title={
                    <Space>
                        <ClockCircleOutlined />
                        <span style={jpFont}>{t.recentPosts[language]}</span>
                    </Space>
                }
                style={{
                    borderRadius: 16,
                    background:
                        themeMode === "dark"
                            ? "rgba(36, 33, 29, 0.85)"
                            : "rgba(253, 246, 227, 0.8)",
                }}
                bodyStyle={{ padding: 16 }}
            >
                <Text type="secondary" style={{ fontSize: 14 }}>
                    {t.noRecentPosts[language]}
                </Text>
            </Card>
        );
    }

    return (
        <Card
            title={
                <Space>
                    <ClockCircleOutlined />
                    <span style={jpFont}>{t.recentPosts[language]}</span>
                </Space>
            }
            style={{
                borderRadius: 16,
                background:
                    themeMode === "dark"
                        ? "rgba(36, 33, 29, 0.85)"
                        : "rgba(253, 246, 227, 0.8)",
            }}
            bodyStyle={{ padding: 10 }}
        >
            <Space direction="vertical" style={{ width: "100%" }} size={10}>
                {recentBlogs.map((blog) => (
                    <ProCard
                        key={blog.id}
                        hoverable
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            background:
                                themeMode === "dark"
                                    ? "rgba(28, 26, 23, 0.6)"
                                    : "rgba(244, 241, 232, 0.5)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            border:
                                themeMode === "dark"
                                    ? "1px solid rgba(207,191,166,0.15)"
                                    : "1px solid rgba(139, 69, 19, 0.1)",
                        }}
                        bodyStyle={{ padding: isMobile ? 8 : 10 }}
                        onClick={() => {
                            if (onBlogClick) {
                                onBlogClick(blog.id);
                            } else {
                                navigate(`/blog/${blog.id}`);
                            }
                        }}
                    >
                        <Space style={{ width: "100%" }} size={8} align="start">
                            {/* Thumbnail */}
                            {blog.thumbnail && (
                                <div
                                    style={{
                                        width: isMobile ? 50 : 60,
                                        height: isMobile ? 50 : 60,
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        flexShrink: 0,
                                        background:
                                            themeMode === "dark" ? "#1e1c19" : "#f5f6fa",
                                    }}
                                >
                                    <img
                                        src={getImageUrl(blog.thumbnail, { w: 160 })}
                                        alt={blog.title}
                                        loading="lazy"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                }}
                            >
                                {/* Title */}
                                <Tooltip title={blog.title}>
                                    <Text
                                        strong
                                        style={{
                                            ...jpFont,
                                            fontSize: isMobile ? 12 : 13,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            lineHeight: 1.3,
                                            color: themeMode === "dark" ? "#f5ede0" : "#2c2c2c",
                                        }}
                                    >
                                        {blog.title}
                                    </Text>
                                </Tooltip>

                                {/* Meta info */}
                                <Space
                                    size={6}
                                    wrap
                                    style={{ fontSize: isMobile ? 10 : 11 }}
                                >
                                    <Space
                                        size={3}
                                        style={{
                                            background:
                                                themeMode === "dark"
                                                    ? "rgba(207,191,166,0.15)"
                                                    : "rgba(139, 69, 19, 0.08)",
                                            padding: "1px 6px",
                                            borderRadius: 10,
                                            border:
                                                themeMode === "dark"
                                                    ? "1px solid rgba(207,191,166,0.25)"
                                                    : "1px solid rgba(139, 69, 19, 0.15)",
                                        }}
                                    >
                                        <CalendarOutlined
                                            style={{
                                                fontSize: isMobile ? 9 : 10,
                                                color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                                            }}
                                        />
                                        <Text
                                            style={{
                                                fontSize: isMobile ? 9 : 10,
                                                color: themeMode === "dark" ? "#cfbfa6" : "#666",
                                            }}
                                        >
                                            {blog.date}
                                        </Text>
                                    </Space>
                                </Space>

                                {/* Read button */}
                                <Button
                                    type="link"
                                    size="small"
                                    icon={<ReadOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onBlogClick) {
                                            onBlogClick(blog.id);
                                        } else {
                                            navigate(`/blog/${blog.id}`);
                                        }
                                    }}
                                    style={{
                                        padding: 0,
                                        height: "auto",
                                        fontSize: isMobile ? 10 : 11,
                                        color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
                                        marginTop: 2,
                                    }}
                                >
                                    {t.readMore[language]}
                                </Button>
                            </div>
                        </Space>
                    </ProCard>
                ))}
            </Space>
        </Card>
    );
};

export default RecentBlogs;
