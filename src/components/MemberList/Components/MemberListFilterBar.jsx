import React from "react";
import { Space, Input, Segmented } from "antd";
import { SearchOutlined, StarOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";

// Translation keys
const t = {
    searchPlaceholder: {
        ja: "メンバーを検索...",
        en: "Search members...",
        vi: "Tìm kiếm thành viên...",
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
};

const MemberListFilterBar = ({
    language,
    themeMode,
    genList,
    genFilter,
    setGenFilter,
    keyword,
    setKeyword,
    showGraduated,
    setShowGraduated,
    shouldShowGraduatedToggle,
    currentMemberCount,
    graduatedMemberCount,
}) => {
    // Ensure language is valid, fallback to "ja"
    const currentLanguage = ["ja", "en", "vi"].includes(language)
        ? language
        : "ja";

    return (
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
            <Space
                wrap
                size="middle"
                style={{ width: "100%", justifyContent: "space-between", gap: "12px" }}
            >
                <Space wrap size="middle" style={{ gap: "12px" }}>
                    {/* Toggle Current/Graduated Members */}
                    {shouldShowGraduatedToggle && (
                        <Segmented
                            value={showGraduated ? "graduated" : "current"}
                            onChange={(val) => setShowGraduated(val === "graduated")}
                            options={[
                                {
                                    label: (
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <StarOutlined />
                                            {t.currentMembers[currentLanguage]} ({currentMemberCount})
                                        </span>
                                    ),
                                    value: "current",
                                },
                                {
                                    label: (
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            {t.graduatedMembers[currentLanguage]} ({graduatedMemberCount})
                                        </span>
                                    ),
                                    value: "graduated",
                                },
                            ]}
                        />
                    )}

                    {/* Generation Filter */}
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
                </Space>

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
    );
};

export default MemberListFilterBar;
