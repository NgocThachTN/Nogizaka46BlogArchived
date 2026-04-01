# Project Structure

## Muc tieu

Project da duoc refactor lai theo huong folder structure ban yeu cau, nhung van giu nguyen runtime hien tai cua repo nay: `Vite + React Router`, khong ep chuyen sang `Next.js`.

## Root

- `.agent/`: cau hinh agent.
- `.github/`: workflow va rule cho GitHub.
- `.vscode/`: thu muc workspace local.
- `docs/`: tai lieu du an.
- `public/`: static assets va local data.
- `src/`: source code chinh.
- `globals.css`: global stylesheet duoc import tu `src/app/main.tsx`.
- `proxy.ts`: local proxy server cho moi truong dev.
- `eslint.config.mjs`, `postcss.config.mjs`, `vite.config.ts`, `tailwind.config.ts`: tool configs.

## src

- `src/app/`: app shell va entrypoint cua ung dung.
  - `App.tsx`: root app component.
  - `App.css`: app-level styles.
  - `main.tsx`: Vite entry file.
- `src/components/`: de trong cho shared components moi trong tuong lai.
- `src/features/`: code duoc chia theo feature.
  - `src/features/blogs/`: blog listing, blog detail, calendar, vocab, furigana.
  - `src/features/members/`: member list, member profile, graduated members data.
  - `src/features/translation/`: translation services va Gemini/Google integrations.
- `src/lib/`: helpers dung chung toan app.
  - `src/lib/api/`: generic API helpers.
  - `src/lib/config/`: env/config access.
  - `src/lib/utils/`: shared utility functions.
- `src/shared/`: tai nguyen dung chung khong thuoc mot feature cu the.
  - `src/shared/assets/`
  - `src/shared/components/`

## Ghi chu

- Repo goc khong phai Next.js app, vi vay cac muc nhu `src/app/(auth)` hay `src/app/api` khong duoc tao gia lap.
- Repo da duoc doi sang TypeScript cho app source, API routes va cac runtime/config file chinh.
- Cac duong dan import da duoc cap nhat de khong thay doi behavior.
