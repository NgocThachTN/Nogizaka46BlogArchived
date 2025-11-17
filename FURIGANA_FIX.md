# Furigana SSR Fix - Vercel Deployment Issue

## Vấn đề (Problem)
Khi deploy lên Vercel, tính năng furigana bị loading mãi không dừng. Nguyên nhân là code furigana đang cố gắng chạy trong môi trường server-side rendering (SSR), nơi không có `document` và `window` APIs.

## Giải pháp (Solution)

### 1. Cập nhật `src/utils/furiganaHelper.js`
Đã thêm kiểm tra môi trường browser vào tất cả các hàm:

```javascript
// Check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';
```

**Các thay đổi chính:**
- ✅ `initKuroshiro()` - Chỉ khởi tạo trong browser
- ✅ `convertToFurigana()` - Kiểm tra browser trước khi xử lý
- ✅ `addFuriganaToHtml()` - Kiểm tra browser trước khi dùng `document.createElement()`
- ✅ `toggleFurigana()` - Kiểm tra browser trước khi thao tác DOM

**Cơ chế hoạt động:**
- Khi code chạy trên server (SSR), các hàm sẽ trả về giá trị gốc (không xử lý furigana)
- Khi code chạy trên browser, các hàm hoạt động bình thường
- Timeout giảm từ 60s xuống 30s để tránh chờ quá lâu

### 2. Cập nhật `vite.config.js`
Đã thêm cấu hình để:
- Tách Kuroshiro thành chunk riêng cho lazy loading
- Đánh dấu Kuroshiro packages là external cho SSR

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'furigana': ['kuroshiro', 'kuroshiro-analyzer-kuromoji'],
      },
    },
  },
},
ssr: {
  external: ['kuroshiro', 'kuroshiro-analyzer-kuromoji'],
},
```

## Cách hoạt động sau khi fix

1. **Trên Vercel (SSR):**
   - Page được render trên server KHÔNG có furigana
   - Không có lỗi, không bị loading mãi
   - HTML trả về nhanh chóng

2. **Trên Browser (Client):**
   - User thấy nội dung blog ngay lập tức
   - Khi user click nút "ふりがな", Kuroshiro mới được khởi tạo
   - Kuroshiro tải dictionary và xử lý content
   - Furigana được hiển thị

## Kiểm tra (Testing)

### Local Test:
```bash
npm run build
npm run preview
```
- Mở http://localhost:4173
- Kiểm tra một blog post
- Thử click nút furigana

### Production Test (sau khi deploy):
1. Mở bất kỳ blog post nào
2. Kiểm tra page load nhanh không bị stuck
3. Click nút "ふりがな" 
4. Đợi ~3-5 giây để Kuroshiro load
5. Kiểm tra furigana hiển thị đúng

## Deploy lên Vercel

```bash
git add .
git commit -m "Fix: Prevent furigana from blocking SSR on Vercel"
git push origin main
```

Vercel sẽ tự động deploy. Sau khi deploy xong:
- ✅ Page load nhanh
- ✅ Không bị loading mãi
- ✅ Furigana hoạt động khi user click nút

## Các cải tiến thêm (nếu vẫn còn chậm)

Nếu furigana vẫn chậm khi click nút, có thể:

1. **Prefetch dictionary khi user hover nút:**
```javascript
<Button 
  onMouseEnter={() => initKuroshiro()}
  onClick={() => setShowFurigana(true)}
>
```

2. **Cache furigana content vào localStorage:**
```javascript
const cacheKey = `furigana:${blog.id}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  setFuriganaContent(cached);
} else {
  const result = await addFuriganaToHtml(blog.content);
  localStorage.setItem(cacheKey, result);
  setFuriganaContent(result);
}
```

3. **Service Worker để cache dictionary:**
```javascript
// Cache kuromoji dictionary files
workbox.routing.registerRoute(
  /kuromoji.*dict/,
  new workbox.strategies.CacheFirst()
);
```

## Kết luận

Fix này đảm bảo:
- ✅ SSR không bị block bởi furigana code
- ✅ Page load nhanh trên Vercel
- ✅ Furigana vẫn hoạt động tốt trên client
- ✅ Không có breaking changes cho user experience
- ✅ Code sạch và maintainable

## Tài liệu tham khảo

- Kuroshiro: https://github.com/hexenq/kuroshiro
- Vite SSR: https://vitejs.dev/guide/ssr.html
- Vercel Deployment: https://vercel.com/docs

