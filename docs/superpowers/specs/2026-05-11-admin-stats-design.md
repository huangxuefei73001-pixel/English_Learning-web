# Word Islands Admin Stats Design

## Goal

Add a minimal private metrics display for the founder account so the site can show:

- total visits
- cumulative unique visitors
- registered users

The metrics must:

- appear only when the admin account is logged in
- render at the bottom of the homepage
- use a low-profile single-line presentation
- avoid changing any other site behavior or UI structure

## Scope

This change only covers:

1. collecting homepage visit counts
2. counting cumulative unique visitors with a long-lived browser cookie
3. reading registered user count from existing server-side account storage
4. exposing the metrics through a small server API
5. rendering the metrics line for admin only

This change explicitly does **not** include:

- public analytics
- charts
- time-series reporting
- online-now counters
- referral/source analytics
- external analytics providers
- database migration
- redesign of homepage sections

## Constraints

- Keep the existing Word Islands UI intact except for adding one subtle line at the bottom
- Reuse the current server-side JSON storage approach
- Do not mix analytics counters into the user-account data file
- Do not expose the metrics to guests or normal logged-in users
- Treat clearing cookies, changing devices, or switching browsers as a new unique visitor
- Do not modify search behavior, Study Card behavior, auth flow, favorites flow, or review flow beyond the minimum wiring needed to read or write stats

## Recommended Approach

Use a dedicated stats file separate from the user data file.

### Why this approach

- It avoids polluting `.data/word-islands.json`
- It matches the current lightweight architecture
- It is easy to reason about and migrate later
- It minimizes risk to existing auth, favorites, and review features

## Data Design

### Existing user data

Keep using:

```text
.data/word-islands.json
```

for:

- users
- favorites
- review queue

### New stats file

Create:

```text
.data/word-islands-stats.json
```

Proposed shape:

```json
{
  "totalVisits": 0,
  "uniqueVisitors": 0,
  "visitorIds": [],
  "updatedAt": "2026-05-11T00:00:00.000Z"
}
```

Notes:

- `totalVisits` increments on every tracked homepage visit
- `uniqueVisitors` increments only when a never-seen visitor id appears
- `visitorIds` stores the set of known visitor ids
- `updatedAt` helps with debugging and sanity checks

The file remains small in the near term because this site is still early-stage and low-scale.

## Visitor Identification

### Cookie strategy

Use a long-lived HTTP cookie, for example:

- name: `wordislands_visitor`
- lifetime: 365 days

Behavior:

- If the visitor has no cookie, generate a new visitor id and set it
- Every homepage page load counts as one visit
- A visitor id counts as unique only the first time it is seen in the stats file

### Counting rules

- same browser + same cookie = same unique visitor
- cleared cookie = new unique visitor
- new browser = new unique visitor
- new device = new unique visitor

This matches the founder-approved counting model.

## API Design

### 1. Visit tracking

Use a small server route dedicated to tracking homepage access.

Recommended route:

```text
/api/stats/track
```

Responsibilities:

- read or create visitor cookie
- increment `totalVisits`
- increment `uniqueVisitors` only for first-seen visitor ids
- return success with no UI-facing payload requirements beyond acknowledgement

This route should be called from the homepage on load.

### 2. Admin stats read

Add a read route:

```text
/api/stats
```

Responsibilities:

- verify current session
- verify current user is admin
- load `.data/word-islands-stats.json`
- load registered user count from `.data/word-islands.json`
- return:
  - `totalVisits`
  - `uniqueVisitors`
  - `registeredUsers`

If the current user is not admin:

- return unauthorized or a hidden/empty response

## Frontend Design

### Placement

Render the stats only on the homepage and only for admin users.

Location:

- bottom of the page

### Presentation

Use a subtle single-line treatment such as:

```text
总访问 1,248 · 独立访客 392 · 注册用户 17
```

Design rules:

- low visual weight
- no card
- no chart
- no counter animation
- no section headline unless needed for spacing/accessibility
- must not compete with the Study Card

## Data Flow

1. Visitor opens homepage
2. Frontend triggers `/api/stats/track`
3. Server reads/sets visitor cookie and updates stats file
4. If the user is logged in as admin, frontend also requests `/api/stats`
5. Server returns metrics payload
6. Homepage renders the single-line stats footer

## Error Handling

### Tracking failures

If `/api/stats/track` fails:

- do not block homepage rendering
- fail silently in UI
- optionally log server-side error

### Stats read failures

If `/api/stats` fails:

- do not affect auth, search, favorites, or Study Card
- simply omit the stats line for that page load

### Missing files

If `.data/word-islands-stats.json` does not exist:

- create it lazily with zeroed defaults

## Operational Notes

- Stats file should live under `.data/` so it remains server-side and uncommitted
- This feature should be safe to deploy without data migration
- Existing admin email mechanism remains the source of truth for who can view metrics

## Testing Plan

### Server-side

- track route creates cookie on first visit
- track route increments total visits on repeated visits
- track route increments unique visitors only once per visitor id
- stats route returns registered user count correctly
- stats route is admin-only

### Frontend

- admin sees footer line
- guest does not see footer line
- normal logged-in user does not see footer line
- footer line does not disturb existing homepage layout

## Files Likely to Change

- `app/api/stats/route.ts`
- `app/api/stats/track/route.ts`
- `lib/server/auth-store.ts`
- `components/home-page.tsx`

Possible new server helper:

- `lib/server/stats-store.ts`

## Guardrail for Implementation

This feature must be implemented as a narrow patch.

Allowed:

- adding one dedicated stats file
- adding one lightweight tracking route
- adding one lightweight admin read route
- adding one admin-only footer line at the bottom of the homepage
- making the smallest necessary change to existing auth storage helpers to read registered user count

Not allowed:

- redesigning homepage layout
- moving existing sections
- changing Study Card rendering
- changing search request sequencing
- changing login/register UX
- changing favorites or review behavior

## Success Criteria

The feature is complete when:

1. homepage visits are counted
2. cumulative unique visitors are counted via cookie
3. registered user count is shown correctly
4. all three metrics appear only for the admin account
5. metrics appear in one low-key line at the bottom of the homepage
6. search, Study Card, favorites, and review behavior remain unchanged
