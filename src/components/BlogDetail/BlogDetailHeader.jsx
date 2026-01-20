import { Button, Select, Tooltip, Segmented } from "antd";
import {
    LeftOutlined,
    ShareAltOutlined,
    GlobalOutlined,
    BulbOutlined,
    MoonOutlined,
    LoadingOutlined,
    RightOutlined,
} from "@ant-design/icons";
import { getCachedBlogDetail } from "../../services/blogService";
import { t } from "./constants";

export default function BlogDetailHeader({
    language,
    setLanguage,
    propSetLanguage,
    navIds,
    fastGo,
    pendingNavId,
    navLock,
    onBack,
    onBackToMemberBlogs,
    onShare,
    showFurigana,
    setShowFurigana,
    furiganaLoading,
    kuroshiroInitializing,
    blog,
    themeMode,
    setThemeMode,
    fontSizeKey,
    setFontSizeKey,
    translating,
    onHoverPrefetch,
}) {
    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                alignItems: "center",
                justifyContent: "flex-end",
            }}
        >
            <Button key="back" icon={<LeftOutlined />} onClick={onBack}>
                {t.back[language]}
            </Button>
            <Button key="member-blogs" onClick={onBackToMemberBlogs} type="default">
                {t.backToMemberBlogs[language]}
            </Button>

            {/* PREV (only render when prevId exists) */}
            {navIds.prevId && (
                <Tooltip key="prev" title={t.prevPost[language]}>
                    <Button
                        icon={
                            pendingNavId &&
                                pendingNavId === navIds.prevId &&
                                !getCachedBlogDetail(navIds.prevId) ? (
                                <LoadingOutlined />
                            ) : (
                                <LeftOutlined />
                            )
                        }
                        loading={
                            pendingNavId === navIds.prevId &&
                            !getCachedBlogDetail(navIds.prevId)
                        }
                        onClick={() => fastGo(navIds.prevId)}
                        onMouseEnter={() => onHoverPrefetch(navIds.prevId)}
                        disabled={
                            navLock ||
                            (pendingNavId === navIds.prevId &&
                                !getCachedBlogDetail(navIds.prevId))
                        }
                    />
                </Tooltip>
            )}

            {/* NEXT (render only when nextId exists; kèm spinner nhỏ nếu đang pending & chưa cache) */}
            {navIds.nextId && (
                <Tooltip key="next" title={t.nextPost[language]}>
                    <Button
                        type="primary"
                        icon={
                            pendingNavId &&
                                pendingNavId === navIds.nextId &&
                                !getCachedBlogDetail(navIds.nextId) ? (
                                <LoadingOutlined />
                            ) : (
                                <RightOutlined />
                            )
                        }
                        loading={
                            pendingNavId === navIds.nextId &&
                            !getCachedBlogDetail(navIds.nextId)
                        }
                        onClick={() => fastGo(navIds.nextId)}
                        onMouseEnter={() => onHoverPrefetch(navIds.nextId)}
                        disabled={navLock}
                    />
                </Tooltip>
            )}

            <Select
                key="lang"
                value={language}
                onChange={(value) => {
                    setLanguage(value);
                    if (propSetLanguage) propSetLanguage(value);
                }}
                style={{ width: 150, minWidth: 120 }}
                loading={translating}
                disabled={translating}
                options={[
                    {
                        value: "ja",
                        label: (
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <GlobalOutlined
                                    style={{ color: "#666", fontSize: "14px" }}
                                />
                                日本語
                            </span>
                        ),
                    },
                    {
                        value: "en",
                        label: (
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <GlobalOutlined
                                    style={{ color: "#666", fontSize: "14px" }}
                                />
                                English
                            </span>
                        ),
                    },
                    {
                        value: "vi",
                        label: (
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <GlobalOutlined
                                    style={{ color: "#666", fontSize: "14px" }}
                                />
                                Tiếng Việt
                            </span>
                        ),
                    },
                ]}
            />
            {language === "ja" && (
                <Tooltip
                    key="furigana-toggle"
                    title={showFurigana ? t.furiganaOn[language] : t.furiganaOff[language]}
                >
                    <Button
                        type={showFurigana ? "primary" : "default"}
                        loading={furiganaLoading || kuroshiroInitializing}
                        onClick={() => setShowFurigana(!showFurigana)}
                        disabled={furiganaLoading || kuroshiroInitializing || !blog?.content}
                    >
                        {t.furigana[language]}
                    </Button>
                </Tooltip>
            )}
            {setThemeMode && (
                <Button
                    key="theme"
                    type="text"
                    size="middle"
                    onClick={() =>
                        setThemeMode(themeMode === "dark" ? "light" : "dark")
                    }
                    icon={themeMode === "dark" ? <BulbOutlined /> : <MoonOutlined />}
                    aria-label="Toggle dark mode"
                    title={themeMode === "dark" ? "Light" : "Dark"}
                />
            )}

            <Segmented
                key="seg-size"
                options={[
                    { label: t.fontSizes.sm[language], value: "sm" },
                    { label: t.fontSizes.md[language], value: "md" },
                    { label: t.fontSizes.lg[language], value: "lg" },
                    { label: t.fontSizes.xl[language], value: "xl" },
                    { label: t.fontSizes.xxl[language], value: "xxl" },
                ]}
                value={fontSizeKey}
                onChange={(v) => setFontSizeKey(v)}
            />

            <Button key="share" icon={<ShareAltOutlined />} onClick={onShare}>
                {t.share[language]}
            </Button>
        </div>
    );
}
