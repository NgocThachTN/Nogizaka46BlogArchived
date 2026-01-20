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
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Reading Time Estimate - Sticky Note */}
            <div className="sticky-note" style={{ transform: "rotate(1deg)", zIndex: 4 }}>
                <ReadingTimeCard
                    readMinutes={readMinutes}
                    language={language}
                    themeMode={themeMode}
                    isMobile={isMobile}
                />
            </div>

            {/* Table of Contents - Sticky Note */}
            {toc && toc.length > 0 && (
                <div className="sticky-note" style={{ transform: "rotate(-1deg)", zIndex: 3 }}>
                    <TableOfContents toc={toc} language={language} themeMode={themeMode} />
                </div>
            )}

            {/* Blog Calendar - Sticky Note / Notepad */}
            <div className="sticky-note" style={{ transform: "rotate(0.5deg)", zIndex: 2 }}>
                <BlogCalendar
                    blogs={memberBlogs}
                    memberInfo={memberInfo}
                    onBlogClick={onBlogClick}
                    isMobile={isMobile}
                    language={language}
                    themeMode={themeMode}
                />
            </div>

            {/* Recent Blogs - Sticky Note / Notepad */}
            <div className="sticky-note" style={{ transform: "rotate(-0.5deg)", zIndex: 1 }}>
                <RecentBlogs
                    blogs={memberBlogs}
                    onBlogClick={onBlogClick}
                    isMobile={isMobile}
                    language={language}
                    themeMode={themeMode}
                    maxItems={5}
                />
            </div>
        </div>
    );
}
