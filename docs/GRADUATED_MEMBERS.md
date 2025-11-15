# Graduated Members Feature

## Overview
Tính năng hiển thị **卒業生 (Graduated Members)** - danh sách thành viên Nogizaka46 đã tốt nghiệp với dữ liệu blog archive từ local database.

## Visual Features

### Member Card Design
- **Grayscale filter**: Ảnh có filter xám 20% để phân biệt với current members
- **Graduation badge**: Badge "卒業" (Graduated) ở góc trên phải
- **Hover effect**: Khi hover, ảnh trở về màu bình thường
- **Graduation date**: Hiển thị ngày tốt nghiệp dưới tên

### Section Layout
- Collapsible card với icon star màu xám
- Hiển thị sau phần current members
- Có thể thu gọn/mở rộng
- Grid layout 5 cards/row (responsive)

## Graduated Members List

| Name | Generation | Graduation Date | Folder |
|------|-----------|-----------------|---------|
| 齋藤 飛鳥 (Saito Asuka) | 1期生 | 2023.01.28 | `asuka.saito` |
| 生田 絵梨花 (Ikuta Erika) | 1期生 | 2022.01.31 | `erika.ikuta` |
| 西野 七瀬 (Nishino Nanase) | 1期生 | 2018.09.02 | `nanase.nishino` |
| 山下 美月 (Yamashita Mizuki) | 3期生 | 2024.09.28 | `mizuki.yamashita` |
| 大園 桃子 (Oozono Momoko) | 3期生 | 2020.09.30 | `momoko.oozono` |
| 橋本 奈々未 (Hashimoto Nanami) | 1期生 | 2017.02.20 | `nanami.hashimoto` |

## How It Works

### 1. Data Loading
```javascript
// In MemberList component
useEffect(() => {
  // ... load current members from API
  
  // Load graduated members from local DB
  if (shouldUseLocalDB()) {
    const graduated = await loadAllGraduatedMembers();
    setGraduatedMembers(graduated);
  }
}, []);
```

### 2. Member Detection
System checks `blogdb/` folders and loads `member.json`:
```javascript
// graduatedMembersLoader.js
export const loadGraduatedMember = async (memberCode) => {
  const member = GRADUATED_MEMBERS.find(m => m.code === memberCode);
  const response = await fetch(`/blogdb/${member.folder}/member.json`);
  const data = await response.json();
  
  return {
    ...data,
    isGraduated: true,
    hasLocalData: true,
  };
};
```

### 3. Rendering
Graduated section renders conditionally:
```jsx
{graduatedMembers.length > 0 && (
  <ProCard title="卒業生" collapsible>
    <List dataSource={graduatedMembers} renderItem={...} />
  </ProCard>
)}
```

## Adding New Graduated Members

### Step 1: Prepare Data
Create folder structure:
```
blogdb/
└── [member-name]/
    ├── member.json
    ├── result.json
    ├── link.json (optional)
    └── img/
```

### Step 2: Add to Registry
Edit `src/utils/graduatedMembersLoader.js`:
```javascript
export const GRADUATED_MEMBERS = [
  // ... existing members
  {
    code: "12345",
    folder: "new.member",
    name: "新メンバー",
    englishName: "New Member",
    generation: "1期生",
    graduationDate: "2024.12.31",
    tags: ["1期生", "選抜メンバー"],
  },
];
```

### Step 3: Verify
1. Enable local DB: `VITE_USE_LOCAL_DB=true`
2. Run dev server: `npm run dev:full`
3. Navigate to `/members`
4. Check console: `✅ Loaded X graduated members from local DB`

## Translation Support

Graduated section supports JA/EN/VI:
```javascript
graduatedMembers: {
  ja: "卒業生",
  en: "Graduated Members",
  vi: "Thành viên đã tốt nghiệp",
},
graduated: {
  ja: "卒業",
  en: "Graduated",
  vi: "Đã tốt nghiệp",
}
```

## Styling Customization

### Change Grayscale Amount
Edit `src/components/MemberList.jsx`:
```jsx
style={{
  filter: "grayscale(20%)", // Change to 0-100%
}}
```

### Change Badge Style
Edit badge styling:
```jsx
<div className="graduated-badge"
  style={{
    background: "rgba(0,0,0,0.7)", // Customize color
    // ... other styles
  }}
>
```

### Card Hover Effects
Edit `src/App.css`:
```css
.graduated-card:hover .thumb img {
  filter: grayscale(0%) !important; /* Full color on hover */
}
```

## Performance

- **Lazy loading**: Graduated members only load when `shouldUseLocalDB() === true`
- **Parallel fetching**: Uses `Promise.allSettled()` for concurrent loads
- **Error resilient**: Failed member loads don't break the list
- **Cache-friendly**: Member data cached in component state

## Troubleshooting

### No graduated members showing
**Check:**
1. `VITE_USE_LOCAL_DB=true` in `.env`
2. Member folders exist in `blogdb/`
3. Console logs: Look for "✅ Loaded X graduated members"

### Member card broken
**Check:**
1. `member.json` format is correct
2. Image path in `member.json` exists
3. Browser console for 404 errors

### Wrong member info
**Check:**
1. `GRADUATED_MEMBERS` array has correct member code
2. Folder name matches member code mapping
3. Clear browser cache

## Future Enhancements

- [ ] Auto-detect graduated members from folder scan
- [ ] Search/filter graduated members separately
- [ ] Timeline view sorted by graduation date
- [ ] "Memorial" photo gallery for graduated members
- [ ] Integration with link.json for social media links

## License
Same as main project (MIT)
