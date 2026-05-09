# Word Islands Checkpoint

Date: 2026-05-09

## Project Boundary

- Correct project: `/Users/pauline/Documents/Playground/English_Learning-web`
- Server project: `/home/ubuntu/English_Learning`
- Do not touch: `/Users/pauline/Documents/Playground/ai-learning-platform-site`

## Current Goal

Upgrade Word Islands from a shared browser-local vocabulary tool into a multi-user site:

- Guests can search words and view study cards.
- Login/register is required for favorites and review queue.
- Each logged-in user sees only their own favorites.
- Old browser-local export can be imported, but only by the admin account.

## Work Completed Locally

### Account and Session API

Added server-side auth routes:

- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/me/route.ts`

Implemented lightweight server storage:

- `lib/server/auth-store.ts`
- `lib/server/api-auth.ts`

Storage defaults to:

- `.data/word-islands.json`

The `.data` directory is ignored by Git, so user data should not be committed.

### Favorites API

Added account-scoped favorites routes:

- `app/api/favorites/route.ts`
- `app/api/favorites/[slug]/route.ts`
- `app/api/favorites/import/route.ts`

Rules:

- `GET /api/favorites` requires login.
- `POST /api/favorites` requires login.
- `DELETE /api/favorites/[slug]` requires login.
- `POST /api/favorites/import` requires login and admin email.

### Frontend Wiring

Updated:

- `components/home-page.tsx`

Current behavior:

- Guest can still search words.
- Guest clicking favorite is directed to login/register.
- Logged-in user can favorite words.
- Logged-in user can mark reviewed and remove from review queue.
- Review queue is loaded from the server account.
- Admin-only import button appears only when `authUser.isAdmin` is true.

### Export File

The user downloaded:

- `/Users/pauline/Downloads/word-islands-export.json`

Detected shape:

```json
{
  "favorites": [],
  "history": [],
  "exportedAt": ""
}
```

The import flow currently reads `favorites` from this JSON.

## Required Environment Variables

Existing OpenRouter variables still apply:

```bash
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_HTTP_REFERER=https://wordislands.cn
OPENROUTER_TITLE=Word Islands
```

New admin variable:

```bash
WORD_ISLANDS_ADMIN_EMAILS=huang_xuefei@yeah.net
```

Optional DB path:

```bash
WORD_ISLANDS_DB_PATH=/home/ubuntu/English_Learning/.data/word-islands.json
```

If `WORD_ISLANDS_DB_PATH` is not set, the app uses `.data/word-islands.json` under the project root.

## Verification Already Run

These passed locally:

```bash
npm run typecheck
npm run build
git diff --check
```

Build output included new dynamic routes:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/register`
- `/api/favorites`
- `/api/favorites/[slug]`
- `/api/favorites/import`

Note: a local dev server smoke test was attempted on port `3020`, but the long-running dev process behaved inconsistently in this sandbox. Do not treat that as a product failure; the production build passed.

On 2026-05-09, verification was re-run after docs/env updates:

- `npm run typecheck` passed
- `npm run build` passed
- `git diff --check` passed

## Current Git State Notes

There were pre-existing dirty changes before this checkpoint. Do not revert them unless the user explicitly asks.

Known modified/untracked areas:

- `.gitignore`
- `.env.example`
- `README.md`
- `DEPLOY_TENCENT.md`
- `app/api/translate/route.ts`
- `components/home-page.tsx`
- `lib/search-history.ts`
- `app/error.tsx`
- `app/global-error.tsx`
- `app/api/auth/`
- `app/api/favorites/`
- `lib/server/`

## Next Session Steps

1. Re-open the correct repo:

```bash
cd /Users/pauline/Documents/Playground/English_Learning-web
```

2. Inspect diff before touching anything:

```bash
git status --short
git diff --stat
```

3. Run verification again:

```bash
npm run typecheck
npm run build
```

4. Locally test the auth/favorites flow if needed.

5. Set server env variable before deploy:

```bash
WORD_ISLANDS_ADMIN_EMAILS=huang_xuefei@yeah.net
```

6. Deploy to Tencent Cloud:

```bash
npm run build
sudo systemctl restart English_Learning
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8083
curl -I https://wordislands.cn
```

7. Register/login using the admin email `huang_xuefei@yeah.net`.

8. Import `/Users/pauline/Downloads/word-islands-export.json` through the admin-only import button.

## Important Product Decisions

- Login/register is required for saving favorites.
- Guests can search words without login.
- Admin import is not a general user feature.
- Existing UI style should remain: Word Islands, learning island concept, rounded cards, warm minimal palette.
- Do not redesign the site during this auth upgrade.
