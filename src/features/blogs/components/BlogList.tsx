import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Typography, Empty, Pagination, Grid, Button } from "antd";
import { ProCard } from "@ant-design/pro-components";
import BlogCalendar from "./BlogCalendar";
import RecentBlogs from "./RecentBlogs";
import BlogListHeader from "./BlogList/Components/BlogListHeader";
import BlogListFilterBar from "./BlogList/Components/BlogListFilterBar";
import BlogCard from "./BlogList/Components/BlogCard";
import { BlogListDesktopSkeleton } from "../../../shared/components/PageSkeletons";
import { useMemberBlogs } from "../hooks/useMemberBlogs";
import type { PageProps } from "../../../shared/types";

const { Title } = Typography;
const { useBreakpoint } = Grid;

const t = {
  noBlogs: {
    ja: "ブログが見つかりません",
    en: "No blogs found",
    vi: "Không tìm thấy blog",
  },
  retry: {
    ja: "再試行",
    en: "Retry",
    vi: "Thử lại",
  },
};

export default function BlogList({
  language,
  setLanguage,
  themeMode,
  setThemeMode,
}: PageProps) {
  const navigate = useNavigate();
  const { memberCode } = useParams();
  const screens = useBreakpoint();
  const currentLanguage = ["ja", "en", "vi"].includes(language) ? language : "ja";
  const pageSize = 9;
  const {
    blogs,
    filteredBlogs,
    currentBlogs,
    loading,
    error,
    memberInfo,
    query,
    setQuery,
    page,
    setPage,
    isPending,
    openBlog,
  } = useMemberBlogs(memberCode, currentLanguage, pageSize);

  const calendarTitle = useMemo(() => "CALENDAR", []);

  if (error) {
    return (
      <div className="diary-paper notebook-container" style={{ minHeight: "100vh", padding: "40px", paddingLeft: "60px" }}>
        <div className="notebook-binding" style={{ left: 0 }}></div>
        <ProCard
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Title level={4} type="danger">
            {error}
          </Title>
          <Button type="primary" onClick={() => window.location.reload()}>
            {t.retry[currentLanguage]}
          </Button>
        </ProCard>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <div
        className="diary-paper notebook-container"
        style={{
          minHeight: "100vh",
          padding: "40px",
          paddingLeft: "60px",
        }}
      >
        <div className="notebook-binding" style={{ left: 0 }}></div>

        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          {(loading || isPending) && !blogs.length ? (
            <BlogListDesktopSkeleton themeMode={themeMode} isMobile={screens.xs} />
          ) : (
            <ProCard ghost gutter={[24, 24]} wrap>
              <ProCard colSpan={{ xs: 24, md: 16, xl: 17 }} ghost>
                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                  <div className="sticky-note" style={{ transform: "rotate(-1deg)", zIndex: 10 }}>
                    <BlogListHeader
                      memberInfo={memberInfo}
                      language={language}
                      setLanguage={setLanguage}
                      themeMode={themeMode}
                      setThemeMode={setThemeMode}
                      screens={screens}
                    />
                  </div>

                  <div className="sticky-note" style={{ transform: "rotate(1deg)", zIndex: 9, marginTop: "-16px" }}>
                    <BlogListFilterBar
                      language={language}
                      themeMode={themeMode}
                      screens={screens}
                      q={query}
                      setQ={setQuery}
                      filteredCount={filteredBlogs.length}
                      isPending={isPending}
                    />
                  </div>

                  {currentBlogs.length === 0 ? (
                    <ProCard
                      bordered
                      style={{
                        borderRadius: 14,
                        minHeight: 220,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          themeMode === "dark"
                            ? "rgba(36, 33, 29, 0.85)"
                            : "rgba(253, 246, 227, 0.8)",
                      }}
                    >
                      <Empty description={t.noBlogs[currentLanguage]} />
                    </ProCard>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: screens.xs ? "repeat(1, 1fr)" : "repeat(3, 1fr)",
                        gap: "24px",
                        width: "100%",
                      }}
                    >
                      {currentBlogs.map((blog, index) => (
                        <div key={blog.id} className="blog-card-wrapper" style={{ height: "100%" }}>
                          <BlogCard
                            blog={blog}
                            index={index}
                            language={language}
                            themeMode={themeMode}
                            screens={screens}
                            onOpen={(blogId: string) => openBlog(blogId, navigate)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredBlogs.length > 0 && (
                    <div
                      className="sticky-note"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        transform: "rotate(-0.5deg)",
                        padding: "12px",
                        background:
                          themeMode === "dark"
                            ? "rgba(36, 33, 29, 0.9)"
                            : "rgba(253, 246, 227, 0.9)",
                        borderRadius: "8px",
                      }}
                    >
                      <Pagination
                        current={page}
                        total={filteredBlogs.length}
                        pageSize={pageSize}
                        onChange={setPage}
                        showSizeChanger={false}
                        size={screens.xs ? "small" : "default"}
                      />
                    </div>
                  )}
                </div>
              </ProCard>

              <ProCard colSpan={{ xs: 24, md: 8, xl: 7 }} ghost>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: 40 }}>
                  <div className="sidebar-notepad" style={{ transform: "rotate(1deg)" }}>
                    <div style={{ marginBottom: 16 }}>
                      <Title level={5} style={{ margin: 0, textAlign: "center", fontFamily: "inherit", opacity: 0.7 }}>
                        {calendarTitle}
                      </Title>
                    </div>
                    <BlogCalendar
                      blogs={blogs}
                      memberInfo={memberInfo}
                      onBlogClick={(blogId?: string) => {
                        if (blogId) {
                          openBlog(blogId, navigate);
                        }
                      }}
                      isMobile={screens.xs}
                      language={language}
                      themeMode={themeMode}
                    />
                  </div>

                  <div className="sidebar-notepad" style={{ transform: "rotate(-0.5deg)" }}>
                    <div style={{ marginBottom: 16 }}>
                      <Title level={5} style={{ margin: 0, textAlign: "center", fontFamily: "inherit", opacity: 0.7 }}>
                        RECENT ENTRIES
                      </Title>
                    </div>
                    <RecentBlogs
                      blogs={blogs}
                      onBlogClick={(blogId?: string) => {
                        if (blogId) {
                          openBlog(blogId, navigate);
                        }
                      }}
                      isMobile={screens.xs}
                      language={language}
                      themeMode={themeMode}
                      maxItems={5}
                    />
                  </div>
                </div>
              </ProCard>
            </ProCard>
          )}
        </div>
      </div>

      <style>{`
        .blog-card img {
          border-radius: 4px;
        }

        .blog-card .ant-pro-card-body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
