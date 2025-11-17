import React from "react";
import { Space, Typography, Tag, Button } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import { prefetchMemberInfo } from "../../../services/blogService";

const { Text } = Typography;

// Translation keys
const t = {
    officialSite: {
        ja: "公式サイト",
        en: "Official Site",
        vi: "Trang chính thức",
    },
};

const jpFont = {
    fontFamily:
        "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
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

// Chuẩn hoá Gen từ dữ liệu (cate/ groupcode có thể khác nhau)
const getGen = (m) => {
    return (
        m.cate?.trim() ||
        m.groupcode?.trim() ||
        (m.code === "10001" ? "その他" : "その他")
    );
};

const MemberCard = ({ member, language, themeMode, onClick }) => {
    // Ensure language is valid, fallback to "ja"
    const currentLanguage = ["ja", "en", "vi"].includes(language)
        ? language
        : "ja";

    const age = getAge(member.birthday);

    return (
        <ProCard
            hoverable
            bordered={false}
            className="member-card"
            onClick={onClick}
            onMouseEnter={() => {
                // Prefetch member list API when hovering to prepare cache
                prefetchMemberInfo();
            }}
            style={{
                borderRadius: 16,
                overflow: "hidden",
                background:
                    themeMode === "dark"
                        ? "rgba(36, 33, 29, 0.9)"
                        : "rgba(253, 246, 227, 0.9)",
                boxShadow:
                    themeMode === "dark"
                        ? "0 4px 12px rgba(0,0,0,0.35)"
                        : "0 4px 12px rgba(139, 69, 19, 0.1)",
                transition: "all 0.3s ease",
                height: "100%",
            }}
            >
                <div
                    className="thumb"
                    style={{
                        position: "relative",
                        paddingBottom: "120%", // Tăng chiều cao ảnh
                        overflow: "hidden",
                        background:
                            themeMode === "dark" ? "#1e1c19" : "#f7f7f9",
                        borderRadius: "12px", // Bo cả 4 góc
                    }}
                >
                    <img
                        src={member.img}
                        alt={member.name}
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
                                {member.name}
                            </Text>
                            {member.english_name && (
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 12,
                                        display: "block",
                                        fontStyle: "italic",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {member.english_name}
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
                                {getGen(member)}
                            </Tag>
                            {member.birthday && (
                                <Tag
                                    style={{
                                        background:
                                            themeMode === "dark"
                                                ? "rgba(207,191,166,0.08)"
                                                : "rgba(147, 51, 234, 0.05)",
                                        border:
                                            themeMode === "dark"
                                                ? "1px solid rgba(207,191,166,0.25)"
                                                : "1px solid rgba(147, 51, 234, 0.2)",
                                        borderRadius: 12,
                                    }}
                                >
                                    🎂 {member.birthday}
                                    {age != null ? ` (${age})` : ""}
                                </Tag>
                            )}
                            {member.blood && (
                                <Tag
                                    style={{
                                        background:
                                            themeMode === "dark"
                                                ? "rgba(207,191,166,0.08)"
                                                : "rgba(147, 51, 234, 0.05)",
                                        border:
                                            themeMode === "dark"
                                                ? "1px solid rgba(207,191,166,0.25)"
                                                : "1px solid rgba(147, 51, 234, 0.2)",
                                        borderRadius: 12,
                                    }}
                                >
                                    🩸 {member.blood}
                                </Tag>
                            )}
                            {member.constellation && (
                                <Tag
                                    style={{
                                        background:
                                            themeMode === "dark"
                                                ? "rgba(207,191,166,0.08)"
                                                : "rgba(147, 51, 234, 0.05)",
                                        border:
                                            themeMode === "dark"
                                                ? "1px solid rgba(207,191,166,0.25)"
                                                : "1px solid rgba(147, 51, 234, 0.2)",
                                        borderRadius: 12,
                                    }}
                                >
                                    ⭐ {member.constellation}
                                </Tag>
                            )}
                        </Space>

                        {member.link && (
                            <Button
                                type="link"
                                size="small"
                                icon={<LinkOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(
                                        member.link,
                                        "_blank",
                                        "noopener,noreferrer"
                                    );
                                }}
                                style={{
                                    color:
                                        themeMode === "dark"
                                            ? "#d2a86a"
                                            : "#9333ea",
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
    );
};

export default MemberCard;
