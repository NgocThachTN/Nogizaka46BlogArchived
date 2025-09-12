// BlogListMobile.jsx — Ant Design Pro • Mobile-First Japanese Style
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Spin,
  Empty,
  Button,
  Avatar,
  Input,
  Space,
  Divider,
  Pagination,
  Tooltip,
  Badge,
  Tag,
  Card,
  Affix,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  CalendarOutlined,
  HeartOutlined,
  ReadOutlined,
  EyeOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BookOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  PageContainer,
  ProCard,
  StatisticCard,
  ProSkeleton,
} from "@ant-design/pro-components";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
  useDeferredValue,
  useTransition,
} from "react";
import {
  fetchAllBlogs,
  getImageUrl,
  fetchMemberInfo,
} from "../services/blogService";

const { Title, Text } = Typography;

/** Japanese color palette */
const colors = {
  primary: "#e91e63", // Sakura pink
  secondary: "#9c27b0", // Purple
  accent: "#ff5722", // Orange
  success: "#4caf50", // Green
  warning: "#ff9800", // Amber
  error: "#f44336", // Red
  info: "#2196f3", // Blue
  text: "#212121", // Dark gray
  textSecondary: "#757575", // Medium gray
  background: "#fafafa", // Light gray
  surface: "#ffffff", // White
  border: "#e0e0e0", // Light border
  shadow: "rgba(0,0,0,0.08)", // Subtle shadow
};

/** JP font - Japanese style */
const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif",
  fontWeight: 400,
  letterSpacing: "0.02em",
};

/** Simple in-memory cache */
const _cache = {
  blogsByMember: new Map(), // key: memberCode -> { list, ts }
  memberByCode: new Map(), // key: memberCode -> { info, ts }
  scrollY: new Map(), // key: memberCode -> number
};
const STALE_MS = 1000 * 60 * 3; // 3 phút coi là "fresh"

