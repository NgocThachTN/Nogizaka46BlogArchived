import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Empty } from "antd";
import { ProCard } from "@ant-design/pro-components";
import MemberListHeader from "./MemberList/Components/MemberListHeader";
import MemberListFilterBar from "./MemberList/Components/MemberListFilterBar";
import GenerationGroup from "./MemberList/Components/GenerationGroup";
import { MemberListDesktopSkeleton } from "../../../shared/components/PageSkeletons";
import { useMemberDirectory } from "../hooks/useMemberDirectory";
import type { PageProps } from "../../../shared/types";

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
    fontFamily: "'Mali', 'Caveat', 'Yomogi', 'Georgia', serif",
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

const t = {
  noMembers: {
    ja: "メンバーが見つかりません",
    en: "No members found",
    vi: "Không tìm thấy thành viên",
  },
};

export default function MemberList({
  language,
  setLanguage,
  themeMode,
  setThemeMode,
}: PageProps) {
  const navigate = useNavigate();
  const currentLanguage = ["ja", "en", "vi"].includes(language) ? language : "ja";
  const [genFilter, setGenFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [showGraduated, setShowGraduated] = useState(false);
  const {
    members,
    graduatedMembers,
    groupedMembers,
    genList,
    loading,
    shouldShowGraduatedToggle,
  } = useMemberDirectory(keyword, genFilter, showGraduated);
  const showSkeleton = loading;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <div
        className={`diary-paper notebook-container${showSkeleton ? " desktop-skeleton-paper" : ""}`}
        style={{
          minHeight: "100vh",
          padding: "40px",
          paddingLeft: "60px",
        }}
      >
        <div className="notebook-binding" style={{ left: 0 }}></div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {showSkeleton ? (
            <MemberListDesktopSkeleton themeMode={themeMode} />
          ) : (
            <>
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

              <div
                className="sticky-note"
                style={{ transform: "rotate(1deg)", zIndex: 9, marginTop: "-10px" }}
              >
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
                  shouldShowGraduatedToggle={shouldShowGraduatedToggle}
                  currentMemberCount={members.length}
                  graduatedMemberCount={graduatedMembers.length}
                  bookFont={bookFont}
                />
              </div>

              {groupedMembers.length === 0 ? (
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
                groupedMembers.map(({ gen, items }) => (
                  <GenerationGroup
                    key={gen}
                    gen={gen}
                    items={items}
                    language={language}
                    themeMode={themeMode}
                    onMemberClick={(memberCode: string) => navigate(`/blogs/${memberCode}`)}
                    bookFont={bookFont}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
