# TASK-LIST.md — Rusuh Booking Tiket (FE) — Task Decomposition

> GENESIS Phase 3 output. Conforms to `GROOMING-DECISIONS.md` + the Phase 2 doc set.
> Scope: **FE only** (Expo + RN + RN Web). BE is a consumed contract. Prefix: **RBT**.
> Seeded by `ARCHITECTURE.md §13` delivery roadmap (P0–P7) and FR/BR/NFR coverage.
> **STOP at Gate H3** — human verifies the breakdown.

---

## Overview

**Total Epics:** 9 · **Total Stories:** 44 · **Estimated Duration:** ~9–11 weeks (5-person team, 2 web FE + 1 mobile FE effectively on the shared codebase)

> Estimates are **story points (S/M/L/XL)**, not calendar promises. The team is 1 mobile + 2 web FE (per tender); the shared RN/RN-Web codebase means most work is shared, with platform-specific tails (`.web.tsx`/`.native.tsx`).

## Epic Overview

| Epic | Name | Priority | Stories | Est. Points | Roadmap |
|------|------|----------|---------|-------------|---------|
| E1 | Foundations (monorepo, Expo, Clean Arch skeleton, CI) | P0 | 5 | 26 | P0 |
| E2 | API client, contracts, server-clock, idempotency, mock adapter | P0 | 5 | 29 | P1 |
| E3 | Auth / profile (OTP, NIK, consent) | P0 | 4 | 21 | P1 |
| E4 | Events: Home, Browse, Event detail (+SEO) | P0 | 5 | 29 | P2 |
| E5 | Queue / Waiting room (state machine, adaptive polling, refresh-safe) | P0 | 5 | 34 | P3 |
| E6 | Checkout / booking hold (NIK/attendee, timer, idempotent hold) | P0 | 5 | 37 | P4 |
| E7 | Payment (FE page + method selection → SNAP handoff → verify; mock-first adapter) | P0 | 6 | 36 | P5 |
| E8 | E-ticket + Notifications (QR, download/share, native+web push) | P0 | 4 | 26 | P6 |
| E9 | Hardening: a11y, perf/bundle, load test, QA, release readiness | P0/P1 | 5 | 24 | P7 |

---

## Dependency Graph

```
E1 Foundations
   └── E2 API client + contracts + ServerClock + idempotency + mock
          ├── E3 Auth/profile ──────────────┐
          ├── E4 Events (Home/Browse/Detail) │
          └── E5 Queue/Waiting ──────────────┤
                                             ▼
                                   E6 Checkout/hold (needs E3 profile, E5 admission)
                                             │
                                             ▼
                                   E7 Payment (needs E6 booking)
                                             │
                                             ▼
                                   E8 E-ticket + Notifications (needs E7 PAID)
                                             │
                                             ▼
                                   E9 Hardening (cross-cutting, finalizes all)
```

## Critical Path

```
E1 skeleton → E2 api-client+clock+idempotency → E5 queue→admission → E6 hold → E7 payment → E8 e-ticket → E9 release-ready
  (L)              (XL)                            (XL)             (XL)       (L)         (L)          (L)
≈ the booking spine; E3/E4 run in parallel off E2 and merge in at E6/E4.
```

---

## Epic 1 — Foundations

**Delivers:** the Expo Universal monorepo, Clean Architecture package skeleton, Expo Router, theme tokens, and the CI skeleton. **Priority:** P0. **Dependencies:** none.

