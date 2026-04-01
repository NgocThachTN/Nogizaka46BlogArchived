// BlogCalendar.jsx — Ant Design Pro • Calendar with Blog Posts
import { useState, useMemo, useEffect } from "react";
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
import "dayjs/locale/en";
import "dayjs/locale/vi";

// Import Ant Design locales for Calendar
import jaJP from "antd/es/locale/ja_JP";
import enUS from "antd/es/locale/en_US";
import viVN from "antd/es/locale/vi_VN";

import { getImageUrl } from "../services/blogService";
import { CalendarWidgetSkeleton } from "./PageSkeletons";

const { Text } = Typography;

// Get Ant Design locale based on language
const getAntdLocale = (lang) => {
  switch (lang) {
    case "vi":
      return viVN;
    case "en":
      return enUS;
    default:
      return jaJP;
  }
};

// Set locale based on language
const setDayjsLocale = (lang) => {
  switch (lang) {
    case "vi":
      dayjs.locale("vi");
      break;
    case "en":
      dayjs.locale("en");
      break;
    default:
      dayjs.locale("ja");
  }
};

// Format date based on language
const formatDate = (date, lang, format = "full") => {
  if (format === "yearMonth") {
    switch (lang) {
      case "vi":
        return `Tháng ${date.format("M/YYYY")}`;
      case "en":
        return date.format("MMMM YYYY");
      default:
        return date.format("YYYY年M月");
    }
  } else if (format === "year") {
    switch (lang) {
      case "vi":
        return `Năm ${date.format("YYYY")}`;
      case "en":
        return date.format("YYYY");
      default:
        return date.format("YYYY年");
    }
  } else {
    // full date
    switch (lang) {
      case "vi":
        return date.format("DD/MM/YYYY");
      case "en":
        return date.format("MMMM D, YYYY");
      default:
        return date.format("YYYY年M月D日");
    }
  }
};

