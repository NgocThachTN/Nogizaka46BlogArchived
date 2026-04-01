import { lazy, Suspense, useEffect, useMemo, type ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProLayout } from "@ant-design/pro-components";
import { ConfigProvider, Segmented, theme } from "antd";
import { BulbOutlined, MoonOutlined } from "@ant-design/icons";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { useAppPreferences } from "../lib/hooks/useAppPreferences";
import { useResponsive } from "../lib/hooks/useResponsive";
import {
  BlogDetailDesktopSkeleton,
  BlogDetailMobileSkeleton,
  BlogListDesktopSkeleton,
  BlogListMobileSkeleton,
  MemberListDesktopSkeleton,
  MemberListMobileSkeleton,
  MemberProfileSkeleton,
} from "../shared/components/PageSkeletons";
import type { PageProps, ThemeMode } from "../shared/types";
import "./App.css";

const MemberListDesktop = lazy(
  () => import("../features/members/components/MemberList")
);
const MemberListMobile = lazy(
  () => import("../features/members/components/MemberListMobile")
);
const BlogListDesktop = lazy(
  () => import("../features/blogs/components/BlogList")
);
const BlogListMobile = lazy(
  () => import("../features/blogs/components/BlogListMobile")
);
const BlogDetailPage = lazy(
  () => import("../features/blogs/components/BlogDetail")
);
const MemberProfile = lazy(
  () => import("../features/members/components/MemberProfile")
);

type RouteKey = "members" | "blogs" | "blog-detail";

function RouteFallback({
  routeKey,
  themeMode,
  isMobile,
}: {
  routeKey: RouteKey;
  themeMode: ThemeMode;
  isMobile: boolean;
}) {
  if (routeKey === "members") {
    return isMobile ? (
      <MemberListMobileSkeleton themeMode={themeMode} />
    ) : (
      <div className="diary-paper notebook-container" style={{ minHeight: "100vh", padding: "40px", paddingLeft: "60px" }}>
        <div className="notebook-binding" style={{ left: 0 }}></div>
        <MemberListDesktopSkeleton themeMode={themeMode} />
      </div>
    );
  }

  if (routeKey === "blogs") {
    return isMobile ? (
      <BlogListMobileSkeleton themeMode={themeMode} />
    ) : (
      <div className="diary-paper notebook-container" style={{ minHeight: "100vh", padding: "40px", paddingLeft: "60px" }}>
        <div className="notebook-binding" style={{ left: 0 }}></div>
        <BlogListDesktopSkeleton themeMode={themeMode} />
      </div>
    );
  }

  return isMobile ? (
    <BlogDetailMobileSkeleton themeMode={themeMode} />
  ) : (
    <div className="diary-paper notebook-container" style={{ minHeight: "100vh", padding: "40px", paddingLeft: "60px" }}>
      <div className="notebook-binding" style={{ left: 0 }}></div>
      <BlogDetailDesktopSkeleton themeMode={themeMode} />
    </div>
  );
}

