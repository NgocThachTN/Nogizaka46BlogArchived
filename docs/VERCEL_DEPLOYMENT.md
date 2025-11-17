# Hướng dẫn Deploy lên Vercel

## Các vấn đề đã fix

### 1. **Kuroshiro Initialization Issues**
- ✅ Added timeout (30s) để tránh hang khi load dictionary
- ✅ Lazy initialization (delay 1s) để không block initial page render
- ✅ Graceful fallback nếu Kuroshiro fail to initialize
- ✅ Browser environment checks

### 2. **Bundle Size Optimization**
- ✅ Code splitting với manual chunks
- ✅ Separate vendor bundles (React, Ant Design, Furigana)
- ✅ Lazy load Kuroshiro libraries

### 3. **Build Configuration**
- ✅ Updated `vite.config.js` với production optimizations
- ✅ Added `.vercelignore` để exclude unnecessary files
- ✅ Increased chunk size warning limit

## Bước Deploy

### 1. **Chuẩn bị Environment Variables**
Trên Vercel Dashboard, thêm environment variable:
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
NODE_ENV=production
```

### 2. **Build Settings trên Vercel**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. **Deploy**
```bash
# Option 1: Deploy qua Vercel CLI
npm install -g vercel
vercel --prod

# Option 2: Push lên GitHub và connect với Vercel
git add .
git commit -m "Fix deployment issues"
git push origin main
```

### 4. **Kiểm tra sau khi deploy**
- ✅ Homepage load được
- ✅ Member list hiển thị
- ✅ Blog detail page load được
- ✅ Translation hoạt động (nếu có API key)
- ⚠️ Furigana có thể load chậm lần đầu (do download dictionary 5MB)

## Troubleshooting

### Nếu trang vẫn không load:

1. **Check Vercel logs:**
   - Vào Vercel Dashboard > Project > Deployments > Latest > View Function Logs

2. **Check browser console:**
   - F12 > Console tab > Xem lỗi JavaScript

3. **Common issues:**
   - ❌ **Missing API Key**: Translation sẽ không hoạt động nhưng blog vẫn load được
   - ❌ **CORS errors**: Kiểm tra `vercel.json` headers config
   - ❌ **404 on refresh**: Kiểm tra `vercel.json` rewrites config
   - ❌ **White screen**: Có thể do bundle size quá lớn - check Network tab

### Furigana không hoạt động:

Đây là normal behavior. Furigana:
- Cần tải ~5MB dictionary lần đầu
- Chỉ hoạt động khi language = "ja"
- Button chỉ hiện khi Kuroshiro đã ready (có thể mất 5-10s)
- Nếu fail, trang vẫn hoạt động bình thường mà không có furigana

## Performance Tips

1. **First Load**: Có thể chậm ~2-3s do load các libraries lớn
2. **Subsequent Loads**: Nhanh hơn do browser caching
3. **Furigana**: Load on-demand, không ảnh hưởng initial render

## Rollback Plan

Nếu deploy fail hoàn toàn, có thể disable furigana tạm thời:

```javascript
// In BlogDetail.jsx, comment out furigana initialization:
// useEffect(() => {
//   ... kuroshiro init code ...
// }, []);
```

Sau đó rebuild và deploy lại.
