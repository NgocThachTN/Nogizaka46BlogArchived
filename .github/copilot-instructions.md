# Nogizaka46 Blog Archive - AI Coding Instructions

## Project Overview
A React SPA that fetches and displays Nogizaka46 member blogs from the official website, with AI-powered Japanese→English/Vietnamese translation using Gemini API. Built with Vite + React 19 + Ant Design Pro, deployed on Vercel.

## Architecture & Critical Patterns

### Dual Proxy Architecture (Critical!)
The app uses **two different proxy systems** depending on environment:
- **Development**: Local Express proxy (`local-proxy-server.js` on port 3001) + Vite dev server proxy
- **Production**: Vercel serverless function (`api/proxy.js`) 
- **Why**: iOS Safari CORS blocks direct requests to `nogizaka46.com`. Proxy adds proper User-Agent and CORS headers.
- **Always use proxy**: `shouldUseProxy()` in `src/utils/deviceDetection.js` returns `true` for all environments

### Data Flow Pattern
1. **API calls flow**: Component → `blogService.js` → Device detection → Either `fetchWithProxy()` (iOS/production) OR direct `axios` (fallback)
2. **JSONP parsing**: Official site returns JSONP (`res({...})`). Strip wrapper: `.replace(/^res\(/, "").replace(/\);?$/, "")` before `JSON.parse()`
3. **Caching**: In-memory `Map` caches in `blogService.js` (10min TTL for members, permanent for blog details)

### API Structure (Official Nogizaka46)
- **Member List API**: `https://www.nogizaka46.com/s/n46/api/list/member?callback=res`
  - Returns array of members with `code`, `name`, `cate` (generation), `img`, `graduation`, etc.
  - Key field: `code` (member code, e.g., "36758")
  
- **Blog List API**: `https://www.nogizaka46.com/s/n46/api/list/blog?ima={timestamp}&rw={limit}&st={offset}&arti_code={memberCode}&callback=res`
  - `ima`: Unix timestamp (use `Math.floor(Date.now() / 1000)`)
  - `rw`: Results per page (default 32)
  - `st`: Offset for pagination (0, 32, 64...)
  - `arti_code`: Member code from member API (filters by member)
  - Returns array with `code` (blog ID), `title`, `text` (HTML), `img`, `date`, `arti_code`, `name` (author)
  
- **Blog Detail API**: `https://www.nogizaka46.com/s/n46/api/list/blog?ima={timestamp}&cd={blogId}&callback=res`
  - `cd`: Blog code/ID
  - Returns single-item array with full blog details

**Optimization principle**: Keep code simple, use direct API calls with proper params, minimize redundant logic.

### iOS 18+ Specific Workarounds
- **Extended timeouts**: 25s for iOS 18+, 20s for others (see `fetchWithProxy` in `src/api/proxy.js`)
- **Exponential backoff**: Retry with `Math.pow(2, attempt) * 1000 + attempt * 500` delay
- **Special headers**: `Sec-Fetch-*` headers required for iOS Safari (in `proxy.js`)
- **Known issue**: iOS detail page loading is buggy (see README roadmap)

### Translation System
- **Streaming translations**: Use `onProgress` callback in `GeminiTranslate.js` to update UI incrementally
- **Chunking**: Text split into 4000-char chunks with HTML tag preservation (`splitTextIntoChunks`)
- **Vietnamese style guide**: Use "mình" (I/me), "mọi người" (fans), never "ạ/nhé". Keep idol diary tone.
- **Title cleaning**: `cleanTitleTranslation()` removes instruction artifacts from Gemini responses

## Development Workflows

### Starting Development
```bash
npm run dev:full   # Starts BOTH proxy server AND Vite (required for iOS testing)
npm run dev        # Vite only (won't work on iOS/Safari without proxy)
npm run proxy      # Proxy only (for debugging proxy issues)
```

**Never use `npm run dev` alone** - the proxy is required for the app to work correctly.

### Build & Deploy
```bash
npm run build      # Vite production build with Terser minification
npm run preview    # Test production build locally
```

**Vercel config**: See `vercel.json` for:
- API routes timeout (30s)
- SPA fallback rewrite rules (important for React Router)
- CORS headers for `/api/*` routes

