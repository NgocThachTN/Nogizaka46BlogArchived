// MemberProfile.jsx — React JS + Ant Design Pro
import {
  Typography,
  Avatar,
  Tag,
  Descriptions,
  Card,
  Space,
  Button,
} from "antd";
import {
  CalendarOutlined,
  TeamOutlined,
  StarOutlined,
  GlobalOutlined,
  HeartOutlined,
  CrownOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";

const { Text, Title } = Typography;

const jpFont = {
  fontFamily:
    "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

// Translation keys for profile labels
const profileLabels = {
  birthday: { ja: "誕生日", en: "Birthday", vi: "Ngày sinh" },
  bloodType: { ja: "血液型", en: "Blood Type", vi: "Nhóm máu" },
  constellation: { ja: "星座", en: "Zodiac", vi: "Cung hoàng đạo" },
  generation: { ja: "期別", en: "Generation", vi: "Thế hệ" },
  officialProfile: { ja: "公式プロフィール", en: "Official Profile", vi: "Trang chính thức" },
};

// Helper function to translate blood type
const translateBloodType = (bloodType, lang) => {
  if (!bloodType) return bloodType;
  if (lang === "ja") return bloodType;

  // Translate "不明" (unknown)
  if (bloodType === "不明") {
    if (lang === "en") return "Unknown";
    if (lang === "vi") return "Không xác định";
  }

  // Remove "型" for non-Japanese languages
  return bloodType.replace(/型/g, "");
};

// Helper function to translate constellation
const translateConstellation = (constellation, lang) => {
  if (!constellation) return constellation;

  const constellations = {
    "おひつじ座": { en: "Aries", vi: "Bạch Dương" },
    "おうし座": { en: "Taurus", vi: "Kim Ngưu" },
    "ふたご座": { en: "Gemini", vi: "Song Tử" },
    "かに座": { en: "Cancer", vi: "Cự Giải" },
    "しし座": { en: "Leo", vi: "Sư Tử" },
    "おとめ座": { en: "Virgo", vi: "Xử Nữ" },
    "てんびん座": { en: "Libra", vi: "Thiên Bình" },
    "さそり座": { en: "Scorpio", vi: "Bọ Cạp" },
    "いて座": { en: "Sagittarius", vi: "Nhân Mã" },
    "やぎ座": { en: "Capricorn", vi: "Ma Kết" },
    "みずがめ座": { en: "Aquarius", vi: "Bảo Bình" },
    "うお座": { en: "Pisces", vi: "Song Ngư" },
  };

  if (lang === "ja") return constellation;
  return constellations[constellation]?.[lang] || constellation;
};

// Helper function to translate generation
const translateGeneration = (generation, lang) => {
  if (!generation) return generation;
  if (lang === "ja") return generation;

  // Extract number from Japanese generation format (e.g., "6期生" -> "6")
  const match = generation.match(/(\d+)期生/);
  if (match) {
    const genNumber = match[1];
    if (lang === "en") {
      // Handle ordinal numbers correctly (1st, 2nd, 3rd, 4th, etc.)
      const ordinal = genNumber === "1" ? "st" :
        genNumber === "2" ? "nd" :
          genNumber === "3" ? "rd" : "th";
      return `${genNumber}${ordinal} Gen`;
    }
    if (lang === "vi") return `Thế hệ ${genNumber}`;
  }

  return generation;
};

// Helper function to translate birthday format
const translateBirthday = (birthday, lang) => {
  if (!birthday) return birthday;
  if (lang === "ja") return birthday;

  // Parse Japanese date format: 1998年8月10日
  const jpMatch = birthday.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (jpMatch) {
    const [_, year, month, day] = jpMatch;
    if (lang === "en") {
      // English format: August 10, 1998
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
    }
    if (lang === "vi") {
      // Vietnamese format: 10/08/1998
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }

  // Parse slash format: 1998/8/10
  const slashMatch = birthday.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const [_, year, month, day] = slashMatch;
    if (lang === "en") {
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
    }
    if (lang === "vi") {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }

  return birthday;
};

// Helper function to format English name (first last -> last first)
const formatEnglishName = (englishName) => {
  if (!englishName) return englishName;

  // Check if name is already capitalized (from local DB) - don't process
  // e.g., "Saito Asuka" should stay as is
  const parts = englishName.trim().split(/\s+/);
  if (parts.length === 2) {
    // Check if first character of first word is uppercase (indicates already formatted)
    const firstChar = parts[0].charAt(0);
    if (firstChar === firstChar.toUpperCase()) {
      // Already formatted (e.g., "Saito Asuka"), return as is
      return englishName;
    }
    // Lowercase from API (e.g., "asuka saito"), reverse order
    return `${parts[1]} ${parts[0]}`;
  }

  return englishName;
};

const MemberProfile = ({ memberInfo, className, themeMode = "light", language = "ja" }) => {
  if (!memberInfo) return null;

  const isDark = themeMode === "dark";
  const bg = isDark ? "#24211d" : "#ffffff";
  const color = isDark ? "#f5ede0" : "#2d1b0e";
  const secondaryColor = isDark ? "#d2a86a" : "#8b4513";
  const borderColor = isDark ? "rgba(207,191,166,0.2)" : "rgba(0,0,0,0.05)";

  return (
    <div className={className} style={{ position: 'relative' }}>
      {/* Tape effect */}
      <div style={{
        position: 'absolute',
        top: -12,
        left: '50%',
        width: 100,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.3)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10,
        transform: 'translateX(-50%) rotate(2deg)',
        backdropFilter: 'blur(2px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }} />

      <div
        style={{
          background: bg,
          padding: "16px",
          paddingBottom: "24px",
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 4px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)",
          borderRadius: 4,
          border: `1px solid ${borderColor}`,
          ...jpFont,
        }}
      >
        {/* Avatar + Name */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            padding: 8,
            background: isDark ? "rgba(255,255,255,0.05)" : "#f8f8f8",
            border: `1px solid ${borderColor}`,
            display: "inline-block",
            borderRadius: 4,
            marginBottom: 12
          }}>
            <Avatar
              size={140}
              src={memberInfo.img}
              shape="square"
              style={{
                borderRadius: 2,
                display: "block",
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: color,
                fontFamily: isDark ? "serif" : "'Yomogi', cursive",
                lineHeight: 1.3
              }}
            >
              {memberInfo.name}
            </div>
            <div
              style={{
                fontSize: 13,
                marginTop: 4,
                color: isDark ? "#999" : "#888",
                letterSpacing: 1
              }}
            >
              {memberInfo.kana}
            </div>
            <div
              style={{
                fontSize: 14,
                marginTop: 2,
                color: secondaryColor,
                textTransform: "capitalize",
                fontFamily: "'Playfair Display', serif"
              }}
            >
              {formatEnglishName(memberInfo.english_name)}
            </div>
          </div>

          <Space style={{ marginTop: 12 }} wrap>
            {/* Tags removed for cleaner look, can be re-enabled if needed */}
          </Space>
        </div>

        {/* Info list - Simplified for card look */}
        <div style={{
          borderTop: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "#eee"}`,
          paddingTop: 16
        }}>
          {[
            { label: profileLabels.birthday[language], value: translateBirthday(memberInfo.birthday, language), icon: <CalendarOutlined /> },
            { label: profileLabels.bloodType[language], value: translateBloodType(memberInfo.blood, language), icon: <HeartOutlined /> },
            { label: profileLabels.constellation[language], value: translateConstellation(memberInfo.constellation, language), icon: <StarOutlined /> },
            { label: profileLabels.generation[language], value: translateGeneration(memberInfo.cate || memberInfo.groupcode, language), icon: <TeamOutlined /> }
          ].map((item, idx) => (
            <div key={idx} style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              fontSize: 13,
              color: isDark ? "#ccc" : "#555"
            }}>
              <span style={{ color: isDark ? "#888" : "#999", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: secondaryColor }}>{item.icon}</span>
                {item.label}
              </span>
              <span style={{ fontWeight: 500, color: color }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Official link */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<GlobalOutlined />}
            href={memberInfo.link}
            target="_blank"
            style={{
              width: "100%",
              borderColor: secondaryColor,
              color: secondaryColor,
              fontFamily: "'Playfair Display', serif"
            }}
          >
            {profileLabels.officialProfile[language]}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