function renderLazyPage(
  Component: typeof MemberListDesktop,
  props: PageProps,
  fallback: ReactNode
) {
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

function App() {
  const { language, setLanguage, themeMode, setThemeMode } = useAppPreferences();
  const { isMobile } = useResponsive();

  useEffect(() => {
    document.title = "Nogizaka46 Blog Archive";
  }, []);

  const algorithm = useMemo(
    () =>
      themeMode === "dark" ? [theme.darkAlgorithm] : [theme.defaultAlgorithm],
    [themeMode]
  );

  const tokens = useMemo(() => {
    if (themeMode === "dark") {
      return {
        colorPrimary: "#9c6b3f",
        colorBgContainer: "#1c1a17",
        colorBgLayout: "#141311",
        colorBgElevated: "#24211d",
        colorText: "#f5ede0",
        colorTextSecondary: "#cfbfa6",
        borderRadius: 8,
        borderRadiusLG: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.45)",
        fontFamily: "'Playfair Display', 'Times New Roman', 'Georgia', 'serif'",
      };
    }

    return {
      colorPrimary: "#8B4513",
      colorBgContainer: "#FDF6E3",
      colorBgLayout: "#F4F1E8",
      colorBgElevated: "#FDF6E3",
      colorText: "#3C2415",
      colorTextSecondary: "#5D4E37",
      borderRadius: 8,
      borderRadiusLG: 12,
      boxShadow:
        "0 2px 8px rgba(139, 69, 19, 0.1), 0 1px 3px rgba(139, 69, 19, 0.15)",
      fontFamily: "'Playfair Display', 'Times New Roman', 'Georgia', 'serif'",
    };
  }, [themeMode]);

  const componentTokens = useMemo(
    () => ({
      Layout:
        themeMode === "dark"
          ? { siderBg: "#141311", headerBg: "#141311", bodyBg: "#1c1a17" }
          : { siderBg: "#F4F1E8", headerBg: "#F4F1E8", bodyBg: "#FDF6E3" },
      Card:
        themeMode === "dark"
          ? {
              borderRadiusLG: 12,
              boxShadowTertiary: "0 2px 8px rgba(0,0,0,0.35)",
              colorBgContainer: "#24211d",
            }
          : {
              borderRadiusLG: 12,
              boxShadowTertiary: "0 2px 8px rgba(139, 69, 19, 0.1)",
              colorBgContainer: "#FDF6E3",
            },
      Button: { borderRadius: 6, borderRadiusLG: 8 },
      Typography:
        themeMode === "dark"
          ? { colorText: "#f5ede0", colorTextSecondary: "#cfbfa6" }
          : { colorText: "#3C2415", colorTextSecondary: "#5D4E37" },
    }),
    [themeMode]
  );

  const pageProps: PageProps = {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
  };

  const memberPageComponent = isMobile ? MemberListMobile : MemberListDesktop;
  const blogListPageComponent = isMobile ? BlogListMobile : BlogListDesktop;

  return (
    <ConfigProvider
      theme={{
        algorithm,
        token: tokens,
        components: componentTokens,
      }}
    >
      <Router>
        <div
          className={`min-h-screen ${
            themeMode === "dark" ? "dark-book-background" : "book-background"
          }`}
        >
          <ProLayout
            layout="side"
            title=""
            logo={false}
            fixSiderbar
            collapsed={isMobile}
            siderWidth={320}
            menuRender={() =>
              !isMobile ? (
                <div className="p-4 h-full overflow-y-auto">
                  <Suspense fallback={<MemberProfileSkeleton themeMode={themeMode} />}>
                    <MemberProfile />
                  </Suspense>
                </div>
              ) : null
            }
            headerRender={isMobile ? false : undefined}
            actionsRender={() => [
              <Segmented
                key="theme-switch"
                size="middle"
                value={themeMode}
                onChange={(value) => setThemeMode(value as ThemeMode)}
                options={[
                  { label: "Light", value: "light", icon: <BulbOutlined /> },
                  { label: "Dark", value: "dark", icon: <MoonOutlined /> },
                ]}
              />,
            ]}
            contentStyle={{ margin: 0, padding: 0 }}
            style={{ minHeight: "100vh" }}
            menuHeaderRender={false}
          >
            <div className="min-h-screen" style={{ paddingTop: 0, marginTop: 0 }}>
              <Routes>
                <Route path="/" element={<Navigate to="/members" replace />} />
                <Route
                  path="/members"
                  element={renderLazyPage(
                    memberPageComponent,
                    pageProps,
                    <RouteFallback routeKey="members" themeMode={themeMode} isMobile={isMobile} />
                  )}
                />
                <Route
                  path="/blogs/:memberCode"
                  element={renderLazyPage(
                    blogListPageComponent,
                    pageProps,
                    <RouteFallback routeKey="blogs" themeMode={themeMode} isMobile={isMobile} />
                  )}
                />
                <Route
                  path="/blog/:id"
                  element={renderLazyPage(
                    BlogDetailPage,
                    pageProps,
                    <RouteFallback routeKey="blog-detail" themeMode={themeMode} isMobile={isMobile} />
                  )}
                />
              </Routes>
            </div>
          </ProLayout>
        </div>
      </Router>
      <SpeedInsights />
      <Analytics />
    </ConfigProvider>
  );
}

export default App;
