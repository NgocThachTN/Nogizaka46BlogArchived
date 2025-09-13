import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProLayout } from "@ant-design/pro-components";
import { ConfigProvider, theme } from "antd";
import { useEffect, useState } from "react";
import BlogList from "./components/BlogList";
import BlogListMobile from "./components/BlogListMobile";
import BlogDetail from "./components/BlogDetail";
import MemberProfile from "./components/MemberProfile";
import MemberList from "./components/MemberList";
import "./App.css";

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [language, setLanguage] = useState("ja");

  useEffect(() => {
    document.title = "Nogizaka46 Blog Archive";

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
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
          fontFamily:
            "'Playfair Display', 'Times New Roman', 'Georgia', 'serif'",
        },
        components: {
          Layout: {
            siderBg: "#F4F1E8",
            headerBg: "#F4F1E8",
            bodyBg: "#FDF6E3",
          },
          Card: {
            borderRadiusLG: 12,
            boxShadowTertiary:
              "0 2px 8px rgba(139, 69, 19, 0.1), 0 1px 3px rgba(139, 69, 19, 0.15)",
            colorBgContainer: "#FDF6E3",
          },
          Button: {
            borderRadius: 6,
            borderRadiusLG: 8,
          },
          Typography: {
            colorText: "#3C2415",
            colorTextSecondary: "#5D4E37",
          },
        },
      }}
    >
      <Router>
        <div className="min-h-screen book-background">
          {/* Mobile Header - Removed title text */}
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
            // headerRender={() => (
            //   <div className="flex items-center w-full px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
            //     <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            //       {/* <span className="text-white font-bold">N46</span> */}
            //     </div>
            //   </div>
            // )}
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
                    <MemberList language={language} setLanguage={setLanguage} />
                  }
                />
                <Route
                  path="/blogs/:memberCode"
                  element={
                    isMobile ? (
                      <BlogListMobile
                        language={language}
                        setLanguage={setLanguage}
                      />
                    ) : (
                      <BlogList language={language} setLanguage={setLanguage} />
                    )
                  }
                />
                <Route
                  path="/blog/:id"
                  element={
                    <BlogDetail language={language} setLanguage={setLanguage} />
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
