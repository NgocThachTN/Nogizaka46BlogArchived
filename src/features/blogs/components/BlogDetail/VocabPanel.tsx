/**
 * VocabPanel — drawer hiển thị danh sách từ vựng đã lưu
 * Có chế độ flashcard: click vào card để lật (từ ↔ nghĩa)
 */
import { createPortal } from "react-dom";
import { useState, useEffect, useCallback } from "react";
import {
  CloseOutlined,
  DeleteOutlined,
  BookOutlined,
  ClearOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { getSavedVocab, removeWord, clearVocab } from "../../lib/jishoService";

const JLPT_META = {
  "jlpt-n5": { label: "N5", color: "#52c41a" },
  "jlpt-n4": { label: "N4", color: "#1677ff" },
  "jlpt-n3": { label: "N3", color: "#fa8c16" },
  "jlpt-n2": { label: "N2", color: "#f5222d" },
  "jlpt-n1": { label: "N1", color: "#722ed1" },
};

const panelKeyframes = `
@keyframes panel-slide-in {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes panel-slide-out {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(40px); }
}
@keyframes card-flip {
  0%   { transform: perspective(600px) rotateY(0deg); }
  50%  { transform: perspective(600px) rotateY(90deg); }
  100% { transform: perspective(600px) rotateY(0deg); }
}`;

function VocabCard({ entry, isDark, onRemove }) {
  const [flipped, setFlipped] = useState(false); // false = word side, true = meaning side

  const accent = isDark ? "#d2a86a" : "#8B4513";
  const bg = flipped
    ? isDark ? "linear-gradient(135deg, #2a2422 0%, #241e18 100%)" : "linear-gradient(135deg, #FFF5D6 0%, #FFEFC0 100%)"
    : isDark ? "linear-gradient(135deg, #2e2920 0%, #28231c 100%)" : "linear-gradient(135deg, #FFFDF0 0%, #FFF8DE 100%)";
  const border = isDark ? "rgba(210,168,106,0.2)" : "rgba(139,69,19,0.18)";
  const text = isDark ? "#f5ede0" : "#2c2c2c";
  const sub = isDark ? "#b8a586" : "#8B7355";
  const jlptMeta = entry.jlpt ? JLPT_META[entry.jlpt] : null;

  return (
    <div
      onClick={() => setFlipped((p) => !p)}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 9,
        padding: "12px 14px",
        marginBottom: 10,
        cursor: "pointer",
        position: "relative",
        transition: "background 0.3s ease, box-shadow 0.2s ease",
        boxShadow: isDark
          ? "0 2px 8px rgba(0,0,0,0.3)"
          : "0 2px 8px rgba(139,69,19,0.1)",
        userSelect: "none",
      }}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(entry.word);
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: sub,
          fontSize: 12,
          padding: 3,
          opacity: 0.6,
          lineHeight: 1,
        }}
        title="Xoá từ"
      >
        <DeleteOutlined />
      </button>

      {/* Flip indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 7,
          right: 10,
          fontSize: 10,
          color: sub,
          opacity: 0.5,
        }}
      >
        <SwapOutlined /> {flipped ? "từ" : "nghĩa"}
      </div>

      {!flipped ? (
        /* WORD SIDE */
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: entry.word.length > 4 ? 20 : 26,
                fontFamily: "'Yomogi', 'Noto Serif JP', serif",
                color: text,
                lineHeight: 1.3,
              }}
            >
              {entry.word}
            </span>
            {jlptMeta && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: jlptMeta.color,
                  border: `1px solid ${jlptMeta.color}66`,
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontFamily: "'Mali', sans-serif",
                }}
              >
                {jlptMeta.label}
              </span>
            )}
            {entry.isCommon && (
              <span style={{ fontSize: 10, color: "#52c41a", fontFamily: "'Mali',sans-serif" }}>
                Common
              </span>
            )}
          </div>
          {entry.reading && entry.reading !== entry.word && (
            <div style={{ fontSize: 14, color: accent, fontFamily: "'Noto Sans JP', sans-serif" }}>
              {entry.reading}
            </div>
          )}
        </div>
      ) : (
        /* MEANING SIDE */
        <div>
          {entry.reading && (
            <div style={{ fontSize: 12, color: accent, marginBottom: 6, fontFamily: "'Noto Sans JP',sans-serif" }}>
              {entry.word}　{entry.reading !== entry.word ? `(${entry.reading})` : ""}
            </div>
          )}
          {(entry.definitions || []).slice(0, 3).map((def, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 6,
                alignItems: "flex-start",
                marginBottom: 4,
              }}
            >
              <span style={{ color: accent, fontSize: 11, fontWeight: 600, marginTop: 1, flexShrink: 0 }}>
                {i + 1}.
              </span>
              <div>
                <span style={{ color: text, fontSize: 13, fontFamily: "'Mali','Caveat',serif", lineHeight: 1.4 }}>
                  {def.en}
                </span>
                {def.pos && (
                  <span style={{ marginLeft: 5, fontSize: 10, color: sub, fontStyle: "italic" }}>
                    {def.pos.split(",")[0]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VocabPanel({ open, themeMode, onClose, refreshKey }) {
  const isDark = themeMode === "dark";
  const [vocab, setVocab] = useState([]);
  const [closing, setClosing] = useState(false);

  // Tải lại danh sách khi panel mở hoặc có từ mới được lưu
  useEffect(() => {
    if (open) {
      setVocab(getSavedVocab());
      setClosing(false);
    }
  }, [open, refreshKey]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose?.();
    }, 240);
  }, [onClose]);

  const handleRemove = (word) => {
    removeWord(word);
    setVocab((prev) => prev.filter((v) => v.word !== word));
  };

  const handleClearAll = () => {
    if (!window.confirm("Xoá tất cả từ vựng đã lưu?")) return;
    clearVocab();
    setVocab([]);
  };

  const handleKeyDown = useCallback(
    (e) => { if (e.key === "Escape") handleClose(); },
    [handleClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open && !closing) return null;

  const accent = isDark ? "#d2a86a" : "#8B4513";
  const bg = isDark
    ? "linear-gradient(to bottom, #1e1a15 0%, #28231c 100%)"
    : "linear-gradient(to bottom, #FFFBF0 0%, #FFF6DC 100%)";
  const border = isDark ? "rgba(210,168,106,0.2)" : "rgba(139,69,19,0.15)";
  const text = isDark ? "#f5ede0" : "#2c2c2c";
  const sub = isDark ? "#b8a586" : "#8B7355";

  const animation = closing ? "panel-slide-out 0.24s ease forwards" : "panel-slide-in 0.28s cubic-bezier(0.22,1,0.36,1) both";

  return createPortal(
    <>
      <style>{panelKeyframes}</style>

      {/* Backdrop (click to close) */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.3)",
          animation: closing ? "panel-slide-out 0.24s ease forwards" : "lb-fade-in 0.25s ease both",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: Math.min(380, window.innerWidth - 24),
          zIndex: 9999,
          background: bg,
          borderLeft: `1px solid ${border}`,
          boxShadow: isDark
            ? "-8px 0 40px rgba(0,0,0,0.5)"
            : "-8px 0 40px rgba(139,69,19,0.15)",
          display: "flex",
          flexDirection: "column",
          animation,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px 12px",
            borderBottom: `1px solid ${border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookOutlined style={{ fontSize: 18, color: accent }} />
            <div>
              <div
                style={{
                  fontFamily: "'Mali', 'Caveat', Georgia, serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: text,
                }}
              >
                単語帳
              </div>
              <div style={{ fontSize: 11, color: sub }}>
                {vocab.length} từ đã lưu
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {vocab.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  background: "none",
                  border: `1px solid ${isDark ? "rgba(245,34,45,0.3)" : "rgba(245,34,45,0.25)"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#f5222d",
                  fontSize: 11,
                  padding: "3px 8px",
                  fontFamily: "'Mali', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                title="Xoá tất cả"
              >
                <ClearOutlined style={{ fontSize: 11 }} />
                Xoá tất
              </button>
            )}
            <button
              onClick={handleClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: sub,
                fontSize: 16,
                padding: 4,
                lineHeight: 1,
              }}
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* Hint */}
        <div
          style={{
            padding: "8px 18px",
            background: isDark ? "rgba(210,168,106,0.06)" : "rgba(139,69,19,0.05)",
            borderBottom: `1px solid ${border}`,
            fontSize: 11,
            color: sub,
            fontStyle: "italic",
            flexShrink: 0,
          }}
        >
          💡 Click vào card để lật — xem nghĩa / ôn từ dạng flashcard
        </div>

        {/* Word list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 16px",
          }}
        >
          {vocab.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: sub }}>
              <BookOutlined style={{ fontSize: 36, opacity: 0.3 }} />
              <div style={{ marginTop: 12, fontSize: 14, fontFamily: "'Mali',serif" }}>
                Chưa có từ nào được lưu
              </div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                Double-click vào từ trong blog để tra từ và lưu
              </div>
            </div>
          ) : (
            vocab.map((entry) => (
              <VocabCard
                key={entry.word}
                entry={entry}
                isDark={isDark}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
