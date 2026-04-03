import { Card, Space, Button } from "antd";
import { jpFont, t } from "./constants";

export default function TableOfContents({ toc, language, themeMode }) {
    if (!toc || toc.length === 0) return null;

    return (
        <Card
            title={
                <span style={{ fontSize: 17 }}>{t.toc[language]}</span>
            }
            style={{
                borderRadius: 4,
                background:
                    themeMode === "dark"
                        ? "rgba(36, 33, 29, 0.85)"
                        : "rgba(253, 246, 227, 0.8)",
                border:
                    themeMode === "dark"
                        ? "1px solid rgba(207,191,166,0.25)"
                        : "1px solid rgba(139, 69, 19, 0.2)",
                boxShadow:
                    themeMode === "dark"
                        ? "0 2px 8px rgba(0,0,0,0.35)"
                        : "0 2px 8px rgba(139, 69, 19, 0.1)",
            }}
            bodyStyle={{ padding: 14 }}
        >
            <Space direction="vertical" style={{ width: "100%" }} size={5}>
                {toc.map((h) => (
                    <Button
                        key={h.id}
                        type="text"
                        size="small"
                        style={{
                            justifyContent: "flex-start",
                            paddingLeft:
                                h.level === "H1" ? 0 : h.level === "H2" ? 7 : 14,
                            fontSize: 16,
                            height: "auto",
                            padding: "7px 12px",
                            ...jpFont,
                        }}
                        onClick={() => {
                            const el = document.getElementById(h.id);
                            if (el)
                                el.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                });
                        }}
                    >
                        {h.text}
                    </Button>
                ))}
            </Space>
        </Card>
    );
}
