import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@ant-design/pro-components";
import {
  Card,
  Typography,
  Space,
  Button,
  Image,
  Spin,
  Avatar,
  Select,
  Tooltip,
  message,
} from "antd";
import {
  LeftOutlined,
  CalendarOutlined,
  ShareAltOutlined,
  TranslationOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { fetchBlogDetail } from "../services/blogService";

// Language translations
const translations = {
  backToList: {
    ja: "一覧へ戻る",
    en: "Back to List",
    vi: "Quay lại Danh sách",
  },
  loading: {
    ja: "読み込み中...",
    en: "Loading...",
    vi: "Đang tải...",
  },
  notFound: {
    ja: "ブログが見つかりません",
    en: "Blog post not found",
    vi: "Không tìm thấy bài viết",
  },
  share: {
    ja: "シェア",
    en: "Share",
    vi: "Chia sẻ",
  },
  blogPost: {
    ja: "ブログ記事",
    en: "Blog Post",
    vi: "Bài viết",
  },
  copied: {
    ja: "リンクがコピーされました",
    en: "Link copied to clipboard",
    vi: "Đã sao chép liên kết",
  },
};

const { Title, Text } = Typography;

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("ja");
  const [readingMode, setReadingMode] = useState(false);

  const handleLanguageChange = (value) => {
    setLanguage(value);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success(translations.copied[language]);
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <Card className="w-full max-w-lg shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="text-center py-8">
            <Spin size="large" tip={translations.loading[language]} />
          </div>
        </Card>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <Card className="w-full max-w-lg shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="text-center py-8">
            <Title level={4} type="secondary">
              {translations.notFound[language]}
            </Title>
            <Button
              type="primary"
              onClick={() => navigate("/blog")}
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 border-0 rounded-full px-8 h-12"
            >
              {translations.backToList[language]}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-6 bg-gradient-to-br from-gray-50 to-purple-50 ${
        readingMode ? "bg-gray-100" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <Button
            icon={<LeftOutlined />}
            type="link"
            onClick={() => navigate("/blog")}
            className="text-base text-purple-600 hover:text-purple-700 font-medium"
          >
            {translations.backToList[language]}
          </Button>

          <Space size="middle">
            <Select
              value={language}
              onChange={handleLanguageChange}
              className="w-32"
              options={[
                { value: "ja", label: "日本語" },
                { value: "en", label: "English" },
                { value: "vi", label: "Tiếng Việt" },
              ]}
            />
            <Tooltip title={readingMode ? "Normal Mode" : "Reading Mode"}>
              <Button
                icon={<EyeOutlined />}
                type={readingMode ? "primary" : "default"}
                onClick={() => setReadingMode(!readingMode)}
                className="rounded-full"
              />
            </Tooltip>
          </Space>
        </div>

        {/* Article Header */}
        <Card
          className="shadow-xl border-0 bg-white/90 backdrop-blur-sm w-full"
          bodyStyle={{
            padding: readingMode ? "2.5rem" : "2rem",
            "@media (max-width: 640px)": {
              padding: readingMode ? "1.5rem" : "1rem",
            },
          }}
        >
          {/* Title Section */}
          <div className="mb-8">
            <Title
              level={1}
              className="text-3xl md:text-4xl text-gray-800 font-bold leading-tight"
            >
              {blog.title}
            </Title>
          </div>

          {/* Author and Date Section */}
          <div className="border-b border-gray-100 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
              <div className="flex items-center gap-5">
                <Avatar
                  src={
                    blog.memberImage ||
                    "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg"
                  }
                  size={{ xs: 48, sm: 60, md: 72, lg: 80 }}
                  className="ring-4 ring-purple-100 shadow-lg transition-all duration-300"
                  onError={(e) => {
                    e.target.src =
                      "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg";
                  }}
                />
                <div className="space-y-2">
                  <Text className="block text-xl font-semibold text-gray-800">
                    {blog.author}
                  </Text>
                  <div className="flex items-center gap-3 text-gray-500">
                    <CalendarOutlined className="text-purple-600 text-lg" />
                    <Text className="text-base">{blog.date}</Text>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="default"
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                  size="large"
                  className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-600 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 rounded-full px-6 h-auto py-2"
                >
                  {translations.share[language]}
                </Button>
              </div>
            </div>
          </div>

          {/* Article Tags */}
          <div className="space-y-4">
            <Text className="block text-sm font-medium text-gray-500">
              {language === "ja" ? "タグ" : language === "en" ? "Tags" : "Thẻ"}
            </Text>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium">
                {translations.blogPost[language]}
              </span>
              {blog.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Article Content */}
        <Card
          className={`shadow-xl border-0 bg-white/90 backdrop-blur-sm ${
            readingMode ? "max-w-3xl mx-auto" : ""
          }`}
          bodyStyle={{
            padding: readingMode ? "3.5rem" : "2.5rem",
            fontSize: readingMode ? "1.125rem" : "1rem",
            lineHeight: readingMode ? "1.9" : "1.7",
          }}
        >
          <div
            className={`blog-content prose prose-lg max-w-none ${
              readingMode ? "prose-xl" : ""
            } prose-headings:text-gray-800 prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-justify prose-a:text-purple-600 prose-a:no-underline hover:prose-a:text-purple-700 prose-img:rounded-lg prose-img:shadow-lg prose-img:mx-auto prose-strong:text-gray-800 prose-blockquote:border-purple-300 prose-blockquote:bg-purple-50 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:text-gray-700 sm:prose-base md:prose-lg lg:prose-xl`}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 pt-8">
          <Button
            type="default"
            size="large"
            icon={<LeftOutlined />}
            onClick={() => navigate("/blog")}
            className="bg-white/90 backdrop-blur-sm border-purple-200 text-purple-600 hover:text-purple-700 hover:border-purple-300 rounded-full px-6 h-12 font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            {translations.backToList[language]}
          </Button>
          {blog.nextPost && (
            <Button
              type="primary"
              size="large"
              onClick={() => navigate(`/blog/${blog.nextPost.id}`)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 rounded-full px-8 h-12 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {language === "ja"
                ? "次の記事"
                : language === "en"
                ? "Next Post"
                : "Bài tiếp theo"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