#### RBT-001: Monorepo + Expo app skeleton
Type: Story · P0 · L · Deps: none
- AC1: `apps/client` Expo app boots on web, Android, iOS (dev build).
- AC2: `packages/{domain,api-client,state,ui,design-tokens,platform,config,test-fixtures}` exist with build wiring.
- AC3: TypeScript strict passes; path aliases resolve across packages.
- AC4: **README onboarding guide** — a developer on another team can go from clone to running the app with no prior context: prerequisites (Node version, npm, Expo CLI, Xcode/Android Studio or Expo Go), `git clone` + `npm install`, run on **web** (`npx expo start --web`), run on **Android emulator** and **iOS simulator** (`npx expo start` → press `a`/`i`, or Expo Go on a device), the monorepo layout (`apps/client` + `packages/*`), the env-var setup (`.env.example` → `.env`, the `EXPO_PUBLIC_*` keys incl. the mock toggle), and the common-issues/troubleshooting notes. Verified by a clean-clone dry run.
- Skills: Expo, monorepo (npm workspaces), TypeScript, technical writing.

#### RBT-002: Expo Router + route tree + layout guards
Type: Story · P0 · M · Deps: RBT-001
- AC1: Routes for `/`, `/browse`, `/events/[eventId]`, `/waiting/[eventId]`, `/checkout/[sessionId]`, `/payment/[bookingId]`, `/success/[bookingId]`, `/expired/[resourceId]`.
- AC2: `src/app` contains routing only (no API/business logic — lint rule enforces).
- Skills: Expo Router.

#### RBT-003: Design tokens + theme provider
Type: Story · P0 · M · Deps: RBT-001
- AC1: `packages/design-tokens` with color/type/spacing/radius/motion tokens (ported from V5), light+dark.
- AC2: Every surface sets background+text pair (no fixed literals). Reduced-motion flag wired.
- Skills: design systems, RN styling.

#### RBT-004: DI composition root + ports
Type: Story · P0 · M · Deps: RBT-001
- AC1: Composition root wires ports (`QueueRepository`, `PaymentRepository`, `Clock`, `NotificationPort`, `FileSharePort`) to concrete adapters.
- AC2: Domain/application layers import no React/RN/Expo/browser/native (lint-enforced dependency rule).
- Skills: Clean Architecture, DI.

#### RBT-005: CI skeleton (GitHub Actions + SonarCloud)
Type: Story · P0 · L · Deps: RBT-001
- AC1: PR workflow runs typecheck, lint, Jest, `npm audit`, SonarCloud; stops before deploy.
- AC2: Branch model `develop`/`main` with the PIPELINE.md gates wired; secrets referenced (not committed).
- AC3: Bundle-size + SEO-output checks stubbed for web release.
- Skills: GitHub Actions, SonarCloud, EAS config.

---

## Epic 2 — API client, contracts, server-clock, idempotency, mock

**Delivers:** the typed API layer every feature depends on. **Priority:** P0. **Deps:** E1.

#### RBT-010: OpenAPI-generated types + repositories
Type: Story · P0 · L · Deps: RBT-004
- AC1: Types generated from `.genesis/docs/api-contract/*`; repositories per service (User/Queue/Booking/Payment).
- AC2: `{meta,data}` + `ErrorEnvelope` unwrap centralized.
- Skills: OpenAPI codegen, TanStack Query.

#### RBT-011: Server-authoritative clock (`ServerClock`)
Type: Story · P0 · M · Deps: RBT-010
- AC1: offset sync from `serverTime`; `remaining(expiresAt)` ≥0; device-clock change/refresh does not reset (unit-tested). (FR-19, D3.2)
- Skills: domain/timer math.

#### RBT-012: Idempotency-Key handling
Type: Story · P0 · M · Deps: RBT-010
- AC1: key generated per action, persisted with action/session, reused on retry/refresh, cleared on terminal. (FR-25, D3.3)
- AC2: double-submit uses one key (unit-tested).
- Skills: domain, state.

#### RBT-013: Error taxonomy + Bahasa mapping + Retry-After
Type: Story · P0 · M · Deps: RBT-010
- AC1: every contract `errorCode` → typed domain error → Bahasa message; `Retry-After`/backoff honored; reads deduped. (D3.4/D3.5)
- Skills: domain, i18n.

