// Constants and configuration for BlogDetail component

export const jpFont = {
    fontFamily:
        "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial",
};

// Diary-style handwriting fonts for journal-like reading experience
// IMPORTANT: Yomogi must be first priority for Japanese handwriting style
// Patrick Hand SC provides CJK support as fallback
export const bookFont = {
    ja: {
        fontFamily:
            "'Yomogi', 'Patrick Hand SC', 'Zen Kurenaido', 'Noto Serif JP', 'Source Han Serif JP', '游明朝', 'Yu Mincho', serif",
        fontWeight: 400,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
        fontDisplay: "swap",
        fontFeatureSettings: "'palt' 1",
    },
    en: {
        fontFamily:
            "'Mali', 'Caveat', 'Yomogi', 'Georgia', serif",
        fontWeight: 500,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        fontDisplay: "swap",
    },
    vi: {
        fontFamily:
            "'Mali', 'Patrick Hand SC', 'Caveat', 'Times New Roman', 'Georgia', serif",
        fontWeight: 500,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        fontDisplay: "swap",
    },
};

// Diary paper line height in pixels - text will align to these lines
export const DIARY_LINE_HEIGHT = 32;

// size preset — big for JP reading (increased ~20% to replace zoom:1.2)
export const SIZE_PRESETS = {
    sm: { px: 24, lh: 1.9, h1: 2.0, h2: 1.7, h3: 1.45 },
    md: { px: 26, lh: 2.1, h1: 2.2, h2: 1.85, h3: 1.6 },
    lg: { px: 30, lh: 2.2, h1: 2.4, h2: 2.0, h3: 1.75 },
    xl: { px: 34, lh: 2.3, h1: 2.6, h2: 2.15, h3: 1.85 },
    xxl: { px: 38, lh: 2.4, h1: 2.8, h2: 2.3, h3: 2.0 },
};

// Translations
export const t = {
    back: { ja: "一覧へ戻る", en: "Back to List", vi: "Quay lại Danh sách" },
    backToMemberBlogs: { ja: "メンバーのブログ一覧", en: "Member's Blogs", vi: "Blog của thành viên" },
    loading: { ja: "読み込み中...", en: "Loading...", vi: "Đang tải..." },
    notFound: {
        ja: "ブログが見つかりません",
        en: "Blog post not found",
        vi: "Không tìm thấy bài viết",
    },
    share: { ja: "シェア", en: "Share", vi: "Chia sẻ" },
    prevPost: { ja: "前の記事", en: "Previous", vi: "Bài trước" },
    copied: {
        ja: "リンクをコピーしました",
        en: "Link copied",
        vi: "Đã sao chép liên kết",
    },
    nextPost: { ja: "次の記事", en: "Next Post", vi: "Bài tiếp theo" },
    openSource: { ja: "元ページ", en: "Original", vi: "Trang gốc" },
    toc: { ja: "目次", en: "Contents", vi: "Mục lục" },
    readTime: { ja: "読了目安", en: "Read time", vi: "Thời gian đọc" },
    minutes: { ja: "分", en: "min", vi: "phút" },
    blogArticle: { ja: "ブログ記事", en: "Blog Article", vi: "Tiêu Đề Blog" },
    furigana: { ja: "ふりがな", en: "Furigana", vi: "Phiên âm" },
    furiganaOn: { ja: "ふりがな表示中", en: "Furigana ON", vi: "Đang hiển thị" },
    furiganaOff: { ja: "ふりがな非表示", en: "Furigana OFF", vi: "Đã tắt" },
    fontSizes: {
        sm: { ja: "小", en: "Small", vi: "Nhỏ" },
        md: { ja: "標準", en: "Normal", vi: "Chuẩn" },
        lg: { ja: "大", en: "Large", vi: "Lớn" },
        xl: { ja: "特大", en: "X-Large", vi: "Rất lớn" },
        xxl: { ja: "特特大", en: "XX-Large", vi: "Cực lớn" },
    },
};

// LocalStorage keys
export const LS_KEY_SIZE = "blog:jpFontSize";
export const LS_KEY_TR_EN = "blog:tr:en";
export const LS_KEY_TR_VI = "blog:tr:vi";
export const LS_KEY_TTL_EN = "blog:trttl:en";
export const LS_KEY_TTL_VI = "blog:trttl:vi";

// Helper function to format English name (capitalize and reverse order)
export const formatEnglishName = (englishName) => {
    if (!englishName) return englishName;

    // Split by space (e.g., "ikeda eisa" -> ["ikeda", "eisa"])
    const parts = englishName.trim().toLowerCase().split(/\s+/);

    if (parts.length === 2) {
        // Capitalize first letter of each part
        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
        // Reverse order: last name first, first name last (eisa ikeda -> Eisa Ikeda)
        return `${capitalize(parts[1])} ${capitalize(parts[0])}`;
    }

    // If not 2 parts, just capitalize first letter
    return englishName.charAt(0).toUpperCase() + englishName.slice(1).toLowerCase();
};

// Helper to clean display text
export const cleanDisplayText = (text) =>
    (text || "")
        .replace(/```html/g, "")
        .replace(/```/g, "")
        .trim();
