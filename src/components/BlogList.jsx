// BlogList.jsx — Ant Design Pro • Mobile-First Fast Render
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
  Grid,
  Tag,
  Select,
} from "antd";
import {
  CalendarOutlined,
  HeartOutlined,
  ReadOutlined,
  EyeOutlined,
  SearchOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard } from "@ant-design/pro-components";
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
import BlogCalendar from "./BlogCalendar";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// Translation keys
const t = {
  searchPlaceholder: {
    ja: "ブログを検索...",
    en: "Search blogs...",
    vi: "Tìm kiếm blog...",
  },
  noBlogs: {
    ja: "ブログが見つかりません",
    en: "No blogs found",
    vi: "Không tìm thấy blog",
  },
  loading: { ja: "読み込み中...", en: "Loading...", vi: "Đang tải..." },
  error: {
    ja: "エラーが発生しました",
    en: "An error occurred",
    vi: "Đã xảy ra lỗi",
  },
  retry: { ja: "再試行", en: "Retry", vi: "Thử lại" },
  blogArticle: { ja: "ブログ記事", en: "Blog Article", vi: "Bài viết blog" },
  readMore: { ja: "続きを読む", en: "Read More", vi: "Đọc thêm" },
  totalPosts: { ja: "総投稿数", en: "Total Posts", vi: "Tổng số bài viết" },
  memberBlogs: {
    ja: "メンバーブログ",
    en: "Member Blogs",
    vi: "Blog thành viên",
  },
  calendar: { ja: "カレンダー", en: "Calendar", vi: "Lịch" },
  list: { ja: "リスト", en: "List", vi: "Danh sách" },
};

/** ---------- Simple in-memory cache ---------- **/
const _cache = {
  blogsByMember: new Map(), // key: memberCode -> { list, ts }
  memberByCode: new Map(), // key: memberCode -> { info, ts }
  scrollY: new Map(), // key: memberCode -> number
};
const STALE_MS = 1000 * 60 * 3; // 3 phút coi là “fresh”

