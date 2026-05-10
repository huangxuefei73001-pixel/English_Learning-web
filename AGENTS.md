# Word Islands Agent Notes

## Project Boundary

- Correct repo: `/Users/pauline/Documents/Playground/English_Learning-web`
- Tencent Cloud deploy path: `/home/ubuntu/English_Learning`
- Do not touch: `/Users/pauline/Documents/Playground/ai-learning-platform-site`

## Product Summary

Word Islands is an English learning website with a two-stage lookup flow:

1. `basic` returns a fast, lightweight vocabulary card
2. `study` returns the full Study Card with examples, synonym contrast, memory aid, and study notes

Guests can search. Login is required for favorites and review queue.

## Current AI Provider

- Provider: DeepSeek official API only
- URL: `https://api.deepseek.com/chat/completions`
- Model: `deepseek-v4-flash`

Do not reintroduce:

- OpenRouter
- Xiaomi fallback
- `deepseek-chat`
- `deepseek-reasoner`
- `deepseek-v4-pro`

## Important Storage

- User data: `.data/word-islands.json`
- Study cache: `.word-islands-cache/study-cards.json`

Study cache currently uses versioned keys with the prefix:

- `deepseek-v1`

This exists to prevent old OpenRouter cache entries from being reused.

## High-Risk Deployment Notes

- Never overwrite `.env.local` blindly on the server
- Back up `.env.local` before editing
- If server code and runtime output disagree, verify both:
  - `grep -n 'DEEPSEEK\\|OPENROUTER\\|XIAOMI' app/api/translate/route.ts`
  - `curl -s http://127.0.0.1:3000/api/translate ...`
- If a word returns old provider data, clear `.word-islands-cache/` before assuming the code is wrong

## Verification

Local:

```bash
npm run build
npm run typecheck
```

Server:

```bash
curl -s http://127.0.0.1:3000/api/translate -H 'Content-Type: application/json' -d '{"query":"obsolete","mode":"study"}'
```

Success must include:

```json
"source":"deepseek"
```

## UI Guardrails

- Keep the existing Word Islands visual language
- Do not redesign the site unless the user explicitly asks
- Preserve the Study Card as the product differentiator
- Avoid reintroducing the large account panel or Study Card Preview block that the user asked to remove
