# 📖 Furigana Feature Guide

## Quick Start

Furigana feature giúp hiển thị cách đọc Hiragana phía trên chữ Kanji, hỗ trợ người học tiếng Nhật.

### 🎯 Cách Sử Dụng

#### Desktop:
1. Mở blog detail page (chế độ Japanese/JP)
2. Click nút **"ふ" (Furigana)** trong toolbar
3. Đợi khởi tạo (~3-5 giây lần đầu)
4. Furigana xuất hiện trên kanji!

#### Mobile:
1. Mở blog detail page (chế độ Japanese/JP)
2. Click icon **"ふ"** trên navigation bar (top right)
3. Hoặc mở drawer settings → "Phiên âm (Furigana)" → Bật
4. Xem furigana hiển thị!

## ✨ Features

- ✅ **Offline Mode** - Dictionary (~17MB) cached locally
- ✅ **On-demand** - Chỉ load khi cần
- ✅ **Fast** - Instant after first init
- ✅ **Mobile Optimized** - Compact "ふ" button
- ✅ **Desktop Support** - Full toggle in toolbar

## 📦 Dictionary Setup

### Automatic (Recommended):
```bash
npm run build  # Auto downloads during build
```

### Manual:
```bash
npm run download-dict
# Downloads 12 dictionary files (~17MB) to public/dict/
```

### Production (Vercel):
- Dictionary auto-downloads during deployment
- Cached in browser for 1 year
- No external CDN needed

## 🔧 Technical Details

### Stack:
- **Kuroshiro** - Japanese text conversion library
- **Kuromoji** - Morphological analyzer with offline dictionary
- **Dictionary**: 12 files in `public/dict/*.gz` format

### Files:
```
public/dict/
├── base.dat.gz      (~3.8 MB)
├── cc.dat.gz        (~1.6 MB)
├── check.dat.gz     (~3.0 MB)
├── tid_*.dat.gz     (~8.8 MB)
└── unk_*.dat.gz     (~0.2 MB)
Total: ~17.4 MB compressed
```

### Browser Support:
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ iOS Safari (Optimized)
- ✅ Android Chrome

## 🎨 UI Components

### Desktop Toolbar:
```
[Languages] [Furigana: ふ] [Theme] [Font]
```

### Mobile Navbar:
```
[Home][List][<][>]  [JP|EN|VI]  [ふ][🌙][📝]
```

### Example Output:

**Before (no furigana):**
```
今日は良い天気です
```

**After (with furigana):**
```
今日(きょう)は良(よ)い天気(てんき)です
```

## 🐛 Troubleshooting

### "Invalid file signature" error:
```bash
# Clear and re-download dictionary
rm -rf public/dict/*.gz
npm run download-dict
```

### Slow initialization:
- First time: 3-5 seconds (normal)
- Dictionary downloading in background
- Check console for progress

### Not working on specific blog:
- Ensure language is set to **Japanese (JP)**
- Check if blog has kanji characters
- Try refresh page (Ctrl+Shift+R)

### Build failed on Vercel:
```bash
# Option 1: Commit dictionary to git (faster builds)
git add public/dict/*.gz
git commit -m "Add kuromoji dictionary"

# Option 2: Let prebuild script download (slower but automatic)
# Already configured in package.json
```

## 📊 Performance

| Metric | Value |
|--------|-------|
| Dictionary size | 17.4 MB (compressed) |
| First init time | 3-5 seconds |
| Subsequent loads | < 100ms |
| Cache duration | 1 year |
| Memory usage | ~20 MB RAM |

## 🔗 Links

- Full Documentation: [docs/KUROMOJI_OFFLINE.md](docs/KUROMOJI_OFFLINE.md)
- Kuroshiro GitHub: https://github.com/hexenq/kuroshiro
- Kuromoji.js: https://github.com/takuyaa/kuromoji.js

## 💡 Tips

1. **First-time users**: Click furigana early to start dictionary download
2. **Mobile users**: Use settings drawer for detailed controls
3. **Performance**: Dictionary cached - only downloads once
4. **Learning**: Toggle on/off to test your kanji reading skills!

## 🎓 For Developers

### Configuration:
```javascript
// src/utils/furiganaHelper.js
const dictPath = import.meta.env.PROD 
  ? "/dict/"  // Production
  : "/dict/"; // Development
```

### Vite Plugin:
```javascript
// vite.config.js
function kuromojiDictPlugin() {
  // Serves .gz files with correct headers
  // Prevents auto-decompression
}
```

### Build Process:
```json
{
  "prebuild": "npm run download-dict",
  "build": "vite build"
}
```

---

**Made with ❤️ for Nogizaka46 fans learning Japanese!**

