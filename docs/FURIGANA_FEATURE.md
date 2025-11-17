# Tính năng Furigana (ふりがな)

## Tổng quan
Tính năng hiển thị phiên âm hiragana (furigana/ruby text) cho các chữ kanji trong blog tiếng Nhật, giúp người đọc dễ dàng biết cách đọc các chữ kanji phức tạp.

## Công nghệ sử dụng
- **kuroshiro**: Thư viện JavaScript chuyển đổi văn bản tiếng Nhật
- **kuroshiro-analyzer-kuromoji**: Bộ phân tích hình thái học cho tiếng Nhật

## Cách hoạt động

### 1. Khởi tạo (Initialization)
```javascript
// Tự động khởi tạo khi component mount
useEffect(() => {
  initKuroshiro().then(() => setKuroshiroReady(true));
}, []);
```

### 2. Toggle Furigana
- Nút "ふりがな" xuất hiện trong header khi:
  - Ngôn ngữ là tiếng Nhật (ja)
  - Kuroshiro đã sẵn sàng
  - Có nội dung blog
  
- Khi bật:
  - Quét toàn bộ HTML content
  - Tìm các text nodes có chứa kanji (U+4E00-U+9FAF)
  - Chuyển đổi sang dạng ruby HTML với hiragana
  - Bỏ qua tags `<script>`, `<style>`, `<ruby>` đã có

### 3. Format hiển thị
```html
<!-- Trước khi chuyển đổi -->
東京に行きました

<!-- Sau khi chuyển đổi -->
<ruby>東京<rt>とうきょう</rt></ruby>に<ruby>行<rt>い</rt></ruby>きました
```

## CSS Styling
Furigana được style với:
- Font size: 0.5em (nhỏ hơn 50% so với kanji)
- Màu: `#d2a86a` (dark mode) / `#8b4513` (light mode)
- Vị trí: Phía trên kanji (ruby-position: over)
- Letter spacing: 0.05em (giãn cách đều)
- User-select: none (không cho chọn khi copy)

## Hiệu năng
- **Lazy loading**: Chỉ chuyển đổi khi người dùng bật toggle
- **Caching**: Kết quả được cache trong component state
- **Reset tự động**: Clear cache khi chuyển blog khác

## Limitations
- Chỉ hoạt động với tiếng Nhật (language = "ja")
- Cần kết nối internet lần đầu để tải dictionary kuromoji (~5MB)
- Có thể sai với từ đặc biệt hoặc tên riêng

## Usage trong Components khác

### BlogDetailMobile
Cần thêm tương tự như BlogDetail:

```javascript
import { initKuroshiro, addFuriganaToHtml } from "../utils/furiganaHelper";

// Add states
const [showFurigana, setShowFurigana] = useState(false);
const [furiganaContent, setFuriganaContent] = useState("");

// Add toggle button
<Button onClick={() => setShowFurigana(!showFurigana)}>
  ふりがな
</Button>
```

## Dependencies
```json
{
  "kuroshiro": "^1.2.0",
  "kuroshiro-analyzer-kuromoji": "^1.1.0"
}
```

## Roadmap
- [ ] Thêm vào BlogDetailMobile
- [ ] Thêm vào BlogList preview
- [ ] Cache furigana trong localStorage
- [ ] Hỗ trợ romaji mode
- [ ] Cho phép click kanji để toggle từng chữ
