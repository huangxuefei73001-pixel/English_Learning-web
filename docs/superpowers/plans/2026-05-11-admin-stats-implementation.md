# Admin Stats Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-only homepage metrics for total visits, cumulative unique visitors, and registered users without changing any other Word Islands behavior.

**Architecture:** Add one isolated server-side stats store backed by a dedicated JSON file, expose two narrow API routes for tracking and reading stats, and append one subtle footer line to the homepage that only renders for the logged-in admin. Keep visit tracking fire-and-forget so stats failures never block search, auth, favorites, or Study Card behavior.

**Tech Stack:** Next.js App Router, React client component, TypeScript, local JSON storage in `.data/`

---

### Task 1: Add a dedicated server-side stats store

**Files:**
- Create: `lib/server/stats-store.ts`
- Modify: `lib/server/auth-store.ts`

- [ ] **Step 1: Add stats storage helpers**

Create `lib/server/stats-store.ts` with a dedicated file path, default shape, atomic writes, and visitor-id tracking.

Key exports:

```ts
export type SiteStats = {
  totalVisits: number;
  uniqueVisitors: number;
  visitorIds: string[];
  updatedAt: string;
};

export const VISITOR_COOKIE = "wordislands_visitor";

export function trackVisit(visitorId: string): SiteStats;
export function readStats(): SiteStats;
export function ensureVisitorId(existing: string | undefined): {
  visitorId: string;
  isNewCookie: boolean;
};
```

- [ ] **Step 2: Add registered-user counting helper**

Add one narrow helper to `lib/server/auth-store.ts`:

```ts
export function countRegisteredUsers() {
  return readDb().users.length;
}
```

- [ ] **Step 3: Verify types still compile**

Run:

```bash
npm run typecheck
```

Expected: success with no TypeScript errors

### Task 2: Add tracking and admin read APIs

**Files:**
- Create: `app/api/stats/route.ts`
- Create: `app/api/stats/track/route.ts`
- Modify: `lib/server/api-auth.ts`

- [ ] **Step 1: Add admin-check helper**

Extend `lib/server/api-auth.ts` with a tiny helper:

```ts
export function requireAdmin() {
  const user = getCurrentUser();

  if (!user?.isAdmin) {
    return {
      user: null,
      response: NextResponse.json({ error: "无权限查看站点统计。" }, { status: 403 }),
    };
  }

  return { user, response: null };
}
```

- [ ] **Step 2: Add track route**

Create `app/api/stats/track/route.ts` as a `POST` route that:

- reads existing visitor cookie
- creates one if missing
- updates total visits and unique visitors
- sets the cookie if newly created
- returns a small success payload

Minimal response shape:

```ts
return NextResponse.json({ ok: true });
```

- [ ] **Step 3: Add admin stats route**

Create `app/api/stats/route.ts` as a `GET` route that:

- requires admin
- loads stats from `stats-store`
- loads registered user count from `countRegisteredUsers()`
- returns:

```ts
{
  totalVisits: number;
  uniqueVisitors: number;
  registeredUsers: number;
}
```

- [ ] **Step 4: Verify routes compile**

Run:

```bash
npm run build
```

Expected: successful Next.js build

### Task 3: Add homepage tracking and admin-only footer

**Files:**
- Modify: `components/home-page.tsx`

- [ ] **Step 1: Add stats state**

Add one small state block near existing auth state:

```ts
type AdminStats = {
  totalVisits: number;
  uniqueVisitors: number;
  registeredUsers: number;
};
```

State:

```ts
const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
```

- [ ] **Step 2: Track homepage visit on mount**

Add a fire-and-forget `useEffect`:

```ts
useEffect(() => {
  void fetch("/api/stats/track", {
    method: "POST",
    cache: "no-store",
  }).catch(() => undefined);
}, []);
```

This must not affect any existing loading state or UI.

- [ ] **Step 3: Load stats only for admin**

After `loadCurrentUser()` resolves user state, if `user?.isAdmin` is true, fetch `/api/stats` and store the payload. If not admin, keep `adminStats` null.

- [ ] **Step 4: Render the footer line**

Append one subtle line at the bottom of the page, below existing sections, only when:

```ts
authUser?.isAdmin && adminStats
```

Render text:

```text
总访问 {n} · 独立访客 {n} · 注册用户 {n}
```

Keep styling low-profile and consistent with the existing palette.

- [ ] **Step 5: Verify nothing else shifted**

Run:

```bash
npm run typecheck
npm run build
```

Then run local dev and visually confirm:

- homepage still opens normally
- Study Card still works
- guests do not see stats
- admin sees one bottom line only

### Task 4: Final verification and deployment handoff

**Files:**
- No additional code files required

- [ ] **Step 1: Run final verification**

Run:

```bash
npm run typecheck
npm run build
```

- [ ] **Step 2: Verify APIs manually**

In the browser or with curl:

- `POST /api/stats/track` returns success
- `GET /api/stats` returns `403` when not admin
- `GET /api/stats` returns metrics when logged in as admin

- [ ] **Step 3: Prepare Tencent deploy commands**

Provide only the smallest deploy steps:

```bash
git pull --ff-only origin main
npm run build
sudo systemctl restart English_Learning
```

- [ ] **Step 4: Commit**

```bash
git add lib/server/stats-store.ts lib/server/auth-store.ts lib/server/api-auth.ts app/api/stats/route.ts app/api/stats/track/route.ts components/home-page.tsx docs/superpowers/plans/2026-05-11-admin-stats-implementation.md
git commit -m "Add admin-only homepage stats footer"
```
