// Furigana Helper - Thêm hiragana reading cho kanji
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

let kuroshiroInstance = null;
let isInitializing = false;
let initPromise = null;

/**
 * Khởi tạo Kuroshiro (chỉ chạy 1 lần)
 */
export async function initKuroshiro() {
    if (kuroshiroInstance) return kuroshiroInstance;

    if (isInitializing) {
        // Đợi initialization đang chạy
        return initPromise;
    }

    isInitializing = true;
    initPromise = (async () => {
        try {
            const kuroshiro = new Kuroshiro();
            // Sử dụng CDN dictionary cho browser
            await kuroshiro.init(new KuromojiAnalyzer({
                dictPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/"
            }));
            kuroshiroInstance = kuroshiro;
            console.log("Kuroshiro initialized successfully");
            return kuroshiroInstance;
        } catch (error) {
            console.error("Failed to initialize Kuroshiro:", error);
            throw error;
        } finally {
            isInitializing = false;
        }
    })();

    return initPromise;
}

/**
 * Chuyển đổi text tiếng Nhật sang dạng có furigana (ruby HTML)
 * @param {string} text - Text tiếng Nhật cần convert
 * @returns {Promise<string>} HTML với furigana tags
 */
export async function convertToFurigana(text) {
    if (!text) return text;

    try {
        const kuroshiro = await initKuroshiro();

        // Convert sang furigana mode với HTML ruby tags
        const result = await kuroshiro.convert(text, {
            to: "hiragana",
            mode: "furigana",
            romajiSystem: "hepburn"
        });

        return result;
    } catch (error) {
        console.error("Furigana conversion error:", error);
        return text; // Fallback về text gốc nếu lỗi
    }
}

/**
 * Thêm furigana vào HTML content (xử lý cả tags)
 * @param {string} htmlContent - HTML content gốc
 * @returns {Promise<string>} HTML với furigana
 */
export async function addFuriganaToHtml(htmlContent) {
    if (!htmlContent) return htmlContent;

    try {
        const kuroshiro = await initKuroshiro();

        // Tạo temporary div để parse HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;

        // Hàm đệ quy để xử lý tất cả text nodes
        async function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || "";

                // Chỉ process nếu có kanji
                if (/[\u4E00-\u9FAF]/.test(text)) {
                    try {
                        const furiganaHtml = await kuroshiro.convert(text, {
                            to: "hiragana",
                            mode: "furigana",
                            romajiSystem: "hepburn"
                        });

                        // Tạo span wrapper với furigana HTML
                        const span = document.createElement("span");
                        span.innerHTML = furiganaHtml;

                        // Replace text node với span
                        node.parentNode.replaceChild(span, node);
                    } catch (err) {
                        console.warn("Failed to convert text node:", err);
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip script, style, ruby tags
                const tagName = node.tagName?.toLowerCase();
                if (["script", "style", "ruby", "rt", "rp"].includes(tagName)) {
                    return;
                }

                // Process child nodes (clone array vì replaceChild thay đổi childNodes)
                const children = Array.from(node.childNodes);
                for (const child of children) {
                    await processNode(child);
                }
            }
        }

        await processNode(tempDiv);
        return tempDiv.innerHTML;

    } catch (error) {
        console.error("HTML furigana processing error:", error);
        return htmlContent; // Fallback
    }
}

/**
 * Toggle furigana cho một element cụ thể
 * @param {HTMLElement} element - Element chứa content
 * @param {string} originalHtml - HTML gốc (không có furigana)
 * @param {boolean} showFurigana - true = hiện furigana, false = ẩn
 */
export async function toggleFurigana(element, originalHtml, showFurigana) {
    if (!element) return;

    try {
        if (showFurigana) {
            // Thêm furigana
            const furiganaHtml = await addFuriganaToHtml(originalHtml);
            element.innerHTML = furiganaHtml;
        } else {
            // Khôi phục HTML gốc
            element.innerHTML = originalHtml;
        }
    } catch (error) {
        console.error("Toggle furigana error:", error);
    }
}
