/**
 * VocabPopup — popup tra từ xuất hiện khi double-click vào từ tiếng Nhật
 * Thiết kế đồng bộ với diary aesthetic của trang
 * Layout: 2 tabs — 単語 (word) | 漢字 (kanji breakdown)
 */
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  BookOutlined,
  StarFilled,
  StarOutlined,
  CloseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { lookupWord, saveWord, getSavedVocab, extractKanji, lookupKanji } from "../../utils/jishoService";
import { translateVocabToVi } from "../../api/GoogleTranslate";

// Màu badge JLPT
const JLPT_META = {
  "jlpt-n5": { label: "N5", color: "#52c41a", bg: "rgba(82,196,26,0.15)" },
  "jlpt-n4": { label: "N4", color: "#1677ff", bg: "rgba(22,119,255,0.12)" },
  "jlpt-n3": { label: "N3", color: "#fa8c16", bg: "rgba(250,140,22,0.15)" },
  "jlpt-n2": { label: "N2", color: "#f5222d", bg: "rgba(245,34,45,0.12)" },
  "jlpt-n1": { label: "N1", color: "#722ed1", bg: "rgba(114,46,209,0.12)" },
};

/** Tính toán vị trí popup sao cho không vượt ra ngoài viewport */
function calcPosition(anchorRect, popupW = 320, popupH = 260) {
  const margin = 12;
  const scrollY = window.scrollY || 0;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Ưu tiên hiển thị phía dưới selection
  let top = anchorRect.bottom + scrollY + margin;
  let left = anchorRect.left + anchorRect.width / 2 - popupW / 2;

  // Nếu popup vượt dưới viewport thì hiển thị phía trên
  if (anchorRect.bottom + popupH + margin > vh) {
    top = anchorRect.top + scrollY - popupH - margin;
  }

  // Clamp ngang
  left = Math.max(margin, Math.min(left, vw - popupW - margin));

  return { top, left };
}

const popupKeyframes = `
@keyframes vocab-pop-in {
  from { opacity: 0; transform: scale(0.88) translateY(-6px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}`;

