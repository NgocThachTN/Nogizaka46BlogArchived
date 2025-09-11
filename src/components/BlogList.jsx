import { useNavigate } from "react-router-dom";
import {
  Typography,
  Image,
  Spin,
  Empty,
  Button,
  Card,
  Space,
  Avatar,
  Tooltip,
  Tag,
} from "antd";
import {
  CalendarOutlined,
  EyeOutlined,
  HeartOutlined,
  ReadOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { ProList, ProCard } from "@ant-design/pro-components";
import { useState, useEffect } from "react";
import { fetchAllBlogs, getImageUrl } from "../services/blogService";

const { Text, Title, Paragraph } = Typography;

const BlogList = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllBlogs();
  }, []);

  const loadAllBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const allBlogs = await fetchAllBlogs();
      setBlogs(allBlogs);
    } catch (error) {
      console.error("Error loading blogs:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleBlogClick = (id) => {
    navigate(`/blog/${id}`);
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 200px)",
        }}
      >
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 200px)",
          gap: "16px",
        }}
      >
        <Title level={4} type="danger">
          {error}
        </Title>
        <Button type="primary" onClick={loadAllBlogs}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block">
            <Title className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 drop-shadow-sm">
              BLOG
            </Title>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
          <Title
            level={2}
            className="text-gray-600 font-light tracking-wide mb-4"
          >
            一ノ瀬 美空 公式ブログ
          </Title>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-500 mb-6">
            <Tag
              icon={<StarOutlined />}
              color="purple"
              className="rounded-full px-3 py-1"
            >
              最新記事
            </Tag>
            <span className="flex items-center space-x-1">
              <ClockCircleOutlined />
              <span>毎日更新</span>
            </span>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="flex justify-center">
            <Empty
              description="まだブログ記事がありません"
              className="bg-white/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg border border-gray-100"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {blogs.map((blog, index) => (
              <ProCard
                key={blog.id}
                hoverable
                onClick={() => handleBlogClick(blog.id)}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white/90 backdrop-blur-sm border-0 overflow-hidden"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
                bodyStyle={{ padding: 0 }}
              >
                {/* Image Cover */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                  <Image
                    alt={blog.title}
                    src={
                      blog.thumbnail
                        ? getImageUrl(blog.thumbnail)
                        : "https://via.placeholder.com/400x200/9c27b0/ffffff?text=No+Image"
                    }
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    preview={false}
                    fallback="https://via.placeholder.com/400x200/9c27b0/ffffff?text=No+Image"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/400x200/9c27b0/ffffff?text=No+Image";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Date Badge */}
                  <div className="absolute top-3 right-3">
                    <Tag className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-full px-3 py-1 text-xs font-medium">
                      {blog.date}
                    </Tag>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Author Info */}
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src="https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg"
                      size={36}
                      className="ring-2 ring-purple-100"
                      onError={(e) => {
                        e.target.src =
                          "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg";
                      }}
                    />
                    <div>
                      <Text className="text-sm font-medium text-gray-700">
                        一ノ瀬 美空
                      </Text>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <ClockCircleOutlined />
                        <span>{blog.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <Title
                    level={5}
                    className="m-0 text-gray-800 font-semibold leading-snug line-clamp-2 group-hover:text-purple-600 transition-colors duration-200"
                  >
                    {blog.title}
                  </Title>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="flex space-x-4">
                      <Tooltip title="Read Blog">
                        <Button
                          type="text"
                          icon={<ReadOutlined />}
                          size="small"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        />
                      </Tooltip>
                      <Tooltip title="Like">
                        <Button
                          type="text"
                          icon={<HeartOutlined />}
                          size="small"
                          className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                        />
                      </Tooltip>
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 rounded-full px-4"
                    >
                      読む
                    </Button>
                  </div>
                </div>
              </ProCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
