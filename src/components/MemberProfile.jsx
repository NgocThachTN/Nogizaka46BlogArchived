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

const MemberProfile = ({ memberInfo, className, themeMode = "light" }) => {
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
            padding: "24px 16px 16px",
            textAlign: "center",
            background:
              themeMode === "dark"
                ? "linear-gradient(135deg, rgba(28,26,23,0.95) 0%, rgba(36,33,29,0.95) 100%)"
                : "linear-gradient(135deg, rgba(253, 246, 227, 0.9) 0%, rgba(244, 241, 232, 0.9) 100%)",
          }}
        >
          <Avatar
            size={120}
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
          <div style={{ marginTop: 16 }}>
            <Title
              level={4}
              style={{
                marginBottom: -1,
                color: themeMode === "dark" ? "#f5ede0" : undefined,
              }}
            >
              {memberInfo.name}
            </Title>
            <Text
              type="secondary"
              style={{
                fontSize: 13,
                color: themeMode === "dark" ? "#cfbfa6" : undefined,
              }}
            >
              {memberInfo.kana}
            </Text>
                <Text
              type="secondary"
              style={{
                fontSize: 15,
                display: "block",
                color: themeMode === "dark" ? "#cfbfa6" : undefined,
                textTransform: "capitalize",
              }}
            >
              {memberInfo.english_name}
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
            width: 90,
            color: themeMode === "dark" ? "#cfbfa6" : "#555",
            background:
              themeMode === "dark"
                ? "rgba(36,33,29,0.6)"
                : "rgba(253,246,227,0.5)",
          }}
          contentStyle={{
            textAlign: "right",
            color: themeMode === "dark" ? "#f5ede0" : undefined,
            background:
              themeMode === "dark"
                ? "rgba(28,26,23,0.4)"
                : "rgba(244,241,232,0.3)",
          }}
        >
          <Descriptions.Item label="誕生日">
            <CalendarOutlined
              style={{
                marginRight: 6,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {memberInfo.birthday}
          </Descriptions.Item>
          <Descriptions.Item label="血液型">
            <HeartOutlined
              style={{
                marginRight: 6,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {memberInfo.blood}
          </Descriptions.Item>
          <Descriptions.Item label="星座">
            <StarOutlined
              style={{
                marginRight: 6,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {memberInfo.constellation}
          </Descriptions.Item>
          <Descriptions.Item label="期別">
            <TeamOutlined
              style={{
                marginRight: 6,
                color: themeMode === "dark" ? "#d2a86a" : undefined,
              }}
            />
            {memberInfo.groupcode}
          </Descriptions.Item>
        </Descriptions>

        {/* Official link */}
        <div
          style={{
            padding: 16,
            textAlign: "center",
            background:
              themeMode === "dark"
                ? "rgba(28,26,23,0.5)"
                : "rgba(253,246,227,0.3)",
          }}
        >
          <Button
            type="link"
            icon={
              <GlobalOutlined
                style={{ color: themeMode === "dark" ? "#d2a86a" : undefined }}
              />
            }
            href={memberInfo.link}
            target="_blank"
            style={{
              color: themeMode === "dark" ? "#d2a86a" : undefined,
            }}
          >
            公式プロフィール
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MemberProfile;