export default function BlogListMobile() {
  const navigate = useNavigate();
  const { memberCode } = useParams();

  const [blogs, setBlogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tìm kiếm mượt: defer + debounce
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);

  const [page, setPage] = useState(1);
  const [memberInfo, setMemberInfo] = useState(null);

  const abortRef = useRef(null);
  const PAGE_SIZE = 6; // Mobile optimized

  // Chuyển state nặng sang background để không block thread
  const [, startTransition] = useTransition();

  // ---- Render instantly from cache ----
  useLayoutEffect(() => {
    const b = _cache.blogsByMember.get(memberCode);
    const m = _cache.memberByCode.get(memberCode);

    if (b?.list?.length) {
      setBlogs(b.list);
      setFiltered(b.list);
      setLoading(false);
    }
    if (m?.info) setMemberInfo(m.info);

    // Khôi phục vị trí cuộn
    const y = _cache.scrollY.get(memberCode);
    if (typeof y === "number") {
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [memberCode]);

  // ---- Load + revalidate ----
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const load = async (revalidateOnly = false) => {
      try {
        if (
          !revalidateOnly &&
          !_cache.blogsByMember.get(memberCode)?.list?.length
        ) {
          setLoading(true);
        }
        setError(null);

        const now = Date.now();
        const cachedB = _cache.blogsByMember.get(memberCode);
        const cachedM = _cache.memberByCode.get(memberCode);
        const isFreshB = cachedB && now - cachedB.ts < STALE_MS;
        const isFreshM = cachedM && now - cachedM.ts < STALE_MS;

        if (isFreshB && isFreshM) {
          setLoading(false);
          return;
        }

        // Fetch song song
        const [all, member] = await Promise.all([
          isFreshB
            ? Promise.resolve(cachedB.list)
            : fetchAllBlogs(memberCode, { signal: controller.signal }),
          isFreshM
            ? Promise.resolve(cachedM.info)
            : fetchMemberInfo(memberCode, { signal: controller.signal }),
        ]);

        if (!controller.signal.aborted) {
          startTransition(() => {
            setBlogs(all);
            setFiltered(
              deferredQ
                ? all.filter((f) =>
                    (f.title + f.author)
                      .toLowerCase()
                      .includes(deferredQ.toLowerCase())
                  )
                : all
            );
          });
          setMemberInfo(member);

          _cache.blogsByMember.set(memberCode, { list: all, ts: Date.now() });
          _cache.memberByCode.set(memberCode, { info: member, ts: Date.now() });
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setError("データの読み込み中にエラーが発生しました。");
        }
      } finally {
        if (!abortRef.current?.signal.aborted) setLoading(false);
      }
    };

    const hasCache = !!_cache.blogsByMember.get(memberCode)?.list?.length;
    load(hasCache);

    return () => controller.abort();
  }, [memberCode, deferredQ]);

  // Lưu vị trí cuộn trước khi rời trang
  useEffect(() => {
    const onStore = () => _cache.scrollY.set(memberCode, window.scrollY);
    window.addEventListener("pagehide", onStore);
    window.addEventListener("beforeunload", onStore);
    return () => {
      onStore();
      window.removeEventListener("pagehide", onStore);
      window.removeEventListener("beforeunload", onStore);
    };
  }, [memberCode]);

  // Debounce nhập liệu
  useEffect(() => {
    const h = setTimeout(() => {
      const kw = q.trim().toLowerCase();
      startTransition(() => {
        if (!kw) {
          setFiltered(blogs);
        } else {
          setFiltered(
            blogs.filter(
              (b) =>
                b.title.toLowerCase().includes(kw) ||
                b.author.toLowerCase().includes(kw)
            )
          );
        }
        setPage(1);
      });
    }, 200);
    return () => clearTimeout(h);
  }, [q, blogs]);

  const current = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, PAGE_SIZE]);

  // const newestDate = useMemo(
  //   () => (blogs[0]?.date ? blogs[0].date : "-"),
  //   [blogs]
  // );

  const onOpen = (id) => {
    _cache.scrollY.set(memberCode, window.scrollY);
    navigate(`/blog/${id}`);
  };

  // ====== RENDER ======

  if (loading && !blogs.length) {
    return (
      <PageContainer
        header={false}
        token={{
          paddingInlinePageContainerContent: 0,
          paddingBlockPageContainerContent: 0,
        }}
        style={{
          background: `linear-gradient(135deg, ${colors.background} 0%, #f5f5f5 100%)`,
          minHeight: "100dvh",
        }}
      >
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <ProCard
            style={{
              background: colors.surface,
              borderRadius: 20,
              boxShadow: `0 4px 20px ${colors.shadow}`,
            }}
          >
            <Space direction="vertical" align="center" size={16}>
              <Spin size="large" />
              <Text style={{ ...jpFont, color: colors.textSecondary }}>
                読み込み中...
              </Text>
            </Space>
          </ProCard>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        header={false}
        token={{
          paddingInlinePageContainerContent: 0,
          paddingBlockPageContainerContent: 0,
        }}
        style={{
          background: `linear-gradient(135deg, ${colors.background} 0%, #f5f5f5 100%)`,
          minHeight: "100dvh",
        }}
      >
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <ProCard
            style={{
              background: colors.surface,
              borderRadius: 20,
              boxShadow: `0 4px 20px ${colors.shadow}`,
              textAlign: "center",
            }}
          >
            <Space direction="vertical" align="center" size={16}>
              <Title level={4} style={{ color: colors.error, ...jpFont }}>
                {error}
              </Title>
              <Button
                type="primary"
                onClick={() => window.location.reload()}
                style={{
                  background: colors.primary,
                  borderColor: colors.primary,
                  borderRadius: 12,
                }}
              >
                再試行
              </Button>
            </Space>
          </ProCard>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={false}
      token={{
        paddingInlinePageContainerContent: 0,
        paddingBlockPageContainerContent: 0,
      }}
      style={{
        background: `linear-gradient(135deg, ${colors.background} 0%, #f5f5f5 100%)`,
        minHeight: "100dvh",
        padding: 0,
        margin: 0,
      }}
    >
      {/* Sticky Hero - Japanese style */}
      <Affix offsetTop={0}>
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.surface} 0%, #f8f9fa 100%)`,
            borderBottom: `2px solid ${colors.primary}20`,
            width: "100%",
            zIndex: 998,
            boxShadow: `0 2px 20px ${colors.shadow}`,
          }}
        >
          <ProCard
            ghost
            bodyStyle={{ padding: "16px 20px" }}
            style={{
              ...jpFont,
              width: "100%",
              maxWidth: "100%",
            }}
          >
            {/* Header with member info */}
            <div style={{ marginBottom: 16 }}>
              <Space
                style={{ width: "100%", justifyContent: "space-between" }}
                align="center"
              >
                <Space>
                  <Avatar
                    size={48}
                    src={
                      memberInfo?.img ||
                      "https://via.placeholder.com/300x300?text=No+Image"
                    }
                    style={{
                      boxShadow: `0 4px 12px ${colors.shadow}`,
                      border: `2px solid ${colors.primary}20`,
                    }}
                  />
                  <Space direction="vertical" size={2}>
                    <Text
                      style={{
                        ...jpFont,
                        letterSpacing: 2,
                        fontSize: 11,
                        color: colors.textSecondary,
                        textTransform: "uppercase",
                        fontWeight: 500,
                      }}
                    >
                      公式ブログ
                    </Text>
                    <Title
                      level={4}
                      style={{
                        ...jpFont,
                        margin: 0,
                        lineHeight: 1.2,
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: 700,
                      }}
                    >
                      {memberInfo?.name || "Loading..."}
                    </Title>
                  </Space>
                </Space>
                <Space>
                  <Statistic
                    value={filtered.length}
                    valueStyle={{
                      color: colors.primary,
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                    prefix={<BookOutlined />}
                    suffix="件"
                  />
                </Space>
              </Space>
            </div>

            {/* Search */}
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: colors.primary }} />}
              placeholder="ブログを検索…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              size="large"
              style={{
                borderRadius: 16,
                background: colors.surface,
                border: `2px solid ${colors.border}`,
                width: "100%",
                boxShadow: `0 2px 8px ${colors.shadow}`,
              }}
            />
          </ProCard>
        </div>
      </Affix>

      {/* Content */}
      <div
        style={{
          padding: "12px 16px 80px",
          contain: "layout paint style",
          width: "100%",
          maxWidth: "100%",
          minHeight: "calc(100dvh - 120px)",
        }}
      >
        {current.length === 0 ? (
          <Card
            style={{
              borderRadius: 20,
              background: colors.surface,
              boxShadow: `0 4px 20px ${colors.shadow}`,
              textAlign: "center",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Empty
              description={
                <Text style={{ ...jpFont, color: colors.textSecondary }}>
                  {q
                    ? "検索結果が見つかりません"
                    : "まだブログ記事がありません"}
                </Text>
              }
            />
          </Card>
        ) : (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {current.map((blog, idx) => (
              <Card
                key={blog.id}
                hoverable
                onClick={() => onOpen(blog.id)}
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  background: `linear-gradient(135deg, ${colors.surface} 0%, #f8f9fa 100%)`,
                  boxShadow: `0 2px 12px ${colors.shadow}`,
                  border: `1px solid ${colors.border}`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  contain: "layout paint style",
                }}
                bodyStyle={{ padding: 0 }}
              >
                <div
                  style={{ display: "flex", height: 120, position: "relative" }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      position: "relative",
                      background: `linear-gradient(135deg, ${colors.background}, #f0f0f0)`,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={
                        blog.thumbnail
                          ? getImageUrl(blog.thumbnail, { w: 480 })
                          : "https://via.placeholder.com/600x320/f0f0f0/666666?text=No+Image"
                      }
                      alt={blog.title}
                      loading={idx < 2 ? "eager" : "lazy"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                      }}
                    />

                    {/* Date badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: colors.primary,
                        color: colors.surface,
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 600,
                        boxShadow: `0 2px 8px ${colors.primary}40`,
                        zIndex: 2,
                      }}
                    >
                      <CalendarOutlined style={{ marginRight: 2 }} />
                      {blog.date}
                    </div>

                    {/* Read icon overlay */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        background: "rgba(255,255,255,0.9)",
                        borderRadius: 50,
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                      }}
                    >
                      <ReadOutlined
                        style={{ fontSize: 12, color: colors.primary }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      flex: 1,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minWidth: 0,
                    }}
                  >
                    <div>
                      <Text
                        strong
                        style={{
                          ...jpFont,
                          fontSize: 15,
                          lineHeight: 1.4,
                          display: "block",
                          marginBottom: 4,
                          color: colors.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                        }}
                      >
                        {blog.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          display: "block",
                          color: colors.textSecondary,
                          marginBottom: 8,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {blog.author}
                      </Text>
                    </div>

                    <Space size={[4, 4]} wrap>
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        style={{
                          color: colors.primary,
                          fontSize: 11,
                          height: 24,
                          padding: "0 8px",
                        }}
                      >
                        閲覧
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        icon={<HeartOutlined />}
                        style={{
                          color: colors.accent,
                          fontSize: 11,
                          height: 24,
                          padding: "0 8px",
                        }}
                      >
                        いいね
                      </Button>
                    </Space>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            <Pagination
              current={page}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                _cache.scrollY.set(memberCode, 0);
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              showSizeChanger={false}
              size="small"
              style={{
                background: colors.surface,
                padding: "8px 16px",
                borderRadius: 16,
                boxShadow: `0 2px 8px ${colors.shadow}`,
              }}
            />
          </div>
        )}
      </div>

      {/* Styles - Japanese Design System */}
      <style>{`
        /* Full-bleed mobile overrides */
        html, body, #root { 
          height: 100%; 
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
          margin: 0;
          padding: 0;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          font-family: 'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif;
        }
        body { 
          margin: 0; 
          padding: 0;
          overscroll-behavior: none;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        #root {
          display: flex;
          flex-direction: column;
        }
        .ant-pro-page-container { 
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
          min-height: 100vh !important;
          min-height: 100dvh !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .ant-pro-page-container-children-container {
          flex: 1 !important;
          margin: 0 !important; 
          padding: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
        }

        /* Japanese Card styles */
        .ant-card { 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          width: 100% !important;
          max-width: 100% !important;
          border-radius: 16px !important;
        }
        .ant-card:hover { 
          transform: translateY(-2px) scale(1.01); 
          box-shadow: 0 8px 25px rgba(233, 30, 99, 0.15) !important; 
        }

        /* Japanese Input */
        .ant-input {
          border-radius: 16px !important;
          border: 2px solid #e0e0e0 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
        }
        .ant-input:focus {
          border-color: #e91e63 !important;
          box-shadow: 0 4px 12px rgba(233, 30, 99, 0.2) !important;
        }

        /* Japanese Button */
        .ant-btn {
          border-radius: 12px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .ant-btn:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }

        /* Japanese Pagination */
        .ant-pagination {
          background: transparent !important;
        }
        .ant-pagination-item {
          border-radius: 8px !important;
          border: 1px solid #e0e0e0 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .ant-pagination-item-active {
          background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%) !important;
          border-color: #e91e63 !important;
          color: white !important;
        }

        /* Mobile image perf */
        img[loading="lazy"] { 
          content-visibility: auto; 
          contain-intrinsic-size: 120px 120px; 
        }

        /* Hide scrollbars */
        *::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Touch optimization */
        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Japanese typography */
        .ant-typography {
          font-family: 'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif !important;
        }

        /* Smooth animations */
        * {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </PageContainer>
  );
}