#### RBT-014: Mock adapter + test fixtures
Type: Story · P0 · M · Deps: RBT-010
- AC1: `packages/test-fixtures` contract-shaped mocks (≥5 events incl. SOLD_OUT/NOT_STARTED/CLOSED) behind the repository ports; toggle real/mock. Covers FE-NEED gaps (O1) until BE delivers.
- Skills: MSW/fixtures.

---

## Epic 3 — Auth / profile

**Delivers:** **OPTIONAL** OTP login, registration with NIK + consent, profile auto-fill source. Login is never forced — a guest completes the whole flow without it (D8.5); NIK+consent is collected at checkout regardless (see RBT-052/053). **P0. Deps:** E2.

#### RBT-020: OTP request/verify flow (optional sign-in)
Type: Story · P0 · M · Deps: RBT-010
- AC1: email → OTP → token; returning user signs straight in. Sign-in is **entry-point optional** — never a blocking gate on browse/queue/checkout. (User Svc, D8.5)
- Skills: forms (RHF+Zod), auth.

#### RBT-021: Registration — name + NIK + consent gate
Type: Story · P0 · L · Deps: RBT-020
- AC1: new account (`hasNik=false`) must complete name + NIK (16-digit, validated); email read-only.
- AC2: **consent checkbox required before NIK/email collection** (D7.1); success pop-up.
- Skills: forms, privacy/PII handling.

#### RBT-022: Profile store + checkout auto-fill source
Type: Story · P0 · S · Deps: RBT-021
- AC1: logged-in profile (fullName/nikMasked/emailMasked) available to prefill checkout ("Terisi dari akun").
- Skills: Zustand state.

#### RBT-023: Secure token storage + session lifecycle
Type: Story · P0 · M · Deps: RBT-020
- AC1: native tokens in `expo-secure-store`; web secure cookie; clear on logout/terminal. (D7.2)
- AC2: session-token used as logged-in slot key (D9.3).
- Skills: platform adapters, security.

---

## Epic 4 — Events (Home, Browse, Event detail)

**Delivers:** discovery surface + SEO. **P0. Deps:** E2.

#### RBT-030: Home — event list + status + nearby/history
Type: Story · P0 · L · Deps: RBT-010
- AC1: `listEvents()`; status enum → badge (Tersedia/Stok Menipis/Sold Out, disabled when sold out); price-from `minorToIDR`; date `DD-MMM-YYYY`. (FR-01/02/03)
- AC2: skeletons + empty state; defensive null-checks.
- Skills: RN lists, design system.

#### RBT-031: Browse — URL-driven filters
Type: Story · P1 · M · Deps: RBT-030
- AC1: `/browse?genre&province&time&sort`; client-filter until BE params (O4); removable chips, reset. Invalid values safe.
- Skills: Expo Router query, filtering.

#### RBT-032: Event detail — categories + availability + queue CTA
Type: Story · P0 · M · Deps: RBT-030
- AC1: `getEvent()` → categories + `priceMinor` + available; rich description JSON (FE-NEED O1, mock until delivered). (FR-11/12)
- AC2: "Masuk Antrean" CTA → anonymous join.
- Skills: RN, contracts.

#### RBT-033: Public SEO rendering (static/server)
Type: Story · P0 · L · Deps: RBT-030, RBT-005
- AC1: `web.output: static`; `/` + `/events/[eventId]` produce indexable HTML; `single` rejected by CI.
- AC2: route metadata, canonical, OG, JSON-LD, sitemap/robots; transactional pages `noindex`.
- Skills: Expo static rendering, SEO.

#### RBT-034: Nearby + history derivation
Type: Story · P1 · S · Deps: RBT-030
- AC1: "Konser Terdekat" (upcoming asc), "History Event" (past/CLOSED desc); rolling windows from `serverNow`; archive endpoint is O4 (fallback for now).
- Skills: domain/date logic.

---

## Epic 5 — Queue / Waiting room

**Delivers:** the virtual waiting room — the system's core risk surface. **P0. Deps:** E2.

