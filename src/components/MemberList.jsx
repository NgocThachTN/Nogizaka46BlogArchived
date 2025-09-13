// MemberList.jsx — Ant Design Pro + nhóm theo Gen + 5 thẻ mỗi hàng
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Typography,
  Tag,
  Spin,
  Space,
  Input,
  Segmented,
  Empty,
  List,
  Tooltip,
  Button,
  Select,
  notification,
} from "antd";
import { ProCard, PageContainer } from "@ant-design/pro-components";
import {
  UserOutlined,
  StarOutlined,
  SearchOutlined,
  LinkOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import MemberListMobile from "./MemberListMobile";

const { Title, Text } = Typography;

// Translation keys
const t = {
  searchPlaceholder: {
    ja: "メンバーを検索...",
    en: "Search members...",
    vi: "Tìm kiếm thành viên...",
  },
  noMembers: {
    ja: "メンバーが見つかりません",
    en: "No members found",
    vi: "Không tìm thấy thành viên",
  },
  loading: { ja: "読み込み中...", en: "Loading...", vi: "Đang tải..." },
  error: {
    ja: "エラーが発生しました",
    en: "An error occurred",
    vi: "Đã xảy ra lỗi",
  },
  retry: { ja: "再試行", en: "Retry", vi: "Thử lại" },
  members: { ja: "メンバー", en: "Members", vi: "Thành viên" },
  nogizaka46: { ja: "乃木坂46", en: "Nogizaka46", vi: "Nogizaka46" },
  officialSite: {
    ja: "公式サイト",
    en: "Official Site",
    vi: "Trang chính thức",
  },
  blog: { ja: "ブログ", en: "Blog", vi: "Blog" },
  generation: { ja: "期生", en: "Generation", vi: "Thế hệ" },
  other: { ja: "その他", en: "Other", vi: "Khác" },
  blogTitle: {
    ja: "乃木坂46 ブログ",
    en: "Nogizaka46 Blog",
    vi: "Nogizaka46 Blog ",
  },
  totalBlogs: {
    ja: "総ブログ数",
    en: "Total Members",
    vi: "Tổng Số Thành Viên",
  },
};

const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

// Thứ tự Gen mong muốn
const GEN_ORDER = [
  "6期生",
  "5期生",
  "4期生",
  "3期生",
  "2期生",
  "1期生",
  "その他",
];

// Chuẩn hoá Gen từ dữ liệu (cate/ groupcode có thể khác nhau)
const getGen = (m) => {
  return (
    m.cate?.trim() ||
    m.groupcode?.trim() ||
    (m.code === "10001" ? "その他" : "その他")
  );
};

// Tính tuổi (nếu có sinh nhật)
const getAge = (birthday) => {
  if (!birthday) return null;
  const parts = birthday.split(/[/-]/);
  if (parts.length < 3) return null;
  const [y, m, d] = parts.map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const hasHadBirthday =
    today.getMonth() + 1 > m ||
    (today.getMonth() + 1 === m && today.getDate() >= d);
  if (!hasHadBirthday) age -= 1;
  return age;
};

const MemberList = ({ language = "ja", setLanguage }) => {
  // Ensure language is valid, fallback to "ja"
  const currentLanguage = ["ja", "en", "vi"].includes(language)
    ? language
    : "ja";
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genFilter, setGenFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const resp = await axios.get(
          "https://www.nogizaka46.com/s/n46/api/list/member?callback=res",
          { responseType: "text" }
        );
        const jsonStr = resp.data.replace(/^res\(/, "").replace(/\);?$/, "");
        const api = JSON.parse(jsonStr);

        // Lọc thành viên còn hoạt động
        const active = (api.data || []).filter((m) => m.graduation === "NO");

        // Ảnh placeholder nếu lỗi
        const normalized = active.map((m) => ({
          ...m,
          img: m.img || "https://via.placeholder.com/300x300?text=No+Image",
        }));

        setMembers(normalized);
      } catch (e) {
        console.error(e);
        notification.error({
          message: "Lỗi tải dữ liệu",
          description:
            "Không tải được danh sách thành viên. Vui lòng thử lại sau.",
          placement: "topRight",
          duration: 4,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Tạo danh sách Gen
  const genList = useMemo(() => {
    const s = new Set(members.map((m) => getGen(m)).filter(Boolean));
    // sắp theo GEN_ORDER
    const ordered = GEN_ORDER.filter((g) => s.has(g));
    // thêm những gen lạ (nếu có)
    const rest = Array.from(s).filter((g) => !GEN_ORDER.includes(g));
    return ["ALL", ...ordered, ...rest];
  }, [members]);

  // Lọc theo từ khoá + Gen
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return members.filter((m) => {
      if (genFilter !== "ALL" && getGen(m) !== genFilter) return false;
      if (!kw) return true;
      const hay = `${m.name} ${m.english_name || ""} ${
        m.kana || ""
      }`.toLowerCase();
      return hay.includes(kw);
    });
  }, [members, genFilter, keyword]);

  // Nhóm theo Gen & sắp thứ tự
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((m) => {
      const g = getGen(m);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(m);
    });
    // sắp Gen theo GEN_ORDER trước, sau đó gen lạ
    const known = GEN_ORDER.filter((g) => map.has(g)).map((g) => ({
      gen: g,
      items: map.get(g),
    }));
    const others = Array.from(map.keys())
      .filter((g) => !GEN_ORDER.includes(g))
      .map((g) => ({ gen: g, items: map.get(g) }));
    return [...known, ...others];
  }, [filtered]);

  // Mobile view
  if (isMobile) {
    return <MemberListMobile language={language} setLanguage={setLanguage} />;
  }

  return (
    <PageContainer
      style={{ background: "transparent", paddingTop: 0, marginTop: 0 }}
      token={{
        paddingInlinePageContainerContent: 0,
        paddingBlockPageContainerContent: 0,
      }}
    >
      <ProCard
        ghost
        direction="column"
        gutter={[16, 16]}
        wrap
        style={{ marginTop: 0, paddingTop: 0 }}
      >
        {/* Header với title và language selector */}
        <ProCard
          bordered
          style={{ borderRadius: 14, background: "rgba(253, 246, 227, 0.8)" }}
        >
          <Space
            style={{ width: "100%", justifyContent: "space-between" }}
            align="center"
          >
            <Space direction="vertical" size={0}>
              <Title level={2} style={{ margin: 0, color: "#9333ea" }}>
                {t.blogTitle[currentLanguage]}
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {t.generation[currentLanguage]} •{" "}
                {t.totalBlogs[currentLanguage]}: {members.length}
              </Text>
            </Space>
            {setLanguage && (
              <Select
                value={language}
                onChange={setLanguage}
                style={{ width: 140 }}
                options={[
                  {
                    value: "ja",
                    label: (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <GlobalOutlined
                          style={{ color: "#666", fontSize: "14px" }}
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
                          gap: "6px",
                        }}
                      >
                        <GlobalOutlined
                          style={{ color: "#666", fontSize: "14px" }}
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
                          gap: "6px",
                        }}
                      >
                        <GlobalOutlined
                          style={{ color: "#666", fontSize: "14px" }}
                        />
                        Tiếng Việt
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </Space>
        </ProCard>

        {/* Bộ lọc */}
        <ProCard
          bordered
          style={{ borderRadius: 14, background: "rgba(253, 246, 227, 0.8)" }}
        >
          <Space
            wrap
            size="middle"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Segmented
              options={genList.map((g) => ({
                label:
                  g === "ALL"
                    ? currentLanguage === "ja"
                      ? "すべて"
                      : currentLanguage === "en"
                      ? "All"
                      : "Tất cả"
                    : g
                        .replace(
                          "期生",
                          currentLanguage === "ja"
                            ? "期生"
                            : currentLanguage === "en"
                            ? " Gen"
                            : " Thế hệ"
                        )
                        .replace(
                          /^(\d+)\s*(Gen|Thế hệ)$/,
                          currentLanguage === "en" ? "Gen $1" : "Thế hệ $1"
                        ),
                value: g,
              }))}
              value={genFilter}
              onChange={(v) => setGenFilter(v)}
            />
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t.searchPlaceholder[currentLanguage]}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ maxWidth: 340 }}
            />
          </Space>
        </ProCard>

        {loading ? (
          <div
            style={{
              minHeight: "50vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin size="large" />
          </div>
        ) : grouped.length === 0 ? (
          <ProCard
            bordered
            style={{ borderRadius: 14, background: "rgba(253, 246, 227, 0.8)" }}
          >
            <Empty description={t.noMembers[currentLanguage]} />
          </ProCard>
        ) : (
          grouped.map(({ gen, items }) => (
            <ProCard
              key={gen}
              title={
                <Space align="center">
                  <StarOutlined />
                  <span style={{ ...jpFont, fontWeight: 700 }}>
                    {gen === "その他"
                      ? t.other[currentLanguage]
                      : gen
                          .replace(
                            "期生",
                            currentLanguage === "ja"
                              ? "期生"
                              : currentLanguage === "en"
                              ? " Gen"
                              : " Thế hệ"
                          )
                          .replace(
                            /^(\d+)\s*(Gen|Thế hệ)$/,
                            currentLanguage === "en" ? "Gen $1" : "Thế hệ $1"
                          )}
                  </span>
                  <Tag color="purple" style={{ marginLeft: 6 }}>
                    {items.length}
                  </Tag>
                </Space>
              }
              bordered
              headerBordered
              style={{
                borderRadius: 14,
                background: "rgba(253, 246, 227, 0.8)",
              }}
              bodyStyle={{ paddingTop: 16 }}
            >
              {/* List với grid 5 cột trên desktop */}
              <List
                grid={{
                  gutter: 16,
                  xs: 2,
                  sm: 3,
                  md: 4,
                  lg: 5,
                  xl: 5,
                  xxl: 5,
                }}
                dataSource={items}
                renderItem={(m) => {
                  const age = getAge(m.birthday);
                  return (
                    <List.Item key={m.code}>
                      <ProCard
                        hoverable
                        bordered={false}
                        className="member-card"
                        onClick={() => navigate(`/blogs/${m.code}`)}
                        style={{
                          borderRadius: 16,
                          overflow: "hidden",
                          background: "rgba(253, 246, 227, 0.9)",
                          boxShadow: "0 4px 12px rgba(139, 69, 19, 0.1)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div
                          className="thumb"
                          style={{
                            position: "relative",
                            paddingBottom: "120%", // Tăng chiều cao ảnh
                            overflow: "hidden",
                            background: "#f7f7f9",
                            borderRadius: "12px", // Bo cả 4 góc
                          }}
                        >
                          <img
                            src={m.img}
                            alt={m.name}
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/300x300?text=No+Image";
                            }}
                          />
                          <div className="member-overlay"></div>
                        </div>

                        <div style={{ padding: "16px 12px" }}>
                          <Space
                            direction="vertical"
                            size={8}
                            style={{ width: "100%" }}
                          >
                            <div>
                              <Text
                                strong
                                style={{
                                  ...jpFont,
                                  fontSize: 16,
                                  display: "block",
                                  marginBottom: 2,
                                }}
                              >
                                {m.name}
                              </Text>
                              {m.english_name && (
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 12,
                                    display: "block",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {m.english_name}
                                </Text>
                              )}
                            </div>

                            <Space size={4} wrap style={{ marginTop: 4 }}>
                              <Tag
                                color="purple"
                                style={{
                                  borderRadius: 12,
                                }}
                              >
                                {getGen(m)}
                              </Tag>
                              {m.birthday && (
                                <Tag
                                  style={{
                                    background: "rgba(147, 51, 234, 0.05)",
                                    border: "1px solid rgba(147, 51, 234, 0.2)",
                                    borderRadius: 12,
                                  }}
                                >
                                  🎂 {m.birthday}
                                  {age != null ? ` (${age})` : ""}
                                </Tag>
                              )}
                              {m.blood && (
                                <Tag
                                  style={{
                                    background: "rgba(147, 51, 234, 0.05)",
                                    border: "1px solid rgba(147, 51, 234, 0.2)",
                                    borderRadius: 12,
                                  }}
                                >
                                  🩸 {m.blood}
                                </Tag>
                              )}
                              {m.constellation && (
                                <Tag
                                  style={{
                                    background: "rgba(147, 51, 234, 0.05)",
                                    border: "1px solid rgba(147, 51, 234, 0.2)",
                                    borderRadius: 12,
                                  }}
                                >
                                  ⭐ {m.constellation}
                                </Tag>
                              )}
                            </Space>

                            {m.link && (
                              <Button
                                type="link"
                                size="small"
                                icon={<LinkOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    m.link,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }}
                                style={{
                                  color: "#9333ea",
                                  fontSize: 12,
                                  padding: 0,
                                  height: "auto",
                                  marginTop: 4,
                                  transition: "all 0.2s ease",
                                }}
                                className="official-button"
                              >
                                {t.officialSite[currentLanguage]}
                              </Button>
                            )}
                          </Space>
                        </div>
                      </ProCard>
                    </List.Item>
                  );
                }}
              />
            </ProCard>
          ))
        )}
      </ProCard>

      {/* Custom styles */}
      <style>{`
        .member-card {
          will-change: transform;
        }
        
        .member-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }

        .member-card .thumb img {
          transition: transform 0.5s ease;
          border-radius: 12px;
        }

        .member-card:hover .thumb img {
          transform: scale(1.05);
        }

        .member-card .official-button:hover {
          color: #7c28ea !important;
        }
        
        .member-card .official-button:hover .anticon {
          transform: translateX(2px);
        }

        .member-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%);
        }
      `}</style>
    </PageContainer>
  );
};

export default MemberList;
