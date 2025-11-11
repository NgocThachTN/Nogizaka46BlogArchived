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
            padding: "20px 14px 14px",
            textAlign: "center",
            background:
              themeMode === "dark"
                ? "linear-gradient(135deg, rgba(28,26,23,0.95) 0%, rgba(36,33,29,0.95) 100%)"
                : "linear-gradient(135deg, rgba(253, 246, 227, 0.9) 0%, rgba(244, 241, 232, 0.9) 100%)",
          }}
        >
          <Avatar
            size={110}
            src={memberInfo.img}
            style={{
              border:
                themeMode === "dark"
                  ? "3px solid rgba(207,191,166,0.3)"
                  : "3px solid #fff",
              boxShadow:
                themeMode === "dark"
                  ? "0 4px 16px rgba(0,0,0,0.4)"
                  : "0 4px 16px rgba(0,0,0,0.08)",
            }}
          />
          <div style={{ marginTop: 10 }}>
            <Title
              level={5}
              style={{
                marginBottom: 3,
                fontSize: 16,
                color: themeMode === "dark" ? "#f5ede0" : undefined,
              }}
            >
              {memberInfo.name}
            </Title>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                display: "block",
                color: themeMode === "dark" ? "#cfbfa6" : undefined,
              }}
            >
              {memberInfo.kana}
            </Text>
            <Text
              type="secondary"
              style={{
                fontSize: 13,
                display: "block",
                marginTop: 2,
                color: themeMode === "dark" ? "#cfbfa6" : undefined,
                textTransform: "capitalize",
              }}
            >
              {memberInfo.english_name}
            </Text>
          </div>
          <Space style={{ marginTop: 10 }} wrap>
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
            width: 80,
            fontSize: 12,
            color: themeMode === "dark" ? "#cfbfa6" : "#555",
            background:
              themeMode === "dark"
                ? "rgba(36,33,29,0.6)"
                : "rgba(253,246,227,0.5)",
          }}
          contentStyle={{
            textAlign: "right",
            fontSize: 12,
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
                marginRight: 5,
                fontSize: 11,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {memberInfo.birthday}
          </Descriptions.Item>
          <Descriptions.Item label={profileLabels.bloodType[language]}>
            <HeartOutlined
              style={{
                marginRight: 5,
                fontSize: 11,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {memberInfo.blood}
          </Descriptions.Item>
          <Descriptions.Item label={profileLabels.constellation[language]}>
            <StarOutlined
              style={{
                marginRight: 5,
                fontSize: 11,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {memberInfo.constellation}
          </Descriptions.Item>
          <Descriptions.Item label={profileLabels.generation[language]}>
            <TeamOutlined
              style={{
                marginRight: 5,
                fontSize: 11,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {memberInfo.groupcode}
          </Descriptions.Item>
        </Descriptions>

        {/* Official link */}
        <div
          style={{
            padding: 12,
            textAlign: "center",
            background:
              themeMode === "dark"
                ? "rgba(28,26,23,0.5)"
                : "rgba(253,246,227,0.3)",
          }}
        >
          <Button
            type="link"
            size="small"
            icon={
              <GlobalOutlined
                style={{
                  color: themeMode === "dark" ? "#d2a86a" : undefined,
                  fontSize: 12,
                }}
              />
            }
            href={memberInfo.link}
            target="_blank"
            style={{
              color: themeMode === "dark" ? "#d2a86a" : undefined,
              fontSize: 12,
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
