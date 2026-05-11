# Word Islands Architecture

## 1. Product Shape

Word Islands is a personal English learning platform built around a Study Card, not just translation.

The user journey is:

1. Enter a word on the homepage
2. See a fast basic card immediately
3. Wait briefly while the full Study Card is generated or loaded from cache
4. Save the word into a personal review queue after login

## 2. Search Pipeline

### `/api/translate`

The translate route supports two modes:

- `basic`
- `study`

### Basic Mode

`basic` is designed for speed and returns a lightweight card with:

- title
- phonetics
- part of speech
- Chinese meaning
- English definition
- summary
- basic collocations

The homepage renders this first so the page never feels blank while waiting for the full Study Card.

### Study Mode

`study` uses DeepSeek to return the full structured Study Card, including:

- collocations
- examples
- similar words
- memory aids
- study notes

The route uses a strict JSON-only prompt and a minimal schema to keep parsing stable.

## 3. AI Provider

Current provider:

- DeepSeek official API
- Endpoint: `https://api.deepseek.com/chat/completions`
- Model: `deepseek-v4-flash`

The project no longer uses:

- OpenRouter
- Xiaomi fallback

## 4. Cache Design

Study cards are cached in:

```text
.word-islands-cache/study-cards.json
```

Cache keys are versioned. Current prefix:

```text
deepseek-v1
```

This was added so old OpenRouter-generated cache entries would not be reused after the provider switch.

## 5. Auth and Favorites

Server-side user data is stored in:

```text
.data/word-islands.json
```

This file holds:

- user accounts
- password hashes
- favorites
- review queue entries

Rules:

- guests can search
- login is required for favorites
- review queue is account-scoped
- only admin accounts can import legacy browser-local favorites JSON

## 6. Admin Stats

Site stats are stored separately from user data in:

```text
.data/word-islands-stats.json
```

This store tracks:

- `totalVisits`
- `uniqueVisitors`
- `visitorIds`
- `updatedAt`

Routes:

- `POST /api/stats/track`
- `GET /api/stats`

Behavior:

- every homepage visit calls `POST /api/stats/track`
- first-time visitors receive a long-lived `wordislands_visitor` cookie
- `GET /api/stats` is admin-only and returns:
  - `totalVisits`
  - `uniqueVisitors`
  - `registeredUsers`

The homepage renders these numbers as a low-profile footer line only when:

- the current session is logged in
- `authUser.isAdmin === true`
- `/api/stats` returns valid stats data

## 7. Frontend Responsibilities

The homepage is responsible for:

- rendering the search box
- performing `basic` then `study` fetches
- showing “Study Card 正在生成中” during the second phase
- rendering cached or freshly generated Study Cards
- wiring favorites and review actions to authenticated APIs
- calling `/api/stats/track` on load
- fetching `/api/stats` for admin sessions
- rendering the admin-only footer stats line

## 8. Operational Risk Areas

The most common failure modes are:

1. AI provider drift
   - code points to DeepSeek, but docs or env still refer to OpenRouter
2. stale cache contamination
   - old provider output appears because `.word-islands-cache` was not cleared
3. runtime mismatch
   - local file changed, but the server is still running an older build
4. accidental env overwrite
   - `.env.local` is replaced instead of safely updated
5. partial deploy
   - new routes are uploaded, but dependent files such as `api-auth.ts`, `auth-store.ts`, or `home-page.tsx` remain old
6. stale homepage HTML / chunk mismatch
   - `.next` contains new chunk names, but `curl http://127.0.0.1:3000` or the domain HTML still references old chunk files
7. browser cache after deploy
   - the server is healthy, but the browser keeps loading an old `/_next/static/...` asset set

## 9. Validation Checklist

Healthy study response:

```json
{
  "model": "deepseek-v4-flash",
  "source": "deepseek",
  "stage": "study"
}
```

Minimum production check:

1. site opens
2. guest search works
3. `/api/translate` returns `source: deepseek`
4. login still works
5. favorites remain user-scoped
6. `POST /api/stats/track` returns `{"ok":true}`
7. admin browser session gets `200` from `/api/stats`
8. homepage bottom text includes `总访问`
