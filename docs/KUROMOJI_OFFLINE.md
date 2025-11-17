# Kuromoji Offline Dictionary Setup

## Tổng quan

Dự án này sử dụng **kuromoji** (Japanese morphological analyzer) để phân tích văn bản tiếng Nhật và thêm furigana. Để tối ưu hiệu suất và độ tin cậy trong production (đặc biệt trên Vercel), chúng ta sử dụng **offline dictionary** thay vì tải từ CDN.

## Cấu trúc

```
public/
  └── dict/              # Kuromoji dictionary files (compressed .gz)
      ├── base.dat.gz
      ├── cc.dat.gz
      ├── check.dat.gz
      ├── tid_map.dat.gz
      ├── tid_pos.dat.gz
      ├── tid.dat.gz
      ├── unk_char.dat.gz
      ├── unk_compat.dat.gz
      ├── unk_invoke.dat.gz
      ├── unk_map.dat.gz
      ├── unk_pos.dat.gz
      └── unk.dat.gz

scripts/
  └── download-kuromoji-dict.js  # Script tải dictionary

src/utils/
  └── furiganaHelper.js          # Sử dụng offline dictionary
```

## Setup

### 1. Tải Dictionary Files

Chạy script để tải dictionary files về `public/dict/`:

```bash
npm run download-dict
```

Script này sẽ:
- Tải 12 file dictionary (`.dat.gz`) từ CDN kuromoji
- **Giữ nguyên format `.gz`** (kuromoji tự giải nén trong browser)
- Lưu vào `public/dict/`
- Skip các file đã tồn tại (để tránh download lại)
- Hiển thị progress và kết quả

### 2. Build Application

Khi build, dictionary files sẽ tự động được copy vào `dist/`:

```bash
npm run build
```

**Lưu ý:** Script `prebuild` đã được cấu hình để tự động chạy `download-dict` trước khi build, nên bạn không cần chạy thủ công.

### 3. Development

Trong development mode, Vite sẽ serve dictionary files từ `public/dict/`:

```bash
npm run dev
```

## Cấu hình

### furiganaHelper.js

```javascript
const dictPath = import.meta.env.PROD 
  ? "/dict/"  // Production: serve từ public/dict/
  : "/dict/"; // Development: cũng từ public/dict/

const initPromise = kuroshiro.init(new KuromojiAnalyzer({ 
  dictPath: dictPath
}));
```

### vite.config.js

```javascript
build: {
  copyPublicDir: true,  // Copy public/ sang dist/
},
publicDir: 'public',
```

### vercel.json

Dictionary files được serve với cache headers tối ưu:

```json
{
  "source": "/dict/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    },
    {
      "key": "Access-Control-Allow-Origin",
      "value": "*"
    }
  ]
}
```

## Deployment trên Vercel

### Tự động (Recommended)

Vercel sẽ tự động:
1. Chạy `npm install`
2. Chạy `prebuild` script (download dictionary)
3. Chạy `npm run build`
4. Deploy ứng dụng với dictionary files

### Thủ công

Nếu cần deploy thủ công:

```bash
# 1. Tải dictionary
npm run download-dict

# 2. Build
npm run build

# 3. Deploy (nếu dùng Vercel CLI)
vercel --prod
```

## Lợi ích

### 1. **Performance**
- ❌ **Trước:** Tải ~2MB dictionary từ CDN mỗi lần init (3-5s)
- ✅ **Sau:** Dictionary đã có sẵn, load ngay lập tức (<1s)

### 2. **Reliability**
- ❌ **Trước:** Phụ thuộc vào CDN bên ngoài (jsdelivr)
- ✅ **Sau:** Dictionary hosted cùng app, không lo CDN down

### 3. **Offline Support**
- ❌ **Trước:** Không hoạt động offline
- ✅ **Sau:** Hoạt động hoàn toàn offline

### 4. **Network Cost**
- ❌ **Trước:** Mỗi user tải dictionary riêng
- ✅ **Sau:** Dictionary được cache vĩnh viễn (1 năm)

## Troubleshooting

### Dictionary files không tìm thấy

**Lỗi:** `Failed to load dictionary from /dict/`

**Giải pháp:**
```bash
# Xóa và tải lại
rm -rf public/dict
npm run download-dict
```

### Build trên Vercel thất bại

**Lỗi:** `Script download-dict failed`

**Nguyên nhân:** Network issue khi download dictionary

**Giải pháp:**
1. Commit dictionary files vào Git (một lần duy nhất):
   ```bash
   git add public/dict/*.gz
   git commit -m "Add kuromoji dictionary files"
   git push
   ```

2. Update `.gitignore` để **KHÔNG** ignore `public/dict/`:
   ```
   # Đảm bảo dòng này KHÔNG có trong .gitignore
   # public/dict/
   ```

### Kuroshiro initialization timeout

**Lỗi:** `Kuroshiro initialization timeout`

**Nguyên nhân:** Dictionary files quá lớn hoặc bị corrupt

**Giải pháp:**
```bash
# Xóa và tải lại
rm -rf public/dict
npm run download-dict

# Build lại
npm run build
```

## Size Impact

Total dictionary size: **~87MB (decompressed)**

| File | Size (uncompressed) |
|------|---------------------|
| base.dat | ~8 MB |
| cc.dat | ~3.3 MB |
| check.dat | ~8 MB |
| tid_pos.dat | ~40 MB |
| tid_map.dat | ~4 MB |
| tid.dat | ~10 MB |
| unk_*.dat | ~13 MB |

**Note:** Dictionary files phải được giải nén (`.dat` thay vì `.dat.gz`) vì:
- ⚠️ Vite/Vercel không serve `.gz` files đúng content-encoding cho kuromoji
- ⚠️ Kuromoji expect `.gz` files với specific binary format, nhưng Vite có thể decompress chúng

**Trade-off:**
- ⚠️ **Bundle size tăng:** +87MB (các file được cache tốt)
- ✅ **Runtime performance:** Nhanh hơn 10x so với tải từ CDN
- ✅ **User experience:** Không có loading delay cho furigana feature
- ✅ **Reliability:** 100% offline, không phụ thuộc CDN bên ngoài

## Maintenance

### Update Dictionary

Để update lên version mới của kuromoji:

1. Update CDN URL trong `scripts/download-kuromoji-dict.js`:
   ```javascript
   const DICT_CDN = 'https://cdn.jsdelivr.net/npm/kuromoji@<VERSION>/dict/';
   ```

2. Xóa dictionary cũ và tải lại:
   ```bash
   rm -rf public/dict
   npm run download-dict
   ```

3. Test và deploy:
   ```bash
   npm run dev  # Test locally
   npm run build
   ```

## References

- [Kuromoji GitHub](https://github.com/takuyaa/kuromoji.js)
- [Kuroshiro Documentation](https://github.com/hexenq/kuroshiro)
- [Vercel Static File Serving](https://vercel.com/docs/concepts/projects/project-configuration)

