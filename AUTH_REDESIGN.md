# Authentication Redesign & CSRF Session Fix

> **Date:** June 2026
> **Scope:** Sign-in, Register pages, session flow, logout flow

---

## 1. What Was Done

### A. Redesigned Login Page & Component

**Files changed:**
- `src/features/auth/components/LoginForm.tsx` (full rewrite)
- `src/app/login/page.tsx` (layout update)

**Changes:**
- Added password visibility toggle (eye icon button)
- Added icons inside input fields (Mail for email, Lock for password)
- Polished card design with centered icon header, shadow, and ring accents
- Added loading spinner inside the submit button during sign-in
- Wrapped the form in a `Suspense` boundary (required by Next.js 14 for `useSearchParams()`)
- Added `autoComplete` attributes for better browser integration
- Fixed silent failure detection: now checks `!result?.ok` in addition to `result?.error`
- Added page metadata (`title`, `description`) for SEO
- Added decorative gradient blobs and subtle grid background pattern

### B. Redesigned Register Page & Component

**Files changed:**
- `src/features/auth/components/RegisterForm.tsx` (full rewrite)
- `src/app/register/page.tsx` (layout update)

**Changes:**
- Simplified from a triple-component `Suspense` wrapper pattern to a single clean component + `Suspense` boundary
- Replaced generic role icons (`User`/`UserCheck`) with semantically correct icons (`ShoppingBag`/`Store`)
- Improved role selection toggle cards with better spacing, gap, and ring styling
- Added loading spinner inside submit button
- Added page metadata for SEO
- Added matching decorative background (mirrored from login page)

### C. Removed Deprecated Code

**Files deleted:**
- `src/stores/auth.store.ts` - Zustand auth store that was never imported anywhere. The actual auth source of truth is `useSession()` from NextAuth via the `useCurrentUser()` hook.

### D. Fixed Critical CSRF Route Conflict (The Session Bug)

**Files deleted:**
- `src/app/api/auth/csrf/route.ts` - This custom route was shadowing NextAuth v4's built-in CSRF endpoint.

---

## 2. The Problem

After signing in with valid credentials, the header continued showing the **"Sign In"** button instead of switching to the user's profile avatar and dropdown menu (My Profile, Orders, Seller Dashboard, Sign Out).

The user could enter correct credentials, the form would submit, the page would redirect to the homepage, but **no authenticated session was ever established**. The header remained in a logged-out state.

---

## 3. Root Cause Analysis

### The Custom CSRF Route Shadowed NextAuth's Built-in CSRF Endpoint

In Next.js App Router, **specific routes take precedence over catch-all routes**. The project had:

```
src/app/api/auth/
├── [...nextauth]/route.ts   <-- NextAuth catch-all (handles /csrf, /session, /callback, etc.)
├── csrf/route.ts             <-- CUSTOM route that intercepts GET /api/auth/csrf
├── login/route.ts
├── logout/route.ts
├── register/route.ts
└── ...
```

When NextAuth's `signIn()` client function runs, it follows this flow:

```
1. GET  /api/auth/csrf         --> Fetches CSRF token + sets CSRF cookie
2. POST /api/auth/callback/credentials --> Sends credentials + CSRF token
3. Server validates CSRF token --> If valid, creates JWT session token + sets session cookie
4. Client receives session cookie --> useSession() picks it up --> Header re-renders
```

**The problem was in Step 1:** Instead of hitting NextAuth's built-in CSRF handler (inside `[...nextauth]`), the request was intercepted by the custom `csrf/route.ts`.

### Why This Broke Everything

| Aspect | NextAuth Expected | Custom Route Returned |
|--------|-------------------|-----------------------|
| Response format | `{ "csrfToken": "abc123..." }` | `{ "success": true, "data": { "csrfToken": "abc123..." } }` |
| CSRF cookie | Sets its own internal CSRF cookie | Sets a different custom CSRF cookie |
| Token validation | Validates against its own cookie | Custom token, incompatible with NextAuth's validation |

The chain of failure:

```
1. signIn() calls GET /api/auth/csrf
2. Custom route returns { success: true, data: { csrfToken: "..." } }
3. signIn() tries to read response.csrfToken --> gets undefined (it's nested inside data)
4. signIn() sends POST /api/auth/callback/credentials with undefined CSRF token
5. NextAuth server-side CSRF validation FAILS
6. The callback returns { url: "...?csrf=true" } WITHOUT setting a session cookie
7. signIn() resolves with no .error property (silent failure)
8. LoginForm checks result?.error --> falsy --> proceeds to redirect
9. window.location.href = "/" --> page reloads with NO session cookie
10. useSession() fetches /api/auth/session --> returns {} --> Header shows "Sign In"
```

