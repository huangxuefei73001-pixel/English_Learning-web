# Word Islands Checkpoint

Date: 2026-05-10

## Project Boundary

- Correct project: `/Users/pauline/Documents/Playground/English_Learning-web`
- Server project: `/home/ubuntu/English_Learning`
- Do not touch: `/Users/pauline/Documents/Playground/ai-learning-platform-site`

## Current Product State

Word Islands is now running as a multi-user English learning site:

- Guests can search words and view Study Cards
- Login/register is required for favorites and review queue
- Each logged-in user sees only their own favorites
- Old browser-local export can be imported, but only by the admin account
- Homepage uses a two-stage word lookup flow: `basic` first, then `study`
- Study Card generation is now powered by DeepSeek official API

## Work Completed

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

### AI Provider and Study Card Flow

Current provider:

- DeepSeek official API
- `DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions`
- `DEEPSEEK_MODEL=deepseek-v4-flash`

Current lookup behavior:

- `mode: "basic"` returns a fast lightweight card
- `mode: "study"` returns the full Study Card

Study Card cache:

- File: `.word-islands-cache/study-cards.json`
- Cache key prefix: `deepseek-v1`

The versioned cache prefix was added because old OpenRouter cache entries were being reused even after the provider switch.

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

Current AI variables:

```bash
DEEPSEEK_API_KEY=...
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-v4-flash
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

Build output included the auth/favorites routes and `/api/translate`.

- `npm run build` passed
- `npm run typecheck` passed

Server-side verification also passed after the DeepSeek switch:

```bash
curl -s http://127.0.0.1:3000/api/translate -H 'Content-Type: application/json' -d '{"query":"obsolete","mode":"study"}'
```

and

```bash
curl -s http://127.0.0.1:3000/api/translate -H 'Content-Type: application/json' -d '{"query":"salient","mode":"study"}'
```

Both returned:

- `source: "deepseek"`
- `model: "deepseek-v4-flash"`
- `stage: "study"`

## Current Git State Notes

As of this checkpoint, the repository was clean locally before this documentation sync.

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

4. If the server behaves like it is still on an old provider, inspect:

```bash
grep -n 'DEEPSEEK\\|OPENROUTER\\|XIAOMI' app/api/translate/route.ts
```

5. If a word still shows old provider data, clear the Study Card cache:

```bash
rm -rf .word-islands-cache
```

6. Set server env variable before deploy:

```bash
WORD_ISLANDS_ADMIN_EMAILS=huang_xuefei@yeah.net
```

7. Deploy to Tencent Cloud:

```bash
npm run build
sudo systemctl restart English_Learning
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8083
curl -I https://wordislands.cn
```

8. Register/login using the admin email `huang_xuefei@yeah.net`.

9. Import `/Users/pauline/Downloads/word-islands-export.json` through the admin-only import button if needed.

## Important Product Decisions

- Login/register is required for saving favorites.
- Guests can search words without login.
- Admin import is not a general user feature.
- DeepSeek is the only active AI provider.
- Old OpenRouter cache entries must not be trusted after provider changes.
- Existing UI style should remain: Word Islands, learning island concept, rounded cards, warm minimal palette.
- Do not redesign the site during this auth upgrade.
