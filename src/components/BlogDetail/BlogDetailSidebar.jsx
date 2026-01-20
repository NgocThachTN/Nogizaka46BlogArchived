import ReadingTimeCard from "./ReadingTimeCard";
import TableOfContents from "./TableOfContents";
import BlogCalendar from "../BlogCalendar";
import RecentBlogs from "../RecentBlogs";

export default function BlogDetailSidebar({
    toc,
    readMinutes,
    memberBlogs,
    memberInfo,
    onBlogClick,
    language,
    themeMode,
    isMobile,
}) {
    return (
        <>
            {/* Reading Time Estimate */}
            <ReadingTimeCard
                readMinutes={readMinutes}
                language={language}
                themeMode={themeMode}
                isMobile={isMobile}
            />

            {/* Table of Contents */}
            <TableOfContents toc={toc} language={language} themeMode={themeMode} />

            {/* Blog Calendar */}
            <BlogCalendar
                blogs={memberBlogs}
                memberInfo={memberInfo}
                onBlogClick={onBlogClick}
                isMobile={isMobile}
                language={language}
                themeMode={themeMode}
            />

            {/* Recent Blogs */}
            <div style={{ marginTop: 16 }}>
                <RecentBlogs
                    blogs={memberBlogs}
                    onBlogClick={onBlogClick}
                    isMobile={isMobile}
                    language={language}
                    themeMode={themeMode}
                    maxItems={5}
                />
            </div>
        </>
    );
}
