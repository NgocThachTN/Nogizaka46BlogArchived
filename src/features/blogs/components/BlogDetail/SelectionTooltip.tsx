/**
 * SelectionTooltip — mini toolbar nổi lên khi bôi text trong blog
 * Nút "Dịch" → dịch đoạn được chọn qua Gemini
 * Nút "Tra từ" → mở VocabPopup (chỉ khi chọn <= 10 ký tự Japanese)
 */
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import {
  TranslationOutlined,
  BookOutlined,
  CloseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { isJapanese } from "../../lib/jishoService";

const keyframes = `
@keyframes sel-tooltip-in {
  from { opacity: 0; transform: translateY(4px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}`;

/** Tính vị trí tooltip không vượt ngoài viewport */
function calcPos(rect, tooltipW = 220) {
  const margin = 8;
  const scrollY = window.scrollY || 0;
  const vw = window.innerWidth;
  let top = rect.top + scrollY - 48; // phía trên selection
  let left = rect.left + rect.width / 2 - tooltipW / 2;
  // nếu vượt lên trên → đặt dưới
  if (rect.top < 52) top = rect.bottom + scrollY + margin;
  left = Math.max(margin, Math.min(left, vw - tooltipW - margin));
  return { top, left };
}

export default function SelectionTooltip({
  containerRef,
  themeMode,
  language,
  onVocabLookup, // callback(word, anchorRect) → mở VocabPopup
  vocabOpen,     // khi VocabPopup đang mở → ẩn tooltip này
}) {
  const isDark = themeMode === "dark";
  const tooltipRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [pos, setPos] = useState({ top: -9999, left: -9999 });

  // translation state
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState("");
  const [error, setError] = useState("");

  const targetLang = language === "en" ? "en" : "vi";

  // Ref để check trong setTimeout mà không bị stale closure
  // Dùng useLayoutEffect: chạy sync sau render, trước paint → luôn cập nhật trước setTimeout 10ms
  const vocabOpenRef = useRef(vocabOpen);
  useLayoutEffect(() => { vocabOpenRef.current = vocabOpen; }, [vocabOpen]);

  // Ẩn tooltip ngay khi VocabPopup mở (safety net cho các path khác)
  useEffect(() => {
    if (vocabOpen) setVisible(false);
  }, [vocabOpen]);

  // Mỗi khi chọn text mới thì reset translated
  const reset = useCallback(() => {
    setTranslated("");
    setError("");
    setTranslating(false);
  }, []);

  // mouseup trong container → kiểm tra selection
  const handleMouseUp = useCallback(
    (e) => {
      // Nếu click vào chính tooltip thì bỏ qua
      if (tooltipRef.current?.contains(e.target)) return;

      setTimeout(() => {
        // Nếu trong lúc chờ, VocabPopup đã được mở (dblclick) → bỏ qua
        if (vocabOpenRef.current) return;

        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? "";

        if (!text || !isJapanese(text)) {
          setVisible(false);
          return;
        }

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        reset();
        setSelectedText(text);
        setPos(calcPos(rect));
        setVisible(true);
      }, 10); // nhỏ delay để selection ổn định
    },
    [reset]
  );

  // Click ngoài tooltip → ẩn
  const handleDocMouseDown = useCallback((e) => {
    if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
      setVisible(false);
    }
  }, []);

  // Escape → ẩn
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") setVisible(false);
  }, []);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    el.addEventListener("mouseup", handleMouseUp);
    return () => el.removeEventListener("mouseup", handleMouseUp);
  }, [containerRef, handleMouseUp]);

  useEffect(() => {
    document.addEventListener("mousedown", handleDocMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleDocMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDocMouseDown, handleKeyDown]);

  const handleTranslate = async () => {
    if (translating || translated) return;
    setTranslating(true);
    setError("");
    try {
      const { translateSnippet } = await import("../../../translation/api/GeminiTranslate");
      const result = await translateSnippet(selectedText, targetLang);
      setTranslated(result);
    } catch (err) {
      setError("Dịch thất bại, thử lại sau.");
    } finally {
      setTranslating(false);
    }
  };

  const handleVocab = () => {
    if (!onVocabLookup) return;
    const sel = window.getSelection();
    const rect = sel?.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null;
    onVocabLookup(selectedText, rect ? { ...rect.toJSON() } : null);
    setVisible(false);
  };

  if (!visible) return null;

  const accent = isDark ? "#d2a86a" : "#8B4513";
  const bg = isDark
    ? "linear-gradient(135deg, #2e2920 0%, #28231c 100%)"
    : "linear-gradient(135deg, #FFFDF0 0%, #FFF8DE 100%)";
  const border = isDark ? "rgba(210,168,106,0.28)" : "rgba(139,69,19,0.22)";
  const text = isDark ? "#f5ede0" : "#2c2c2c";
  const sub = isDark ? "#b8a586" : "#8B7355";
  const canVocab = selectedText.length <= 10;
  const tooltipW = translated ? 300 : canVocab ? 220 : 160;

  return createPortal(
    <>
      <style>{keyframes}</style>
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          top: pos.top,
          left: pos.left,
          zIndex: 9990,
          width: tooltipW,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          boxShadow: isDark
            ? "0 6px 24px rgba(0,0,0,0.5)"
            : "0 6px 24px rgba(139,69,19,0.18)",
          fontFamily: "'Mali','Caveat',Georgia,serif",
          animation: "sel-tooltip-in 0.18s cubic-bezier(0.34,1.2,0.64,1) both",
          overflow: "hidden",
        }}
      >
        {/* Toolbar row */}
        {!translated && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 8px",
            }}
          >
            {/* Dịch button */}
            <button
              onClick={handleTranslate}
              disabled={translating}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 6,
                border: `1px solid ${accent}`,
                background: isDark ? "rgba(210,168,106,0.15)" : "rgba(139,69,19,0.08)",
                color: accent,
                fontSize: 12,
                fontWeight: 700,
                cursor: translating ? "wait" : "pointer",
                fontFamily: "'Mali',sans-serif",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {translating ? (
                <LoadingOutlined style={{ fontSize: 12 }} />
              ) : (
                <TranslationOutlined style={{ fontSize: 12 }} />
              )}
              {translating ? "Đang dịch..." : "Dịch"}
            </button>

            {/* Tra từ — chỉ khi chọn ngắn */}
            {canVocab && (
              <button
                onClick={handleVocab}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                  background: "none",
                  color: sub,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Mali',sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                <BookOutlined style={{ fontSize: 12 }} />
                Tra từ
              </button>
            )}

            <button
              onClick={() => setVisible(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: sub,
                padding: "4px 6px",
                fontSize: 12,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              <CloseOutlined />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: "6px 12px 10px", color: "#f5222d", fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Translation result */}
        {translated && (
          <div style={{ padding: "10px 12px 12px" }}>
            {/* Selected text (mini) */}
            <div
              style={{
                fontSize: 11,
                color: sub,
                marginBottom: 6,
                fontFamily: "'Noto Sans JP',sans-serif",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span style={{ flex: 1, lineHeight: 1.4, opacity: 0.8 }}>
                {selectedText.length > 30 ? selectedText.slice(0, 30) + "…" : selectedText}
              </span>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {canVocab && (
                  <button
                    onClick={handleVocab}
                    style={{
                      background: "none",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                      borderRadius: 4,
                      cursor: "pointer",
                      color: sub,
                      fontSize: 10,
                      padding: "1px 5px",
                      fontFamily: "'Mali',sans-serif",
                    }}
                  >
                    <BookOutlined style={{ fontSize: 9 }} /> Tra từ
                  </button>
                )}
                <button
                  onClick={() => setVisible(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: sub,
                    fontSize: 12,
                    padding: "0 2px",
                    lineHeight: 1,
                  }}
                >
                  <CloseOutlined />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: isDark ? "rgba(210,168,106,0.15)" : "rgba(139,69,19,0.1)",
                marginBottom: 8,
              }}
            />

            {/* Translation */}
            <div
              style={{
                fontSize: 14,
                color: text,
                lineHeight: 1.6,
                fontFamily: "'Mali','Caveat',Georgia,serif",
              }}
            >
              {translated}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: sub,
                opacity: 0.6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <TranslationOutlined style={{ fontSize: 10 }} />
              Gemini · {targetLang === "vi" ? "Tiếng Việt" : "English"}
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
