import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Image,
  Spin,
  Empty,
  Button,
  Avatar,
  Input,
  Card,
  Row,
  Col,
  Space,
  Divider,
  Pagination,
} from "antd";
import {
  CalendarOutlined,
  HeartOutlined,
  ReadOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { useState, useEffect } from "react";
import {
  fetchAllBlogs,
  getImageUrl,
  fetchMemberInfo,
} from "../services/blogService";

const { Text, Title } = Typography;

const BlogList = () => {
  const navigate = useNavigate();
  const { memberCode } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [memberInfo, setMemberInfo] = useState(null);
  const pageSize = 9;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [blogs, member] = await Promise.all([
          fetchAllBlogs(memberCode),
          fetchMemberInfo(memberCode),
        ]);
        setBlogs(blogs);
        setFilteredBlogs(blogs);
        setMemberInfo(member);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("データの読み込み中にエラーが発生しました。");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [memberCode]);

  const reloadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [blogs, member] = await Promise.all([
        fetchAllBlogs(memberCode),
        fetchMemberInfo(memberCode),
      ]);
      setBlogs(blogs);
      setFilteredBlogs(blogs);
      setMemberInfo(member);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("データの読み込み中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  // Filter blogs based on search text
  useEffect(() => {
    let filtered = blogs;

    if (searchText) {
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(searchText.toLowerCase()) ||
          blog.author.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredBlogs(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [blogs, searchText]);

  const handleBlogClick = (id) => {
    navigate(`/blog/${id}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-96">
          <Spin size="large" tip="読み込み中..." />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col justify-center items-center min-h-96 space-y-4">
          <Title level={4} type="danger">
            {error}
          </Title>
          <Button type="primary" onClick={reloadData}>
            再試行
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      className="bg-gray-50 min-h-screen"
      pageHeaderRender={() => (
        <div className="text-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="flex justify-center items-center mb-4">
              <Avatar
                size={64}
                src={
                  memberInfo?.img ||
                  "https://via.placeholder.com/300x300?text=No+Image"
                }
                className="shadow-md"
              />
            </div>

            <Title level={1} className="text-4xl font-bold text-gray-800 mb-2">
              Blog
            </Title>

            <Title level={3} className="text-gray-600 font-normal mb-6">
              {memberInfo?.name || "Loading..."} 公式ブログ
            </Title>

            {/* Simple Stats */}
          </div>
        </div>
      )}
    >
      {/* Calculate current page data */}
      {(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const currentPageData = filteredBlogs.slice(
          startIndex,
          startIndex + pageSize
        );

        return currentPageData.length === 0 ? (
          <div className="flex justify-center">
            <Empty
              description={
                searchText
                  ? "検索結果が見つかりません"
                  : "まだブログ記事がありません"
              }
              className="bg-white p-12 rounded-lg shadow-sm"
            />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {currentPageData.map((blog) => (
              <Col xs={24} sm={12} lg={8} key={blog.id}>
                <Card
                  hoverable
                  onClick={() => handleBlogClick(blog.id)}
                  className="h-full shadow-sm hover:shadow-md transition-shadow duration-200"
                  cover={
                    <div className="h-48 overflow-hidden bg-gray-100">
                      <Image
                        alt={blog.title}
                        src={
                          blog.thumbnail
                            ? getImageUrl(blog.thumbnail)
                            : "https://via.placeholder.com/400x200/f0f0f0/666666?text=No+Image"
                        }
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        preview={false}
                        fallback="https://via.placeholder.com/400x200/f0f0f0/666666?text=No+Image"
                      />
                    </div>
                  }
                >
                  <div className="space-y-3">
                    {/* Author Info */}
                    <div className="flex items-center space-x-2">
                      <Avatar
                        src="https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg"
                        size={32}
                      />
                      <div>
                        <Text className="text-sm font-medium text-gray-700">
                          一ノ瀬 美空
                        </Text>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <CalendarOutlined />
                          <span>{blog.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <Title
                      level={5}
                      className="mb-0 text-gray-800 font-semibold leading-tight hover:text-blue-600 transition-colors duration-200"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "2.5rem",
                      }}
                    >
                      {blog.title}
                    </Title>

                    <Divider className="my-3" />

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                      <Space>
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          size="small"
                          className="text-gray-500 hover:text-blue-600"
                        >
                          閲覧
                        </Button>
                        <Button
                          type="text"
                          icon={<HeartOutlined />}
                          size="small"
                          className="text-gray-500 hover:text-red-500"
                        >
                          いいね
                        </Button>
                      </Space>
                      <Button
                        type="primary"
                        size="small"
                        icon={<ReadOutlined />}
                        className="bg-blue-600 hover:bg-blue-700 border-blue-600"
                      >
                        読む
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        );
      })()}

      {/* Pagination */}
      {filteredBlogs.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            current={currentPage}
            total={filteredBlogs.length}
            pageSize={pageSize}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      )}
    </PageContainer>
  );
};

export default BlogList;