#### RBT-040: Queue state machine (domain)
Type: Story · P0 · L · Deps: RBT-011
- AC1: WAITING/ADMITTED/CLAIMED/MISSED/LEFT/SOLD_OUT/CLOSED/ENDED transitions; only ADMITTED authorizes (unit-tested). (FR-05/08)
- Skills: domain state machines.

#### RBT-041: Join (anonymous) + refresh-safe persistence
Type: Story · P0 · L · Deps: RBT-040, RBT-023
- AC1: anonymous join (FE-NEED body O1); persist entryId+queueToken; restore on refresh/re-join (no duplicate). (FR-10, BR-07, D9.3)
- AC2: slot keyed session-token (logged-in) / visitor-token (guest).
- Skills: platform persistence, state.

#### RBT-042: Adaptive polling (+ SSE fallback)
Type: Story · P0 · L · Deps: RBT-040
- AC1: honor `nextPollAfterMs` (far/mid/near); one poller/session; jitter; cancel on unmount/background; no request storm. (NFR-05/06, ARCH §9.2)
- Skills: TanStack Query polling, perf.

#### RBT-043: Waiting room UI (position, zones, estimate)
Type: Story · P0 · M · Deps: RBT-042
- AC1: "orang di depan" + "estimasi"; zone color+label (GUARANTEED/POSSIBLE/NOT_ENOUGH); live region on change; ETA (FR-09, in). 
- Skills: RN UI, a11y.

#### RBT-044: Auto-claim + redirect + error states
Type: Story · P0 · M · Deps: RBT-040
- AC1: on turn, auto-claim (no button) → admissionToken (TTL ~60s) → redirect checkout; TURN_MISSED/EVENT_SOLD_OUT error states. (FR-08)
- Skills: state, routing.

---

## Epic 6 — Checkout / booking hold

**Delivers:** ticket selection, NIK/attendee validation, buyer data, idempotent hold, booking timer. **P0. Deps:** E5 (admission), E3 (profile).

#### RBT-050: Booking session create/restore + timer
Type: Story · P0 · L · Deps: RBT-044, RBT-011
- AC1: create session from admissionToken; restore via `current` without resetting `expiresAt`; countdown from server deadline; SESSION_EXPIRED → expired. (FR-17/18/19, D9.2)
- Skills: state, timer.

#### RBT-051: Ticket item list + category/quantity rules
Type: Story · P0 · L · Deps: RBT-050
- AC1: item list (min1, max `maxSelectable`); reject over-stock/over-3/accumulation-over-3; `allowMixedCategories`. (FR-13/14)
- Skills: domain rules, forms.

#### RBT-052: NIK validation + attendee checks + single-use buyer-NIK
Type: Story · P0 · L · Deps: RBT-051
- AC1: NIK mandatory, 16-digit; each ticket carries attendee NIK; buyer NIK usable on exactly one row (single-use checkbox disables others). (D9.1)
- AC2: debounced `attendee-checks`: ALREADY_REGISTERED blocks, CHECK_LIMIT_REACHED does not.
- AC3: **guest path** — since login is optional (D8.5), the NIK **consent gate (D7.1)** is rendered inline here at checkout for users who did not register; logged-in users who already consented at registration skip it.
- Skills: domain, forms, debounce, privacy/PII.

#### RBT-053: Buyer data + set-buyer + confirm-leave
Type: Story · P0 · M · Deps: RBT-052, RBT-022
- AC1: buyer NIK+email (auto-fill if logged in); set-buyer (FE-NEED O1 mock); back → confirm-leave dialog ("re-queue").
- Skills: forms, state.

#### RBT-054: Create booking (idempotent hold) + error handling
Type: Story · P0 · L · Deps: RBT-053, RBT-012
- AC1: `POST /bookings` with Idempotency-Key → hold; redirect payment; map CATEGORY_UNAVAILABLE/BUYER_QUOTA_EXHAUSTED/QUANTITY_EXCEEDS_LIMIT/MIXED/DUPLICATE. (FR-16, FR-25)
- Skills: domain, contracts.

