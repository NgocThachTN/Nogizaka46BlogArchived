# Nogizaka46 Blog Archived

> Fetch Nogizaka46 members’ blogs from the official site, with automatic multilingual translation via **Gemini API**.

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-contributing)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)
![Ant Design Pro](https://img.shields.io/badge/UI-Ant%20Design%20Pro-0170fe)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000)

---

## ✨ Overview

- Mock Data from official Nogizaka46 blog content for fans.
- One-click **Japanese → English & Vietnamese** translations (Gemini).
- Fast, mobile-first UI built on React + Vite + Ant Design Pro.

---

## 🎯 Features

- Member list & blog detail pages
- Auto translation **JA → EN/VI**
- Client-side caching & smooth navigation
- SPA routing ready for Vercel
- Basic i18n setup with language switcher
- **🗂️ Local Database Support** – Load archived blogs from local files (see [docs/LOCAL_DATABASE.md](docs/LOCAL_DATABASE.md))
- **🎓 Graduated Members Section** – Display alumni members with archive blogs (see [docs/GRADUATED_MEMBERS.md](docs/GRADUATED_MEMBERS.md))

---

## ⚙️ Tech Stack

- **React + Vite** – modern frontend with hot reload  
- **Ant Design Pro Components** – clean, consistent UI  
- **Axios + Cheerio** – crawl & parse official blog data  
- **i18n** – JA/EN/VI  
- **Gemini API** – automatic translations with **load balancing** (supports up to 2 API keys)

## 🛠 Scripts
- `npm i` – install essential library 
- `npm run dev:full` – start dev server and proxy server (without :full you cannot run web in localhost:5173)
- `npm run build` – create production build  
- `preview` – serve built app  
- `lint` – optional (if configured)

---

## 🔑 API Key Configuration

**Multiple API Keys Support (NEW!)** – The system now supports up to 2 Gemini API keys for load balancing.

### How it works:
- **Single key**: Use `VITE_GEMINI_API_KEY` only - works as before
- **Dual keys**: Add `VITE_GEMINI_API_KEY_2` - system automatically rotates between keys
- **Rotation logic**: Each blog translation uses a different key (Blog 1 → Key 1, Blog 2 → Key 2, Blog 3 → Key 1, ...)

### Setup:
```bash
# .env file
VITE_GEMINI_API_KEY=your_first_api_key_here
VITE_GEMINI_API_KEY_2=your_second_api_key_here  # Optional
```

**Benefits:**
- ✅ Avoid rate limits when translating many blogs
- ✅ Better reliability (fallback if one key hits quota)
- ✅ Faster parallel translations
- ✅ Automatic rotation - no manual switching needed

---

## 🗂️ Local Database Exception

**NEW:** Load blogs from local `blogdb/` folder instead of online API!

Perfect for:
- ✅ Testing with archived data
- ✅ Offline development  
- ✅ Graduated members backup

**Quick start:**
```bash
# Enable local database mode
echo "VITE_USE_LOCAL_DB=true" >> .env

# Add your blog data to blogdb/[member-folder]/result.json
# See docs/LOCAL_DATABASE.md for format & instructions
```

📖 **Full documentation:** [docs/LOCAL_DATABASE.md](docs/LOCAL_DATABASE.md)

---

## 🌍 i18n Usage (quick)

- Default language via `VITE_I18N_DEFAULT_LANG`  
- Language switcher toggles **ja / en / vi**  
- Add new keys in `src/i18n/*.json`

## 🧩 Known Issues
- Since the 6th generation (6期生) joined less than a year ago, there are currently no individual blogs available for its members.  
This project only provides blog translation from the 5th generation (5期生) and earlier.

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



