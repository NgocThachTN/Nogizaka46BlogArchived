import { Avatar, Skeleton } from "antd";
import type { CSSProperties } from "react";

const getSurfaceStyle = (themeMode, extra = {}) => ({
  background:
    themeMode === "dark"
      ? "rgba(36, 33, 29, 0.9)"
      : "rgba(255, 255, 255, 0.92)",
  border:
    themeMode === "dark"
      ? "1px solid rgba(207,191,166,0.18)"
      : "1px solid rgba(139,69,19,0.12)",
  boxShadow:
    themeMode === "dark"
      ? "0 4px 14px rgba(0,0,0,0.35)"
      : "0 4px 14px rgba(139,69,19,0.08)",
  borderRadius: 4,
  ...extra,
});

const getSkeletonBlockStyle = (themeMode, extra = {}) => ({
  display: "block",
  width: "100%",
  borderRadius: 4,
  background:
    themeMode === "dark"
      ? "linear-gradient(90deg, rgba(72, 66, 58, 0.92) 25%, rgba(100, 92, 81, 0.98) 37%, rgba(72, 66, 58, 0.92) 63%)"
      : "linear-gradient(90deg, rgba(233, 226, 214, 0.95) 25%, rgba(245, 239, 229, 1) 37%, rgba(233, 226, 214, 0.95) 63%)",
  backgroundSize: "400% 100%",
  animation: "page-skeleton-shimmer 1.4s ease infinite",
  ...extra,
});

const SkeletonShimmerStyles = () => (
  <style>
    {`
      @keyframes page-skeleton-shimmer {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: 0 0;
        }
      }
    `}
  </style>
);

const MediaSkeletonBlock = ({ themeMode, style }) => (
  <div aria-hidden="true" style={getSkeletonBlockStyle(themeMode, style)} />
);

const SkeletonLine = ({ themeMode, width = "100%", height = 18, style = {} }: { themeMode: string; width?: string | number; height?: number; style?: CSSProperties }) => (
  <div
    aria-hidden="true"
    style={getSkeletonBlockStyle(themeMode, {
      width,
      height,
      borderRadius: height >= 28 ? 8 : 999,
      ...style,
    })}
  />
);

const StickySkeleton = ({ themeMode, children, style }) => (
  <div className="sticky-note" style={style}>
    <div style={getSurfaceStyle(themeMode, { padding: 18 })}>{children}</div>
  </div>
);

const MemberCardSkeleton = ({ themeMode }) => (
  <div
    style={getSurfaceStyle(themeMode, {
      padding: "10px 10px 16px 10px",
      transform: "rotate(-1deg)",
    })}
  >
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: "120%",
        marginBottom: 12,
        overflow: "hidden",
        borderRadius: 2,
      }}
    >
      <MediaSkeletonBlock
        themeMode={themeMode}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 2,
        }}
      />
    </div>
    <Skeleton active title={{ width: "72%" }} paragraph={{ rows: 2, width: ["92%", "58%"] }} />
  </div>
);

const MobileMemberCardSkeleton = ({ themeMode }) => (
  <div
    style={{
      ...getSurfaceStyle(themeMode, {
        background: themeMode === "dark" ? "#2a2520" : "#fff",
        padding: "8px 8px 12px 8px",
      }),
      display: "flex",
      alignItems: "center",
      gap: 16,
      marginBottom: 16,
    }}
  >
    <MediaSkeletonBlock
      themeMode={themeMode}
      style={{ width: 80, height: 96, borderRadius: 0, flexShrink: 0 }}
    />
    <div style={{ flex: 1 }}>
      <Skeleton active title={{ width: "60%" }} paragraph={{ rows: 2, width: ["80%", "45%"] }} />
    </div>
  </div>
);

const BlogCardSkeleton = ({ themeMode, height = 160 }) => (
  <div style={getSurfaceStyle(themeMode, { padding: 16 })}>
    <MediaSkeletonBlock themeMode={themeMode} style={{ height, marginBottom: 16, borderRadius: 12 }} />
    <Skeleton active title={{ width: "80%" }} paragraph={{ rows: 2, width: ["100%", "60%"] }} />
  </div>
);