// Translation keys
const t = {
  calendar: { ja: "カレンダー", en: "Calendar", vi: "Lịch" },
  thisMonth: {
    ja: "今月の投稿",
    en: "This Month's Posts",
    vi: "Bài viết tháng này",
  },
  totalPosts: { ja: "総投稿数", en: "Total Posts", vi: "Tổng số bài viết" },
  yearView: { ja: "年表示", en: "Year", vi: "Năm" },
  monthView: { ja: "月表示", en: "Month", vi: "Tháng" },
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
  onBlogClick = () => { },
  isMobile = false,
  language = "ja",
  themeMode = "light",
  loading = false,
}) {
  // Set initial locale
  setDayjsLocale(language);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState("month"); // month, year

  // Set locale when language changes
  useEffect(() => {
    setDayjsLocale(language);
    // Force re-render by updating selectedDate with new locale
    setSelectedDate(prev => dayjs(prev.toDate()));
  }, [language]);

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

    const isDark = themeMode === "dark";

    return (
      <div className="blog-date-marker" style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 2
      }}>
        <div
          style={{
            width: "60%",
            height: 3,
            borderRadius: 2,
            background: isDark ? "#d2a86a" : "#8b4513",
            opacity: 0.8
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
  if (loading) {
    return <CalendarWidgetSkeleton themeMode={themeMode} isMobile={isMobile} />;
  }

  if (!blogs || blogs.length === 0) {
    return (
      <div
        style={{
          borderRadius: 2,
          background:
            themeMode === "dark"
              ? "rgba(36, 33, 29, 0.95)"
              : "rgba(255, 255, 255, 0.9)",
          border:
            themeMode === "dark"
              ? "1px solid rgba(207,191,166,0.2)"
              : "1px solid rgba(0,0,0,0.05)",
          boxShadow:
            themeMode === "dark"
              ? "0 4px 12px rgba(0,0,0,0.3)"
              : "0 2px 8px rgba(0,0,0,0.05)",
          padding: isMobile ? 12 : 16
        }}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Text type="secondary">{t.loading[language]}</Text>
        </div>
      </div>
    );
  }

  const isDark = themeMode === "dark";

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
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        borderBottom: `1px dashed ${isDark ? "rgba(207,191,166,0.2)" : "rgba(139, 69, 19, 0.1)"}`,
        paddingBottom: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarOutlined style={{ fontSize: 16, color: isDark ? "#d2a86a" : "#8b4513" }} />
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            fontFamily: isDark ? "serif" : "'Yomogi', cursive",
            color: isDark ? "#d2a86a" : "#8b4513"
          }}>
            {t.calendar[language]}
          </span>
        </div>

        <Button
          size="small"
          type="text"
          style={{
            fontSize: 12,
            fontFamily: "'Playfair Display', serif",
            color: isDark ? "#cfbfa6" : "#8b4513"
          }}
          onClick={() => setViewMode(viewMode === "month" ? "year" : "month")}
        >
          {viewMode === "month" ? t.yearView[language] : t.monthView[language]}
        </Button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <Calendar
          key={language} // Force re-render when language changes
          locale={getAntdLocale(language)} // Set Ant Design locale
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
                marginBottom: 8,
                padding: "0 4px",
              }}
            >
              <Button
                size="small"
                type="text"
                style={{ fontSize: 14, color: isDark ? "#d2a86a" : "#8b4513" }}
                onClick={() =>
                  onChange(
                    value.subtract(1, viewMode === "month" ? "month" : "year")
                  )
                }
              >
                ←
              </Button>
              <Text strong style={{
                fontSize: isMobile ? 14 : 16,
                fontFamily: "'Playfair Display', serif",
                color: isDark ? "#f5ede0" : "#2d1b0e"
              }}>
                {viewMode === "month"
                  ? formatDate(value, language, "yearMonth")
                  : formatDate(value, language, "year")}
              </Text>
              <Button
                size="small"
                type="text"
                style={{ fontSize: 14, color: isDark ? "#d2a86a" : "#8b4513" }}
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
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px dashed ${isDark ? "rgba(207,191,166,0.2)" : "rgba(139, 69, 19, 0.1)"}`
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: isDark ? "#cfbfa6" : "#666" }}>
              <ReadOutlined />
              <span>{formatDate(selectedDate, language)}</span>
            </div>
            <Badge
              count={selectedDateBlogs.length}
              style={{
                backgroundColor: isDark ? "#d2a86a" : "#8b4513",
                color: isDark ? "#141311" : "#fff",
                boxShadow: "none",
                fontWeight: 600,
              }}
            />
          </div>

          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            {selectedDateBlogs.map((blog) => (
              <div
                key={blog.id}
                onClick={() => onBlogClick(blog.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(139, 69, 19, 0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 4,
                    overflow: "hidden",
                    flexShrink: 0,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: isDark ? "#f5ede0" : "#2d1b0e",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "'Playfair Display', serif"
                  }}>
                    {blog.title}
                  </div>
                </div>
              </div>
            ))}
          </Space>
        </div>
      )}

      {/* No blogs for selected date */}
      {selectedDateBlogs.length === 0 && (
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px dashed ${isDark ? "rgba(207,191,166,0.2)" : "rgba(139, 69, 19, 0.1)"}`,
          textAlign: "center",
          color: isDark ? "#666" : "#999",
          fontSize: 13,
          padding: "10px 0"
        }}>
          {t.noPosts[language]}
        </div>
      )}

      {/* Enhanced Calendar Styles */}
      <style>{`
        .blog-calendar {
          background: transparent !important;
        }
        
        .blog-calendar .ant-picker-calendar-header {
          padding: 0;
          border-bottom: none;
          margin-bottom: 8px;
        }
        
        .blog-calendar .ant-picker-calendar-date {
          height: ${isMobile ? "28px" : "30px"};
          margin: 0;
          border-radius: 4px;
        }

        .blog-calendar .ant-picker-calendar-date-content {
           height: 100%;
        }

        /* Hide today circle default style to use our custom one but keep text visible */
         .blog-calendar .ant-picker-calendar-date-today {
           background: transparent !important;
           border: none !important;
           box-shadow: none !important;
         }
         
         .blog-calendar .ant-picker-calendar-date-content {
           height: 100%;
           position: absolute;
           top: 0;
           left: 0;
           width: 100%;
           pointer-events: none;
         }

        .blog-calendar .ant-picker-calendar-date:hover {
          background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(139, 69, 19, 0.1)"} !important;
        }
        
        .blog-calendar .ant-picker-calendar-date-selected {
           background: transparent !important;
           box-shadow: none !important;
           border: none !important;
        }
        
        /* Circle around selected date */
        .blog-calendar .ant-picker-calendar-date-selected::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            right: 2px;
            bottom: 2px;
            border: 2px solid ${isDark ? "#d2a86a" : "#8b4513"};
            border-radius: 50%;
            pointer-events: none;
        }

        .blog-calendar .ant-picker-calendar-date-value {
           color: ${themeMode === "dark" ? "#cfbfa6" : "#5d4e37"};
           font-family: 'Playfair Display', serif;
           font-weight: 500;
        }
        
        .blog-calendar .ant-picker-calendar-date-today .ant-picker-calendar-date-value {
           font-weight: 700;
           text-decoration: underline;
           text-underline-offset: 4px;
           text-decoration-color: ${isDark ? "#d2a86a" : "#8b4513"};
        }

        .blog-calendar .ant-picker-calendar-month-panel {
           background: transparent !important;
        }
      `}</style>
    </div>
  );
}
