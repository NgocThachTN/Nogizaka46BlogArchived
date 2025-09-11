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

const memberInfo = {
  code: "55390",
  name: "一ノ瀬 美空",
  english_name: "Miku Ichinose",
  kana: "いちのせ みく",
  cate: "5期生",
  img: "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg",
  link: "https://www.nogizaka46.com/s/n46/artist/55390",
  pick: "選抜メンバー",
  god: "福神",
  birthday: "2003/05/24",
  blood: "B型",
  constellation: "ふたご座",
  groupcode: "5期生",
};

const MemberProfile = () => {
  return (
    <ProCard ghost colSpan={{ xs: 24, md: 8, xl: 6 }}>
      <Card
        style={{ borderRadius: 16, overflow: "hidden" }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Avatar + Name */}
        <div
          style={{
            padding: "24px 16px 16px",
            textAlign: "center",
            background: "linear-gradient(135deg,#faf5ff,#fdf2f8)",
          }}
        >
          <Avatar
            size={120}
            src={memberInfo.img}
            style={{
              border: "4px solid #fff",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
          />
          <div style={{ marginTop: 16 }}>
            <Title level={4} style={{ marginBottom: 4 }}>
              {memberInfo.name}
            </Title>
            <Text type="secondary" style={{ fontSize: 14, display: "block" }}>
              {memberInfo.english_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {memberInfo.kana}
            </Text>
          </div>
          <Space style={{ marginTop: 12 }} wrap>
            {memberInfo.pick && (
              <Tag
                icon={<CrownOutlined />}
                color="gold"
                style={{ borderRadius: 16, padding: "2px 12px" }}
              >
                {memberInfo.pick}
              </Tag>
            )}
            {memberInfo.god && (
              <Tag
                icon={<FireOutlined />}
                color="purple"
                style={{ borderRadius: 16, padding: "2px 12px" }}
              >
                {memberInfo.god}
              </Tag>
            )}
          </Space>
        </div>

        {/* Info list */}
        <Descriptions
          column={1}
          bordered
          size="small"
          style={{ borderRadius: 0 }}
          labelStyle={{ width: 90, color: "#555" }}
          contentStyle={{ textAlign: "right" }}
        >
          <Descriptions.Item label="誕生日">
            <CalendarOutlined style={{ marginRight: 6 }} />
            {memberInfo.birthday}
          </Descriptions.Item>
          <Descriptions.Item label="血液型">
            <HeartOutlined style={{ marginRight: 6 }} />
            {memberInfo.blood}
          </Descriptions.Item>
          <Descriptions.Item label="星座">
            <StarOutlined style={{ marginRight: 6 }} />
            {memberInfo.constellation}
          </Descriptions.Item>
          <Descriptions.Item label="期別">
            <TeamOutlined style={{ marginRight: 6 }} />
            {memberInfo.groupcode}
          </Descriptions.Item>
        </Descriptions>

        {/* Official link */}
        <div style={{ padding: 16, textAlign: "center" }}>
          <Button
            type="link"
            icon={<GlobalOutlined />}
            href={memberInfo.link}
            target="_blank"
          >
            公式プロフィール
          </Button>
        </div>
      </Card>
    </ProCard>
  );
};

export default MemberProfile;