### Environment Variables
Required in `.env`:
```env
VITE_GEMINI_API_KEY=your_key_here
```

Accessed via `import.meta.env.VITE_*` (Vite convention). See `src/config/env.js` for validation.

## Component Patterns

### Mobile/Desktop Duality
- Desktop: `BlogList.jsx`, `BlogDetail.jsx`  
- Mobile: `BlogListMobile.jsx`, `BlogDetailMobile.jsx`
- Routing: Conditional render based on `window.innerWidth < 768` (see `App.jsx` routes)
- Layout: Desktop uses `ProLayout` sidebar with `MemberProfile`, mobile uses `PageContainer`

### Styling Approach
- **Primary**: Ant Design Pro components + ConfigProvider theming (see `App.jsx` `tokens` and `componentTokens`)
- **Secondary**: Tailwind utility classes (configured to not conflict: `preflight: false` in `tailwind.config.js`)
- **Theme**: "book-background" aesthetic with light/dark modes. Colors: `#8B4513` (brown) light, `#9c6b3f` dark
- **Japanese fonts**: Auto-detected in `optimizeHtmlContent()` - applies `'Noto Sans JP'` stack to Japanese text

### i18n Pattern
- **No library**: Manual translation objects like `const t = { searchPlaceholder: { ja: "...", en: "...", vi: "..." } }`
- **Access**: `t.searchPlaceholder[language]`
- **State**: Language stored in component state, passed to children as props

## File Locations & Responsibilities

### Critical Files
- `src/services/blogService.js` - All data fetching, caching, HTML optimization
- `src/api/proxy.js` - Client-side proxy helper (creates `/api/proxy?url=...` requests)
- `src/api/GeminiTranslate.js` - Translation logic with Vietnamese style rules
- `src/utils/deviceDetection.js` - iOS detection, User-Agent selection, proxy decision
- `api/proxy.js` - Vercel serverless proxy (production)
- `local-proxy-server.js` - Express dev proxy (development)

### Routing Structure
```
/ → redirect to /members
/members → MemberList (desktop) | MemberListMobile
/blogs/:memberCode → BlogList | BlogListMobile  
/blog/:id → BlogDetail (no mobile variant - same for both)
```

## Common Pitfalls

1. **Don't bypass proxy**: Direct `axios` calls to `nogizaka46.com` will fail on iOS. Always use `fetchWithProxy()` or `blogService.js` methods.
2. **Don't forget JSONP parsing**: Raw API responses are `res({...})` not pure JSON.
3. **HTML optimization required**: Blog content has relative image URLs - must run through `optimizeHtmlContent()` to convert to absolute paths.
4. **Chunk size matters**: Gemini has input limits - keep chunks under 4000 chars but preserve HTML tag structure.
5. **Cache busting**: Member API cache is 10min. If data seems stale, check `MEMBER_CACHE_MS` in `blogService.js`.
6. **Vercel rewrites**: Changes to routing? Update `vercel.json` rewrite rules for SPA fallback.
7. **Keep code simple**: Avoid over-engineering. Use direct API params (`arti_code` for member blogs) instead of complex filtering logic.

## Code Optimization Principles

- **Simplicity first**: Write straightforward code that's easy to maintain and debug
- **Direct API usage**: Use API parameters correctly (e.g., `arti_code` filters by member automatically)
- **Minimize logic**: Let the API do the work - don't filter data client-side if API supports it
- **Cache strategically**: Cache expensive operations (member list, blog details) but not frequently changing data
- **Error handling**: Fail gracefully with fallback values, log errors clearly for debugging

## Testing Considerations

- **iOS Safari**: Primary target due to CORS issues. Test on real device or iOS Simulator.
- **Firefox**: Known partial support issues (see README roadmap).
- **Mobile breakpoint**: 768px is the desktop/mobile cutoff.
- **Translation quality**: Vietnamese translations should sound like an idol's diary, not formal text.

## Code Style Notes

- **Comments in code**: Mix of English and Vietnamese (keep existing style)
- **Console warnings**: `console.warn()` for missing API keys, `console.error()` for fetch failures
- **Error handling**: Try-catch with fallback values (return `[]` or `null` instead of throwing)
- **Async patterns**: Use `Promise.all()` for parallel fetches (see `fetchAllBlogs` pagination)
