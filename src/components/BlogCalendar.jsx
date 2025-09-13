// BlogCalendar.jsx — Ant Design Pro • Calendar with Blog Posts
import { useState, useMemo } from "react";
import {
  Calendar,
  Card,
  Badge,
  Tooltip,
  Space,
  Typography,
  Button,
  Empty,
} from "antd";
import { CalendarOutlined, ReadOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { getImageUrl } from "../services/blogService";

const { Text } = Typography;
dayjs.locale("ja");

export default function BlogCalendar({
  blogs = [],
  memberInfo = null,
  onBlogClick = () => {},
  isMobile = false,
}) {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState("month"); // month, year

  // Group blogs by date
  const blogsByDate = useMemo(() => {
    const grouped = {};
    blogs.forEach((blog) => {
      if (blog.date) {
        const dateKey = dayjs(blog.date).format("YYYY-MM-DD");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(blog);
      }
    });
    return grouped;
  }, [blogs]);

  // Get blogs for selected date
  const selectedDateBlogs = useMemo(() => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    return blogsByDate[dateKey] || [];
  }, [selectedDate, blogsByDate]);

  // Calendar cell render
  const dateCellRender = (current) => {
    const dateKey = current.format("YYYY-MM-DD");
    const dayBlogs = blogsByDate[dateKey] || [];

    if (dayBlogs.length === 0) return null;

    return (
      <div style={{ position: "relative", height: "100%" }}>
        {/* Blog indicator line */}
        <div
          style={{
            position: "absolute",
            bottom: 2,
            left: 4,
            right: 4,
            height: 3,
            background: "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)",
            borderRadius: "2px",
            boxShadow: "0 1px 3px rgba(109, 40, 217, 0.3)",
          }}
        />
      </div>
    );
  };

  // Month cell render (for year view)
  const monthCellRender = (current) => {
    const monthKey = current.format("YYYY-MM");
    const monthBlogs = Object.keys(blogsByDate).filter((date) =>
      date.startsWith(monthKey)
    );

    if (monthBlogs.length === 0) return null;

    return (
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <Badge
          count={monthBlogs.length}
          style={{
            backgroundColor: "#6d28d9",
            fontSize: 12,
            minWidth: 20,
            height: 20,
            lineHeight: "20px",
          }}
        />
      </div>
    );
  };

  // Handle date selection
  const onDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Handle panel change (month/year view)
  const onPanelChange = (date, mode) => {
    setViewMode(mode);
  };

  // Show loading state if no blogs yet
  if (!blogs || blogs.length === 0) {
    return (
      <ProCard
        title={
          <Space>
            <CalendarOutlined />
            <span>ブログカレンダー</span>
            {memberInfo && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {memberInfo.name}
              </Text>
            )}
          </Space>
        }
        style={{ borderRadius: 16 }}
        bodyStyle={{ padding: isMobile ? 12 : 16 }}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Text type="secondary">ブログデータを読み込み中...</Text>
        </div>
      </ProCard>
    );
  }

  return (
    <ProCard
      title={
        <Space>
          <CalendarOutlined />
          <span>ブログカレンダー</span>
          {memberInfo && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {memberInfo.name}
            </Text>
          )}
        </Space>
      }
      style={{ borderRadius: 16 }}
      bodyStyle={{ padding: isMobile ? 12 : 16 }}
      extra={
        <Button
          size="small"
          onClick={() => setViewMode(viewMode === "month" ? "year" : "month")}
        >
          {viewMode === "month" ? "年表示" : "月表示"}
        </Button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Calendar
          className="blog-calendar"
          fullscreen={false}
          value={selectedDate}
          onSelect={onDateSelect}
          onPanelChange={onPanelChange}
          dateCellRender={viewMode === "month" ? dateCellRender : undefined}
          monthCellRender={viewMode === "year" ? monthCellRender : undefined}
          headerRender={({ value, onChange }) => (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                padding: "0 8px",
              }}
            >
              <Button
                size="small"
                onClick={() =>
                  onChange(
                    value.subtract(1, viewMode === "month" ? "month" : "year")
                  )
                }
              >
                ←
              </Button>
              <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>
                {value.format(viewMode === "month" ? "YYYY年M月" : "YYYY年")}
              </Text>
              <Button
                size="small"
                onClick={() =>
                  onChange(
                    value.add(1, viewMode === "month" ? "month" : "year")
                  )
                }
              >
                →
              </Button>
            </div>
          )}
        />
      </div>

      {/* Selected date blogs */}
      {selectedDateBlogs.length > 0 && (
        <Card
          size="small"
          title={
            <Space>
              <ReadOutlined />
              <span>{selectedDate.format("YYYY年M月D日")} の投稿</span>
              <Badge count={selectedDateBlogs.length} />
            </Space>
          }
          style={{
            borderRadius: 12,
            marginTop: 12,
          }}
          bodyStyle={{ padding: isMobile ? 8 : 12 }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            {selectedDateBlogs.map((blog) => (
              <Card
                key={blog.id}
                size="small"
                hoverable
                onClick={() => onBlogClick(blog.id)}
                style={{
                  borderRadius: 8,
                  cursor: "pointer",
                  border: "1px solid #f0f0f0",
                }}
                bodyStyle={{ padding: isMobile ? 8 : 12 }}
              >
                <div
                  style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: isMobile ? 40 : 48,
                      height: isMobile ? 40 : 48,
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "#f5f6fa",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={
                        blog.thumbnail
                          ? getImageUrl(blog.thumbnail, { w: 96 })
                          : "https://via.placeholder.com/96x96/f0f0f0/666666?text=No+Image"
                      }
                      alt={blog.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Tooltip title={blog.title}>
                      <Text
                        strong
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          fontSize: isMobile ? 12 : 13,
                          lineHeight: 1.4,
                          marginBottom: 4,
                        }}
                      >
                        {blog.title}
                      </Text>
                    </Tooltip>
                    <div
                      style={{
                        color: "#666",
                        fontSize: isMobile ? 10 : 11,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <CalendarOutlined />
                      <span>{blog.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* No blogs for selected date */}
      {selectedDateBlogs.length === 0 && (
        <Card
          size="small"
          style={{
            borderRadius: 12,
            marginTop: 12,
            textAlign: "center",
          }}
          bodyStyle={{ padding: isMobile ? 16 : 24 }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                {selectedDate.format("YYYY年M月D日")} には投稿がありません
              </Text>
            }
          />
        </Card>
      )}

      {/* Enhanced Calendar Styles */}
      <style>{`
        .blog-calendar {
          background: linear-gradient(135deg, #faf7ff 0%, #ffffff 100%);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(109, 40, 217, 0.08);
        }
        
        .blog-calendar .ant-picker-calendar-header {
          padding: ${isMobile ? "12px 0" : "16px 0"};
          border-bottom: 2px solid #f0f0f0;
          margin-bottom: 16px;
        }
        
        .blog-calendar .ant-picker-calendar-date {
          position: relative;
          height: ${isMobile ? "36px" : "44px"};
          padding: ${isMobile ? "4px" : "6px"};
          border-radius: 8px;
          transition: all 0.3s ease;
          margin: 2px;
        }
        
        .blog-calendar .ant-picker-calendar-date-content {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 6px;
        }
        
        .blog-calendar .ant-picker-calendar-date-today {
          background: linear-gradient(135deg, rgba(109, 40, 217, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%) !important;
          border: 2px solid rgba(109, 40, 217, 0.3) !important;
          box-shadow: 0 2px 8px rgba(109, 40, 217, 0.2);
        }
        
        .blog-calendar .ant-picker-calendar-date:hover {
          background: linear-gradient(135deg, rgba(109, 40, 217, 0.08) 0%, rgba(109, 40, 217, 0.03) 100%) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(109, 40, 217, 0.15);
        }
        
        .blog-calendar .ant-picker-calendar-date-selected {
          background: linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%) !important;
          border: 2px solid #6d28d9 !important;
          box-shadow: 0 4px 16px rgba(109, 40, 217, 0.3);
        }
        
        .blog-calendar .ant-picker-calendar-date-selected .ant-picker-calendar-date-value {
          color: #fff !important;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .blog-calendar .ant-picker-calendar-date-value {
          font-size: ${isMobile ? "13px" : "15px"};
          line-height: 1.2;
          font-weight: 500;
        }
        
        .blog-calendar .ant-picker-calendar-date-today .ant-picker-calendar-date-value {
          color: #6d28d9 !important;
          font-weight: 700;
        }
        
        .blog-calendar .ant-picker-calendar-month-panel {
          padding: ${isMobile ? "12px" : "16px"};
          background: linear-gradient(135deg, #faf7ff 0%, #ffffff 100%);
          border-radius: 12px;
        }
        
        .blog-calendar .ant-picker-calendar-month-panel-cell {
          height: ${isMobile ? "70px" : "90px"};
          padding: ${isMobile ? "8px" : "12px"};
          border-radius: 12px;
          transition: all 0.3s ease;
          margin: 4px;
        }
        
        .blog-calendar .ant-picker-calendar-month-panel-cell:hover {
          background: linear-gradient(135deg, rgba(109, 40, 217, 0.08) 0%, rgba(109, 40, 217, 0.03) 100%) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(109, 40, 217, 0.15);
        }
        
        .blog-calendar .ant-picker-calendar-month-panel-cell-selected {
          background: linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%) !important;
          border: 2px solid #6d28d9 !important;
          box-shadow: 0 6px 24px rgba(109, 40, 217, 0.3);
        }
        
        .blog-calendar .ant-picker-calendar-month-panel-cell-selected .ant-picker-calendar-month-panel-cell-content {
          color: #fff !important;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .blog-calendar .ant-picker-calendar-month-panel-cell-content {
          font-size: ${isMobile ? "13px" : "15px"};
          font-weight: 500;
        }
        
        .blog-calendar .ant-picker-calendar-date-today::before {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          right: 3px;
          bottom: 3px;
          border: 2px solid #6d28d9;
          border-radius: 6px;
          pointer-events: none;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        .blog-calendar .ant-picker-calendar-date-today .ant-picker-calendar-date-value {
          animation: bounce 1s ease-in-out infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        .blog-calendar .ant-picker-calendar-date-cell {
          border-radius: 8px;
          margin: 1px;
        }
        
        .blog-calendar .ant-picker-calendar-date-cell:hover {
          background: rgba(109, 40, 217, 0.05);
        }
        
      `}</style>
    </ProCard>
  );
}