---

## Epic 7 — Payment (FE payment page → Midtrans SNAP handoff)

**Delivers:** FE-built payment page (order summary + method selection + server timer) → create-attempt → SNAP handoff → verify → recovery, per **prototype `payment.html`/`snap.html`**. **P0. Deps:** E6.

> **Mock-first behind the real architecture (D10.5):** every story below is **production code built against the `PaymentRepository` port**. Because the BE payment service is still in progress, v1 binds a **mock adapter** (RBT-065) at the composition root; integrating real BE later swaps only that binding (Liskov-substitutable), changing no UI / domain / use-case code.

#### RBT-060: Payment page (summary + method selection + timer)
Type: Story · P0 · L · Deps: RBT-054, RBT-011
- AC1: `GET /payments/{id}/page` → order summary (total == `amountMinor`, **no service/hidden-fee line**), `paymentExpiresAt`+serverTime → 10-min server-authoritative countdown. (FR-20/21, D10.1)
- AC2: **method-selection UI** driven by server `page.methods` — VA (BCA/BNI/BRI/Permata) · QRIS · GoPay, no credit card; VA-number / QR instruction area shown when applicable. Default = first method; "Bayar Sekarang" enabled on selection.
- Skills: RN, forms, timer, design system.

#### RBT-061: Create-attempt + SNAP handoff (web redirect / mobile WebView)
Type: Story · P0 · L · Deps: RBT-060, RBT-012
- AC1: "Bayar" → `createAttempt(bookingId, method, Idempotency-Key)` → BE `redirectUrl`; web redirects, mobile opens WebView/in-app browser. (FR-24, D10.2) — O2 contract detail flagged.
- AC2: refresh-safe — `currentAttempt.status==='PENDING'` restores selected method + SNAP redirect state ("Kembali ke SNAP").
- Skills: payment integration, platform adapters, WebView.

#### RBT-062: Page-token WebView reuse (mobile)
Type: Story · P0 · M · Deps: RBT-061
- AC1: mobile path `POST /payments/{id}/page-tokens` → `pageUrl`+one-time `pageToken` → WebView loads page → `POST /payment-page-sessions {pageToken}` sets `rb_pay` cookie → **same FE payment page reused**, timer still server-authoritative across handoff. (FR-24, D10.3) — O2 endpoints flagged.
- Skills: WebView, platform adapters, session handoff.

#### RBT-063: Callback verify + result routing
Type: Story · P0 · M · Deps: RBT-061
- AC1: success/failed callback (`successReturnUrl`/`failedReturnUrl`) → `GET /payments/{id}/status`; render success only if PAID (never trust callback); VERIFYING/REVIEW/UNKNOWN → processing + backoff poll; deadline-passed reconciled from serverTime. (FR-25, D10.4)
- Skills: state, polling.

#### RBT-064: Failure/expiry recovery
Type: Story · P0 · M · Deps: RBT-063
- AC1: FAILED+payable → retry new attempt; `BOOKING_NOT_PAYABLE`/deadline passed → expired(reason=payment) + re-queue path. (FR-23)
- Skills: state, routing.

#### RBT-065: Mock `PaymentRepository` adapter + SNAP simulator
Type: Story · P0 · M · Deps: RBT-014, RBT-060
- AC1: mock adapter implements the **full `PaymentRepository` port** (`getPaymentPage`, `createAttempt`, `getPaymentStatus`, `createPageToken`, `snapCallback`) with contract-shaped data ({meta,data}, `amountMinor`, `paymentExpiresAt`+`serverTime`, `redirectUrl`, `successReturnUrl`/`failedReturnUrl`, `currentAttempt`). Liskov-substitutable with the future BE adapter. (D10.5)
- AC2: local **SNAP simulator** page (equivalent to prototype `snap.html`) — success/failed buttons drive `snapCallback`; server-authoritative timer honored across handoff; VERIFYING/UNKNOWN paths selectable for testing.
- AC3: **composition-root swap** — one DI binding / `EXPO_PUBLIC_*` toggle selects mock vs real; integrating BE changes only the binding (RBT-014 toggle extended). No UI/domain/use-case change required.
- Skills: ports/adapters, test-fixtures, DI.

