import { Typography, Avatar, Tag } from "antd";
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
  english_name: "miku ichinose",
  kana: "いちのせ みく",
  cate: "5期生",
  img: "https://www.nogizaka46.com/images/46/d21/1d87f2203680137df7346b7551ed0.jpg",
  link: "https://www.nogizaka46.com/s/n46/artist/55390",
  pick: "選抜メンバー",
  god: "福神",
  under: "",
  birthday: "2003/05/24",
  blood: "B型",
  constellation: "ふたご座",
  graduation: "NO",
  groupcode: "5期生",
};

const MemberProfile = () => {
  return (
    <ProCard className="overflow-hidden bg-white shadow-sm">
      {/* Profile Header - Minimal Japanese Style */}
      <div className="relative">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 opacity-50" />

        {/* Main Content */}
        <div className="relative pt-8 pb-6 text-center">
          {/* Avatar with subtle border */}
          <div className="inline-block p-1 bg-white rounded-full">
            <Avatar
              size={120}
              src={memberInfo.img}
              className="rounded-full border-2 border-gray-100"
            />
          </div>

          {/* Name Section with Japanese Typography */}
          <div className="mt-5 space-y-1">
            <Title level={3} className="!mb-0 !text-gray-800 tracking-wide">
              {memberInfo.name}
            </Title>
            <Text className="block text-base text-gray-500 tracking-wider capitalize">
              {memberInfo.english_name}
            </Text>
            <Text className="block text-sm text-gray-400 tracking-widest">
              {memberInfo.kana}
            </Text>
          </div>

          {/* Status Tags with Japanese Aesthetic */}
          <div className="flex gap-3 justify-center mt-4">
            {memberInfo.pick && (
              <Tag
                icon={<CrownOutlined />}
                className="rounded-full px-4 py-1 border-0 bg-amber-50 text-amber-700"
              >
                {memberInfo.pick}
              </Tag>
            )}
            {memberInfo.god && (
              <Tag
                icon={<FireOutlined />}
                className="rounded-full px-4 py-1 border-0 bg-purple-50 text-purple-700"
              >
                {memberInfo.god}
              </Tag>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details - Japanese Minimal Style */}
      <div className="px-6 py-4 bg-gray-50/50">
        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-3">
          {/* Birthday */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-50">
                <CalendarOutlined className="text-purple-500" />
              </div>
              <Text className="text-gray-500">誕生日</Text>
            </div>
            <Text className="font-medium text-gray-700">
              {memberInfo.birthday}
            </Text>
          </div>

          {/* Blood Type */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-pink-50">
                <HeartOutlined className="text-pink-500" />
              </div>
              <Text className="text-gray-500">血液型</Text>
            </div>
            <Text className="font-medium text-gray-700">
              {memberInfo.blood}
            </Text>
          </div>

          {/* Constellation */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50">
                <StarOutlined className="text-amber-500" />
              </div>
              <Text className="text-gray-500">星座</Text>
            </div>
            <Text className="font-medium text-gray-700">
              {memberInfo.constellation}
            </Text>
          </div>

          {/* Generation */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50">
                <TeamOutlined className="text-blue-500" />
              </div>
              <Text className="text-gray-500">期別</Text>
            </div>
            <Text className="font-medium text-gray-700">
              {memberInfo.groupcode}
            </Text>
          </div>

          {/* Official Profile Link */}
          <a
            href={memberInfo.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50">
                <GlobalOutlined className="text-gray-500" />
              </div>
              <Text className="text-gray-500">公式プロフィール</Text>
            </div>
            <Text className="text-gray-400">→</Text>
          </a>
        </div>
      </div>
    </ProCard>
  );
};

export default MemberProfile;
