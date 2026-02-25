import { SIZE_PRESETS, bookFont } from "./constants";

export default function BlogStyles({ themeMode, fontSizeKey, language, sz }) {
    return (
        <>
            {/* prose base */}
            <style>{`
        /* Furigana (Ruby) Styling */
        .jp-prose ruby {
          ruby-position: over;
          ruby-align: center;
        }
        .jp-prose rt {
          font-size: 0.5em;
          line-height: 1.2;
          color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"};
          font-weight: 400;
          letter-spacing: 0.05em;
          user-select: none;
          -webkit-user-select: none;
        }
        .jp-prose rp {
          display: none;
        }
        .jp-prose ruby > span {
          display: inline-block;
        }
        .jp-prose * {
          max-width: 100%;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          box-sizing: border-box !important;
        }
        /* Force override inline styles with higher specificity */
        .jp-prose p,
        .jp-prose p.p1,
        .jp-prose p.p2,
        .jp-prose p.p3,
        .jp-prose p[style*="font-size"],
        .jp-prose p[class*="p"] { 
          color: ${themeMode === "dark" ? "#f5ede0" : "#374151"} !important; 
          /* Use exact line-height in pixels to match ruled lines */
          margin: 0 !important;
          padding: 0 !important;
          text-align: left !important; 
          font-size: ${sz.px}px !important;
          line-height: ${Math.round(sz.px * sz.lh)}px !important;
          letter-spacing: ${language === "ja" ? "0.05em" : "0.02em"} !important;
          word-spacing: ${language === "ja" ? "0.1em" : "0.05em"};
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          font-stretch: normal !important;
          font-family: ${bookFont[language].fontFamily} !important;
        }
        /* Extra spacing between paragraphs - removed to preserve original HTML spacing */
        .jp-prose div[dir="auto"],
        .jp-prose div[style*="font-size"] { 
          font-size: ${sz.px}px !important;
          line-height: ${Math.round(sz.px * sz.lh)}px !important;
        }
        .jp-prose span,
        .jp-prose span.s1,
        .jp-prose span.s2,
        .jp-prose span[class*="s"],
        .jp-prose span[style*="font-size"],
        .jp-prose span[style*="UICTFontTextStyleBody"] {
          font-size: ${sz.px}px !important;
          line-height: ${Math.round(sz.px * sz.lh)}px !important;
          font-family: ${bookFont[language].fontFamily} !important;
          color: ${themeMode === "dark" ? "#f5ede0" : "#374151"} !important;
        }
        /* Override UICTFontTextStyleBody specifically */
        .jp-prose *[style*="UICTFontTextStyleBody"] {
          font-family: ${bookFont[language].fontFamily} !important;
          font-size: ${sz.px}px !important;
          line-height: ${Math.round(sz.px * sz.lh)}px !important;
        }
        .jp-prose h1 { 
          font-weight: 600; 
          margin: ${window.innerWidth < 768 ? "0.7em 0 0.4em" : "0.9em 0 0.6em"}; 
          letter-spacing: ${window.innerWidth < 768 ? "-0.02em" : language === "ja" ? "0.05em" : "normal"};
        }
        .jp-prose h2 { 
          font-weight: 600; 
          margin: ${window.innerWidth < 768 ? "0.7em 0 0.4em" : "0.9em 0 0.5em"}; 
          letter-spacing: ${window.innerWidth < 768 ? "-0.01em" : language === "ja" ? "0.05em" : "normal"};
        }
        .jp-prose h3 { 
          font-weight: 600; 
          margin: ${window.innerWidth < 768 ? "0.7em 0 0.3em" : "0.9em 0 0.4em"};
          letter-spacing: ${language === "ja" ? "0.05em" : "normal"};
        }
        .jp-prose a { 
          color: ${themeMode === "dark" ? "#d2a86a" : "#6b21a8"}; 
          text-decoration: none; 
          border-bottom: 1px dotted ${themeMode === "dark" ? "#d2a86a" : "#6b21a8"};
          word-break: break-all;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        .jp-prose a:hover { 
          border-bottom-style: solid;
        }
        .jp-prose img { 
          /* Polaroid style image */
          display: block; 
          margin: ${window.innerWidth < 768 ? "24px" : "32px"} auto; 
          max-width: ${window.innerWidth < 768 ? "85%" : "75%"}; 
          height: auto;
          /* White polaroid frame */
          padding: ${window.innerWidth < 768 ? "8px 8px 24px 8px" : "12px 12px 40px 12px"};
          background: ${themeMode === "dark" ? "#f5f0e6" : "#ffffff"};
          border-radius: 2px;
          /* Polaroid shadow and slight rotation */
          box-shadow: ${themeMode === "dark"
                    ? "0 4px 12px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)"
                    : "0 4px 12px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)"
                };
          transform: rotate(-1deg);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: none !important;
          cursor: pointer;
        }
        .jp-prose img:nth-child(even) {
          transform: rotate(1.5deg);
        }
        .jp-prose img:nth-child(3n) {
          transform: rotate(-0.5deg);
        }
        .jp-prose img:hover {
          transform: rotate(0deg) scale(1.02);
          box-shadow: ${themeMode === "dark"
                    ? "0 8px 20px rgba(0,0,0,0.6), 0 12px 32px rgba(0,0,0,0.4)"
                    : "0 8px 20px rgba(0,0,0,0.2), 0 12px 32px rgba(0,0,0,0.15)"
                };
        }
        .jp-prose div, .jp-prose span {
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
      `}</style>

            {/* dynamic heading scale */}
            <style>{`
        .jp-prose h1 { 
          font-size: ${window.innerWidth < 768
                    ? SIZE_PRESETS[fontSizeKey].h1 * 0.85
                    : SIZE_PRESETS[fontSizeKey].h1
                }em; 
        }
        .jp-prose h2 { 
          font-size: ${window.innerWidth < 768
                    ? SIZE_PRESETS[fontSizeKey].h2 * 0.85
                    : SIZE_PRESETS[fontSizeKey].h2
                }em; 
        }
        .jp-prose h3 { 
          font-size: ${window.innerWidth < 768
                    ? SIZE_PRESETS[fontSizeKey].h3 * 0.85
                    : SIZE_PRESETS[fontSizeKey].h3
                }em; 
        }
      `}</style>

            {/* Override PageContainer header max-width */}
            <style>{`
        /* Force full width for PageContainer and Header */
        .ant-pro-page-container,
        div.ant-pro-page-container,
        [class*="ant-pro-page-container"] {
          width: 100% !important;
          max-width: 100% !important;
          padding: 16px !important;
          box-sizing: border-box !important;
        }
        .ant-pro-page-container-warp,
        div.ant-pro-page-container-warp {
          width: 100% !important;
          max-width: 100% !important;
          padding-inline: 0 !important;
        }
        .ant-page-header,
        div.ant-page-header,
        header.ant-page-header,
        .ant-pro-page-container .ant-page-header {
          width: calc(100% - 32px) !important;
          max-width: calc(100% - 32px) !important;
          min-width: 0 !important;
          margin: 12px 16px 16px 16px !important;
          padding: 14px 20px !important;
          background: ${themeMode === "dark" ? "rgba(36, 33, 29, 0.85)" : "rgba(253, 246, 227, 0.8)"} !important;
          border: 1px solid ${themeMode === "dark" ? "rgba(207,191,166,0.25)" : "rgba(139, 69, 19, 0.2)"} !important;
          border-radius: 12px !important;
          box-shadow: ${themeMode === "dark" ? "0 2px 8px rgba(0,0,0,0.35)" : "0 2px 8px rgba(139, 69, 19, 0.1)"} !important;
          box-sizing: border-box !important;
        }
        .ant-page-header-heading,
        .ant-page-header .ant-page-header-heading {
          width: 100% !important;
          max-width: 100% !important;
          display: flex !important;
          flex-wrap: nowrap !important;
          justify-content: space-between !important;
          align-items: center !important;
          gap: 16px !important;
        }
        .ant-page-header-heading-left,
        .ant-page-header .ant-page-header-heading-left {
          flex: 0 0 auto !important;
          margin-right: 0 !important;
          min-width: auto !important;
        }
        .ant-page-header-heading-title,
        .ant-page-header .ant-page-header-heading-title {
          margin-right: 0 !important;
          padding-right: 8px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          white-space: nowrap !important;
          flex-shrink: 0 !important;
        }
        .ant-page-header-heading-extra,
        .ant-page-header .ant-page-header-heading-extra {
          margin: 0 !important;
          flex: 1 1 auto !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 6px !important;
          flex-wrap: wrap !important;
          min-width: 0 !important;
        }
        .ant-page-header-heading-extra > * {
          flex-shrink: 1 !important;
        }
        /* Button styling for consistency */
        .ant-page-header-heading-extra .ant-btn {
          height: 34px !important;
          padding: 4px 14px !important;
          font-size: 13px !important;
          border-radius: 8px !important;
          border: 1px solid ${themeMode === "dark" ? "rgba(207,191,166,0.3)" : "rgba(139, 69, 19, 0.25)"} !important;
          background: ${themeMode === "dark" ? "rgba(28, 26, 23, 0.6)" : "rgba(255, 255, 255, 0.7)"} !important;
          color: ${themeMode === "dark" ? "#cfbfa6" : "#5d4e37"} !important;
          transition: all 0.2s ease !important;
        }
        .ant-page-header-heading-extra .ant-btn:hover {
          background: ${themeMode === "dark" ? "rgba(210, 168, 106, 0.15)" : "rgba(139, 69, 19, 0.1)"} !important;
          border-color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
        }
        .ant-page-header-heading-extra .ant-btn-primary {
          background: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          border-color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          color: ${themeMode === "dark" ? "#1c1a17" : "#fff"} !important;
        }
        .ant-page-header-heading-extra .ant-btn-primary:hover {
          background: ${themeMode === "dark" ? "#e0bc82" : "#a0522d"} !important;
          border-color: ${themeMode === "dark" ? "#e0bc82" : "#a0522d"} !important;
        }
        .ant-page-header-heading-extra .ant-btn-icon-only {
          width: 34px !important;
          padding: 4px 0 !important;
        }
        .ant-page-header-heading-extra .ant-select {
          min-width: 130px !important;
        }
        .ant-page-header-heading-extra .ant-select .ant-select-selector {
          height: 34px !important;
          border-radius: 8px !important;
          border: 1px solid ${themeMode === "dark" ? "rgba(207,191,166,0.3)" : "rgba(139, 69, 19, 0.25)"} !important;
          background: ${themeMode === "dark" ? "rgba(28, 26, 23, 0.6)" : "rgba(255, 255, 255, 0.7)"} !important;
        }
        .ant-page-header-heading-extra .ant-select:hover .ant-select-selector {
          border-color: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
        }
        .ant-page-header-heading-extra .ant-segmented {
          height: 34px !important;
          border-radius: 8px !important;
          background: ${themeMode === "dark" ? "rgba(28, 26, 23, 0.6)" : "rgba(255, 255, 255, 0.7)"} !important;
          border: 1px solid ${themeMode === "dark" ? "rgba(207,191,166,0.3)" : "rgba(139, 69, 19, 0.25)"} !important;
          padding: 2px !important;
        }
        .ant-page-header-heading-extra .ant-segmented-item {
          padding: 0 12px !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          color: ${themeMode === "dark" ? "#cfbfa6" : "#5d4e37"} !important;
        }
        .ant-page-header-heading-extra .ant-segmented-item-selected {
          background: ${themeMode === "dark" ? "#d2a86a" : "#8b4513"} !important;
          color: ${themeMode === "dark" ? "#1c1a17" : "#fff"} !important;
        }
        .ant-pro-page-container-children-content {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 16px 16px 16px !important;
        }
        /* Fix for narrow header on initial load */
        div[class*="ant-pro-page-container"] {
          width: 100% !important;
        }
      `}</style>
        </>
    );
}
