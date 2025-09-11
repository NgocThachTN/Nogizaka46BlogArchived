import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@ant-design/pro-components";
import { Card, Typography, Space, Button, Image, Spin, Avatar } from "antd";
import {
  LeftOutlined,
  CalendarOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { fetchBlogDetail, getImageUrl } from "../services/blogService";

const { Title, Text } = Typography;

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlog = async () => {
      try {
        setLoading(true);
        const data = await fetchBlogDetail(id);
        setBlog(data);
      } catch (error) {
        console.error("Error loading blog:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{ textAlign: "center", padding: "24px" }}>
        <Title level={4} type="secondary">
          Không tìm thấy bài viết
        </Title>
        <Button
          type="primary"
          onClick={() => navigate("/")}
          style={{ marginTop: 16 }}
        >
          Quay lại trang chủ
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Navigation */}
        <div className="mb-6">
          <Button
            icon={<LeftOutlined />}
            type="link"
            onClick={() => navigate("/blog")}
            className="p-0 h-auto text-base text-purple-600 hover:text-purple-700 font-medium"
          >
            一覧へ戻る
          </Button>
        </div>

        {/* Article Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <Title
            level={1}
            className="mb-6 text-3xl md:text-4xl text-gray-800 font-bold leading-tight"
          >
            {blog.title}
          </Title>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mb-6">
            <div className="flex items-center space-x-4">
              <Avatar
                src={
                  blog.memberImage ||
                  "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg"
                }
                size={50}
                className="ring-4 ring-purple-100 shadow-lg"
                onError={(e) => {
                  e.target.src =
                    "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg";
                }}
              />
              <div>
                <Text className="block text-lg font-semibold text-gray-800">
                  {blog.author}
                </Text>
                <div className="flex items-center space-x-2 text-gray-500">
                  <CalendarOutlined className="text-purple-600" />
                  <Text className="text-sm">{blog.date}</Text>
                </div>
              </div>
            </div>

            <Button
              type="default"
              icon={<ShareAltOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-600 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 rounded-full px-6"
            >
              シェア
            </Button>
          </div>

          {/* Article Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-medium">
              ブログ記事
            </span>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-medium">
              一ノ瀬 美空
            </span>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
          <div
            className="blog-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* Back Button */}
        <div className="text-center pt-6">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/blog")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 rounded-full px-8 py-2 h-12 text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            一覧へ戻る
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