// ── Tab: 単語 ──────────────────────────────────────────────────────────────
function TabWord({ entry, word, saved, onSave, isDark, accent, text, sub,
  lang, onLangChange, viDefs, loadingVi }) {
  const jlptMeta = entry?.jlpt ? JLPT_META[entry.jlpt] : null;

  if (!entry) return (
    <div style={{ padding: "12px 0 8px" }}>
      <div style={{ fontSize: 26, fontFamily: "'Yomogi','Noto Serif JP',serif", color: text, marginBottom: 8 }}>
        {word}
      </div>
      <div style={{ color: sub, fontSize: 13 }}>見つかりませんでした · Not found</div>
    </div>
  );

  return (
    <div>
      {/* Word + reading */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          fontSize: entry.word.length > 4 ? 22 : 28,
          fontFamily: "'Yomogi','Noto Serif JP',serif",
          color: text, lineHeight: 1.3,
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}>
          {entry.word}
          {entry.isCommon && (
            <span style={{
              fontSize: 10,
              background: isDark ? "rgba(82,196,26,0.2)" : "rgba(82,196,26,0.15)",
              color: "#52c41a", border: "1px solid rgba(82,196,26,0.4)",
              borderRadius: 4, padding: "1px 6px",
              fontFamily: "'Mali',sans-serif", fontWeight: 600, letterSpacing: 0.5,
            }}>Common</span>
          )}
        </div>
        {entry.reading && entry.reading !== entry.word && (
          <div style={{ fontSize: 16, color: accent, fontFamily: "'Noto Sans JP',sans-serif", marginTop: 2 }}>
            {entry.reading}
          </div>
        )}
      </div>

      {/* JLPT badge */}
      {jlptMeta && (
        <div style={{ marginBottom: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: jlptMeta.color,
            background: jlptMeta.bg, border: `1px solid ${jlptMeta.color}55`,
            borderRadius: 5, padding: "2px 8px", letterSpacing: 1,
            fontFamily: "'Mali',sans-serif",
          }}>JLPT {jlptMeta.label}</span>
        </div>
      )}

      {/* Definitions header with EN | VI toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ height: 1, background: isDark ? "rgba(210,168,106,0.15)" : "rgba(139,69,19,0.12)", flex: 1, marginRight: 10 }} />
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {["en", "vi"].map((l) => (
            <button key={l} onClick={() => onLangChange(l)} style={{
              padding: "2px 9px", borderRadius: 4, fontSize: 11, fontWeight: 700,
              fontFamily: "'Mali',sans-serif", cursor: "pointer",
              border: `1px solid ${lang === l ? accent : (isDark ? "rgba(210,168,106,0.2)" : "rgba(139,69,19,0.18)")}`,
              background: lang === l ? (isDark ? "rgba(210,168,106,0.18)" : "rgba(139,69,19,0.1)") : "transparent",
              color: lang === l ? accent : sub,
              transition: "all 0.15s",
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Definitions */}
      <div style={{ marginBottom: 12, minHeight: 48 }}>
        {/* EN definitions */}
        {lang === "en" && entry.definitions.slice(0, 3).map((def, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < entry.definitions.length - 1 ? 6 : 0 }}>
            <span style={{
              minWidth: 18, height: 18, borderRadius: "50%",
              background: isDark ? "rgba(210,168,106,0.2)" : "rgba(139,69,19,0.12)",
              color: accent, fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 2,
            }}>{i + 1}</span>
            <div>
              <span style={{ color: text, fontSize: 14, lineHeight: 1.4 }}>{def.en}</span>
              {def.pos && (
                <span style={{ marginLeft: 6, fontSize: 10, color: sub, fontStyle: "italic" }}>
                  {def.pos.split(",")[0]}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* VI definitions */}
        {lang === "vi" && (
          loadingVi ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", color: sub }}>
              <LoadingOutlined style={{ color: accent, fontSize: 14 }} />
              <span style={{ fontSize: 13 }}>Đang dịch...</span>
            </div>
          ) : viDefs.length > 0 ? (
            viDefs.map((def, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < viDefs.length - 1 ? 6 : 0 }}>
                <span style={{
                  minWidth: 18, height: 18, borderRadius: "50%",
                  background: isDark ? "rgba(210,168,106,0.2)" : "rgba(139,69,19,0.12)",
                  color: accent, fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 2,
                }}>{i + 1}</span>
                <span style={{ color: text, fontSize: 14, lineHeight: 1.4 }}>{def}</span>
              </div>
            ))
          ) : (
            <div style={{ color: sub, fontSize: 13, padding: "6px 0" }}>Không có bản dịch</div>
          )
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={() => window.open(`https://mazii.net/vi-VN/search/word/javi/${encodeURIComponent(entry.word)}`, "mazii_lookup")}
          style={{
            padding: "5px 10px", borderRadius: 6,
            border: `1px solid ${isDark ? "rgba(114,46,209,0.3)" : "rgba(114,46,209,0.25)"}`,
            background: isDark ? "rgba(114,46,209,0.12)" : "rgba(114,46,209,0.08)",
            color: isDark ? "#b388ff" : "#7c3aed", fontSize: 12,
            cursor: "pointer", fontFamily: "'Mali',sans-serif",
            fontWeight: 600, transition: "all 0.15s ease",
          }}
        >Mazii ↗</button>
        <button
          onClick={() => window.open(`https://jisho.org/word/${encodeURIComponent(entry.slug || entry.word)}`, "_blank")}
          style={{
            padding: "5px 10px", borderRadius: 6,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
            background: "none", color: sub, fontSize: 12,
            cursor: "pointer", fontFamily: "'Mali',sans-serif",
          }}
        >Jisho ↗</button>
      </div>
    </div>
  );
}

// ── Tab: 漢字 ──────────────────────────────────────────────────────────────
function TabKanji({ kanjiEntries, loading, isDark, accent, text, sub }) {
  if (loading) return (
    <div style={{ textAlign: "center", padding: "32px 0", color: sub }}>
      <LoadingOutlined style={{ fontSize: 22, color: accent }} />
      <div style={{ marginTop: 8, fontSize: 13 }}>検索中...</div>
    </div>
  );

  if (!kanjiEntries.length) return (
    <div style={{ padding: "24px 0", textAlign: "center", color: sub, fontSize: 13 }}>
      漢字なし · No kanji found
    </div>
  );

  return (
    <div>
      {kanjiEntries.map((k) => {
        const km = k.jlpt ? JLPT_META[k.jlpt] : null;
        return (
          <div key={k.char} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "8px 10px", marginBottom: 6, borderRadius: 8,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(139,69,19,0.04)",
            border: `1px solid ${isDark ? "rgba(210,168,106,0.1)" : "rgba(139,69,19,0.08)"}`,
          }}>
            <div style={{ flexShrink: 0, textAlign: "center", minWidth: 44 }}>
              <div style={{ fontSize: 36, fontFamily: "'Yomogi','Noto Serif JP',serif", color: accent, lineHeight: 1 }}>
                {k.kanji}
              </div>
              {k.reading && (
                <div style={{ fontSize: 11, color: sub, fontFamily: "'Noto Sans JP',sans-serif", marginTop: 3, lineHeight: 1 }}>
                  {k.reading}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {km && (
                <span style={{
                  display: "inline-block", fontSize: 10, fontWeight: 700,
                  color: km.color, background: km.bg,
                  border: `1px solid ${km.color}55`, borderRadius: 4,
                  padding: "1px 6px", marginBottom: 5,
                  fontFamily: "'Mali',sans-serif", letterSpacing: 0.8,
                }}>JLPT {km.label}</span>
              )}
              <div style={{ fontSize: 13, color: text, lineHeight: 1.5, fontFamily: "'Mali','Caveat',serif", wordBreak: "break-word" }}>
                {(k.meanings || []).join(" / ")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main popup ─────────────────────────────────────────────────────────────
export default function VocabPopup({ word, anchorRect, themeMode, onClose, onSaved }) {
  const isDark = themeMode === "dark";
  const popupRef = useRef(null);

  const [entry, setEntry] = useState(null);
  const [loadingWord, setLoadingWord] = useState(false);
  const [loadingKanji, setLoadingKanji] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  const [kanjiEntries, setKanjiEntries] = useState([]);
  const [activeTab, setActiveTab] = useState("word");
  const [lang, setLang] = useState("en");       // "en" | "vi"
  const [viDefs, setViDefs] = useState([]);     // Vietnamese definitions cache
  const [loadingVi, setLoadingVi] = useState(false);

  // Tra từ khi word thay đổi
  useEffect(() => {
    if (!word) return;
    setEntry(null);
    setSaved(false);
    setKanjiEntries([]);
    setActiveTab("word");
    setLang("en");
    setViDefs([]);
    setLoadingWord(true);
    setLoadingKanji(true);

    lookupWord(word).then((result) => {
      setEntry(result);
      setLoadingWord(false);
      const vocab = getSavedVocab();
      setSaved(vocab.some((v) => v.word === (result?.word || word)));

      const kanjis = extractKanji(result?.word || word);
      if (kanjis.length > 0) {
        Promise.all(kanjis.map((ch) => lookupKanji(ch))).then((results) => {
          setKanjiEntries(results.map((r, i) => ({ ...r, char: kanjis[i] })).filter(Boolean));
          setLoadingKanji(false);
        });
      } else {
        setLoadingKanji(false);
      }
    });
  }, [word]);

  // Tính vị trí cố định
  useEffect(() => {
    if (!anchorRect) return;
    setPos(calcPosition(anchorRect, 340, 320));
  }, [anchorRect]);

  const handleOutsideClick = useCallback((e) => {
    if (popupRef.current && !popupRef.current.contains(e.target)) onClose?.();
  }, [onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose?.();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleOutsideClick, handleKeyDown]);

  const handleSave = () => {
    if (!entry) return;
    saveWord(entry);
    setSaved(true);
    onSaved?.();
  };

  // Dịch sang tiếng Việt (gọi Gemini, cache kết quả)
  const handleLangChange = (newLang) => {
    setLang(newLang);
    if (newLang === "vi" && viDefs.length === 0 && !loadingVi && entry) {
      setLoadingVi(true);
      translateVocabToVi(entry.word, entry.reading, entry.definitions)
        .then((defs) => { setViDefs(defs); })
        .finally(() => setLoadingVi(false));
    }
  };

  if (!word) return null;

  const accent = isDark ? "#d2a86a" : "#8B4513";
  const bg = isDark
    ? "linear-gradient(135deg, #2e2920 0%, #28231c 100%)"
    : "linear-gradient(135deg, #FFFDF0 0%, #FFF8DE 100%)";
  const border = isDark ? "1px solid rgba(210,168,106,0.25)" : "1px solid rgba(139,69,19,0.22)";
  const text = isDark ? "#f5ede0" : "#2c2c2c";
  const sub = isDark ? "#b8a586" : "#8B7355";

  const hasKanji = kanjiEntries.length > 0 || loadingKanji;
  const tabs = [
    { key: "word", label: "単語" },
    ...(hasKanji ? [{ key: "kanji", label: "漢字" }] : []),
  ];

  return createPortal(
    <>
      <style>{popupKeyframes}</style>
      <div
        ref={popupRef}
        style={{
          position: "absolute",
          top: pos.top,
          left: pos.left,
          zIndex: 9999,
          width: 340,
          background: bg,
          border,
          borderRadius: 10,
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(139,69,19,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          fontFamily: "'Mali','Caveat',Georgia,serif",
          animation: "vocab-pop-in 0.22s cubic-bezier(0.34,1.2,0.64,1) both",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOutlined style={{ color: accent, fontSize: 15 }} />
            <span style={{ color: sub, fontSize: 12, letterSpacing: 1 }}>辞書 · Dictionary</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: sub, padding: 2, lineHeight: 1, fontSize: 14 }}
            title="Close"
          >
            <CloseOutlined />
          </button>
        </div>

        {/* ── Loading word ── */}
        {loadingWord && (
          <div style={{ textAlign: "center", padding: "28px 0", color: sub }}>
            <LoadingOutlined style={{ fontSize: 22, color: accent }} />
            <div style={{ marginTop: 8, fontSize: 13 }}>検索中...</div>
          </div>
        )}

        {/* ── Tab bar (only when >1 tab) ── */}
        {!loadingWord && tabs.length > 1 && (
          <div style={{ display: "flex", padding: "8px 16px 0", gap: 4 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "5px 16px",
                  borderRadius: "6px 6px 0 0",
                  border: "none",
                  borderBottom: activeTab === tab.key ? `2px solid ${accent}` : "2px solid transparent",
                  background: activeTab === tab.key
                    ? isDark ? "rgba(210,168,106,0.12)" : "rgba(139,69,19,0.07)"
                    : "transparent",
                  color: activeTab === tab.key ? accent : sub,
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "'Yomogi','Mali',sans-serif",
                  transition: "all 0.15s ease",
                }}
              >{tab.label}</button>
            ))}
          </div>
        )}

        {/* ── Divider under tabs ── */}
        {!loadingWord && tabs.length > 1 && (
          <div style={{ height: 1, background: isDark ? "rgba(210,168,106,0.15)" : "rgba(139,69,19,0.12)" }} />
        )}

        {/* ── Tab content ── */}
        {!loadingWord && (
          <div style={{ padding: "12px 16px 14px", maxHeight: 420, overflowY: "auto" }}>
            {activeTab === "word" && (
              <TabWord
                entry={entry}
                word={word}
                saved={saved}
                onSave={handleSave}
                isDark={isDark}
                accent={accent}
                text={text}
                sub={sub} lang={lang}
                onLangChange={handleLangChange}
                viDefs={viDefs}
                loadingVi={loadingVi} />
            )}
            {activeTab === "kanji" && (
              <TabKanji
                kanjiEntries={kanjiEntries}
                loading={loadingKanji}
                isDark={isDark}
                accent={accent}
                text={text}
                sub={sub}
              />
            )}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
