import React from "react";
import { Space, Typography, Tag, Button } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import { prefetchMemberInfo } from "../../../services/memberService";

const { Text } = Typography;

// Translation keys
const t = {
    officialSite: {
        ja: "公式サイト",
        en: "Official Site",
        vi: "Trang chính thức",
    },
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
// Component MemberCard      
const MemberCard = ({ member, language, themeMode, onClick, bookFont }) => {
    // Ensure language is valid, fallback to "ja"
    const currentLanguage = ["ja", "en", "vi"].includes(language)
        ? language
        : "ja";

    const age = getAge(member.birthday);

    const fontStyle = {
        fontFamily: bookFont?.[currentLanguage]?.fontFamily,
    };

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
                borderRadius: 2, // Polaroid corners are usually sharp or slightly rounded
                overflow: "hidden",
                // Dark mode: Dark card. Light mode: White card.
                background: themeMode === "dark" ? "#2a2520" : "#ffffff",
                boxShadow:
                    themeMode === "dark"
                        ? "0 4px 12px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)"
                        : "0 4px 12px rgba(139, 69, 19, 0.15), 0 1px 2px rgba(139, 69, 19, 0.1)",
                transition: "all 0.3s ease",
                height: "100%",
                border: themeMode === "dark"
                    ? "1px solid rgba(139, 115, 85, 0.2)"
                    : "1px solid rgba(139, 69, 19, 0.1)",
                padding: "10px 10px 16px 10px", // Internal padding like a photo frame
            }}
            bodyStyle={{ padding: 0 }}
        >
            <div
                className="thumb"
                style={{
                    position: "relative",
                    paddingBottom: "120%", // Tăng chiều cao ảnh
                    overflow: "hidden",
                    background:
                        themeMode === "dark" ? "#1e1c19" : "#f7f7f9",
                    borderRadius: "2px",
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
                        transition: "transform 0.5s ease",
                    }}
                    onError={(e) => {
                        e.currentTarget.src =
                            "https://via.placeholder.com/300x300?text=No+Image";
                    }}
                />
                <div className="member-overlay"></div>
            </div>

            <div style={{ marginTop: 12, padding: "0 4px" }}>
                <Space
                    direction="vertical"
                    size={6}
                    style={{ width: "100%" }}
                >
                    <div style={{ textAlign: "center" }}>
                        <Text
                            strong
                            style={{
                                ...fontStyle,
                                fontSize: 18,
                                display: "block",
                                marginBottom: 2,
                                color: themeMode === "dark" ? "#d2a86a" : "#5d4e37",
                                lineHeight: 1.3
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
                                    fontFamily: "'Cormorant Garamond', serif", // Or keep it simple
                                    color: themeMode === "dark" ? "#8c7b64" : "#9ca3af"
                                }}
                            >
                                {member.english_name}
                            </Text>
                        )}
                    </div>

                    <Space size={4} wrap style={{ marginTop: 4, justifyContent: "center" }}>
                        <Tag
                            color="purple" // Keep purple for consistency but maybe soften it?
                            style={{
                                borderRadius: 4,
                                fontFamily: bookFont?.[currentLanguage]?.fontFamily,
                                background: themeMode === "dark" ? "rgba(147, 51, 234, 0.2)" : "rgba(147, 51, 234, 0.1)",
                                border: "none",
                                color: themeMode === "dark" ? "#d8b4fe" : "#7e22ce"
                            }}
                        >
                            {getGen(member)}
                        </Tag>
                        {member.birthday && (
                            <Tag
                                style={{
                                    background:
                                        themeMode === "dark"
                                            ? "rgba(207,191,166,0.1)"
                                            : "rgba(120, 113, 108, 0.1)",
                                    border: "none",
                                    borderRadius: 4,
                                    color: themeMode === "dark" ? "#cfbfa6" : "#57534e",
                                    fontFamily: bookFont?.[currentLanguage]?.fontFamily,
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
                                            ? "rgba(207,191,166,0.1)"
                                            : "rgba(120, 113, 108, 0.1)",
                                    border: "none",
                                    borderRadius: 4,
                                    color: themeMode === "dark" ? "#cfbfa6" : "#57534e",
                                    fontFamily: bookFont?.[currentLanguage]?.fontFamily,
                                }}
                            >
                                🩸 {member.blood}
                            </Tag>
                        )}
                    </Space>

                    {member.link && (
                        <div style={{ textAlign: "center" }}>
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
                                            ? "#a8a29e"
                                            : "#78716c",
                                    fontSize: 12,
                                    padding: 0,
                                    height: "auto",
                                    marginTop: 0,
                                    transition: "all 0.2s ease",
                                    fontFamily: bookFont?.[currentLanguage]?.fontFamily,
                                }}
                                className="official-button"
                            >
                                {t.officialSite[currentLanguage]}
                            </Button>
                        </div>
                    )}
                </Space>
            </div>
        </ProCard>
    );
};

export default MemberCard;
