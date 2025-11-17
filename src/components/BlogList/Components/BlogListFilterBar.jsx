import React from "react";
import { Input, Space, Tag } from "antd";
import { ProCard } from "@ant-design/pro-components";
import { SearchOutlined } from "@ant-design/icons";

// Translation keys
const t = {
  searchPlaceholder: {
    ja: "ブログを検索...",
    en: "Search blogs...",
    vi: "Tìm kiếm blog...",
  },
  totalPosts: {
    ja: "総投稿数",
    en: "Total Posts",
    vi: "Tổng số bài viết",
  },
};

const BlogListFilterBar = ({
  language,
  themeMode,
  screens,
  q,
  setQ,
  filteredCount,
  isPending,
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
          {t.totalPosts[currentLanguage]} {filteredCount}{" "}
          {isPending ? "…" : ""}
        </Tag>
      </Space>
    </ProCard>
  );
};

export default BlogListFilterBar;
