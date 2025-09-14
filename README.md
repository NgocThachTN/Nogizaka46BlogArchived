# Nogizaka46 Blog Archived

> Fetch & preserve Nogizaka46 members’ blogs from the official site, with automatic multilingual translation via **Gemini API**.

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-contributing)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)
![Ant Design Pro](https://img.shields.io/badge/UI-Ant%20Design%20Pro-0170fe)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000)

---

## ✨ Overview

- Archives official Nogizaka46 blog content for fans.
- One-click **Japanese → English & Vietnamese** translations (Gemini).
- Fast, mobile-first UI built on React + Vite + Ant Design Pro.

---

## 🎯 Features

- Member list & blog detail pages
- Auto translation **JA → EN/VI**
- Client-side caching & smooth navigation
- SPA routing ready for Vercel
- Basic i18n setup with language switcher

---

## ⚙️ Tech Stack

- **React + Vite** – modern frontend with hot reload  
- **Ant Design Pro Components** – clean, consistent UI  
- **Axios + Cheerio** – crawl & parse official blog data  
- **i18n** – JA/EN/VI  
- **Gemini API** – automatic translations
## 🛠 Scripts
-- `npm i` – install essential library 
- `npm run dev` – start dev server  
- `npm run build` – create production build  
- `preview` – serve built app  
- `lint` – optional (if configured)

## 🌍 i18n Usage (quick)

- Default language via `VITE_I18N_DEFAULT_LANG`  
- Language switcher toggles **ja / en / vi**  
- Add new keys in `src/i18n/*.json`

## 🧩 Known Issues

- **iOS blog pages don’t load** (Safari/Chrome on iPhone).  
  _Status_: pending fix (khi nào rảnh sẽ xử).  
  _Workaround_: dùng Android hoặc desktop browsers.

- **Firefox not supported for now.**  
  _Reason_: vài API/render path cần chỉnh tương thích.  
  _Use_: **Chrome / Edge / Safari (desktop)** recommended.

## 🧰 Troubleshooting

- Hard refresh after deploy (`Cmd/Ctrl + Shift + R`)  
- Ensure rewrite to `/index.html` exists on Vercel  
- If fetch blocked: run behind your own proxy (set `VITE_API_BASE`)  
- Check console/network logs for CORS/UA blocks from the source site

## 🗺 Roadmap

- [ ] Fix iOS loading issue on blog detail  
- [ ] Full Firefox support  
- [ ] Offline cache & smarter prefetch  
- [ ] Advanced search & filters (member, date, keyword)  
- [ ] Unit tests for parsing & i18n

## 🤝 Contributing

1. Fork & create a feature branch  
2. Commit with clear messages  
3. Open a PR (include screenshots if UI)  
4. We discuss, you ship 🚀

## 📜 License

MIT — use freely, keep the notice.

## 🙏 Credits

- Official Nogizaka46 website (source content)  
- Google Gemini API for translations  
- Ant Design Pro for UI kit