### Why It Was Silent

The LoginForm only checked `result?.error`:

```typescript
if (result?.error) {
  toast.error("Invalid email or password");
  return;
}
// Proceeded to redirect even though login actually failed
window.location.href = callbackUrl || "/";
```

When NextAuth's CSRF validation fails, the callback response is `{ url: "...?csrf=true" }` without an `error` property. So `result?.error` was `undefined`, and the code assumed success and redirected.

---

## 4. The Fix

### Fix 1: Delete the Conflicting Route

**Deleted:** `src/app/api/auth/csrf/route.ts`

This allows NextAuth's catch-all `[...nextauth]` route to handle `/api/auth/csrf` natively with the correct response format and cookie management.

**Note:** The `src/lib/csrf.ts` utility module was kept because it's still used by the checkout route (`src/app/api/checkout/route.ts`) for its own CSRF validation. Only the conflicting route handler was removed.

### Fix 2: Detect Silent Failures in LoginForm

**Changed:**

```typescript
// Before (missed silent failures)
if (result?.error) {
  toast.error("Invalid email or password");
  return;
}

// After (catches both explicit errors and non-ok responses)
if (result?.error || !result?.ok) {
  toast.error(result?.error || "Invalid email or password");
  return;
}
```

This ensures that if `signIn()` returns a response that isn't explicitly successful (no `ok: true`), the user sees an error message instead of being redirected without a session.

---

## 5. Verification Results

After the fix, the complete auth flow was tested end-to-end:

### Login Flow
```
1. User enters credentials on /login
2. signIn("credentials") fetches CSRF token from NextAuth (correct format)
3. POST /api/auth/callback/credentials with valid CSRF token
4. Server creates JWT, sets next-auth.session-token cookie (httpOnly)
5. window.location.href = "/" triggers full page reload
6. SessionProvider fetches /api/auth/session --> returns user data
7. Header re-renders with avatar + name + dropdown menu
```

### Session Endpoint (After Login)
```json
{
  "user": {
    "name": "maged",
    "email": "1@yahoo.com",
    "id": "6a033d35e8a04cddb66f9185",
    "role": "SELLER",
    "emailVerified": null
  },
  "expires": "2026-07-10T04:27:05.176Z"
}
```

### Dropdown Menu (Authenticated)
- My Profile
- Orders
- Seller Dashboard (shown for SELLER/ADMIN roles)
- Admin Panel (shown for ADMIN role only)
- Sign Out

### Logout Flow
```
1. User clicks "Sign Out" in dropdown
2. handleLogout() calls POST /api/auth/logout (clears session cookies)
3. nextAuthSignOut({ callbackUrl: "/" }) triggers NextAuth sign-out
4. Page redirects to homepage
5. /api/auth/session returns {} (empty - no session)
6. Header re-renders showing "Sign In" button
```

---

## 6. Key Takeaways

### NextAuth Route Conflicts in Next.js App Router

When using NextAuth v4 with the App Router catch-all pattern (`[...nextauth]`), **never create specific route files** that match NextAuth's internal endpoints:

| NextAuth Internal Routes | Do NOT Create |
|--------------------------|---------------|
| `/api/auth/csrf` | `src/app/api/auth/csrf/route.ts` |
| `/api/auth/session` | `src/app/api/auth/session/route.ts` |
| `/api/auth/providers` | `src/app/api/auth/providers/route.ts` |
| `/api/auth/signin` | `src/app/api/auth/signin/route.ts` |
| `/api/auth/signout` | `src/app/api/auth/signout/route.ts` |
| `/api/auth/callback/*` | `src/app/api/auth/callback/*/route.ts` |

Custom routes like `/api/auth/login`, `/api/auth/register`, `/api/auth/logout` are safe because they don't conflict with NextAuth's internal routing.

### Always Check `result?.ok` After `signIn()`

NextAuth's `signIn()` with `redirect: false` can return responses without an `error` property even when the login fails (e.g., CSRF validation failure). Always verify `result?.ok === true` before proceeding.

### Stale `.next` Cache Can Mask Fixes

After deleting the conflicting route, the `.next` build cache may still contain the old compiled code. If issues persist after a fix, delete the `.next` folder and restart the dev server:

```bash
# Windows (from project root)
if exist .next rd /s /q .next
npx next dev
```

