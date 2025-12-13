import React from "react";
import { Space, Tag, List } from "antd";
import { StarOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import MemberCard from "./MemberCard";

const jpFont = {
    fontFamily:
        "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

// Translation keys
const t = {
    other: { ja: "その他", en: "Other", vi: "Khác" },
};

const GenerationGroup = ({ gen, items, language, themeMode, onMemberClick }) => {
    // Ensure language is valid, fallback to "ja"
    const currentLanguage = ["ja", "en", "vi"].includes(language)
        ? language
        : "ja";

    return (
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
                background:
                    themeMode === "dark"
                        ? "rgba(36, 33, 29, 0.85)"
                        : "rgba(253, 246, 227, 0.8)",
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
                //dataSource={items.slice(0, 10)} // Giới hạn hiển thị 10 thành viên đầu tiên
                dataSource={items}
                renderItem={(m) => (
                    <MemberCard
                        member={m}
                        language={language}
                        themeMode={themeMode}
                        onClick={() => onMemberClick(m.code)}
                    />
                )}
            />
        </ProCard>
    );
};

export default GenerationGroup;
