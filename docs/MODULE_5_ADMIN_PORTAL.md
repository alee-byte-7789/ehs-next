# Module 5 — Admin Portal (foundation)

## Scope delivered

Per the same "each module fully built and verified" rule Module 4
followed: this covers **project setup, admin authentication, and the
registration-approval workflow** — the one Admin Portal feature that had
an actual backend to wire against (Module 3). Complaint triage is
deferred the same way mobile complaint screens were in Module 4 — no
complaint API exists yet (Module 6).

## What's in `admin-portal/`

- Vite + React + TypeScript, Tailwind v4 (via `@tailwindcss/vite`, no
  separate config file needed — theme tokens live in `src/index.css`'s
  `@theme` block, copied from the same palette as
  `mobile-app/lib/theme.ts` and `PROJECT_ROADMAP.md` Section 5)
- `src/lib/api-client.ts` — axios with the same access-token-attach +
  refresh-and-retry-on-401 pattern as the mobile app's client, adapted for
  Vite's `import.meta.env` convention instead of Expo's `process.env`
- `src/lib/auth-context.tsx`, `token-storage.ts` (localStorage — there's
  no AsyncStorage/SecureStore equivalent needed for a plain web app),
  `types.ts` (mirrors the backend schemas, same source of truth as the
  mobile app's copy)
- `src/lib/registration-queries.ts` — React Query hooks: admin profile,
  list-pending, approve, reject
- `src/pages/{LoginPage,DashboardPage}.tsx`, `src/components/{Button,StatusBadge,ProtectedRoute}.tsx`

## Deployment — separate Vercel project, not unified with the mobile PWA

Unlike the mobile app, this is **its own Vercel project** with its own
domain, not folded into the same `vercel.json` as the backend + resident
PWA. Reason: both the resident PWA and this Admin Portal want routes like
`/` and `/login` for completely different audiences — cramming both under
one domain creates real routing collisions (this exact class of bug is
what broke the resident PWA's first deploy). Separate projects, same
backend, avoids that entirely. The tradeoff: this needs its own entry in
the backend's `CORS_ALLOW_ORIGINS` once it has a real domain, since it's
now a genuinely cross-origin caller instead of same-origin.

**To deploy:** same Vercel flow as before — new project, import the
`ehs-next` repo, but this time set **Root Directory: `admin-portal`**
(different from the unified backend+mobile deploy, which left it blank).
Vercel auto-detects Vite. Add one environment variable:
`VITE_API_BASE_URL=https://ehs-next.vercel.app/api/v1` (the
backend's real URL, absolute — this app has no same-origin relationship
with the backend the way the mobile PWA does).

**After deploying, go back to the backend's Vercel project and add this
new Admin Portal's real URL to `CORS_ALLOW_ORIGINS`** — otherwise its
requests will be blocked by the browser as cross-origin. This is the one
manual follow-up step that can't be done ahead of time, since the URL
doesn't exist until the first deploy completes.

## Verified, not just written

- `npx tsc -b` — clean (caught and fixed one real issue along the way:
  `verbatimModuleSyntax` requires `AxiosError`/`InternalAxiosRequestConfig`
  to be imported as `type`-only imports, not mixed with the value import)
- `npm run build` — succeeds, produces a working `dist/`
- **Full integration test against a live backend**, using the exact
  request/response shapes the app's own code sends and reads: registered
  a test resident, then walked through admin login →
  `GET /admins/me` (confirmed `role` field matches what `DashboardPage.tsx`
  displays) → `GET /registrations/pending` (confirmed the exact resident
  fields the table renders) → `POST .../approve` (confirmed the response
  shape `useApproveRegistration` expects, and that `resident_code` came
  back as `EHS-P-100-O` — correct format, correctly triggered by this
  exact API call)

## Design decisions worth flagging

1. **Tailwind v4's CSS-first config**, not a `tailwind.config.js` — this
   is the current idiomatic way to set up Tailwind v4 with Vite; theme
   customization lives in `@theme` inside `index.css` instead.
2. **RBAC is enforced server-side only** (`require_admin_roles` in the
   backend, from Module 3) — the frontend doesn't hide the dashboard from
   an `it_admin` role or similar; it just calls the API and surfaces
   whatever error comes back (a 403 would show as "could not load," which
   is honest rather than trying to duplicate permission logic in two places).
3. **No password-reset or "create another admin" UI yet** — admins are
   still bootstrapped via `backend/scripts/create_admin.py` only, per
   Module 3's design. Worth a future module once there's a concrete need
   for more than one or two admin accounts.
