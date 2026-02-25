import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { DownloadOutlined, LeftOutlined, RightOutlined, CloseOutlined } from "@ant-design/icons";

/**
 * Image lightbox dong bo voi diary/scrapbook aesthetic cua trang BlogDetail
 */
export default function ImageLightbox({ open, imageUrl, allImages = [], themeMode, onClose }) {
    const isDark = themeMode === "dark";
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (imageUrl && allImages.length > 0) {
            const idx = allImages.indexOf(imageUrl);
            setCurrentIndex(idx >= 0 ? idx : 0);
        }
        setImgLoaded(false);
    }, [imageUrl, allImages]);

    const currentUrl = allImages.length > 0 ? allImages[currentIndex] : imageUrl;

    const goNext = useCallback(() => {
        setImgLoaded(false);
        setCurrentIndex(i => (i + 1) % allImages.length);
    }, [allImages.length]);

    const goPrev = useCallback(() => {
        setImgLoaded(false);
        setCurrentIndex(i => (i - 1 + allImages.length) % allImages.length);
    }, [allImages.length]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (e.key === "ArrowRight") goNext();
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, goNext, goPrev, onClose]);

    useEffect(() => {
        if (open) {
            // Tính scrollbar width trước khi ẩn, bù lại bằng padding-right
            // tránh nội dung bị giật ngang khi scrollbar biến mất
            const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = `${scrollbarW}px`;
        } else {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }
        return () => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, [open]);

    const handleDownload = async () => {
        if (!currentUrl || downloading) return;
        setDownloading(true);
        const filename = currentUrl.split("/").pop().split("?")[0] || "image.jpg";
        try {
            const res = await fetch(currentUrl);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        } catch {
            window.open(currentUrl, "_blank");
        } finally {
            setDownloading(false);
        }
    };

    const hasMultiple = allImages.length > 1;

    if (!open) return null;

    const bg = isDark
        ? "linear-gradient(to bottom, #2a2520 0%, #24211d 100%)"
        : "linear-gradient(to bottom, #FFF9E6 0%, #FFF5D6 100%)";
    const borderColor = isDark ? "rgba(139, 115, 85, 0.3)" : "rgba(139, 69, 19, 0.2)";
    const cardShadow = isDark
        ? "0 8px 40px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)"
        : "0 8px 40px rgba(139, 69, 19, 0.2), 0 2px 8px rgba(139, 69, 19, 0.1)";
    const accentColor = isDark ? "#d2a86a" : "#8B4513";
    const mutedColor = isDark ? "#b8a586" : "#6b5a47";
    const btnBg = isDark ? "rgba(42, 37, 32, 0.85)" : "rgba(255, 249, 230, 0.9)";
    const btnBorder = isDark ? "rgba(210, 168, 106, 0.35)" : "rgba(139, 69, 19, 0.25)";
    const btnHoverBg = isDark ? "rgba(210, 168, 106, 0.15)" : "rgba(139, 69, 19, 0.08)";
    const polaroidBg = isDark ? "#f5f0e6" : "#ffffff";
    const polaroidShadow = isDark
        ? "0 4px 16px rgba(0,0,0,0.55), 0 10px 32px rgba(0,0,0,0.35)"
        : "0 4px 16px rgba(0,0,0,0.15), 0 10px 32px rgba(0,0,0,0.1)";
    const diaryFont = "'Mali', 'Caveat', 'Georgia', serif";

    const navBtnStyle = {
        flexShrink: 0,
        width: 36,
        height: 36,
        border: `1px solid ${btnBorder}`,
        borderRadius: "50%",
        background: btnBg,
        color: mutedColor,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        transition: "all 0.2s ease",
        padding: 0,
    };

    const backdrop = (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1050,
                background: isDark ? "rgba(10, 8, 6, 0.85)" : "rgba(20, 14, 8, 0.78)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                animation: "lb-fade-in 0.45s ease both",
                willChange: "opacity",
                transform: "translateZ(0)",
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    position: "relative",
                    background: bg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 4,
                    boxShadow: cardShadow,
                    padding: "28px 28px 22px",
                    maxWidth: "min(92vw, 760px)",
                    width: "100%",
                    animation: "lb-scale-in 0.5s cubic-bezier(0.34, 1.15, 0.64, 1) 0.06s both",
                }}
            >
                {/* Tape decorations */}
                <div style={{
                    position: "absolute", top: -10, left: 32, width: 48, height: 18,
                    background: isDark ? "rgba(210,168,106,0.28)" : "rgba(139,69,19,0.15)",
                    borderRadius: 2, transform: "rotate(-2deg)", pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", top: -10, right: 48, width: 40, height: 18,
                    background: isDark ? "rgba(210,168,106,0.22)" : "rgba(139,69,19,0.12)",
                    borderRadius: 2, transform: "rotate(1.5deg)", pointerEvents: "none",
                }} />

                {/* Close */}
                <button onClick={onClose} title="Close (Esc)" style={{
                    position: "absolute", top: 12, right: 14,
                    width: 30, height: 30,
                    border: `1px solid ${btnBorder}`, borderRadius: "50%",
                    background: btnBg, color: mutedColor, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, transition: "all 0.2s ease", zIndex: 2, padding: 0,
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = btnHoverBg; e.currentTarget.style.color = accentColor; e.currentTarget.style.borderColor = accentColor; }}
                    onMouseLeave={e => { e.currentTarget.style.background = btnBg; e.currentTarget.style.color = mutedColor; e.currentTarget.style.borderColor = btnBorder; }}
                >
                    <CloseOutlined />
                </button>

                {/* Counter */}
                {hasMultiple && (
                    <div style={{ position: "absolute", top: 14, left: 20, fontFamily: diaryFont, fontSize: 12, color: mutedColor, letterSpacing: "0.08em", userSelect: "none" }}>
                        {currentIndex + 1} / {allImages.length}
                    </div>
                )}

                {/* Nav + Polaroid */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: hasMultiple ? 6 : 0 }}>
                    {hasMultiple && (
                        <button onClick={goPrev} title="Prev (←)" style={navBtnStyle}
                            onMouseEnter={e => { e.currentTarget.style.background = btnHoverBg; e.currentTarget.style.color = accentColor; e.currentTarget.style.borderColor = accentColor; }}
                            onMouseLeave={e => { e.currentTarget.style.background = btnBg; e.currentTarget.style.color = mutedColor; e.currentTarget.style.borderColor = btnBorder; }}
                        ><LeftOutlined /></button>
                    )}

                    {/* Polaroid frame */}
                    <div
                        style={{ background: polaroidBg, padding: "12px 12px 44px", borderRadius: 2, boxShadow: polaroidShadow, transform: "rotate(-0.8deg)", transition: "transform 0.3s ease", maxWidth: "calc(min(80vw, 620px))", lineHeight: 0 }}
                        onMouseEnter={e => e.currentTarget.style.transform = "rotate(0deg)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "rotate(-0.8deg)"}
                    >
                        {!imgLoaded && (
                            <div style={{ width: "min(60vw, 480px)", height: 300, background: isDark ? "rgba(245,240,230,0.06)" : "rgba(139,69,19,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: diaryFont, color: mutedColor, fontSize: 14, letterSpacing: "0.05em" }}>
                                loading...
                            </div>
                        )}
                        <img
                            src={currentUrl}
                            alt=""
                            onLoad={() => setImgLoaded(true)}
                            style={{ display: imgLoaded ? "block" : "none", maxWidth: "min(70vw, 580px)", maxHeight: "60vh", width: "100%", height: "auto", objectFit: "contain" }}
                        />
                    </div>

                    {hasMultiple && (
                        <button onClick={goNext} title="Next (→)" style={navBtnStyle}
                            onMouseEnter={e => { e.currentTarget.style.background = btnHoverBg; e.currentTarget.style.color = accentColor; e.currentTarget.style.borderColor = accentColor; }}
                            onMouseLeave={e => { e.currentTarget.style.background = btnBg; e.currentTarget.style.color = mutedColor; e.currentTarget.style.borderColor = btnBorder; }}
                        ><RightOutlined /></button>
                    )}
                </div>

                {/* Divider */}
                <div style={{ margin: "18px 0 14px", borderTop: `1px solid ${borderColor}` }} />

                {/* Download */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 22px", border: `1px solid ${accentColor}`, borderRadius: 4, background: "transparent", color: accentColor, fontFamily: diaryFont, fontSize: 14, fontWeight: 500, letterSpacing: "0.06em", cursor: downloading ? "wait" : "pointer", transition: "all 0.2s ease", opacity: downloading ? 0.65 : 1 }}
                        onMouseEnter={e => { if (!downloading) { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = isDark ? "#1c1a17" : "#fff"; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = accentColor; }}
                    >
                        <DownloadOutlined />
                        {downloading ? "..." : "Tải ảnh"}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(
        <>
            <style>{`
                @keyframes lb-fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes lb-scale-in { from { opacity: 0; transform: scale(0.84) translateY(22px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>
            {backdrop}
        </>,
        document.body
    );
}
