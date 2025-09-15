import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProLayout } from "@ant-design/pro-components";
import { ConfigProvider, theme, Segmented } from "antd";
import { BulbOutlined, MoonOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import BlogList from "./components/BlogList";
import BlogListMobile from "./components/BlogListMobile";
import BlogDetail from "./components/BlogDetail";
import MemberProfile from "./components/MemberProfile";
import MemberList from "./components/MemberList";
import "./App.css";
import { Analytics } from "@vercel/analytics/next"

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [language, setLanguage] = useState("ja");
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem("theme-mode");
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    document.title = "Nogizaka46 Blog Archive";

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme-mode", themeMode);
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [themeMode]);

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
            title={<div className="flex items-center space-x-3"></div>}
            logo={false}
            fixSiderbar
            collapsed={isMobile}
            siderWidth={320}
            headerHeight={isMobile ? 0 : 72}
            menuRender={() => {
              return !isMobile ? (
                <div className="p-4 h-full overflow-y-auto">
                  <MemberProfile />
                </div>
              ) : null;
            }}
            headerRender={isMobile ? false : undefined}
            actionsRender={() => [
              <Segmented
                key="theme-switch"
                size="middle"
                value={themeMode}
                onChange={(val) => setThemeMode(val)}
                options={[
                  { label: "Light", value: "light", icon: <BulbOutlined /> },
                  { label: "Dark", value: "dark", icon: <MoonOutlined /> },
                ]}
              />,
            ]}
            style={{
              minHeight: "100vh",
            }}
            menuHeaderRender={false}
          >
            <div
              className="min-h-screen"
              style={{ paddingTop: 0, marginTop: 0 }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/members" replace />} />
                <Route
                  path="/members"
                  element={
                    <MemberList
                      language={language}
                      setLanguage={setLanguage}
                      themeMode={themeMode}
                      setThemeMode={setThemeMode}
                    />
                  }
                />
                <Route
                  path="/blogs/:memberCode"
                  element={
                    isMobile ? (
                      <BlogListMobile
                        language={language}
                        setLanguage={setLanguage}
                        themeMode={themeMode}
                        setThemeMode={setThemeMode}
                      />
                    ) : (
                      <BlogList
                        language={language}
                        setLanguage={setLanguage}
                        themeMode={themeMode}
                        setThemeMode={setThemeMode}
                      />
                    )
                  }
                />
                <Route
                  path="/blog/:id"
                  element={
                    <BlogDetail
                      language={language}
                      setLanguage={setLanguage}
                      themeMode={themeMode}
                      setThemeMode={setThemeMode}
                    />
                  }
                />
              </Routes>
            </div>
          </ProLayout>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
