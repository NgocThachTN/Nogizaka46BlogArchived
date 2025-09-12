// BlogList.jsx — Ant Design Pro • Compact Hero • Cached & Fast Back
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
} from "antd";
import {
  CalendarOutlined,
  HeartOutlined,
  ReadOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  PageContainer,
  ProCard,
  StatisticCard,
} from "@ant-design/pro-components";
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import {
  fetchAllBlogs,
  getImageUrl,
  fetchMemberInfo,
} from "../services/blogService";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const PAGE_SIZE = 9;

/** ---------- Simple in-memory cache ---------- **/
const _cache = {
  blogsByMember: new Map(), // key: memberCode -> { list, ts }
  memberByCode: new Map(),  // key: memberCode -> { info, ts }
  scrollY: new Map(),       // key: memberCode -> number
};
const STALE_MS = 1000 * 60 * 3; // 3 phút coi là “fresh”

export default function BlogList() {
  const navigate = useNavigate();
  const { memberCode } = useParams();
  const screens = useBreakpoint();

  const [blogs, setBlogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [memberInfo, setMemberInfo] = useState(null);

  const abortRef = useRef(null);

  // ---- Render instantly from cache (if có) ----
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberCode]);

  // ---- Load + revalidate (nếu cache cũ) ----
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const load = async (revalidateOnly = false) => {
      try {
        if (!revalidateOnly && !(_cache.blogsByMember.get(memberCode)?.list?.length)) {
          setLoading(true);
        }
        setError(null);

        const now = Date.now();
        const cachedB = _cache.blogsByMember.get(memberCode);
        const cachedM = _cache.memberByCode.get(memberCode);
        const isFreshB = cachedB && now - cachedB.ts < STALE_MS;
        const isFreshM = cachedM && now - cachedM.ts < STALE_MS;

        // Nếu fresh hết thì thôi
        if (isFreshB && isFreshM) {
          setLoading(false);
          return;
        }

        // song song
        const [all, member] = await Promise.all([
          isFreshB
            ? Promise.resolve(cachedB.list)
            : fetchAllBlogs(memberCode, { signal: controller.signal }),
          isFreshM
            ? Promise.resolve(cachedM.info)
            : fetchMemberInfo(memberCode, { signal: controller.signal }),
        ]);

        // Cập nhật state + cache
        if (!controller.signal.aborted) {
          setBlogs(all);
          setFiltered((prev) => (q ? all.filter(f => (f.title + f.author).toLowerCase().includes(q.toLowerCase())) : all));
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

    // Nếu có cache rồi -> revalidate nền, ngược lại fetch bình thường
    const hasCache = !!_cache.blogsByMember.get(memberCode)?.list?.length;
    load(hasCache);

    return () => controller.abort();
  }, [memberCode, q]);

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

  // Tìm kiếm cục bộ
  useEffect(() => {
    const kw = q.trim().toLowerCase();
    let list = blogs;
    if (kw) {
      list = blogs.filter(
        (b) =>
          b.title.toLowerCase().includes(kw) ||
          b.author.toLowerCase().includes(kw)
      );
    }
    setFiltered(list);
    setPage(1);
  }, [q, blogs]);

  const current = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const newestDate = useMemo(
    () => (blogs[0]?.date ? blogs[0].date : "-"),
    [blogs]
  );

  const onOpen = (id) => {
    // lưu scroll ngay trước khi đi chi tiết
    _cache.scrollY.set(memberCode, window.scrollY);
    navigate(`/blog/${id}`);
  };

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
          <Spin size="large" tip="読み込み中..." />
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
            再試行
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
      <ProCard ghost direction="column" gutter={[12, 12]}>
        {/* COMPACT HERO */}
        <ProCard
          bordered
          style={{
            borderRadius: 16,
            background: "linear-gradient(180deg, #ffffff 0%, #faf7ff 100%)",
            marginTop: 0,
          }}
          bodyStyle={{ padding: screens.xs ? 14 : 18 }}
        >
          <Space
            direction={screens.xs ? "vertical" : "horizontal"}
            align="center"
            style={{ width: "100%", justifyContent: "center" }}
            size={screens.xs ? 10 : 16}
          >
            <Avatar
              size={screens.xs ? 56 : 64}
              src={
                memberInfo?.img ||
                "https://via.placeholder.com/300x300?text=No+Image"
              }
              style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.08)" }}
            />
            <Space direction="vertical" align="center" size={4}>
              <Title level={3} style={{ margin: 0, lineHeight: 1 }}>
                Blog
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {memberInfo?.name || "Loading..."} 公式ブログ
              </Text>
            </Space>

            <Space size={8} wrap style={{ marginLeft: screens.xs ? 0 : "auto" }}>
              <StatisticCard
                style={{ borderRadius: 12, minWidth: 120 }}
                bodyStyle={{ padding: 10 }}
                statistic={{ title: "投稿数", value: filtered.length }}
              />
              <StatisticCard
                style={{ borderRadius: 12, minWidth: 160 }}
                bodyStyle={{ padding: 10 }}
                statistic={{ title: "最新", value: newestDate }}
              />
            </Space>
          </Space>
        </ProCard>

        {/* FILTER ROW */}
        <ProCard bordered style={{ borderRadius: 14 }} bodyStyle={{ padding: 12 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
            <Input
              allowClear
              size={screens.xs ? "middle" : "large"}
              prefix={<SearchOutlined />}
              placeholder="検索タイトル・著者..."
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
              合計 {filtered.length} 件
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
              description={q ? "検索結果が見つかりません" : "まだブログ記事がありません"}
            />
          </ProCard>
        ) : (
          <ProCard ghost gutter={[16, 16]} wrap>
            {current.map((blog) => (
              <ProCard
                key={blog.id}
                colSpan={{ xs: 24, sm: 12, lg: 8 }}
                hoverable
                bordered
                style={{ borderRadius: 12 }}
                bodyStyle={{ padding: 12 }}
                onClick={() => onOpen(blog.id)}
                className="blog-card"
              >
                {/* Thumbnail */}
                <div
                  style={{
                    position: "relative",
                    height: screens.xs ? 150 : 190,
                    overflow: "hidden",
                    borderRadius: 10,
                    background: "#f5f6fa",
                    marginBottom: 10,
                  }}
                >
                  <img
                    src={
                      blog.thumbnail
                        ? getImageUrl(blog.thumbnail)
                        : "https://via.placeholder.com/600x320/f0f0f0/666666?text=No+Image"
                    }
                    alt={blog.title}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform .3s",
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
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space>
                    <Avatar src={memberInfo?.img} size={26} />
                    <Text strong>{blog.author}</Text>
                  </Space>

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
                      }}
                    >
                      {blog.title}
                    </Title>
                  </Tooltip>

                  <Divider style={{ margin: "8px 0" }} />

                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space>
                      <Button type="text" size="small" icon={<EyeOutlined />}>
                        閲覧
                      </Button>
                      <Button type="text" size="small" icon={<HeartOutlined />}>
                        いいね
                      </Button>
                    </Space>
                    <Button
                      type="primary"
                      size="small"
                      icon={<ReadOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(blog.id);
                      }}
                    >
                      読む
                    </Button>
                  </Space>
                </Space>
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

      {/* Hover effect */}
      <style>{`
        .blog-card:hover img { transform: scale(1.035); }
      `}</style>
    </PageContainer>
  );
}