---

## Epic 8 — E-ticket + Notifications

**Delivers:** success/e-ticket + QR + download/share + native & web push. **P0. Deps:** E7.

#### RBT-070: Success page + order summary
Type: Story · P0 · M · Deps: RBT-063
- AC1: verify PAID → order summary (orderId, qty, amount, masked buyer NIK). (FR-22)
- Skills: RN, contracts.

#### RBT-071: E-ticket QR + download/share
Type: Story · P0 · M · Deps: RBT-070
- AC1: `getTickets` → one card/ticket with QR (`react-native-svg`, no raw NIK); native file-system+share, web Blob/print.
- Skills: QR, platform file adapters.

#### RBT-072: Native notifications (`expo-notifications`)
Type: Story · P0 · M · Deps: RBT-004
- AC1: permission, token registration, required flows (expiry reminder, payment success, admission, event reminder); tap → deep link.
- Skills: expo-notifications, deep links.

#### RBT-073: Web push (service worker) — v1 mandatory
Type: Story · P0 · L · Deps: RBT-072
- AC1: service-worker + browser Notification/Push permission + web adapter behind shared notification flow; same required flows; feature-detect/degrade. (D8.2)
- Skills: web push, service workers.

---

## Epic 9 — Hardening (cross-cutting)

**Delivers:** a11y, perf/bundle budgets, flash-crowd load test, QA, release readiness. **P0/P1. Deps:** all.

#### RBT-080: Accessibility (WCAG 2.1 AA, web + native)
Type: Story · P0 · M · Deps: all feature epics
- AC1: WCAG 2.1 AA on web — contrast, focus order, keyboard nav, live regions on queue/timer/status changes; status never color-only (pairs with a label/icon).
- AC2: native screen-reader labels (VoiceOver/TalkBack) on interactive controls; reduced-motion honored across animated surfaces.
- AC3: automated a11y lint/axe pass in CI where feasible; manual checklist for the rest.
- Skills: a11y, RNTL, axe.

#### RBT-081: Performance + bundle budgets
Type: Story · P0 · M · Deps: RBT-033, all feature epics
- AC1: web budgets met — p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 (mobile 4G profile); bundle **public ≤300KB / transactional ≤500KB gzip** enforced by CI.
- AC2: code-split transactional routes; lazy-load heavy deps; image/QR render without layout shift.
- AC3: debounced NIK checks + one-poller-per-session verified (no request storm).
- Skills: perf profiling, bundling, Web Vitals.

#### RBT-082: Flash-crowd load test (core risk)
Type: Story · P0 · L · Deps: RBT-042, RBT-050, RBT-054
- AC1: FE load-test baseline against a test BE — **50k public / 10k waiting / 1k checkout** concurrent; adaptive-polling `nextPollAfterMs` honored under load (no FE-induced storm).
- AC2: session-continuity ("jangan PHP") holds across refresh/background/kill at load; server-authoritative timer + idempotent hold verified under contention (no oversell observable from FE).
- AC3: results documented with pass/fail vs targets; regressions filed.
- Skills: load testing, perf, domain verification.
- **Highest-risk story in the project** — proves the no-oversell / flash-crowd NFR; keep it independently trackable.

