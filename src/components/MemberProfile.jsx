import {
  Card,
  Typography,
  Space,
  Tag,
  Avatar,
  Descriptions,
  Badge,
} from "antd";
import {
  CalendarOutlined,
  HeartOutlined,
  StarOutlined,
  TeamOutlined,
  UserOutlined,
  FireOutlined,
  CrownOutlined,
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
  groupcode: "6期生",
};

const MemberProfile = () => {
  return (
    <div className="space-y-4">
      {/* Main Profile Card */}
      <ProCard
        className="overflow-hidden shadow-xl border-0 bg-white/90 backdrop-blur-sm"
        bodyStyle={{ padding: 0 }}
      >
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 p-6 text-center">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <Badge.Ribbon text="選抜" color="gold" className="font-bold">
              <Avatar
                size={90}
                src={memberInfo.img}
                icon={<UserOutlined />}
                className="border-4 border-white shadow-2xl mb-4 ring-4 ring-white/20"
              />
            </Badge.Ribbon>
            <Title
              level={4}
              className="text-white mb-1 font-bold tracking-wide"
            >
              {memberInfo.name}
            </Title>
            <Text className="block text-white/90 text-sm font-medium mb-1">
              {memberInfo.english_name}
            </Text>
            <Text className="block text-white/75 text-xs">
              {memberInfo.kana}
            </Text>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-2 right-2 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-2 left-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Profile Information */}
        <div className="p-4 space-y-3">
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-200">
            <CalendarOutlined className="text-purple-600 text-lg" />
            <Text className="text-sm font-medium text-gray-700">
              {memberInfo.birthday}
            </Text>
          </div>
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-gradient-to-r from-pink-50 to-red-50 hover:from-pink-100 hover:to-red-100 transition-all duration-200">
            <HeartOutlined className="text-pink-600 text-lg" />
            <Text className="text-sm font-medium text-gray-700">
              {memberInfo.blood}
            </Text>
          </div>
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 transition-all duration-200">
            <StarOutlined className="text-orange-600 text-lg" />
            <Text className="text-sm font-medium text-gray-700">
              {memberInfo.constellation}
            </Text>
          </div>
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
            <TeamOutlined className="text-blue-600 text-lg" />
            <Text className="text-sm font-medium text-gray-700">
              {memberInfo.groupcode}
            </Text>
          </div>
        </div>

        {/* Status Tags */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-2 justify-center">
            {memberInfo.pick && (
              <Tag
                icon={<CrownOutlined />}
                color="purple"
                className="rounded-full px-3 py-1 text-xs font-medium border-0 shadow-sm"
              >
                {memberInfo.pick}
              </Tag>
            )}
            {memberInfo.god && (
              <Tag
                icon={<FireOutlined />}
                color="gold"
                className="rounded-full px-3 py-1 text-xs font-medium border-0 shadow-sm"
              >
                {memberInfo.god}
              </Tag>
            )}
            {memberInfo.under && (
              <Tag
                color="blue"
                className="rounded-full px-3 py-1 text-xs font-medium border-0 shadow-sm"
              >
                {memberInfo.under}
              </Tag>
            )}
          </div>
        </div>
      </ProCard>

      {/* Quick Stats Card */}
      <ProCard
        title={
          <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ブログ統計
          </span>
        }
        size="small"
        className="bg-white/90 backdrop-blur-sm border-0 shadow-lg"
        bodyStyle={{ padding: "12px" }}
      >
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-lg font-bold text-purple-600">45</div>
            <div className="text-xs text-gray-600">記事数</div>
          </div>
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100">
            <div className="text-lg font-bold text-pink-600">1.2K</div>
            <div className="text-xs text-gray-600">いいね</div>
          </div>
        </div>
      </ProCard>
    </div>
  );
};

export default MemberProfile;
