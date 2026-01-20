import { ProCard } from "@ant-design/pro-components";
import { Spin, Progress, Space } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

export default function TranslationOverlay({ translating, translationProgress, themeMode }) {
    if (!translating) return null;

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                background:
                    themeMode === "dark"
                        ? "rgba(28,26,23,0.9)"
                        : "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                borderRadius: 16,
                backdropFilter: "blur(3px)",
            }}
        >
            <ProCard
                style={{
                    textAlign: "center",
                    borderRadius: 16,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                    border: "1px solid rgba(109, 40, 217, 0.15)",
                    background:
                        "linear-gradient(135deg, #ffffff 0%, #faf7ff 100%)",
                    maxWidth: 320,
                    width: "90%",
                }}
                bodyStyle={{ padding: "32px 24px" }}
            >
                <Space direction="vertical" align="center" size={20}>
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Spin
                            size="large"
                            indicator={
                                <LoadingOutlined
                                    style={{ fontSize: 28, color: "#6d28d9" }}
                                    spin
                                />
                            }
                        />
                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: 16,
                                color: "#6d28d9",
                                fontWeight: 600,
                            }}
                        >
                            {translationProgress}%
                        </div>
                    </div>

                    <div>
                        <Progress
                            percent={translationProgress}
                            strokeColor={{
                                "0%": "#6d28d9",
                                "50%": "#8b5cf6",
                                "100%": "#a855f7",
                            }}
                            trailColor="#f3f4f6"
                            size="small"
                            style={{
                                width: 240,
                                marginBottom: 12,
                            }}
                            showInfo={false}
                        />
                    </div>
                </Space>
            </ProCard>
        </div>
    );
}
