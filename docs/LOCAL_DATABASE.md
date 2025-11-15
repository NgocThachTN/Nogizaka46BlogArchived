# Local Blog Database - Usage Guide

## Overview
Hệ thống **ngoại lệ đọc dữ liệu local** cho phép ứng dụng đọc blog từ folder `blogdb/` thay vì gọi API online. Điều này hữu ích cho:
- ✅ Testing với dữ liệu archived
- ✅ Development offline
- ✅ Backup members đã graduate
- ✅ Tăng tốc load time (không cần proxy/API calls)
- ✅ **Graduated Members section** - Hiển thị riêng thành viên đã tốt nghiệp

## Features

### 1. Graduated Members List
Tự động hiển thị section "卒業生 (Graduated Members)" trong MemberList với:
- Badge "卒業" (Graduated) 
- Grayscale filter cho ảnh
- Graduation date display
- Local database priority loading

### 2. Blog Archive Access
Members đã graduate vẫn truy cập được blog archive từ local files.

## Folder Structure
```
blogdb/
├── asuka.saito/
│   ├── member.json      # Thông tin member
│   ├── result.json      # Danh sách blog (REQUIRED)
│   ├── link.json        # Social links
│   └── img/             # Image assets
│       ├── files/
│       └── images/
├── erika.ikuta/
└── [other-members]/
```

## Data Format

### `result.json` (Blog List)
**Array of blog objects:**
```json
[
  {
    "datetime": "2022.12.26 19:40",
    "title": "Blog title here...",
    "content": "<div>HTML content with relative img paths</div>",
    "url": "https://www.nogizaka46.com/s/n46/diary/detail/100996"
  }
]
```

**Important:** 
- Image paths in `content` should be relative: `img/files/...` → Auto-converted to `/blogdb/[folder]/img/files/...`
- URL must contain blog ID (extracted from `/detail/(\d+)` pattern)

### `member.json` (Member Info)
```json
{
  "name": "齋藤 飛鳥",
  "name_hiragana": "さいとう あすか",
  "intro": [
    {"key": "生年月日", "value": "1998年8月10日"},
    {"key": "血液型", "value": "O型"}
  ],
  "image": "img/images/46/83c/8edd4e0d72fd9bc2f6b7aed33ea56.jpg",
  "tag": []
}
```

### `link.json` (Social Links)
```json
[
  {
    "type": "instagram",
    "link": "https://www.instagram.com/asuka.3110.official/"
  }
]
```

## How to Enable

### Method 1: Environment Variable (Recommended)
Edit `.env`:
```env
VITE_USE_LOCAL_DB=true
```

### Method 2: Auto-Enable in Development
Local DB tự động bật khi chạy `npm run dev` (không cần config).

### Method 3: Production Override
Thêm vào `.env.production`:
```env
VITE_USE_LOCAL_DB=true
```

## Priority Logic
```
1. Check if shouldUseLocalDB() === true
   ├─ Yes → Try local blogdb/[folder]/result.json
   │         ├─ Found data → Use local ✅
   │         └─ Empty/Error → Fallback to API ⚠️
   └─ No → Use online API directly
```

## Member Code Mapping
```javascript
const GRADUATED_MEMBERS = [
  {
    code: "36758",
    folder: "asuka.saito",
    name: "齋藤 飛鳥",
    englishName: "Saito Asuka",
    generation: "1期生",
    graduationDate: "2023.01.28",
  },
  {
    code: "13470",
    folder: "erika.ikuta",
    name: "生田 絵梨花",
    englishName: "Ikuta Erika",
    generation: "1期生",
    graduationDate: "2022.01.31",
  },
  // ... more members
];
```

Để thêm graduated member mới:
1. Tạo folder trong `blogdb/[member-name]/`
2. Add data files (`member.json`, `result.json`)
3. Update `GRADUATED_MEMBERS` array in `src/utils/graduatedMembersLoader.js`

## Testing

### 1. Prepare Test Data
Copy example format:
```bash
cp blogdb/asuka.saito/result.example.json blogdb/asuka.saito/result.json
```

### 2. Enable Local DB
```bash
echo "VITE_USE_LOCAL_DB=true" >> .env
```

### 3. Run Dev Server
```bash
npm run dev:full
```

### 4. Open Browser
Navigate to member page (e.g., `/blogs/36758` for Asuka Saito)

### 5. Check Console
Look for these logs:
```
🗂️ Attempting to load from local DB: asuka.saito
✅ Loaded 2 blogs from local DB
```

## Image Path Handling

**Original (in result.json):**
```html
<img src="img/files/46/diary/n46/MEMBER/moblog/202212/mobUjir9B.jpg">
```

**Auto-converted to:**
```html
<img src="/blogdb/asuka.saito/img/files/46/diary/n46/MEMBER/moblog/202212/mobUjir9B.jpg">
```

**Ensure images are placed correctly:**
```
blogdb/asuka.saito/img/files/46/diary/...
```

## Performance Benefits

| Source | Load Time | Requests | CORS Issues |
|--------|-----------|----------|-------------|
| Online API | ~3-5s | 10-20 | iOS Safari ❌ |
| Local DB | ~0.2-0.5s | 0 | None ✅ |

## Troubleshooting

### ⚠️ "Local DB empty, falling back to API"
**Cause:** `result.json` is empty `[]` or invalid JSON  
**Fix:** Populate with valid blog data (see format above)

### ⚠️ Images not showing
**Cause:** Image paths don't match folder structure  
**Fix:** Check that `img/` folder exists and paths are correct

### ⚠️ Blog ID not found
**Cause:** URL doesn't contain `/detail/(\d+)` pattern  
**Fix:** Ensure `url` field in `result.json` has proper format

### ⚠️ Member not loading
**Cause:** `member.json` missing or invalid  
**Fix:** Create `member.json` with required fields

## API Reference

### `shouldUseLocalDB(): boolean`
Determines if local database should be used

### `loadLocalBlogs(folderName): Promise<Array>`
Load all blogs from `result.json` for a member

### `loadLocalMemberInfo(folderName): Promise<Object>`
Load member info from `member.json`

### `getFolderFromMemberCode(code): string|null`
Convert member code to folder name

### `getMemberCodeFromFolder(folder): string|null`
Convert folder name to member code

## Notes

- ⚠️ Local DB data must be manually updated (not synced with online API)
- ✅ Good for archived/graduated members who no longer have active blogs
- ✅ Can mix local + online: Some members from local, others from API
- ⚠️ Production build requires `public/blogdb/` or CDN hosting for images

## Example: Adding New Member

1. Create folder:
```bash
mkdir blogdb/minami.hoshino
```

2. Add member.json:
```json
{
  "name": "星野 みなみ",
  "name_hiragana": "ほしの みなみ",
  "image": "img/member.jpg"
}
```

3. Add result.json with blogs (array format)

4. Update `localBlogLoader.js`:
```javascript
const MEMBER_FOLDER_MAP = {
  // ... existing
  "minami.hoshino": ["星野 みなみ", "Hoshino Minami"],
};

const CODE_MAP = {
  // ... existing  
  "13477": "minami.hoshino",
};
```

5. Test:
```bash
VITE_USE_LOCAL_DB=true npm run dev
```

## License
Same as main project
