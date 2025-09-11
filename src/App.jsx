import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProLayout } from "@ant-design/pro-components";
import { ConfigProvider, theme } from "antd";
import BlogList from "./components/BlogList";
import BlogDetail from "./components/BlogDetail";
import MemberProfile from "./components/MemberProfile";
import "./App.css";

function App() {
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
          <ProLayout
            layout="side"
            title={
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N46</span>
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Nogizaka46 Blog
                </span>
              </div>
            }
            logo={false}
            fixSiderbar
            collapsed={false}
            siderWidth={320}
            headerHeight={72}
            menuRender={() => (
              <div className="p-4 h-full overflow-y-auto">
                <MemberProfile />
              </div>
            )}
            headerRender={() => (
              <div className="flex items-center justify-between w-full px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold">N46</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Nogizaka46 Blog
                    </h1>
                    <p className="text-sm text-gray-600">
                      一ノ瀬 美空 公式ブログ
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      アーカイブ
                    </p>
                    <p className="text-xs text-gray-500">Blog Archive</p>
                  </div>
                </div>
              </div>
            )}
            style={{
              minHeight: "100vh",
            }}
            menuHeaderRender={false}
          >
            <div className="min-h-screen">
              <Routes>
                <Route path="/" element={<Navigate to="/blog" replace />} />
                <Route path="/blog" element={<BlogList />} />
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