#### RBT-083: QA suites — Playwright (web) + Maestro (native), local/manual
Type: Story · P0 · L · Deps: all feature epics
- AC1: Playwright web + Maestro native suites green **locally/manually** (NOT in cloud CI, per D6.5); cover the 13 acceptance scenarios (TESTING-STRATEGY §4).
- AC2: happy path (queue→hold→pay→e-ticket) + key edge cases (expiry, re-queue, payment failed/verifying) scripted.
- Skills: Playwright, Maestro, e2e.

#### RBT-084: Release readiness — OTA channels, rollback, release summary
Type: Story · P0/P1 · M · Deps: RBT-005, RBT-081, RBT-082, RBT-083
- AC1: EAS Update channels (`development`/`production`) + OTA-vs-native routing rehearsed; rollback path tested (per PIPELINE.md + D5.3).
- AC2: release summary/checklist wired; SEO output + bundle gates green on web release; go/no-go evidence collected for H5.
- Skills: EAS, GitHub Actions, release management.

---

## Milestones

- **M1 — Walking skeleton** (E1 + E2): app boots, typed API + clock + idempotency + mock, CI green.
- **M2 — Discovery** (E3 + E4): auth/profile + Home/Browse/Event + SEO.
- **M3 — Booking spine** (E5 + E6): queue → admission → checkout → hold (the core "jangan PHP" path).
- **M4 — Pay & deliver** (E7 + E8): Midtrans payment + verify + e-ticket + notifications.
- **M5 — Release-ready** (E9): a11y/perf/load/QA + OTA/rollback → production.

## Parallel Work Opportunities (disjoint files)

- **Batch A (after E2):** E3 (auth, `features/auth`), E4 (events, `features/events`), E5 (queue, `features/queue`) — distinct feature packages, shared only via domain/api-client (frozen interfaces).
- **Batch B (after E6):** E7 (payment) sequential on booking; E8 notifications (RBT-072/073) can start in parallel with E7 since they only need the DI port.
- **Serialize:** anything touching `packages/domain` state machines or `api-client` ports (shared writers) — land interface changes first.

## Risk Register

| Story | Risk | Impact | Mitigation |
|-------|------|--------|------------|
| RBT-041/042 | Queue correctness + no request storm under flash crowd | H | Domain unit tests + load test (RBT-080); honor nextPollAfterMs; one poller/session |
| RBT-061/062/065 | Payment/page-token contract (O2) unconfirmed; BE payment service still in progress | M | **Mock `PaymentRepository` adapter (RBT-065) keeps FE fully unblocked** — all payment UI/flow is production code against the port; swap to real BE at composition root. Confirm createAttempt + page-token shapes before M4 |
| RBT-073 | Web push browser support/permissions | M | Feature-detect + graceful degrade; test across browsers |
| RBT-050/054 | Hold/timer race on refresh/expiry | H | Server-authoritative only; reconcile with BE; acceptance scenarios 1/3/6 |
| O1 FE-NEED gaps | BE endpoints not delivered in time | M | Mock adapter keeps FE unblocked; track delivery |

## Out of Scope (FE build)

| Item | Reason |
|------|--------|
| BE services (Queue/Booking/Payment/Notification/User impl) | Other team |
| Stock atomicity, queue fairness enforcement | BE (NFR-04/05) |
| Payment card/instrument entry (card no., CVV, VA auth, e-wallet PIN) | Happens on Midtrans SNAP hosted page — PCI out of scope (D7.3). FE builds only the method-selection page + summary + timer (D10). |
| Admin/back-office | Out of scope (requirement §2) |

## Tracking
States: Backlog → To Do → In Progress → In Review → QA → Done. Labels: `blocked`, `needs-spec`, `needs-review`, `tech-debt`.

---

**GATE H3 — Task verification.** ✅ **PASSED 2026-10-29 (user: "split it, approve as is").** Epic 9 split into per-concern stories (RBT-080…084); flash-crowd load test (RBT-082) surfaced as the independently-tracked highest-risk story. Breakdown: 9 epics / 44 stories, FR/BR/NFR traceable, deps + critical path sound. → Phase 4 (Skills & Rules).