export default function BlogList({ language = "ja", setLanguage }) {
  // Ensure language is valid, fallback to "ja"
  const currentLanguage = ["ja", "en", "vi"].includes(language)
    ? language
    : "ja";
  const navigate = useNavigate();
  const { memberCode } = useParams();
  const screens = useBreakpoint();

  // PAGE_SIZE dynamic: mobile nhỏ hơn để render ít card/ lần
  const PAGE_SIZE = useMemo(() => (screens.xs ? 6 : 9), [screens.xs]);

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

  // Chuyển state nặng sang background để không block thread (mượt trên mobile)
  const [isPending, startTransition] = useTransition();

  // ---- Render instantly from cache (nếu có) ----
  useLayoutEffect(() => {
    const b = _cache.blogsByMember.get(memberCode);
    const m = _cache.memberByCode.get(memberCode);

    if (b?.list?.length) {
      setBlogs(b.list);
      setFiltered(b.list);
      setLoading(false); // không show spinner khi quay lại
    }
    if (m?.info) setMemberInfo(m.info);

    // Khôi phục vị trí cuộn
    const y = _cache.scrollY.get(memberCode);
    if (typeof y === "number") {
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [memberCode]);

  // ---- Load + revalidate (nếu cache cũ) ----
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
          // cập nhật state nặng trong transition => ít giật lag hơn
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
          setError(t.error[currentLanguage]);
        }
      } finally {
        if (!abortRef.current?.signal.aborted) setLoading(false);
      }
    };

    const hasCache = !!_cache.blogsByMember.get(memberCode)?.list?.length;
    load(hasCache);

    return () => controller.abort();
  }, [memberCode, deferredQ, currentLanguage]);

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

  // Debounce nhập liệu (200ms) để hạn chế filter liên tục
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

  const onOpen = (id) => {
    _cache.scrollY.set(memberCode, window.scrollY);
    navigate(`/blog/${id}`);
  };

  // ====== RENDER ======

  if (loading && !blogs.length) {
    return (
      <PageContainer header={false}>
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" tip={t.loading[currentLanguage]} />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer header={false}>
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
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={false}
      token={{
        paddingBlockPageContainerContent: 0,
        paddingInlinePageContainerContent: screens.xs ? 12 : 24,
      }}
    >
      <ProCard ghost gutter={[16, 16]} wrap>
        {/* Main Content */}
        <ProCard
          colSpan={{ xs: 24, md: 16, xl: 17 }}
          ghost
          direction="column"
          gutter={[12, 12]}
        >
          {/* COMPACT HERO (nhẹ trên mobile) */}
          <ProCard
            bordered
            style={{
              borderRadius: 16,
              background: screens.xs
                ? "#fff" // đơn giản cho mobile
                : "linear-gradient(180deg, #ffffff 0%, #faf7ff 100%)",
              marginTop: 0,
            }}
            bodyStyle={{ padding: screens.xs ? 12 : 18 }}
          >
            <Space
              direction={screens.xs ? "vertical" : "horizontal"}
              align="center"
              style={{ width: "100%", justifyContent: "center" }}
              size={screens.xs ? 8 : 16}
            >
              <Avatar
                size={screens.xs ? 52 : 64}
                src={
                  memberInfo?.img ||
                  "https://via.placeholder.com/300x300?text=No+Image"
                }
                style={
                  screens.xs ? {} : { boxShadow: "0 6px 16px rgba(0,0,0,0.08)" }
                }
              />
              <Space direction="vertical" align="center" size={2}>
                <Title level={3} style={{ margin: 0, lineHeight: 1 }}>
                  {t.memberBlogs[currentLanguage]}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {memberInfo?.name || t.loading[currentLanguage]}{" "}
                  {t.blogArticle[currentLanguage]}
                </Text>
                {setLanguage && (
                  <Select
                    value={language}
                    onChange={setLanguage}
                    size="small"
                    style={{ width: 140, marginTop: 8 }}
                    options={[
                      {
                        value: "ja",
                        label: (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <GlobalOutlined
                              style={{ color: "#666", fontSize: "12px" }}
                            />
                            日本語
                          </span>
                        ),
                      },
                      {
                        value: "en",
                        label: (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <GlobalOutlined
                              style={{ color: "#666", fontSize: "12px" }}
                            />
                            English
                          </span>
                        ),
                      },
                      {
                        value: "vi",
                        label: (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <GlobalOutlined
                              style={{ color: "#666", fontSize: "12px" }}
                            />
                            Tiếng Việt
                          </span>
                        ),
                      },
                    ]}
                  />
                )}
              </Space>
            </Space>
          </ProCard>

          {/* FILTER ROW */}
          <ProCard
            bordered
            style={{ borderRadius: 14 }}
            bodyStyle={{ padding: 12 }}
          >
            <Space
              style={{ width: "100%", justifyContent: "space-between" }}
              wrap
            >
              <Input
                allowClear
                size={screens.xs ? "middle" : "large"}
                prefix={<SearchOutlined />}
                placeholder={t.searchPlaceholder[currentLanguage]}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ maxWidth: 360, width: "100%" }}
              />
              <Tag
                color="purple"
                style={{
                  height: screens.xs ? 26 : 30,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {t.totalPosts[currentLanguage]} {filtered.length}{" "}
                {isPending ? "…" : ""}
              </Tag>
            </Space>
          </ProCard>

          {/* LIST */}
          {current.length === 0 ? (
            <ProCard
              bordered
              style={{
                borderRadius: 14,
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Empty
                description={
                  q ? t.noBlogs[currentLanguage] : t.noBlogs[currentLanguage]
                }
              />
            </ProCard>
          ) : (
            <ProCard ghost gutter={[16, 16]} wrap>
              {current.map((blog, idx) => (
                <ProCard
                  key={blog.id}
                  colSpan={{ xs: 24, sm: 12, lg: 8 }}
                  hoverable={!screens.xs} // tắt hover trên mobile cho nhẹ
                  bordered
                  style={{
                    borderRadius: 12,
                    // contain layout/paint giúp trình duyệt tối ưu composite
                    contain: "content",
                    willChange: "transform",
                    height: "100%", // Đảm bảo tất cả card có cùng chiều cao
                    display: "flex",
                    flexDirection: "column",
                  }}
                  bodyStyle={{
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    overflow: "hidden", // Tránh tràn nội dung
                  }}
                  onClick={() => onOpen(blog.id)}
                  className="blog-card"
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      position: "relative",
                      height: screens.xs ? 148 : 190,
                      overflow: "hidden",
                      borderRadius: 10,
                      background: "#f5f6fa",
                      marginBottom: 12,
                      flexShrink: 0, // Không cho phép thu nhỏ
                    }}
                  >
                    <img
                      src={
                        blog.thumbnail
                          ? getImageUrl(blog.thumbnail, {
                              w: screens.xs ? 640 : 960,
                            })
                          : "https://via.placeholder.com/600x320/f0f0f0/666666?text=No+Image"
                      }
                      srcSet={
                        blog.thumbnail
                          ? [
                              `${getImageUrl(blog.thumbnail, { w: 480 })} 480w`,
                              `${getImageUrl(blog.thumbnail, { w: 640 })} 640w`,
                              `${getImageUrl(blog.thumbnail, { w: 960 })} 960w`,
                              `${getImageUrl(blog.thumbnail, {
                                w: 1280,
                              })} 1280w`,
                            ].join(", ")
                          : undefined
                      }
                      sizes={
                        screens.xs ? "(max-width: 576px) 100vw, 640px" : "33vw"
                      }
                      alt={blog.title}
                      loading={idx === 0 ? "eager" : "lazy"}
                      // ảnh eager đầu tiên để cảm giác “vào là thấy”, còn lại lazy
                      decoding="async"
                      fetchpriority={idx === 0 ? "high" : "low"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform .25s",
                      }}
                    />
                    <div style={{ position: "absolute", top: 8, left: 8 }}>
                      <Badge
                        count={
                          <Space size={4} style={{ fontSize: 12 }}>
                            <CalendarOutlined />
                            {blog.date}
                          </Space>
                        }
                        style={{
                          background: "rgba(0,0,0,.55)",
                          color: "#fff",
                          padding: "3px 8px",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minHeight: 0, // Cho phép flex item thu nhỏ
                    }}
                  >
                    <Tooltip title={blog.title}>
                      <Title
                        level={5}
                        style={{
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: "2.4em",
                          lineHeight: 1.25,
                          marginBottom: 12,
                          flexShrink: 0,
                        }}
                      >
                        {blog.title}
                      </Title>
                    </Tooltip>

                    {/* Action Buttons - Sử dụng ProCard để layout tốt hơn */}
                    <div style={{ marginTop: "auto", width: "100%" }}>
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "nowrap", // Không wrap để tránh tràn
                        }}
                        size={[8, 8]}
                      >
                        {/* Left side - View and Like buttons */}
                        <Space size={4} style={{ flexShrink: 1, minWidth: 0 }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            style={{
                              padding: "4px 6px",
                              fontSize: 11,
                              height: 24,
                              minWidth: "auto",
                              flexShrink: 0,
                            }}
                          >
                            {screens.xs ? "" : "閲覧"}
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            icon={<HeartOutlined />}
                            style={{
                              padding: "4px 6px",
                              fontSize: 11,
                              height: 24,
                              minWidth: "auto",
                              flexShrink: 0,
                            }}
                          >
                            {screens.xs ? "" : "いいね"}
                          </Button>
                        </Space>

                        {/* Right side - Read More button */}
                        <Button
                          type="primary"
                          size="small"
                          icon={<ReadOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpen(blog.id);
                          }}
                          style={{
                            flexShrink: 0,
                            minWidth: screens.xs ? 50 : 70,
                            fontSize: 11,
                            height: 24,
                            padding: "0 8px",
                          }}
                        >
                          {screens.xs ? "読む" : t.readMore[currentLanguage]}
                        </Button>
                      </Space>
                    </div>
                  </div>
                </ProCard>
              ))}
            </ProCard>
          )}

          {/* PAGINATION */}
          {filtered.length > 0 && (
            <ProCard ghost style={{ justifyContent: "center" }}>
              <Pagination
                current={page}
                total={filtered.length}
                pageSize={PAGE_SIZE}
                onChange={(p) => {
                  _cache.scrollY.set(memberCode, 0); // sang page mới thì về top
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                showSizeChanger={false}
                size={screens.xs ? "small" : "default"}
              />
            </ProCard>
          )}
        </ProCard>

        {/* Sidebar */}
        <ProCard
          colSpan={{ xs: 24, md: 8, xl: 7 }}
          ghost
          direction="column"
          gutter={[16, 16]}
        >
          {/* Blog Calendar */}
          <BlogCalendar
            blogs={blogs}
            memberInfo={memberInfo}
            onBlogClick={onOpen}
            isMobile={screens.xs}
            language={language}
          />
        </ProCard>
      </ProCard>

      {/* Hover effect và responsive layout */}
      <style>{`
        @media (hover:hover) {
          .blog-card:hover img { transform: scale(1.03); }
        }
        
        /* Đảm bảo card layout không bị tràn */
        .blog-card .ant-pro-card-body {
          overflow: hidden;
        }
        
        /* Responsive text cho mobile */
        @media (max-width: 576px) {
          .blog-card .ant-typography {
            font-size: 14px !important;
          }
          
          .blog-card .ant-btn {
            font-size: 10px !important;
            padding: 2px 4px !important;
            height: 20px !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