const MobileDiaryCardSkeleton = ({ themeMode }) => (
  <div style={{ marginBottom: 24, position: "relative" }}>
    <div
      style={{
        position: "absolute",
        left: -24,
        top: 10,
        width: 24,
        height: 50,
        borderRadius: "4px 0 0 4px",
        background: themeMode === "dark" ? "#8b5a2b" : "#fdf6e3",
        border: "1px solid rgba(139,69,19,0.3)",
        borderRight: "none",
      }}
    />
    <div
      style={getSurfaceStyle(themeMode, {
        background: themeMode === "dark" ? "#2a2520" : "#fff",
        overflow: "hidden",
      })}
    >
      <MediaSkeletonBlock
        themeMode={themeMode}
        style={{ width: "100%", height: 180, borderRadius: 0, display: "block" }}
      />
      <div style={{ padding: "16px 20px" }}>
        <Skeleton active title={{ width: "78%" }} paragraph={{ rows: 1, width: "42%" }} />
      </div>
    </div>
  </div>
);

export function CalendarWidgetSkeleton({ themeMode, isMobile = false }) {
  return (
    <div style={getSurfaceStyle(themeMode, { padding: isMobile ? 12 : 20 })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Skeleton.Button active size="small" style={{ width: 120 }} />
        <Skeleton.Button active size="small" style={{ width: 72 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <Skeleton.Button active size="small" style={{ width: "100%", height: 28 }} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
          marginBottom: 18,
        }}
      >
        {Array.from({ length: 35 }, (_, i) => (
          <div
            key={`calendar-cell-${i}`}
            style={{
              height: isMobile ? 28 : 34,
              borderRadius: 4,
              background: themeMode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(139,69,19,0.08)",
            }}
          />
        ))}
      </div>
      <Skeleton active title={{ width: "45%" }} paragraph={{ rows: 3, width: ["100%", "94%", "86%"] }} />
    </div>
  );
}

export function RecentBlogsWidgetSkeleton({ themeMode, isMobile = false, rows = 5 }) {
  return (
    <div style={getSurfaceStyle(themeMode, { padding: isMobile ? 12 : 20 })}>
      <div style={{ marginBottom: 16 }}>
        <Skeleton.Button active size="small" style={{ width: 140 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={`recent-skeleton-${i}`}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: 8,
              borderRadius: 4,
              background: themeMode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            }}
          >
            <MediaSkeletonBlock
              themeMode={themeMode}
              style={{ width: isMobile ? 50 : 56, height: isMobile ? 50 : 56 }}
            />
            <div style={{ flex: 1 }}>
              <Skeleton active title={{ width: "90%" }} paragraph={{ rows: 1, width: "48%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberProfileSkeleton({ themeMode }) {
  return (
    <div style={{ position: "relative" }}>
      <SkeletonShimmerStyles />
      <div
        style={{
          position: "absolute",
          top: -12,
          left: "50%",
          width: 100,
          height: 30,
          transform: "translateX(-50%) rotate(2deg)",
          background: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.18)",
          zIndex: 1,
        }}
      />
      <div style={getSurfaceStyle(themeMode, { padding: "16px 16px 24px", position: "relative" })}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              display: "inline-block",
              padding: 8,
              borderRadius: 4,
              border:
                themeMode === "dark"
                  ? "1px solid rgba(207,191,166,0.18)"
                  : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Avatar
              shape="square"
              size={140}
              style={{
                background: themeMode === "dark" ? "#3a342d" : "#ede6dc",
              }}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <Skeleton active title={{ width: "58%" }} paragraph={{ rows: 2, width: ["44%", "52%"] }} />
          </div>
        </div>
        <div style={{ borderTop: `1px dashed ${themeMode === "dark" ? "rgba(255,255,255,0.1)" : "#eee"}`, paddingTop: 16 }}>
          <Skeleton active title={false} paragraph={{ rows: 4, width: ["100%", "100%", "96%", "82%"] }} />
        </div>
        <div style={{ marginTop: 20 }}>
          <Skeleton.Button active block style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

export function MemberListDesktopSkeleton({ themeMode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", maxWidth: 1200, margin: "0 auto" }}>
      <SkeletonShimmerStyles />
      <StickySkeleton themeMode={themeMode} style={{ transform: "rotate(-1deg)", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          <Skeleton active title={{ width: 280 }} paragraph={{ rows: 1, width: 180 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <Skeleton.Button active style={{ width: 140 }} />
            <Skeleton.Button active style={{ width: 164 }} />
          </div>
        </div>
      </StickySkeleton>

      <StickySkeleton themeMode={themeMode} style={{ transform: "rotate(1deg)", zIndex: 9, marginTop: -10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton.Button key={`member-filter-${i}`} active size="small" style={{ width: i === 0 ? 180 : 92 }} />
            ))}
          </div>
          <Skeleton.Input active style={{ width: 320 }} />
        </div>
      </StickySkeleton>

      {["6th", "5th", "4th"].map((label, groupIndex) => (
        <div key={`member-group-${label}`} style={{ marginBottom: groupIndex === 2 ? 0 : 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Skeleton.Avatar active size="small" shape="circle" />
            <Skeleton.Button active style={{ width: 140 }} />
            <Skeleton.Button active size="small" style={{ width: 84, marginLeft: "auto" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 32 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <MemberCardSkeleton key={`member-card-${label}-${i}`} themeMode={themeMode} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MemberListMobileSkeleton({ themeMode }) {
  return (
    <>
      <SkeletonShimmerStyles />
      <div
        style={{
          background: themeMode === "dark" ? "rgba(36, 33, 29, 0.95)" : "rgba(255,255,255,0.95)",
          borderBottom:
            themeMode === "dark"
              ? "1px dashed rgba(207,191,166,0.3)"
              : "1px dashed rgba(139,69,19,0.3)",
          padding: "12px 16px 12px 12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Skeleton active title={{ width: 180 }} paragraph={{ rows: 1, width: 120 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Skeleton.Button active size="small" style={{ width: 56 }} />
            <Skeleton.Button active size="small" shape="circle" />
            <Skeleton.Button active size="small" shape="circle" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Skeleton.Button active block style={{ width: "100%", height: 32, marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 12, overflow: "hidden" }}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton.Button key={`mobile-member-chip-${i}`} active size="small" style={{ width: i === 0 ? 64 : 88 }} />
            ))}
          </div>
          <Skeleton.Input active block style={{ width: "100%" }} />
        </div>
      </div>
      <div style={{ padding: "16px 16px 80px 32px" }}>
        {Array.from({ length: 6 }, (_, i) => (
          <MobileMemberCardSkeleton key={`mobile-member-card-${i}`} themeMode={themeMode} />
        ))}
      </div>
    </>
  );
}

export function BlogListDesktopSkeleton({ themeMode, isMobile = false }) {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <SkeletonShimmerStyles />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 17fr) minmax(280px, 7fr)", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <StickySkeleton themeMode={themeMode} style={{ transform: "rotate(-1deg)", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <Skeleton.Button active style={{ width: 132 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Skeleton.Avatar active size={64} />
                <Skeleton active title={{ width: 240 }} paragraph={{ rows: 1, width: 180 }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Skeleton.Button active style={{ width: 140 }} />
                <Skeleton.Button active shape="circle" />
              </div>
            </div>
          </StickySkeleton>

          <StickySkeleton themeMode={themeMode} style={{ transform: "rotate(1deg)", zIndex: 9, marginTop: -16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <Skeleton.Input active style={{ width: 360 }} />
              <Skeleton.Button active style={{ width: 130 }} />
            </div>
          </StickySkeleton>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 24 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <BlogCardSkeleton key={`blog-card-${i}`} themeMode={themeMode} height={isMobile ? 148 : 190} />
            ))}
          </div>

          <StickySkeleton themeMode={themeMode} style={{ transform: "rotate(-0.5deg)", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Skeleton.Button active style={{ width: 220 }} />
            </div>
          </StickySkeleton>
        </div>

        {!isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 40 }}>
            <div className="sidebar-notepad" style={{ transform: "rotate(1deg)" }}>
              <CalendarWidgetSkeleton themeMode={themeMode} />
            </div>
            <div className="sidebar-notepad" style={{ transform: "rotate(-0.5deg)" }}>
              <RecentBlogsWidgetSkeleton themeMode={themeMode} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BlogListMobileSkeleton({ themeMode }) {
  return (
    <>
      <SkeletonShimmerStyles />
      <div
        style={{
          background: themeMode === "dark" ? "rgba(36, 33, 29, 0.95)" : "rgba(255,255,255,0.95)",
          borderBottom:
            themeMode === "dark"
              ? "1px dashed rgba(207,191,166,0.3)"
              : "1px dashed rgba(139,69,19,0.3)",
          padding: "12px 16px 12px 12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Skeleton.Button active size="small" shape="circle" />
            <Skeleton.Avatar active size={40} />
            <Skeleton active title={{ width: 150 }} paragraph={{ rows: 1, width: 96 }} />
          </div>
          <Skeleton.Button active size="small" shape="circle" />
        </div>
        <div style={{ marginTop: 12 }}>
          <Skeleton.Input active block style={{ width: "100%" }} />
        </div>
      </div>
      <div style={{ padding: "20px 20px 80px 40px" }}>
        {Array.from({ length: 4 }, (_, i) => (
          <MobileDiaryCardSkeleton key={`mobile-diary-${i}`} themeMode={themeMode} />
        ))}
      </div>
    </>
  );
}

export function BlogDetailDesktopSkeleton({ themeMode }) {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <SkeletonShimmerStyles />
      <StickySkeleton themeMode={themeMode} style={{ transform: "rotate(-0.5deg)", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Skeleton.Button active style={{ width: 110 }} />
            <Skeleton.Button active style={{ width: 120 }} />
          </div>
          <Skeleton.Button active style={{ width: 280 }} />
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton.Button key={`detail-toolbar-${i}`} active shape="circle" />
            ))}
          </div>
        </div>
      </StickySkeleton>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", justifyContent: "center" }}>
        <div style={{ width: 300, flexShrink: 0, transform: "rotate(-1.5deg)" }}>
          <MemberProfileSkeleton themeMode={themeMode} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={getSurfaceStyle(themeMode, { padding: "28px 32px" })}>
            <Skeleton active title={{ width: "56%" }} paragraph={{ rows: 1, width: "24%" }} />
            <div style={{ margin: "24px 0" }}>
              <MediaSkeletonBlock themeMode={themeMode} style={{ width: "100%", height: 340 }} />
            </div>
            <Skeleton active title={false} paragraph={{ rows: 14, width: ["100%", "100%", "96%", "94%", "91%", "88%", "100%", "98%", "95%", "92%", "90%", "86%", "82%", "58%"] }} />
          </div>
        </div>

        <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 24 }}>
          <StickySkeleton themeMode={themeMode} style={{ transform: "rotate(1deg)", zIndex: 4 }}>
            <Skeleton active title={{ width: "55%" }} paragraph={{ rows: 2, width: ["70%", "45%"] }} />
          </StickySkeleton>
          <StickySkeleton themeMode={themeMode} style={{ transform: "rotate(-1deg)", zIndex: 3 }}>
            <Skeleton active title={{ width: "48%" }} paragraph={{ rows: 5, width: ["100%", "94%", "88%", "82%", "64%"] }} />
          </StickySkeleton>
          <div className="sticky-note" style={{ transform: "rotate(0.5deg)", zIndex: 2 }}>
            <CalendarWidgetSkeleton themeMode={themeMode} />
          </div>
          <div className="sticky-note" style={{ transform: "rotate(-0.5deg)", zIndex: 1 }}>
            <RecentBlogsWidgetSkeleton themeMode={themeMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlogDetailMobileSkeleton({ themeMode }) {
  return (
    <div
      className="diary-paper notebook-container mobile-skeleton-paper"
      style={{
        width: "100%",
        minHeight: "100vh",
        height: "100dvh",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: themeMode === "dark" ? "#1c1a17" : "#fdf6e3",
      }}
    >
      <SkeletonShimmerStyles />
      <div
        style={{
          background: themeMode === "dark" ? "rgba(36,33,29,0.95)" : "rgba(255,255,255,0.95)",
          borderBottom:
            themeMode === "dark"
              ? "1px dashed rgba(207,191,166,0.3)"
              : "1px dashed rgba(139,69,19,0.3)",
          padding: "8px 12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <Skeleton.Button active size="small" shape="circle" />
            <Skeleton.Button active size="small" shape="circle" />
            <Skeleton.Button active size="small" style={{ width: 74 }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Skeleton.Button active size="small" style={{ width: 108 }} />
            <Skeleton.Button active size="small" shape="circle" />
          </div>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          padding: "16px 12px 80px",
          backgroundColor: themeMode === "dark" ? "#2a2520" : "#FFF9E6",
        }}
      >
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `2px dashed ${themeMode === "dark" ? "rgba(207,191,166,0.2)" : "rgba(139,69,19,0.15)"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 80, textAlign: "center" }}>
              <Skeleton.Avatar active size={56} />
              <div style={{ marginTop: 8 }}>
                <Skeleton active title={{ width: "100%" }} paragraph={false} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <Skeleton active title={{ width: "100%" }} paragraph={{ rows: 1, width: "42%" }} />
            </div>
          </div>
        </div>
        <Skeleton active title={false} paragraph={{ rows: 4, width: ["100%", "100%", "86%", "64%"] }} />
        <div style={{ margin: "24px 0" }}>
          <MediaSkeletonBlock themeMode={themeMode} style={{ width: "100%", height: 220, display: "block" }} />
        </div>
        <Skeleton active title={false} paragraph={{ rows: 10, width: ["100%", "100%", "100%", "96%", "94%", "92%", "88%", "84%", "80%", "58%"] }} />
      </div>
    </div>
  );
}

export function BlogDetailTranslationSkeleton({
  themeMode,
  translationProgress = 0,
  showHeader = false,
}) {
  const progressText = Math.max(0, Math.min(100, Math.round(translationProgress || 0)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkeletonShimmerStyles />
      {showHeader && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
              width: "100%",
              padding: "0 4px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
                minWidth: 260,
              }}
            >
              <MediaSkeletonBlock
                themeMode={themeMode}
                style={{ width: 22, height: 22, borderRadius: 6 }}
              />
              <SkeletonLine themeMode={themeMode} width={180} height={24} />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
                flex: 1,
                maxWidth: "70%",
              }}
            >
              <SkeletonLine themeMode={themeMode} width={116} height={14} />
              <SkeletonLine themeMode={themeMode} width="62%" height={24} />
            </div>
          </div>
          <div
            style={{
              height: 1,
              background:
                themeMode === "dark"
                  ? "rgba(207,191,166,0.2)"
                  : "rgba(139,69,19,0.15)",
              marginBottom: 29,
            }}
          />
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SkeletonLine themeMode={themeMode} width={132} height={18} />
          <SkeletonLine themeMode={themeMode} width={88} height={18} />
        </div>
        <div
          style={{
            minWidth: 180,
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginLeft: "auto",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 999,
              overflow: "hidden",
              background:
                themeMode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(139,69,19,0.12)",
            }}
          >
            <div
              style={{
                width: `${progressText}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  themeMode === "dark"
                    ? "linear-gradient(90deg, #d2a86a 0%, #f0d8a5 100%)"
                    : "linear-gradient(90deg, #8b4513 0%, #c27a3f 100%)",
                transition: "width 0.25s ease",
              }}
            />
          </div>
          <span
            style={{
              minWidth: 42,
              textAlign: "right",
              fontSize: 12,
              fontWeight: 600,
              color: themeMode === "dark" ? "#d8c4a7" : "#8b4513",
            }}
          >
            {progressText}%
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SkeletonLine themeMode={themeMode} width="100%" height={18} />
        <SkeletonLine themeMode={themeMode} width="96%" height={18} />
        <SkeletonLine themeMode={themeMode} width="92%" height={18} />
        <SkeletonLine themeMode={themeMode} width="82%" height={18} />
        <MediaSkeletonBlock
          themeMode={themeMode}
          style={{ width: "100%", height: 300, borderRadius: 12, margin: "8px 0" }}
        />
        <SkeletonLine themeMode={themeMode} width="100%" height={18} />
        <SkeletonLine themeMode={themeMode} width="98%" height={18} />
        <SkeletonLine themeMode={themeMode} width="95%" height={18} />
        <SkeletonLine themeMode={themeMode} width="88%" height={18} />
        <SkeletonLine themeMode={themeMode} width="76%" height={18} />
      </div>
    </div>
  );
}

export function BlogDetailMobileTranslationSkeleton({
  themeMode,
  translationProgress = 0,
}) {
  const progressText = Math.max(0, Math.min(100, Math.round(translationProgress || 0)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SkeletonShimmerStyles />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ width: "min(220px, 100%)", display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 7,
              borderRadius: 999,
              overflow: "hidden",
              background:
                themeMode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(139,69,19,0.12)",
            }}
          >
            <div
              style={{
                width: `${progressText}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  themeMode === "dark"
                    ? "linear-gradient(90deg, #d2a86a 0%, #f0d8a5 100%)"
                    : "linear-gradient(90deg, #8b4513 0%, #c27a3f 100%)",
                transition: "width 0.25s ease",
              }}
            />
          </div>
          <span
            style={{
              minWidth: 36,
              textAlign: "right",
              fontSize: 11,
              fontWeight: 600,
              color: themeMode === "dark" ? "#d8c4a7" : "#8b4513",
            }}
          >
            {progressText}%
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SkeletonLine themeMode={themeMode} width="100%" height={18} />
        <SkeletonLine themeMode={themeMode} width="96%" height={18} />
        <SkeletonLine themeMode={themeMode} width="92%" height={18} />
        <SkeletonLine themeMode={themeMode} width="78%" height={18} />
        <MediaSkeletonBlock
          themeMode={themeMode}
          style={{ width: "100%", height: 220, borderRadius: 10, margin: "6px 0" }}
        />
        <SkeletonLine themeMode={themeMode} width="100%" height={18} />
        <SkeletonLine themeMode={themeMode} width="98%" height={18} />
        <SkeletonLine themeMode={themeMode} width="94%" height={18} />
        <SkeletonLine themeMode={themeMode} width="88%" height={18} />
        <SkeletonLine themeMode={themeMode} width="74%" height={18} />
      </div>
    </div>
  );
}
