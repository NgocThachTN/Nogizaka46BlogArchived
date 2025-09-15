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

// Translation keys
const t = {
  calendar: { ja: "ブログカレンダー", en: "Blog Calendar", vi: "Lịch Blog" },
  thisMonth: {
    ja: "今月の投稿",
    en: "This Month's Posts",
    vi: "Bài viết tháng này",
  },
  totalPosts: { ja: "総投稿数", en: "Total Posts", vi: "Tổng số bài viết" },
  yearView: { ja: "年表示", en: "Year View", vi: "Xem theo năm" },
  monthView: { ja: "月表示", en: "Month View", vi: "Xem theo tháng" },
  postsOn: { ja: "の投稿", en: "Posts on", vi: "Bài viết ngày" },
  noPosts: {
    ja: "には投稿がありません",
    en: "No posts on this date",
    vi: "Không có bài viết ngày này",
  },
  selectOtherDate: {
    ja: "他の日付を選択してください",
    en: "Please select another date",
    vi: "Vui lòng chọn ngày khác",
  },
  loading: {
    ja: "ブログデータを読み込み中...",
    en: "Loading blog data...",
    vi: "Đang tải dữ liệu blog...",
  },
  january: { ja: "1月", en: "January", vi: "Tháng 1" },
  february: { ja: "2月", en: "February", vi: "Tháng 2" },
  march: { ja: "3月", en: "March", vi: "Tháng 3" },
  april: { ja: "4月", en: "April", vi: "Tháng 4" },
  may: { ja: "5月", en: "May", vi: "Tháng 5" },
  june: { ja: "6月", en: "June", vi: "Tháng 6" },
  july: { ja: "7月", en: "July", vi: "Tháng 7" },
  august: { ja: "8月", en: "August", vi: "Tháng 8" },
  september: { ja: "9月", en: "September", vi: "Tháng 9" },
  october: { ja: "10月", en: "October", vi: "Tháng 10" },
  november: { ja: "11月", en: "November", vi: "Tháng 11" },
  december: { ja: "12月", en: "December", vi: "Tháng 12" },
};

