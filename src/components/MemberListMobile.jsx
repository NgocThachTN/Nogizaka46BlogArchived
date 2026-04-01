// MemberListMobile.jsx — Notebook Diary Edition
// Notebook style member list with "sticker/photo" cards

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
  Collapse,
  Badge,
  Divider,
  Select,
  Skeleton,
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
  GlobalOutlined,
  BulbOutlined,
  MoonOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  loadAllGraduatedMembers,
  shouldUseLocalDB,
} from "../utils/graduatedMembersLoader";
import { MemberListMobileSkeleton } from "./PageSkeletons";

/** Typography */
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
    vi: "Blog Nogizaka46",
  },
  totalBlogs: {
    ja: "総メンバー数",
    en: "Total Members",
    vi: "Tổng Số Thành Viên ",
  },
  graduatedMembers: {
    ja: "卒業生",
    en: "Graduated Members",
    vi: "Thành viên đã tốt nghiệp",
  },
  currentMembers: {
    ja: "現役メンバー",
    en: "Current Members",
    vi: "Thành viên hiện tại",
  },
  graduated: {
    ja: "卒業",
    en: "Graduated",
    vi: "Đã tốt nghiệp",
  },
};

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

export default function MemberListMobile({
  language = "ja",
  setLanguage,
  themeMode = "light",
  setThemeMode,
}) {
  // Ensure language is valid, fallback to "ja"
  const currentLanguage = ["ja", "en", "vi"].includes(language)
    ? language
    : "ja";
  const navigate = useNavigate();

  /** State */
  const [members, setMembers] = useState([]);
  const [graduatedMembers, setGraduatedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genFilter, setGenFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [collapsedGens, setCollapsedGens] = useState(new Set());
  const [showGraduated, setShowGraduated] = useState(false);
  const scrollWrapRef = useRef(null);

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

        // Thêm card member đặc biệt với id 40008
        const specialMember = {
          code: "40008",
          name: "6期生リレー",
          cate: "6期生",
          groupcode: "6期生",
          graduation: "NO",
        };

        if (!canceled) setMembers([...normalized, specialMember]);

        // ===== Load graduated members from local database =====
        if (shouldUseLocalDB()) {
          try {
            const graduated = await loadAllGraduatedMembers();
            console.log(
              `✅ Loaded ${graduated.length} graduated members from local DB`
            );
            if (!canceled) setGraduatedMembers(graduated);
          } catch (error) {
            console.warn("Failed to load graduated members:", error);
            if (!canceled) setGraduatedMembers([]);
          }
        }
        // ===== END graduated members loading =====
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
    // Show generation options based on current view (current or graduated)
    const allMembers = showGraduated ? graduatedMembers : members;
    const safeMembers = allMembers.filter(Boolean);
    const s = new Set(safeMembers.map((m) => getGen(m)).filter(Boolean));
    const ordered = GEN_ORDER.filter((g) => s.has(g));
    const rest = Array.from(s).filter((g) => !GEN_ORDER.includes(g));
    return ["ALL", ...ordered, ...rest];
  }, [members, graduatedMembers, showGraduated]);

  /** Filtered */
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    // Show only graduated members when showGraduated is true, otherwise show only current members
    const allMembers = showGraduated ? graduatedMembers : members;
    const totalMembers = allMembers.filter((m) => {
      if (!m) return false;
      if (genFilter !== "ALL" && getGen(m) !== genFilter) return false;
      if (!kw) return true;
      const hay = `${m.name} ${m.english_name || ""} ${m.kana || ""
        }`.toLowerCase();
      return hay.includes(kw);
    });
    return totalMembers;
  }, [members, graduatedMembers, genFilter, keyword, showGraduated]);

  /** Grouped */
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.filter(Boolean).forEach((m) => {
      const g = getGen(m);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(m);
    });
    const known = GEN_ORDER.filter((g) => map.has(g)).map((g) => ({
      gen: g,
      items: (map.get(g) || []).filter(Boolean),
    }));
    const others = Array.from(map.keys())
      .filter((g) => !GEN_ORDER.includes(g))
      .map((g) => ({ gen: g, items: (map.get(g) || []).filter(Boolean) }));
    return [...known, ...others].filter((group) => group?.gen && group.items?.length);
  }, [filtered]);

  const collapseItems = useMemo(() => {
    return grouped
      .filter((group) => group?.gen && Array.isArray(group.items) && group.items.length > 0)
      .map(({ gen, items }) => {
        const displayGen = gen === "ãã®ä»–"
          ? t.other[currentLanguage]
          : gen.replace("æœŸç”Ÿ", currentLanguage === "en" ? " Gen" : "æœŸç”Ÿ").replace(/^(\d+)\s*(Gen|Tháº¿ há»‡)$/, currentLanguage === "en" ? "Gen $1" : "Tháº¿ há»‡ $1");

        return {
          key: gen,
          label: (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontFamily: "'Yomogi', cursive",
                fontSize: 18,
                fontWeight: "bold",
                color: themeMode === "dark" ? "#f5ede0" : "#5c4033",
                borderBottom: "2px solid rgba(139,69,19,0.3)"
              }}>
                {displayGen}
              </span>
              <Badge
                count={items.length}
                style={{ backgroundColor: "#8b5a2b", color: "#fff" }}
              />
            </div>
          ),
          children: (
            <div style={{ padding: "4px 0" }}>
              {gen === "6æœŸç”Ÿ" && <Gen6BlogCard />}
              {items.filter(Boolean).map((m) => (
                <MemberCard key={m.code} m={m} />
              ))}
            </div>
          ),
          style: {
            borderBottom: "none",
            marginBottom: 16
          }
        };
      });
  }, [currentLanguage, grouped, themeMode]);

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
  // Tạo card đặc biệt cho gen 6 blog
  function Gen6BlogCard() {
    return (
      <div
      onClick={() => navigate(`/blogs/40008`)}
      style={{
        display: "flex",
        background: "white",
        borderRadius: 2,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        padding: "6px",
        marginBottom: 12,
        alignItems: "center",
        border: "1px solid #e0e0e0",
        transform: "rotate(-1deg)",
        transition: "transform 0.1s ease",
        cursor: "pointer",
        maxWidth: "100%",
      }}
    >
      {/* Image Placeholder */}
      <div
        style={{
          width: 70,
          height: 85,
          background: "linear-gradient(135deg, #9333ea 0%, #7c28ea 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: "1px solid #f0f0f0",
        }}
      >
        <div style={{ fontSize: "28px" }}>📝</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingLeft: 12, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Text
          strong
          style={{
            ...jpFont,
            fontSize: 16,
            color: "#9333ea",
            marginBottom: 4,
            display: "block",
            fontFamily: "'Yomogi', cursive, sans-serif",
          }}
        >
          {currentLanguage === "ja"
            ? "6期生ブログ"
            : currentLanguage === "en"
              ? "6th Gen Blog"
              : "Blog Thế hệ 6"}
        </Text>
        <Tag
          style={{
            borderRadius: 4,
            fontSize: 10,
            alignSelf: "flex-start",
            border: "none",
            background: "rgba(147, 51, 234, 0.1)",
            color: "#9333ea",
            fontFamily: "'Mali', cursive, sans-serif"
          }}
        >
          OFFICIAL
        </Tag>
      </div>
      </div>
    );
  }

  function MemberCard({ m }) {
    const age = getAge(m.birthday);
    return (
      <div
        onClick={() => navigate(`/blogs/${m.code}`)}
        style={{
          background: "white",
          padding: "8px 8px 12px 8px", // Bottom padding for "Polaroid" caption area
          borderRadius: 2,
          boxShadow: themeMode === "dark"
            ? "0 2px 8px rgba(0,0,0,0.4)"
            : "0 2px 6px rgba(0,0,0,0.1)",
          marginBottom: 16,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          transform: `rotate(${Math.random() * 2 - 1}deg)`, // Slight random rotation
          border: themeMode === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
          maxWidth: "100%",
          backgroundColor: themeMode === "dark" ? "#2a2520" : "#fff",
        }}
      >
        {/* Photo */}
        <div
          style={{
            width: 80,
            height: 96,
            position: "relative",
            background: "#f0f0f0",
            flexShrink: 0,
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <img
            src={m.img}
            alt={m.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/320x320?text=No+Image";
            }}
          />
        </div>

        {/* Info - Handwritten Style */}
        <div
          style={{
            flex: 1,
            paddingLeft: 16,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            minWidth: 0,
          }}
        >
          <div>
            <Text
              strong
              style={{
                ...jpFont,
                fontSize: 18,
                lineHeight: 1.3,
                display: "block",
                color: themeMode === "dark" ? "#f5ede0" : "#2c2c2c",
                fontFamily: `${language === "en" || language === "vi" ? "'Mali', cursive" : "'Yomogi', cursive"}, sans-serif`,
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
                  color: themeMode === "dark" ? "#cfbfa6" : "#8b5a2b",
                  fontFamily: "'Mali', cursive, sans-serif",
                }}
              >
                {m.english_name}
              </Text>
            )}
          </div>

          <div style={{ marginTop: 8 }}>
            <Space size={[4, 4]} wrap>
              {m.graduation === "YES" ? (
                <span style={{ fontSize: 11, color: "#888", border: "1px solid #ccc", padding: "0 4px", borderRadius: 4 }}>
                  {t.graduated[currentLanguage]}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: "#8b5a2b", background: "rgba(139, 90, 43, 0.1)", padding: "0 4px", borderRadius: 4 }}>
                  {getGen(m)}
                </span>
              )}
            </Space>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        ref={scrollWrapRef}
        className="diary-paper notebook-container no-scrollbar"
        style={{
          width: "100%",
          minHeight: "100vh",
          height: "100dvh",
          padding: 0,
          margin: 0,
          position: "relative",
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: themeMode === "dark" ? "#1c1a17" : "#fdf6e3",
          display: "block",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          overscrollBehavior: "none",
        }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div
          className="notebook-binding"
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: -10,
            width: 30,
            backgroundSize: "8px 30px",
            zIndex: 50,
          }}
        ></div>
        <MemberListMobileSkeleton themeMode={themeMode} />
      </div>
    );
  }

  return (
    <div
      ref={scrollWrapRef}
      className="diary-paper notebook-container no-scrollbar"
      style={{
        width: "100%",
        minHeight: "100vh",
        height: "100dvh",
        padding: 0,
        margin: 0,
        position: "relative",
        overflowY: "auto",
        overflowX: "hidden",
        backgroundColor: themeMode === "dark" ? "#1c1a17" : "#fdf6e3",
        display: "block",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        overscrollBehavior: "none", // Prevent rubber-banding black bar
      }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Visual binding effect - thinner for mobile */}
      <div
        className="notebook-binding"
        style={{
          position: "fixed", // Fixed so it stays on screen
          top: 0,
          bottom: 0,
          left: -10, // Hide part of it off-screen for mobile
          width: 30,
          backgroundSize: "8px 30px",
          zIndex: 50,
        }}
      ></div>

      {/* Header - Sticky Note Style */}
      <div
        style={{
          background:
            themeMode === "dark"
              ? "rgba(36, 33, 29, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          borderBottom:
            themeMode === "dark"
              ? "1px dashed rgba(207,191,166,0.3)"
              : "1px dashed rgba(139, 69, 19, 0.3)",
          zIndex: 100,
          position: "relative", // Ensure z-index works to sit above red margin line
          padding: "12px 16px 12px 12px", // Adjusted left padding for consistency
          flexShrink: 0,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <Space
          style={{ width: "100%", justifyContent: "space-between" }}
          align="center"
        >
          <Space direction="vertical" size={0}>
            <Text
              type="secondary"
              style={{
                letterSpacing: 2,
                fontSize: 10,
                color: themeMode === "dark" ? "#cfbfa6" : "#8b5a2b",
                textTransform: "uppercase",
                fontFamily: "'Mali', cursive, sans-serif"
              }}
            >
              {t.blogTitle[currentLanguage]}
            </Text>
            <Title
              level={4}
              style={{
                margin: 0,
                lineHeight: 1.2,
                fontSize: 20,
                color: themeMode === "dark" ? "#f5ede0" : "#5c4033",
                fontFamily: "'Yomogi', cursive, sans-serif"
              }}
            >
              {showGraduated ? t.graduatedMembers[currentLanguage] : t.members[currentLanguage]}
            </Title>
          </Space>
          <Space>
            {setLanguage && (
              <Select
                value={language}
                onChange={setLanguage}
                size="small"
                variant="borderless"
                dropdownMatchSelectWidth={false}
                style={{ width: 60, fontFamily: "'Mali', cursive", color: "#8b5a2b" }}
                options={[
                  { value: "ja", label: "JP" },
                  { value: "en", label: "EN" },
                  { value: "vi", label: "VI" },
                ]}
              />
            )}
            {setThemeMode && (
              <Button
                type="text"
                onClick={() =>
                  setThemeMode(themeMode === "dark" ? "light" : "dark")
                }
                style={{ borderRadius: 10, flexShrink: 0, color: "#8b5a2b" }}
                icon={
                  themeMode === "dark" ? <BulbOutlined /> : <MoonOutlined />
                }
              />
            )}
            <Button
              type="text"
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerVisible(true)}
              style={{ borderRadius: 10, flexShrink: 0, color: "#8b5a2b" }}
            />
          </Space>
        </Space>

        {/* Gen chips + Search */}
        <div style={{ marginTop: 12 }}>
          <Segmented
            value={showGraduated ? "graduated" : "current"}
            onChange={(val) => setShowGraduated(val === "graduated")}
            size="middle"
            block
            style={{
              marginBottom: 12,
              background:
                themeMode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(139, 69, 19, 0.08)",
              color: themeMode === "dark" ? "#d2a86a" : "#8b4513",
            }}
            options={[
              {
                label: (
                  <span style={{ fontSize: 13, fontFamily: "'Mali', cursive" }}>
                    {t.currentMembers[currentLanguage]}
                  </span>
                ),
                value: "current",
              },
              {
                label: (
                  <span style={{ fontSize: 13, fontFamily: "'Mali', cursive" }}>
                    OG ({graduatedMembers.length})
                  </span>
                ),
                value: "graduated",
              },
            ]}
          />

          {/* Horizontal Scrollable Gen Filter */}
          <div style={{
            overflowX: "auto",
            whiteSpace: "nowrap",
            paddingBottom: 8,
            marginBottom: 4,
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}>
            <Space size={8}>
              {genList.map(g => {
                const label = g === "ALL"
                  ? currentLanguage === "ja" ? "すべて" : "All"
                  : g.replace("期生", currentLanguage === "en" ? " Gen" : "");

                const isActive = genFilter === g;

                return (
                  <div
                    key={g}
                    onClick={() => setGenFilter(g)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      background: isActive
                        ? (themeMode === "dark" ? "#d2a86a" : "#8b5a2b")
                        : (themeMode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(139,69,19,0.05)"),
                      color: isActive
                        ? (themeMode === "dark" ? "#1c1a17" : "#fff")
                        : (themeMode === "dark" ? "#d2a86a" : "#8b5a2b"),
                      fontSize: 13,
                      fontFamily: "'Mali', cursive",
                      cursor: "pointer",
                      border: isActive ? "none" : `1px solid ${themeMode === "dark" ? "rgba(207,191,166,0.3)" : "rgba(139,69,19,0.2)"}`,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </Space>
          </div>

          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "#8b5a2b" }} />}
            placeholder={t.searchPlaceholder[currentLanguage]}
            onChange={onSearchChange}
            size="middle"
            style={{
              borderRadius: 20,
              background:
                themeMode === "dark"
                  ? "rgba(0,0,0,0.2)"
                  : "rgba(255,255,255,0.6)",
              border:
                themeMode === "dark"
                  ? "1px solid rgba(207,191,166,0.25)"
                  : "1px solid rgba(139, 69, 19, 0.2)",
              width: "100%",
              fontFamily: "'Mali', cursive"
            }}
          />
        </div>
      </div>

      {/* Content - Scrollable List */}
      <div
        style={{
          padding: "16px 16px 80px 32px", // Left padding for binding
        }}
      >
        {grouped.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#8b5a2b" }}>
            <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <div style={{ marginTop: 16 }}>{t.noMembers[currentLanguage]}</div>
          </div>
        ) : (
          <Collapse
            ghost
            size="middle"
            defaultActiveKey={collapseItems.map((item) => item.key)}
            style={{ background: "transparent" }}
            expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? 90 : 0} style={{ color: "#8b5a2b" }} />}
            legacyItems={grouped.map(({ gen, items }) => {
              const displayGen = gen === "その他"
                ? t.other[currentLanguage]
                : gen.replace("期生", currentLanguage === "en" ? " Gen" : "期生").replace(/^(\d+)\s*(Gen|Thế hệ)$/, currentLanguage === "en" ? "Gen $1" : "Thế hệ $1");

              return {
                key: gen,
                label: (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontFamily: "'Yomogi', cursive",
                      fontSize: 18,
                      fontWeight: "bold",
                      color: themeMode === "dark" ? "#f5ede0" : "#5c4033",
                      borderBottom: "2px solid rgba(139,69,19,0.3)"
                    }}>
                      {displayGen}
                    </span>
                    <Badge
                      count={items.length}
                      style={{ backgroundColor: "#8b5a2b", color: "#fff" }}
                    />
                  </div>
                ),
                children: (
                  <div style={{ padding: "4px 0" }}>
                    {gen === "6期生" && <Gen6BlogCard />}
                    {items.map((m) => (
                      <MemberCard key={m.code} m={m} />
                    ))}
                  </div>
                ),
                style: {
                  borderBottom: "none",
                  marginBottom: 16
                }
              };
            })}
            items={collapseItems}
          />
        )}
      </div>

      {/* Filter Drawer */}
      <Drawer
        title="Filter"
        placement="bottom"
        height={320}
        open={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        styles={{ body: { paddingTop: 8 } }}
      >
        {/* Simplified drawer content - can be removed if chips are enough, 
             or kept for advanced filters later */}
        <div style={{ padding: 16, textAlign: "center", color: "#888" }}>
          Additional filters coming soon...
        </div>
      </Drawer>

      {/* Global & Scrollbar Styles */}
      <style>{`
          /* Hide scrollbar for clean reading */
          .notebook-container::-webkit-scrollbar {
            display: none;
          }
           .ant-collapse-header {
             padding-left: 0 !important;
           }
      `}</style>
    </div>
  );
}
