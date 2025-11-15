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
  return (
    <div className={className}>
      <Card
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background:
            themeMode === "dark"
              ? "rgba(36, 33, 29, 0.85)"
              : "rgba(253, 246, 227, 0.8)",
          border:
            themeMode === "dark"
              ? "1px solid rgba(207,191,166,0.2)"
              : "1px solid rgba(139, 69, 19, 0.1)",
          boxShadow:
            themeMode === "dark"
              ? "0 4px 16px rgba(0,0,0,0.3)"
              : "0 4px 16px rgba(0,0,0,0.08)",
          ...jpFont,
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Avatar + Name */}
        <div
          style={{
            padding: "24px 17px 17px",
            textAlign: "center",
            background:
              themeMode === "dark"
                ? "linear-gradient(135deg, rgba(28,26,23,0.95) 0%, rgba(36,33,29,0.95) 100%)"
                : "linear-gradient(135deg, rgba(253, 246, 227, 0.9) 0%, rgba(244, 241, 232, 0.9) 100%)",
          }}
        >
          <Avatar
            size={132}
            src={memberInfo.img}
            style={{
              border:
                themeMode === "dark"
                  ? "4px solid rgba(207,191,166,0.3)"
                  : "4px solid #fff",
              boxShadow:
                themeMode === "dark"
                  ? "0 4px 16px rgba(0,0,0,0.4)"
                  : "0 4px 16px rgba(0,0,0,0.08)",
            }}
          />
          <div style={{ marginTop: 12 }}>
            <Title
              level={5}
              style={{
                marginBottom: 4,
                fontSize: 19,
                color: themeMode === "dark" ? "#f5ede0" : undefined,
              }}
            >
              {memberInfo.name}
            </Title>
            <Text
              type="secondary"
              style={{
                fontSize: 14,
                display: "block",
                color: themeMode === "dark" ? "#cfbfa6" : undefined,
              }}
            >
              {memberInfo.kana}
            </Text>
            <Text
              type="secondary"
              style={{
                fontSize: 16,
                display: "block",
                marginTop: 2,
                color: themeMode === "dark" ? "#cfbfa6" : undefined,
                textTransform: "capitalize",
              }}
            >
              {formatEnglishName(memberInfo.english_name)}
            </Text>
          </div>
          <Space style={{ marginTop: 12 }} wrap>
            {/* {memberInfo.pick && (
              <Tag
                icon={<CrownOutlined />}
                color="gold"
                style={{ borderRadius: 16, padding: "2px 12px" }}
              >
                {memberInfo.pick}
              </Tag>
            )} */}
            {/* {memberInfo.god && (
              <Tag
                icon={<FireOutlined />}
                color="purple"
                style={{ borderRadius: 16, padding: "2px 12px" }}
              >
                {memberInfo.god}
              </Tag>
            )} */}
          </Space>
        </div>

        {/* Info list */}
        <Descriptions
          column={1}
          bordered
          size="small"
          style={{
            borderRadius: 0,
            background:
              themeMode === "dark"
                ? "rgba(28,26,23,0.5)"
                : "rgba(253,246,227,0.5)",
          }}
          labelStyle={{
            width: 110,
            fontSize: 14,
            color: themeMode === "dark" ? "#cfbfa6" : "#555",
            background:
              themeMode === "dark"
                ? "rgba(36,33,29,0.6)"
                : "rgba(253,246,227,0.5)",
          }}
          contentStyle={{
            textAlign: "right",
            fontSize: 14,
            color: themeMode === "dark" ? "#f5ede0" : undefined,
            background:
              themeMode === "dark"
                ? "rgba(28,26,23,0.4)"
                : "rgba(244,241,232,0.3)",
          }}
        >
          <Descriptions.Item label={profileLabels.birthday[language]}>
            <CalendarOutlined
              style={{
                marginRight: 6,
                fontSize: 13,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {translateBirthday(memberInfo.birthday, language)}
          </Descriptions.Item>
          <Descriptions.Item label={profileLabels.bloodType[language]}>
            <HeartOutlined
              style={{
                marginRight: 6,
                fontSize: 13,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {translateBloodType(memberInfo.blood, language)}
          </Descriptions.Item>
          <Descriptions.Item label={profileLabels.constellation[language]}>
            <StarOutlined
              style={{
                marginRight: 6,
                fontSize: 13,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {translateConstellation(memberInfo.constellation, language)}
          </Descriptions.Item>
          <Descriptions.Item label={profileLabels.generation[language]}>
            <TeamOutlined
              style={{
                marginRight: 6,
                fontSize: 13,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            <span style={{ fontSize: 14, display: "inline-block", verticalAlign: "middle" }}>
              {translateGeneration(memberInfo.cate || memberInfo.groupcode, language)}
            </span>
          </Descriptions.Item>
        </Descriptions>

        {/* Official link */}
        <div
          style={{
            padding: 14,
            textAlign: "center",
            background:
              themeMode === "dark"
                ? "rgba(28,26,23,0.5)"
                : "rgba(253,246,227,0.3)",
          }}
        >
          <Button
            type="link"
            size="middle"
            icon={
              <GlobalOutlined
                style={{
                  color: themeMode === "dark" ? "#d2a86a" : undefined,
                  fontSize: 14,
                }}
              />
            }
            href={memberInfo.link}
            target="_blank"
            style={{
              color: themeMode === "dark" ? "#d2a86a" : undefined,
              fontSize: 14,
            }}
          >
            {profileLabels.officialProfile[language]}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MemberProfile;
