// MemberListMobile.jsx — Ant Design Pro, mobile-first, super polished
// Highlights:
// - Sticky hero with segmented Gen chips + search
// - rAF debounced search + instant filter feedback
// - Beautiful member cards with lazy images, intrinsic placeholder, and tags
// - Collapse by generation with custom headers
// - Safe JSONP parse + error states + skeletons
// - Smooth 60fps scrolling: content-visibility for images, layout containment

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Typography,
  Tag,
  Space,
  Input,
  Segmented,
  Empty,
  Drawer,
  Button,
  Card,
  message,
  Affix,
  Collapse,
  Badge,
  Divider,
} from "antd";
import {
  PageContainer,
  ProCard,
  ProSkeleton,
} from "@ant-design/pro-components";
import {
  SearchOutlined,
  FilterOutlined,
  StarOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";

/** Typography */
const { Title, Text } = Typography;

/** JP font */
const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

/** Gen order */
const GEN_ORDER = [
  "6期生",
  "5期生",
  "4期生",
  "3期生",
  "2期生",
  "1期生",
  "その他",
];

/** Helpers */
const getGen = (m) =>
  m.cate?.trim() ||
  m.groupcode?.trim() ||
  (m.code === "10001" ? "その他" : "その他");

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

const useRafDebounce = (fn, delay = 160) => {
  const timer = useRef();
  return useCallback(
    (...args) => {
      if (timer.current) cancelAnimationFrame(timer.current);
      const start = performance.now();
      const tick = () => {
        if (performance.now() - start >= delay) {
          fn(...args);
        } else {
          timer.current = requestAnimationFrame(tick);
        }
      };
      timer.current = requestAnimationFrame(tick);
    },
    [fn, delay]
  );
};

export default function MemberListMobile() {
  const navigate = useNavigate();

  /** State */
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genFilter, setGenFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [collapsedGens, setCollapsedGens] = useState(new Set());

  /** Search */
  const setKeywordDebounced = useRafDebounce((v) => setKeyword(v), 140);
  const onSearchChange = (e) => setKeywordDebounced(e.target.value);

  /** Fetch */
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await axios.get(
          "https://www.nogizaka46.com/s/n46/api/list/member?callback=res",
          { responseType: "text" }
        );
        const jsonStr = (resp.data || "")
          .replace(/^res\(/, "")
          .replace(/\);?$/, "");
        const api = JSON.parse(jsonStr);
        const active = (api.data || []).filter((m) => m.graduation === "NO");
        const normalized = active.map((m) => ({
          ...m,
          img: m.img || "https://via.placeholder.com/320x320?text=No+Image",
        }));
        if (!canceled) setMembers(normalized);
      } catch (e) {
        console.error(e);
        message.error("データを取得できませんでした。");
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  /** Gen options */
  const genList = useMemo(() => {
    const s = new Set(members.map((m) => getGen(m)).filter(Boolean));
    const ordered = GEN_ORDER.filter((g) => s.has(g));
    const rest = Array.from(s).filter((g) => !GEN_ORDER.includes(g));
    return ["ALL", ...ordered, ...rest];
  }, [members]);

  /** Filtered */
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

  /** Grouped */
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((m) => {
      const g = getGen(m);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(m);
    });
    const known = GEN_ORDER.filter((g) => map.has(g)).map((g) => ({
      gen: g,
      items: map.get(g),
    }));
    const others = Array.from(map.keys())
      .filter((g) => !GEN_ORDER.includes(g))
      .map((g) => ({ gen: g, items: map.get(g) }));
    return [...known, ...others];
  }, [filtered]);

  /** Toggle gen collapse */
  const toggleGenCollapse = (gen) => {
    setCollapsedGens((prev) => {
      const next = new Set(prev);
      if (next.has(gen)) next.delete(gen);
      else next.add(gen);
      return next;
    });
  };

  /** Member card */
  const MemberCard = ({ m }) => {
    const age = getAge(m.birthday);
    return (
      <Card
        hoverable
        onClick={() => navigate(`/blogs/${m.code}`)}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          marginBottom: 8,
          contain: "layout paint style",
          width: "100%",
          maxWidth: "100%",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ display: "flex", height: 96 }}>
          {/* Image */}
          <div
            style={{
              width: 96,
              height: 96,
              position: "relative",
              background: "#f7f7f9",
              flexShrink: 0,
            }}
          >
            <img
              src={m.img}
              alt={m.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                contentVisibility: "auto",
                containIntrinsicSize: "120px 120px",
              }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/320x320?text=No+Image";
              }}
            />
            <Tag
              color="purple"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                fontSize: 9,
                padding: "1px 4px",
                borderRadius: 6,
                lineHeight: 1.2,
              }}
            >
              {getGen(m).length > 3 ? getGen(m).slice(0, 3) : getGen(m)}
            </Tag>
          </div>

          {/* Text */}
          <div
            style={{
              flex: 1,
              padding: 12,
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
                  lineHeight: 1.3,
                  display: "block",
                  marginBottom: 2,
                  color: "#111827",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.name}
              </Text>
              {m.english_name ? (
                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    display: "block",
                    fontStyle: "italic",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.english_name}
                </Text>
              ) : null}
            </div>

            <Space size={[2, 2]} wrap>
              {m.birthday && (
                <Tag
                  style={{
                    background: "rgba(99,102,241,0.06)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    borderRadius: 6,
                    fontSize: 9,
                    padding: "1px 4px",
                    lineHeight: 1.2,
                  }}
                >
                  🎂 {m.birthday.split("/")[0]}
                  {age != null ? `(${age})` : ""}
                </Tag>
              )}
              {m.blood && (
                <Tag
                  style={{
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 6,
                    fontSize: 9,
                    padding: "1px 4px",
                    lineHeight: 1.2,
                  }}
                >
                  🩸 {m.blood}
                </Tag>
              )}
            </Space>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <PageContainer
      header={false}
      token={{
        paddingInlinePageContainerContent: 0,
        paddingBlockPageContainerContent: 0,
        paddingInlinePageContainer: 0,
      }}
      style={{
        background: "#fff",
        padding: 0,
        margin: 0,
        minHeight: "100dvh",
        width: "100vw",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sticky Hero */}
      <Affix offsetTop={0}>
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #f2f2f5",
            width: "100%",
            zIndex: 998,
          }}
        >
          <ProCard
            ghost
            bodyStyle={{ padding: "12px 16px" }}
            style={{
              ...jpFont,
              width: "100%",
              maxWidth: "100%",
            }}
          >
            <Space
              style={{ width: "100%", justifyContent: "space-between" }}
              align="center"
            >
              <Space direction="vertical" size={0}>
                <Text
                  type="secondary"
                  style={{ letterSpacing: 2, fontSize: 12 }}
                >
                  乃木坂46 メンバー
                </Text>
                <Title
                  level={4}
                  style={{ margin: 0, lineHeight: 1.2, fontSize: 18 }}
                >
                  Members
                </Title>
              </Space>
              <Button
                type="text"
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
                style={{ borderRadius: 10, flexShrink: 0 }}
              />
            </Space>

            {/* Gen chips + Search */}
            <div style={{ marginTop: 12 }}>
              <Segmented
                value={genFilter}
                onChange={setGenFilter}
                options={genList.map((g) => ({
                  label:
                    g === "ALL" ? "すべて" : g.length > 3 ? g.slice(0, 3) : g,
                  value: g,
                }))}
                size="small"
                block
                style={{ marginBottom: 8 }}
              />
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="メンバーを検索…"
                onChange={onSearchChange}
                size="middle"
                style={{
                  borderRadius: 12,
                  background: "#fafafa",
                  width: "100%",
                }}
              />
            </div>
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
        {loading ? (
          <ProCard ghost>
            <ProSkeleton type="list" />
          </ProCard>
        ) : grouped.length === 0 ? (
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Empty description="該当するメンバーが見つかりません" />
          </Card>
        ) : (
          <Collapse
            ghost
            size="middle"
            style={{ background: "transparent" }}
            items={grouped.map(({ gen, items }) => {
              const isCollapsed = collapsedGens.has(gen);
              return {
                key: gen,
                label: (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "2px 0",
                    }}
                    onClick={() => toggleGenCollapse(gen)}
                  >
                    <Space>
                      <StarOutlined
                        style={{ color: "#7c3aed", fontSize: 14 }}
                      />
                      <span
                        style={{
                          ...jpFont,
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#18181b",
                        }}
                      >
                        {gen}
                      </span>
                    </Space>
                    <Space>
                      <Tag
                        style={{
                          background: "#f5f3ff",
                          border: "1px solid #e9d5ff",
                          color: "#6d28d9",
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 10,
                          padding: "1px 6px",
                        }}
                      >
                        {items.length}
                      </Tag>
                      {isCollapsed ? (
                        <RightOutlined
                          style={{ color: "#7c3aed", fontSize: 12 }}
                        />
                      ) : (
                        <DownOutlined
                          style={{ color: "#7c3aed", fontSize: 12 }}
                        />
                      )}
                    </Space>
                  </div>
                ),
                children: (
                  <div style={{ padding: "4px 0" }}>
                    {items.map((m) => (
                      <MemberCard key={m.code} m={m} />
                    ))}
                  </div>
                ),
                style: {
                  marginBottom: 8,
                  borderRadius: 12,
                  border: "1px solid #f1f1f5",
                  background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                },
                forceRender: false,
                showArrow: false,
                collapsible: "icon",
              };
            })}
            expandIcon={() => null}
            activeKey={grouped
              .map(({ gen }) => (collapsedGens.has(gen) ? null : gen))
              .filter(Boolean)}
            onChange={(keys) => {
              const newCollapsed = new Set();
              grouped.forEach(({ gen }) => {
                if (!keys.includes(gen)) newCollapsed.add(gen);
              });
              setCollapsedGens(newCollapsed);
            }}
          />
        )}
      </div>

      {/* Filter Drawer (bottom) */}
      <Drawer
        title="フィルター"
        placement="bottom"
        height={320}
        open={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        styles={{ body: { paddingTop: 8 } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Text strong style={{ display: "block", marginBottom: 10 }}>
              期生
            </Text>
            <Segmented
              block
              options={genList.map((g) => ({
                label: g === "ALL" ? "すべて" : g,
                value: g,
              }))}
              value={genFilter}
              onChange={setGenFilter}
              size="large"
            />
          </div>
        </Space>
      </Drawer>

      {/* Styles */}
      <style>{`
        /* Full-bleed mobile overrides */
        html, body, #root { 
          height: 100%; 
          min-height: 100vh;
          min-height: 100dvh;
          background: #fff;
          margin: 0;
          padding: 0;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
        }
        body { 
          margin: 0; 
          padding: 0;
          overscroll-behavior: none;
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

        /* Card styles */
        .ant-card { 
          transition: transform .2s ease, box-shadow .2s ease; 
          width: 100% !important;
          max-width: 100% !important;
        }
        .ant-card:hover { 
          transform: translateY(-1px); 
          box-shadow: 0 4px 12px rgba(0,0,0,.06); 
        }

        /* Collapse styles */
        .ant-collapse { 
          border: none !important; 
          background: transparent !important; 
          width: 100% !important;
        }
        .ant-collapse-item { 
          border: 1px solid #f1f1f5 !important; 
          border-radius: 12px !important; 
          margin-bottom: 8px !important; 
          background: #fff !important; 
          box-shadow: 0 1px 4px rgba(0,0,0,0.04) !important; 
          overflow: hidden !important; 
          width: 100% !important;
        }
        .ant-collapse-item-active { 
          box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important; 
        }
        .ant-collapse-header { 
          padding: 12px 16px !important; 
          background: linear-gradient(135deg, #ffffff, #fafafc) !important; 
          border: none !important; 
          border-radius: 12px !important; 
          cursor: pointer !important; 
          transition: all 0.3s ease !important; 
        }
        .ant-collapse-header:hover { 
          background: linear-gradient(135deg, #f8f9ff, #f0f2ff) !important; 
        }
        .ant-collapse-content { 
          border: none !important; 
          background: #fff !important; 
          border-radius: 0 0 12px 12px !important; 
        }
        .ant-collapse-content-box { 
          padding: 4px 16px 16px !important; 
        }
        .ant-collapse-arrow { 
          display: none !important; 
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
      `}</style>
    </PageContainer>
  );
}
