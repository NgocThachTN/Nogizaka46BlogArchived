// MemberList.jsx — Ant Design Pro + nhóm theo Gen + 5 thẻ mỗi hàng
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Spin,
  Empty,
  notification,
} from "antd";
import { ProCard, PageContainer } from "@ant-design/pro-components";
import MemberListMobile from "./MemberListMobile";
import { loadAllGraduatedMembers, shouldUseLocalDB } from "../utils/graduatedMembersLoader";
import MemberListHeader from "./MemberList/Components/MemberListHeader";
import MemberListFilterBar from "./MemberList/Components/MemberListFilterBar";

import GenerationGroup from "./MemberList/Components/GenerationGroup";

// Diary-style handwriting fonts for journal-like reading experience
const bookFont = {
  ja: {
    fontFamily:
      "'Yomogi', 'Patrick Hand SC', 'Zen Kurenaido', 'Noto Serif JP', 'Source Han Serif JP', '游明朝', 'Yu Mincho', serif",
    fontWeight: 400,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
    fontDisplay: "swap",
    fontFeatureSettings: "'palt' 1",
  },
  en: {
    fontFamily:
      "'Mali', 'Caveat', 'Yomogi', 'Georgia', serif",
    fontWeight: 500,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    fontDisplay: "swap",
  },
  vi: {
    fontFamily:
      "'Mali', 'Patrick Hand SC', 'Caveat', 'Times New Roman', 'Georgia', serif",
    fontWeight: 500,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    fontDisplay: "swap",
  },
};

const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

// Translation keys
const t = {
  noMembers: {
    ja: "メンバーが見つかりません",
    en: "No members found",
    vi: "Không tìm thấy thành viên",
  },
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

const MemberList = ({
  language = "ja",
  setLanguage,
  themeMode,
  setThemeMode,
}) => {
  // Ensure language is valid, fallback to "ja"
  const currentLanguage = ["ja", "en", "vi"].includes(language)
    ? language
    : "ja";
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [graduatedMembers, setGraduatedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genFilter, setGenFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showGraduated, setShowGraduated] = useState(false);

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

        // Fetch current members from API
        const resp = await axios.get(
          "https://www.nogizaka46.com/s/n46/api/list/member?callback=res",
          { responseType: "text" }
        );
        const jsonStr = resp.data.replace(/^res\(/, "").replace(/\);?$/, "");
        const api = JSON.parse(jsonStr);

        // Lọc thành viên còn hoạt động
        const active = (api.data || []).filter((m) => m.graduation === "NO");

        // Thêm member đặc biệt 6期生リレー vào danh sách API
        const specialMember = {
          code: "40008",
          name: "6期生リレー",
          cate: "6期生",
          groupcode: "6期生",
          graduation: "NO",
        };

        // Kết hợp dữ liệu API với member đặc biệt
        const allMembers = [...active, specialMember];

        // Ảnh placeholder nếu lỗi
        const normalized = allMembers.map((m) => ({
          ...m,
          img: m.img || "https://via.placeholder.com/300x300?text=No+Image",
        }));

        setMembers(normalized);

        // ===== Load graduated members from local database =====
        if (shouldUseLocalDB()) {
          try {
            const graduated = await loadAllGraduatedMembers();
            console.log(`✅ Loaded ${graduated.length} graduated members from local DB`);
            setGraduatedMembers(graduated);
          } catch (error) {
            console.warn("Failed to load graduated members:", error);
            setGraduatedMembers([]);
          }
        }
        // ===== END graduated members loading =====

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
    // Show generation options based on current view (current or graduated)
    const allMembers = showGraduated ? graduatedMembers : members;
    const s = new Set(allMembers.map((m) => getGen(m)).filter(Boolean));
    // sắp theo GEN_ORDER
    const ordered = GEN_ORDER.filter((g) => s.has(g));
    // thêm những gen lạ (nếu có)
    const rest = Array.from(s).filter((g) => !GEN_ORDER.includes(g));
    return ["ALL", ...ordered, ...rest];
  }, [members, graduatedMembers, showGraduated]);

  // Lọc theo từ khoá + Gen
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    // Show only graduated members when showGraduated is true, otherwise show only current members
    const allMembers = showGraduated ? graduatedMembers : members;
    return allMembers.filter((m) => {
      if (genFilter !== "ALL" && getGen(m) !== genFilter) return false;
      if (!kw) return true;
      const hay = `${m.name} ${m.english_name || ""} ${m.kana || ""
        }`.toLowerCase();
      return hay.includes(kw);
    });
  }, [members, graduatedMembers, genFilter, keyword, showGraduated]);

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
    return (
      <MemberListMobile
        language={language}
        setLanguage={setLanguage}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <div
        className="diary-paper notebook-container"
        style={{
          minHeight: "100vh",
          padding: isMobile ? "16px" : "40px",
          paddingLeft: isMobile ? "16px" : "60px", // Space for binding
        }}
      >
        {/* Visual binding effect */}
        {!isMobile && <div className="notebook-binding" style={{ left: 0 }}></div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: 1200, margin: "0 auto" }}>

          {/* Header Area - Sticky Note Style */}
          <div className="sticky-note" style={{ transform: "rotate(-1deg)", zIndex: 10 }}>
            <MemberListHeader
              language={language}
              setLanguage={setLanguage}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              memberCount={members.length}
              bookFont={bookFont}
            />
          </div>

          {/* Filter Area - Sticky Note Style */}
          <div className="sticky-note" style={{ transform: "rotate(1deg)", zIndex: 9, marginTop: "-10px" }}>
            <MemberListFilterBar
              language={language}
              themeMode={themeMode}
              genList={genList}
              genFilter={genFilter}
              setGenFilter={setGenFilter}
              keyword={keyword}
              setKeyword={setKeyword}
              showGraduated={showGraduated}
              setShowGraduated={setShowGraduated}
              shouldShowGraduatedToggle={shouldUseLocalDB() && graduatedMembers.length > 0}
              currentMemberCount={members.length}
              graduatedMemberCount={graduatedMembers.length}
              bookFont={bookFont}
            />
          </div>

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
              style={{
                borderRadius: 14,
                background:
                  themeMode === "dark"
                    ? "rgba(36, 33, 29, 0.85)"
                    : "rgba(253, 246, 227, 0.8)",
              }}
            >
              <Empty description={t.noMembers[currentLanguage]} />
            </ProCard>
          ) : (
            grouped.map(({ gen, items }) => (
              <GenerationGroup
                key={gen}
                gen={gen}
                items={items}
                language={language}
                themeMode={themeMode}
                onMemberClick={(memberCode) => navigate(`/blogs/${memberCode}`)}
                bookFont={bookFont}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberList;
