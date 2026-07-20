# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChordVault is a self-hosted chord sheet web app for musicians: store, transpose, and perform chord sheets. Backend is Node.js/Express with a single-file SQLite database (better-sqlite3, WAL mode); frontend is a React + TypeScript SPA (Vite). Chord parsing/transposition/Nashville numbers run client-side via ChordSheetJS — the server does light reads/writes only.

## Commands

### Setup
```bash
npm install                          # backend deps
cd frontend && npm install && cd ..  # frontend deps
cp .env.example .env                 # then set JWT_SECRET
```

### Development
```bash
npm run dev   # runs backend (node server.js) + Vite dev server concurrently, with hot reload
```
Backend runs on `http://localhost:3100`; Vite dev server proxies API calls there.

### Lint / Format
```bash
npm run lint                 # backend (eslint .)
npm run lint:fix
npm run format                # prettier --write on *.js, lib/**/*.js, routes/**/*.js
npm run format:check
cd frontend && npm run lint   # frontend (eslint src/)
cd frontend && npm run format
```

### Tests
```bash
npm test                         # backend: node --test test/*.test.js (all backend tests)
node --test test/songHash.test.js   # run a single backend test file
cd frontend && npm run test      # frontend: vitest run (all)
cd frontend && npm run test:watch
cd frontend && npx vitest run src/lib/__tests__/keys.test.ts   # a single frontend test file

# Smoke test (Playwright, requires a running server with built frontend)
cd frontend && npm run build && cd ..
JWT_SECRET=test node server.js &
npx playwright install chromium   # first time only
node test/smoke.js
```

### Build
```bash
cd frontend && npm run build   # tsc -b && vite build; outputs are served by Express from public/
```

A Husky pre-commit hook runs lint-staged (ESLint on staged backend/frontend files), TypeScript typecheck, and frontend unit tests before every commit — don't bypass it with `--no-verify`.

## Architecture

### Backend: factory router pattern
Each file in `routes/` exports a `createXxxRouter(deps)` function that returns an Express router; `server.js` wires them under `/api`. Dependencies (rate limiters, etc.) are injected at construction time rather than imported globally — follow this pattern for new route modules.

- `lib/db.js` — opens the SQLite DB, sets pragmas (WAL, foreign_keys), registers custom SQL functions (`search_text`, `search_lyrics` — used for FTS5 lyric search with a trigram tokenizer for CJK support), and defines the full schema (`CREATE TABLE IF NOT EXISTS ...`). This is the source of truth for the data model.
- `lib/models/` — model layer (`Song`, `User`) sitting between routes and raw SQL.
- `lib/auth.js` — JWT middleware: `requireAuth`, `requireAdmin`, `optionalAuth`.
- `lib/validation.js` — all input validators (e.g. `parseId`, `validateSongInput`, `parsePaginationParams`). Route handlers should call into here rather than inlining checks.
- `lib/constants.js` — shared constants (roles, status values, limits) — no magic strings/numbers in routes.
- `lib/errors.js` — `AppError` class and the central Express error handler (`errorHandler`, registered last in `server.js`).
- `lib/rateLimiter.js` — global + per-route limiters (see rate limit table in README's Security section); new `/api/*` routes are covered automatically by the global limiter unless skipped.
- `lib/demo.js` — demo-mode gating (used by the public demo instance).

Songs are stored internally as ChordPro text; `extractMetadata`/`extractDirective` helpers (in `routes/songs.js`) pull title/artist/key/bpm/tags/etc. out of ChordPro directives (`{title: ...}`, `{x_tags: ...}`) rather than requiring separate form fields. Multi-format input (chords-over-lyrics, Ultimate Guitar) is auto-detected and converted — conversion logic lives on the frontend (`frontend/src/lib/import.ts`), not the backend.

Song versioning uses self-referential `parent_id` on the `songs` table; community corrections reuse the same table with `status = 'pending'` and are promoted/rejected via the correction endpoints (see `resolveCorrectionWithAuth` in `routes/songs.js` for the ownership/admin check pattern).

### Frontend structure (`frontend/src/`)
- `views/` — page-level views (one per route: `BrowseView`, `SongView`, `SongEditView`, `SetlistPlayView`, `AdminView`, etc.)
- `components/` — reusable UI components
- `context/` — React Context providers for global state: `AuthContext`, `ThemeContext`, `ToastContext` (no Redux/state library)
- `hooks/` — custom hooks
- `lib/` — non-UI logic: `api.ts` (API client), `chords.ts`/`keys.ts` (transposition, Nashville numbers), `chordpro-lang.ts` (CodeMirror ChordPro language support), `import.ts` (format auto-detection/conversion), `pdf-export.ts`, `setlists.ts`, `storage.ts` (local/browser-only setlists)
- `types/` — TypeScript interfaces
- `styles/` — CSS, with theme variables in `variables.css` (use these custom properties rather than hardcoding colors)

Routing is hash-based (e.g. `#song/42`, `#setlist/42/play`), parsed in `App.tsx` — there is no router library.

The song editor is CodeMirror 6 with a custom ChordPro language/highlighting mode plus a live preview pane. OCR (image/PDF → chord sheet) calls Gemini Flash through the backend OCR proxy routes; API keys are stored per-user, AES-256-GCM encrypted, derived from `JWT_SECRET` (see `routes/settings.js`).

### Data model essentials
- `songs.visibility`: `public`/`private`; `songs.status`: `active`/`pending` (pending = an unapproved correction, linked via `parent_id`)
- `setlist_songs` carries per-entry playback overrides (`transpose`, `nashville`, `font`, `two_col`, `content_override`) distinct from the setlist's own settings
- Roles: `owner` / `admin` / `user` (see `lib/constants.js` and `isAdminRole()` in `lib/auth.js`)

## Conventions

- Prepared statements only (`db.prepare()`) — never string-interpolate SQL.
- Wrap multi-step DB operations in `db.transaction()`.
- All route params parsed via `parseId()` (rejects NaN).
- All user-supplied values escaped via `escHtml()` before rendering server-side.
- Single quotes, 2-space indent, trailing commas (Prettier-enforced).
- No `any` types in TypeScript (warn level).
- Content size limits, pagination, and other numeric limits belong in `lib/constants.js` / `frontend/src/lib/constants.ts`, not inline.
