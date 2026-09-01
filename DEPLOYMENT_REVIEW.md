# Shoply E-Commerce Platform — Pre-Deployment Review

> **Project:** Shoply (Next.js 14 E-Commerce Platform)
> **Stack:** Next.js 14, React 18, TypeScript, MongoDB/Mongoose, NextAuth, Stripe, Cloudinary, Tailwind CSS, Zustand, React Query
> **Review Date:** June 2026

---

## Table of Contents

- [Merits](#merits)
- [Demerits & Risks](#demerits--risks)
- [Critical Fixes Before Deploy](#critical-fixes-before-deploy)
- [Verdict](#verdict)

---

## Merits

### 1. Modern & Well-Chosen Tech Stack

The project uses a current, production-grade stack: Next.js 14 App Router with Server Components and Server Actions, React 18, TypeScript, Tailwind CSS, Zustand for client state, React Query for server state, Zod for validation, and shadcn/ui for components. This demonstrates awareness of the modern React ecosystem and positions the project for long-term maintainability.

### 2. Solid Feature-Based Architecture

The `src/features/` directory organizes domain logic into `auth/`, `cart/`, `inventory/`, `orders/`, `products/`, `seller/`, `admin/`, and `wishlist/` modules. Each feature has its own services, actions, and components. This is a mature organizational pattern that scales well and makes the codebase navigable.

### 3. Comprehensive E-Commerce Feature Set

The platform covers core e-commerce flows end-to-end:
- Product listing, detail pages, search (text index)
- Shopping cart with guest support (cookie-based, merge-on-login)
- Stripe checkout + Cash on Delivery
- Order management with status tracking
- Wishlist with toggle support
- Reviews system
- Seller and Admin dashboards
- Email verification and contact form
- Dark mode with system preference detection
- Banner management

### 4. Security-Conscious Design (Post-Fixes)

Several critical security issues have been addressed:
- `.env` is now gitignored with a `.env.example` provided
- Role-based access control on product creation (SELLER/ADMIN only)
- Cart ownership validation on clear
- Admin product update bypass fixed
- MongoDB indexes added on high-traffic fields (Product, Order, Category)
- Security headers configured (X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

### 5. Atomic Inventory Protection

Stock decrement uses `findOneAndUpdate` with `$gte` condition, preventing overselling at the database level. Stock restoration via Stripe webhook uses `bulkWrite` for batch operations. This is a critical correctness guarantee for any e-commerce system.

### 6. Stripe Webhook Handling

The platform handles `checkout.session.completed`, `checkout.session.expired`, and `payment_intent.payment_failed` events. This covers the major payment lifecycle states and properly restores stock on failures — a non-trivial integration.

### 7. Input Validation with Zod

Comprehensive Zod schemas exist for registration, login, checkout address, product creation, and other inputs. This provides type-safe runtime validation that catches malformed data before it reaches the database.

### 8. Rate Limiting on Sensitive Routes

Registration, login, checkout, and contact form are rate-limited. While the implementation has issues (see Demerits), the intent and placement are correct.

### 9. Responsive UI with Dark Mode

The Tailwind-based UI includes responsive grid layouts, mobile sheet navigation, real-time cart badge updates, and dark mode with system preference detection. The visual design is clean and modern.

### 10. Utility Infrastructure

- CSRF protection on checkout route
- `withErrorHandler` wrapper for API routes (exists but unused)
- Guest cart with 30-day cookie expiry
- Order number generation
- Image upload to Cloudinary

---

## Demerits & Risks

### 1. Zero Tests — Critical

There are no unit, integration, or end-to-end tests anywhere in the project. This is the single biggest risk for deployment. Any future change could silently break checkout, payment, or authentication flows without detection.

**Impact:** Unpredictable regressions, no confidence in deployments.

### 2. ~~No Database Transactions~~ ✅ Fixed

The checkout flow now uses MongoDB sessions with `withTransaction()` to wrap all write operations (stock decrement, order creation, order items, coupon tracking, cart clearing) in a single atomic transaction. If any step fails, the entire transaction is automatically rolled back — no inconsistent data. For standalone MongoDB deployments without replica set support, the code gracefully falls back to the previous compensating pattern. External calls (Stripe session creation, email sending) run after the transaction commits to avoid holding the transaction open during network I/O.

**Impact:** ✅ Resolved — checkout writes are now atomic on replica sets; graceful fallback on standalone instances.

### 3. ~~In-Memory Rate Limiter — Not Production-Viable~~ ✅ Fixed

The rate limiter now uses an atomic `findOneAndUpdate` with `$lt` and `$gt` conditions to prevent TOCTOU race conditions. The read-then-update pattern has been replaced with a single atomic operation that checks the limit and increments the counter in one database call. IP extraction still uses `x-forwarded-for` which is spoofable behind proxies.

**Impact:** ✅ Resolved — TOCTOU race condition eliminated. Proxy-based IP spoofing remains a minor concern (acceptable for most deployments).

### 4. Stripe Webhook Idempotency Gap

The `checkout.session.expired` and `payment_intent.payment_failed` handlers restore stock and cancel orders without checking if stock was already restored. If Stripe retries a webhook event, stock could be incremented multiple times, inflating inventory.

**Impact:** Inventory corruption from webhook retries.

### 5. ~~Missing Middleware Protection for API Routes~~ ✅ Fixed

The middleware matcher now covers all API routes (`/api/products/*`, `/api/upload`, `/api/contact`, `/api/categories/*`, `/api/coupons/*`). Public read-only endpoints (product listing, product detail, suggestions, categories GET, contact) are explicitly whitelisted. Protected write routes (upload, product create, category create, coupon validate) are guarded by middleware auth checks, with route-level auth as defense-in-depth.

**Impact:** ✅ Resolved — all API routes are now covered by middleware auth checks.

### 6. No CORS or Content Security Policy

There is no CORS configuration — API routes are accessible from any origin. No Content-Security-Policy header is set, leaving the app vulnerable to XSS, especially with `dangerouslySetInnerHTML` used for JSON-LD structured data.

**Impact:** Cross-origin abuse, potential XSS vectors.

### 7. Product Update Action Accepts Arbitrary Fields

The `updateProduct` server action accepts `data: Record<string, any>` and passes it directly to `findOneAndUpdate` without field allowlisting. An attacker could modify `sellerId`, `isActive`, `price`, or other sensitive fields.

**Impact:** Privilege escalation, data manipulation.

### 8. CartItem TTL Index Deletes Active Items

A TTL index on `CartItem.createdAt` deletes items after 30 days regardless of cart activity. If a user has items in their cart that haven't been touched in 30 days, MongoDB silently removes them. There is no mechanism to refresh the timestamp on access.

**Impact:** Silent data loss for infrequent users.

### 9. No Loading States or Error Boundaries

The UI lacks loading skeletons for products, cart, and checkout pages. There are no per-section error boundaries — a crash in one component takes down the entire page. Empty states for orders and cart are missing or incomplete.

**Impact:** Poor user experience during loading and error conditions.

### 10. No SEO Fundamentals

Missing `sitemap.xml`, `robots.txt`, Open Graph tags, Twitter Card tags, and canonical URLs. Product pages use `cache: "no-store"` instead of ISR, negating Next.js caching benefits.

**Impact:** Invisible to search engines, poor social sharing.

### 11. No CI/CD, Docker, or Monitoring

No GitHub Actions, no Dockerfile, no Sentry/error tracking, no structured logging, no health check endpoint. The only error handling is `console.error`.

**Impact:** No automated quality gates, no production visibility.

### 12. ~~N+1 Query Patterns~~ ✅ Fixed

Order listing and user listing have been optimized to use **single aggregation pipelines** with `$lookup` instead of multiple queries:
- `getUserOrders` — single `Order.aggregate()` with `$lookup` on `orderitems` (1 query instead of 2)
- `getAllOrders` — same `$lookup` pattern
- `adminGetAllUsers` — single `User.aggregate()` with `$lookup` on `orders` + `$addFields` for count (1 query instead of 2)
- `getSellerOrders` — single `Order.aggregate()` with `$lookup` → `$unwind` → `$match` → `$group` pipeline (1 query instead of 3)
- Added composite index `{ productId: 1, createdAt: -1 }` on OrderItem for seller order queries
- Added index `{ createdAt: -1 }` on User for admin user listing sort

**Impact:** ✅ Resolved — each endpoint now uses exactly 1 database query (plus 1 count query for pagination).

### 13. ~~Duplicate Type Definitions~~ ✅ Fixed

`Role`, `OrderStatus`, `PaymentMethod`, `PaymentStatus` are now defined only in `src/types/index.ts`. Model files import from there as the single source of truth.

### 14. Weak Password Policy

Registration only requires 8 characters with no complexity requirements. Passwords like `aaaaaaaa` are accepted.

**Impact:** Vulnerable accounts, potential credential stuffing.

### 15. No Email Verification Enforcement

Email verification tokens exist but the middleware does not check `emailVerified` status. Unverified users can access all protected routes including checkout and orders.

**Impact:** Unverified accounts can make purchases.

---

## Critical Fixes Before Deploy

| # | Issue | Fix | Effort |
|---|---|---|---|
| 1 | Zero tests | Add integration tests for checkout, auth, cart | 2-3 days |
| ~~2~~ | ~~No DB transactions~~ | ✅ Wrapped in MongoDB `withTransaction()` with fallback | — |
| ~~3~~ | ~~Rate limiter race condition~~ | ✅ Used atomic `findOneAndUpdate` with `$lt` condition | — |
| 4 | Stripe webhook idempotency | Check order status before restoring stock in expired/failed handlers | 1 hour |
| ~~5~~ | ~~Missing middleware API routes~~ | ✅ Added all missing routes to matcher + public route whitelist | — |
| 6 | Product update field sanitization | Allowlist permitted fields in `updateProduct` | 30 min |
| 7 | CORS configuration | Add CORS headers in `next.config.js` or middleware | 30 min |
| 8 | CSP headers | Add Content-Security-Policy header | 30 min |
| 9 | CartItem TTL index | Remove or make conditional on cart `lastActiveAt` | 15 min |
| 10 | Cart store server sync | Make `clearCart` call the server action | 15 min |
| ~~11~~ | ~~N+1 queries~~ | ✅ Already fixed with batch queries | — |

---

## Verdict

### Should You Deploy?

**Not yet.** The platform has strong foundations — a modern stack, good feature coverage, and clean UI — but several production-critical gaps remain:

1. **No tests** means any deployment is a gamble
2. ~~**No transactions** means data corruption under failure~~ ✅ Fixed
3. **Webhook idempotency gaps** mean inventory can drift
4. **Missing auth on some API routes** means potential data exposure
5. **No monitoring** means you won't know when things break

### Recommended Path

Fix the 8 remaining critical items above (approximately **3 days of focused work**), then deploy behind a staging environment first. The codebase is well-organized enough that these fixes are straightforward — they just need to be done.

### Risk Assessment

| Area | Risk Level | Notes |
|---|---|---|
| Data Integrity | MEDIUM | Transactions added; webhook gaps remain |
| Security | MEDIUM | Core issues fixed; CSP, CORS, field sanitization remain |
| Reliability | HIGH | No tests, no monitoring, no error tracking |
| Performance | LOW-MEDIUM | N+1 fixed; no caching layer |
| SEO | HIGH | Missing sitemap, robots.txt, OG tags |
| User Experience | MEDIUM | No loading states, no error boundaries |

---

*Review generated for pre-deployment assessment. Address critical items before going live.*