export default function BlogCalendar({
  blogs = [],
  memberInfo = null,
  onBlogClick = () => {},
  isMobile = false,
  language = "ja",
  themeMode = "light",
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
        style={{
          borderRadius: 16,
          background:
            themeMode === "dark"
              ? "rgba(36, 33, 29, 0.85)"
              : "rgba(253, 246, 227, 0.8)",
        }}
        bodyStyle={{ padding: isMobile ? 12 : 16 }}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Text type="secondary">{t.loading[language]}</Text>
        </div>
      </ProCard>
    );
  }

  return (
    <ProCard
      title={
        <Space>
          <CalendarOutlined />
          <span>{t.calendar[language]}</span>
          {memberInfo && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {memberInfo.name}
            </Text>
          )}
        </Space>
      }
      style={{
        borderRadius: 16,
        background:
          themeMode === "dark"
            ? "rgba(36, 33, 29, 0.85)"
            : "rgba(253, 246, 227, 0.8)",
      }}
      bodyStyle={{ padding: isMobile ? 12 : 16 }}
      extra={
        <Button
          size="small"
          onClick={() => setViewMode(viewMode === "month" ? "year" : "month")}
        >
          {viewMode === "month" ? t.yearView[language] : t.monthView[language]}
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
                {viewMode === "month"
                  ? value.format("YYYY年M月")
                  : value.format("YYYY年")}
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
              <span>
                {selectedDate.format("YYYY年M月D日")} {t.postsOn[language]}
              </span>
              <Badge count={selectedDateBlogs.length} />
            </Space>
          }
          style={{
            borderRadius: 12,
            marginTop: 12,
            background:
              themeMode === "dark"
                ? "rgba(36, 33, 29, 0.9)"
                : "rgba(253, 246, 227, 0.9)",
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
                  border:
                    themeMode === "dark"
                      ? "1px solid rgba(207,191,166,0.25)"
                      : "1px solid rgba(139, 69, 19, 0.2)",
                  background:
                    themeMode === "dark"
                      ? "rgba(36, 33, 29, 0.95)"
                      : "rgba(253, 246, 227, 0.95)",
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
                      borderRadius: 8,
                      overflow: "hidden",
                      background: themeMode === "dark" ? "#1e1c19" : "#f5f6fa",
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
            background:
              themeMode === "dark"
                ? "rgba(36, 33, 29, 0.9)"
                : "rgba(253, 246, 227, 0.9)",
          }}
          bodyStyle={{ padding: isMobile ? 16 : 24 }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                {selectedDate.format("YYYY年M月D日")} {t.noPosts[language]}
              </Text>
            }
          />
        </Card>
      )}

      {/* Enhanced Calendar Styles */}
      <style>{`
        .blog-calendar {
          background: ${
            themeMode === "dark"
              ? "#141311"
              : "linear-gradient(135deg, #faf7ff 0%, #ffffff 100%)"
          };
          border-radius: 16px;
          padding: 16px;
          box-shadow: ${
            themeMode === "dark"
              ? "0 4px 20px rgba(0,0,0,0.35)"
              : "0 4px 20px rgba(109, 40, 217, 0.08)"
          };
        }
        
        .blog-calendar .ant-picker-calendar-header {
          padding: ${isMobile ? "12px 0" : "16px 0"};
          border-bottom: 2px solid ${
            themeMode === "dark" ? "rgba(207,191,166,0.15)" : "#f0f0f0"
          };
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
          background: ${
            themeMode === "dark"
              ? "rgba(207,191,166,0.08)"
              : "linear-gradient(135deg, rgba(109, 40, 217, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%)"
          } !important;
          border: 2px solid ${
            themeMode === "dark"
              ? "rgba(207,191,166,0.3)"
              : "rgba(109, 40, 217, 0.3)"
          } !important;
          box-shadow: ${
            themeMode === "dark"
              ? "0 2px 8px rgba(0,0,0,0.35)"
              : "0 2px 8px rgba(109, 40, 217, 0.2)"
          };
        }
        
        .blog-calendar .ant-picker-calendar-date:hover {
          background: ${
            themeMode === "dark"
              ? "rgba(207,191,166,0.12)"
              : "linear-gradient(135deg, rgba(109, 40, 217, 0.08) 0%, rgba(109, 40, 217, 0.03) 100%)"
          } !important;
          transform: translateY(-1px);
          box-shadow: ${
            themeMode === "dark"
              ? "0 4px 12px rgba(0,0,0,0.35)"
              : "0 4px 12px rgba(109, 40, 217, 0.15)"
          };
        }
        
        .blog-calendar .ant-picker-calendar-date-selected {
          background: ${
            themeMode === "dark"
              ? "#9c6b3f"
              : "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)"
          } !important;
          border: 2px solid ${
            themeMode === "dark" ? "#9c6b3f" : "#6d28d9"
          } !important;
          box-shadow: ${
            themeMode === "dark"
              ? "0 4px 16px rgba(0,0,0,0.35)"
              : "0 4px 16px rgba(109, 40, 217, 0.3)"
          };
        }
        
        .blog-calendar .ant-picker-calendar-date-selected .ant-picker-calendar-date-value {
          color: ${themeMode === "dark" ? "#141311" : "#fff"} !important;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .blog-calendar .ant-picker-calendar-date-value {
          font-size: ${isMobile ? "13px" : "15px"};
          line-height: 1.2;
          font-weight: 500;
          color: ${themeMode === "dark" ? "#f5ede0" : "inherit"};
        }
        
        .blog-calendar .ant-picker-calendar-date-today .ant-picker-calendar-date-value {
          color: ${themeMode === "dark" ? "#d2a86a" : "#6d28d9"} !important;
          font-weight: 700;
        }
        
        .blog-calendar .ant-picker-calendar-month-panel {
          padding: ${isMobile ? "12px" : "16px"};
          background: ${
            themeMode === "dark"
              ? "#141311"
              : "linear-gradient(135deg, #faf7ff 0%, #ffffff 100%)"
          };
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
          background: ${
            themeMode === "dark"
              ? "rgba(207,191,166,0.12)"
              : "linear-gradient(135deg, rgba(109, 40, 217, 0.08) 0%, rgba(109, 40, 217, 0.03) 100%)"
          } !important;
          transform: translateY(-2px);
          box-shadow: ${
            themeMode === "dark"
              ? "0 6px 20px rgba(0,0,0,0.35)"
              : "0 6px 20px rgba(109, 40, 217, 0.15)"
          };
        }
        
        .blog-calendar .ant-picker-calendar-month-panel-cell-selected {
          background: ${
            themeMode === "dark"
              ? "#9c6b3f"
              : "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)"
          } !important;
          border: 2px solid ${
            themeMode === "dark" ? "#9c6b3f" : "#6d28d9"
          } !important;
          box-shadow: ${
            themeMode === "dark"
              ? "0 6px 24px rgba(0,0,0,0.35)"
              : "0 6px 24px rgba(109, 40, 217, 0.3)"
          };
        }
        
        .blog-calendar .ant-picker-calendar-month-panel-cell-selected .ant-picker-calendar-month-panel-cell-content {
          color: ${themeMode === "dark" ? "#141311" : "#fff"} !important;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .blog-calendar .ant-picker-calendar-month-panel-cell-content {
          font-size: ${isMobile ? "13px" : "15px"};
          font-weight: 500;
          color: ${themeMode === "dark" ? "#f5ede0" : "inherit"};
        }
        
        .blog-calendar .ant-picker-calendar-date-today::before {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          right: 3px;
          bottom: 3px;
          border: 2px solid ${themeMode === "dark" ? "#d2a86a" : "#6d28d9"};
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
