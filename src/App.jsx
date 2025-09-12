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
import BlogDetail from "./components/BlogDetail";
import MemberProfile from "./components/MemberProfile";
import MemberList from "./components/MemberList";
import "./App.css";

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
          colorPrimary: "#9C27B0",
          colorBgContainer: "#ffffff",
          borderRadius: 12,
          borderRadiusLG: 16,
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Layout: {
            siderBg: "#ffffff",
            headerBg: "#ffffff",
            bodyBg: "#f8fafc",
          },
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          },
          Button: {
            borderRadius: 8,
            borderRadiusLG: 12,
          },
        },
      }}
    >
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          {/* Mobile Header */}
          {isMobile && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: 56,
                background: "#ffffff",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 0.3,
                zIndex: 1000,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              Nogizaka46 Blog Translate
            </div>
          )}
          <ProLayout
            layout="side"
            title={
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  {/* <span className="text-white font-bold text-sm">N46</span> */}
                </div>
              </div>
            }
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
              style={{ paddingTop: isMobile ? 56 : 0 }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/members" replace />} />
                <Route path="/members" element={<MemberList />} />
                <Route path="/blogs/:memberCode" element={<BlogList />} />
                <Route path="/blog/:id" element={<BlogDetail />} />
              </Routes>
            </div>
          </ProLayout>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
