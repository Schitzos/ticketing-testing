# Grand Architecture — Rusuh Booking Tiket (Expo Universal)

> **Status:** Locked frontend architecture
> **Date:** 2026-10-28
> **Authors:** FE Architecture
> **Scope:** Frontend for **Web + Android + iOS**, consuming the five backend services defined in `.genesis/docs/api-contract/`.
> **Backend ownership:** API implementation, inventory authority, queue fairness, payment processing, notification delivery, and data persistence remain owned by the BE team.

**Sources of truth:** PDF `.genesis/requirement/Tender Rusuh Booking Ticket.pdf` → OpenAPI contracts in `.genesis/docs/api-contract/` → `.genesis/docs/FE-BE-align-contract.md` → `.genesis/docs/FE-Flow-Diagrams.md` → prototype **V5**.

## 0. Executive Summary

We build one TypeScript frontend codebase with Expo:

| Target | Runtime | UI layer |
|---|---|---|
| Android | Expo + React Native | React Native components |
| iOS | Expo + React Native | React Native components |
| Web | Expo + React Native Web | React Native components, with selective `.web.tsx` implementations |

The shared frontend core contains API clients, typed contracts, client-side validation, state machines, timers, queue presentation logic, idempotency-key handling, and platform-neutral user flows. The backend remains the final authority for stock, queue order, ticket limits, booking holds, payment state, and expiry.

### Locked decisions

1. **Expo is the application framework.** We use Expo SDK, Expo Router, config plugins, development builds, and EAS or an equivalent internal CI pipeline.
2. **React Native Web is the web target.** We share most components across Android, iOS, and web, while allowing web-specific components where DOM, SEO, print, payment redirects, or desktop interaction requires them.
3. **Expo Go is development-only.** Real development and QA use custom Expo development/preview builds once native capabilities are introduced.
4. **TypeScript is the shared language.** There is no KMP, Kotlin/JS, Compose, SwiftUI, or separate native business-logic implementation in this architecture.
5. **One frontend domain layer, three platform renderers.** Business-flow logic is shared; platform-specific presentation and native adapters are isolated.
6. **The backend is authoritative.** Client validation improves UX but never replaces server validation or atomic inventory control.
7. **Clean Architecture and SOLID are mandatory design principles.** Feature code is organized around use cases and ports, not screens, frameworks, or transport details.

## 1. Product Context and Goals

Rusuh Booking Tiket is a high-contention concert-ticket system:

```text
Event discovery → Event preview → Waiting room → Admission →
Buyer/NIK validation → Ticket selection → Booking hold → Payment → E-ticket
```

The FE must make this flow understandable and resilient while the BE handles contention and authority.

### 1.1 Functional surface

| Screen | Purpose |
|---|---|
| Home | Event catalog, nearby events, history, profile entry |
| Browse results | URL-driven genre, province, time-window, and sort filters for upcoming events |
| Event detail | Event information, categories, availability, queue CTA |
| Waiting room | Queue position, progress, estimated time, refresh-safe state |
| Ticket detail / checkout | Buyer details, attendees, NIK validation, quantity, hold timer |
| Payment | Payment method, SNAP redirect/callback, payment timer, authoritative status verification |
| Success | Order summary, masked NIK, order ID, QR/e-ticket download |
| Expired / failed | Clear reason, released-hold messaging, recovery path |

### 1.2 Quality goals

- One shared implementation of client-side flow rules across Android, iOS, and web.
- Server-authoritative queue, stock, booking, payment, and deadline behavior.
- High-quality responsive web experience without forcing every desktop interaction into mobile conventions.
- Native capabilities for local/remote notifications, file sharing, deep links, secure storage, and QR handling.
- Accessible controls, readable contrast, reduced-motion support, and keyboard-friendly web behavior.
- Fast iteration through development builds and controlled OTA updates.
- Testable domain logic independent of React rendering and platform APIs.
- WCAG 2.1 AA for the web experience, with documented exceptions approved by accessibility review.
- Stampede-safe frontend performance: bounded bundle size, adaptive polling, CDN-friendly assets, and no client-side request storm.

### 1.3 Non-goals

- Reimplementing BE queue or inventory authority in the client.
- Sharing every visual detail across platforms when the platform experience should differ.
- Treating localStorage, AsyncStorage, or secure storage as the source of truth for orders or stock.
- Sending payment, push, or notification requests directly from the client when the contract assigns them to BE.

## 2. System Overview

```mermaid
flowchart LR
    WEB["Web<br/>Expo + React Native Web"]
    AND["Android<br/>Expo + React Native"]
    IOS["iOS<br/>Expo + React Native"]

    subgraph FE["Shared TypeScript frontend"]
        UI["Shared UI + design system"]
        FLOW["Domain flows + state machines"]
        API["Typed API clients + mappers"]
        ADAPTERS["Platform adapters"]
    end

    WEB --> UI
    AND --> UI
    IOS --> UI
    UI --> FLOW
    FLOW --> API
    FLOW --> ADAPTERS
    API --> BE["Backend gateway / five services"]
    ADAPTERS --> OS["Browser / Android / iOS APIs"]
```

### 2.1 Shared system design: Clean Architecture + platform boundaries

The frontend is a Clean Architecture system with one shared core and platform-specific outer adapters. The key rule is that source-code dependencies point inward toward higher-level policy. This follows the Clean Architecture dependency rule: the UI, transport, storage, and native APIs may change without changing domain rules. The same pattern also maps well to Expo because platform-specific files and modules can be selected at build time. [Clean Architecture dependency rule](https://www.informit.com/articles/article.aspx?p=2832399) [Expo platform-specific modules](https://docs.expo.dev/router/advanced/platform-specific-modules/)

```mermaid
flowchart LR
    WEB["Web<br/>RN Web"]
    AND["Android<br/>RN"]
    IOS["iOS<br/>RN"]

    subgraph CORE["SHARED FRONTEND CORE"]
        UI["UI + Design System"]
        APP["Use Cases + State"]
        DOMAIN["Domain Rules"]
        PORTS["Ports + API Contracts"]
        UI --> APP --> DOMAIN --> PORTS
    end

    WEB --> UI
    AND --> UI
    IOS --> UI
    PORTS --> ADAPTERS["Platform Adapters"]
    ADAPTERS --> BE["Backend APIs"]

    classDef platform fill:#e3f2fd,stroke:#1565c0,color:#0d47a1;
    classDef shared fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20;
    classDef backend fill:#fce4ec,stroke:#c2185b,color:#880e4f;
    class WEB,AND,IOS,ADAPTERS platform;
    class UI,APP,DOMAIN,PORTS shared;
    class BE backend;
```

#### What is shared

| Shared layer | Responsibility | Examples |
|---|---|---|
| Domain | Pure business concepts and rules | NIK validation, quantity rules, money, timer math, queue/booking/payment states |
| Application | User-intent orchestration | `JoinQueue`, `HoldBooking`, `CreatePaymentAttempt`, `RestoreSession` |
| Contracts | Stable boundaries between layers | TypeScript models, repository ports, API error taxonomy, request/response types |
| Feature state | Cross-platform server state and transitions | queue position, booking hold, payment status, loading/error/expired states |
| Design system | Shared visual language and accessible primitives | tokens, typography, buttons, cards, ticket rows, status indicators |
| Default components | Common interaction behavior | event cards, steppers, forms, countdowns, QR display, modals |

#### What is platform-specific

| Platform layer | Responsibility |
|---|---|
| Web presentation | SEO metadata, browser URLs, keyboard/focus behavior, desktop navigation, print, browser downloads, hover/pointer states |
| Native presentation | Native navigation conventions, safe areas, gestures, platform back behavior, haptics |
| Web adapters | Cookies, browser storage, payment redirects, Blob/download, web notification provider |
| Native adapters | Secure storage, push/local notifications, file system, share sheet, deep links, biometric/device APIs |
| Platform motion | Shared motion tokens and transitions, with CSS/Canvas or native-specific implementation where needed |

React Native Web is the default web renderer, while `.web.tsx`, `.native.tsx`, `.ios.tsx`, and `.android.tsx` are explicit escape hatches—not duplicated business logic. Expo and React Native document these platform-specific extension mechanisms. [React Native platform-specific code](https://reactnative.dev/docs/platform-specific-code.html) [Expo web support](https://docs.expo.dev/workflow/web/)

#### Dependency direction

```text
Platform screens and components
            ↓
Feature hooks / view models
            ↓
Application use cases and state machines
            ↓
Domain entities and rules
            ↑
Repository / platform ports implemented by outer adapters
            ↓
Backend transport, storage, OS, or browser APIs
```

The domain and application layers must not import React, React Native, Expo, browser globals, or native modules. React components must not call `fetch`, `expo-notifications`, `expo-file-system`, or storage directly; they call a feature hook or use case. Concrete implementations are wired at the composition root.

#### SOLID constraints inside this design

| Principle | Frontend application |
|---|---|
| **S — Single Responsibility** | Screens compose features; use cases perform one user intent; repositories translate one backend capability; adapters wrap one platform API. |
| **O — Open/Closed** | Add a payment method, notification provider, or platform implementation through a new adapter/configuration rather than modifying domain rules. |
| **L — Liskov Substitution** | Mock, staging, and production repositories implement the same interfaces and can be substituted in tests or environments. |
| **I — Interface Segregation** | Depend on focused ports such as `QueueRepository`, `PaymentRepository`, `Clock`, `NotificationPort`, and `FileSharePort`; do not inject one global service object. |
| **D — Dependency Inversion** | Use cases depend on interfaces; concrete REST, Expo, browser, and native implementations are wired at the application composition root. |

This keeps the same booking flow usable by Android, iOS, web, mocks, and automated tests.

### 2.2 Technology choices

| Concern | Locked choice | Notes |
|---|---|---|
| App framework | **Expo** | Universal Android, iOS, and web workflow |
| UI | **React Native** | Shared component primitives and interaction model |
| Web renderer | **React Native Web** | React DOM underneath; `.web.tsx` escape hatch |
| Navigation | **Expo Router** | File-based routes, deep links, browser URLs, layouts, guards |
| Language | **TypeScript** | Shared domain, API types, hooks, and UI |
| State | **Zustand** | Client/session/UI state; domain actions remain framework-light |
| Server data | **TanStack Query** | Cache, retries, refetch, polling, mutation lifecycle |
| Forms | **React Hook Form + Zod** | NIK, email, attendee, and checkout validation |
| Animations | **React Native Reanimated** | Shared motion; CSS/SVG/Canvas only for web-specific effects |
| QR | `react-native-svg` + QR library | Render shared QR; platform-specific export/download adapter |
| Notifications | `expo-notifications` | Local scheduling and remote token registration |
| Files | `expo-file-system` + `expo-sharing` | Native save/share; browser download fallback |
| Secure storage | `expo-secure-store` | Tokens and sensitive client credentials on native |
| Local persistence | **AsyncStorage** | Non-authoritative drafts and restore metadata; SQLite is out of scope for v1 |
| Contracts | OpenAPI-generated TypeScript types/client | Keep FE aligned with BE contracts |
| Static quality | **SonarCloud Quality Gate** | TypeScript analysis, bugs, vulnerabilities, code smells, duplication, and coverage thresholds |
| Unit/component testing | **Jest** + React Native Testing Library | Domain rules, hooks, components, accessibility contracts |
| Web QA | **Playwright (local/manual)** | React Native Web in Chromium/WebKit/Firefox, responsive layouts, SEO output, keyboard, download/print; not executed in cloud CI |
| Native QA | **Maestro (local/manual)** | Final Android/iOS development or preview builds, notifications, deep links, permissions, share/download; not executed in cloud CI |
| Delivery | EAS Build/Submit/Update or internal CI | EAS is optional; Expo framework is not tied to EAS |

## 3. Monorepo Structure

```text
apps/
└── client/                            # One Expo app: Android, iOS, Web
    ├── src/
    │   ├── app/                        # Expo Router routes only
    │   │   ├── (public)/
    │   │   │   ├── index.tsx           # Home
    │   │   │   ├── browse.tsx          # URL-driven filtered event results
    │   │   │   ├── events/[eventId].tsx
    │   │   │   └── history.tsx
    │   │   ├── (booking)/
    │   │   │   ├── waiting/[eventId].tsx
    │   │   │   ├── checkout/[sessionId].tsx
    │   │   │   ├── payment/[bookingId].tsx
    │   │   │   └── success/[bookingId].tsx
    │   │   └── expired/[resourceId].tsx
    │   ├── features/                    # Screen-level composition
    │   │   ├── events/
    │   │   ├── queue/
    │   │   ├── booking/
    │   │   ├── payment/
    │   │   └── ticket/
    │   ├── components/                 # App-specific shared components
    │   └── providers/                   # Query, state, theme, DI composition root
    ├── app.json / app.config.ts
    ├── eas.json
    └── package.json

packages/
├── domain/                            # Pure TypeScript business-flow logic
├── api-client/                        # OpenAPI types, repositories, transport
├── state/                             # Session, queue, cart, checkout, payment
├── ui/                                # Cross-platform components
├── design-tokens/                     # Telkomsel-inspired theme tokens
├── platform/                          # Native/web adapter interfaces + actuals
├── config/                            # Environment and feature flags
└── test-fixtures/                     # Contract-shaped mocks and scenarios
```

`src/app` is intentionally limited to routing and route configuration. It should not contain API calls or business rules. Routes import feature containers from `src/features`, which call shared use cases from `packages/domain` and `packages/api-client`.

```text
src/app/events/[eventId].tsx
        ↓
src/features/events/EventDetailScreen.tsx
        ↓
packages/domain/use-cases/get-event-detail.ts
        ↓
packages/api-client/repositories/event-repository.ts
```

This keeps Expo Router replaceable and prevents the route tree from becoming the application’s business layer.

### 3.1 Platform file conventions

Use shared files first, then split only when behavior or UX genuinely differs:

```text
TicketCard.tsx          # shared default
TicketCard.web.tsx      # desktop/web-specific version
TicketCard.native.tsx   # Android + iOS version
PaymentRedirect.web.ts  # browser payment callback
PaymentRedirect.native.ts # app deep-link callback
```

### 3.2 Platform divergence governance

Platform files are an escape hatch, not a second architecture. Apply these rules:

- **Logic never splits.** Validation, state transitions, API calls, timers, and business rules stay in shared domain/application packages.
- **Only presentation or platform integration may split.** A `.web.tsx` file may change layout, semantics, keyboard behavior, print, or browser APIs; it may not reimplement booking behavior.
- **Shared-first rule.** Start with one shared component and split only after a measured accessibility, UX, native capability, or performance reason.
- **One web + one native variant is the normal maximum.** A third full implementation (`.ios.tsx` or `.android.tsx`) requires architecture review.
- **Duplication threshold.** If platform variants duplicate more than roughly 25% of their logic/markup, extract shared primitives or redesign the component.
- **Feature-level forks are a smell.** If several components in one feature require parallel platform trees, the feature needs a shared view model and smaller platform adapters.

The owner of a platform fork must record its reason, shared contract, test coverage, and removal/review date in the feature documentation.

## 4. Shared Frontend Core

### 4.1 Domain package

`packages/domain` owns pure client-side rules and state transitions:

```text
domain/
├── models/             # event, queue, booking, payment, ticket
├── errors/             # typed domain errors
├── services/           # server clock, polling policy, money, messages
├── rules/              # NIK, quantity, attendee, payment-method rules
├── state-machines/     # queue, booking, payment
└── use-cases/          # events, queue, booking, payment, profile
```

Client rules include NIK formatting, required fields, quantity limits for UX, duplicate attendee checks, timer presentation, retry policy, and route transitions. The BE must repeat and enforce all security- or inventory-sensitive rules.

### 4.2 Server-authoritative clock

Every timed API response may carry `serverTime`, `expiresAt`, or an equivalent contract field. The FE calculates a display offset and never treats the device clock as authoritative.

```ts
export class ServerClock {
  constructor(private readonly clock: ClockPort) {}
  private offsetMs = 0;

  sync(serverTimeMs: number, deviceNowMs = this.clock.now()) {
    this.offsetMs = serverTimeMs - deviceNowMs;
  }

  now() { return this.clock.now() + this.offsetMs; }
  remaining(expiresAtMs: number) { return Math.max(0, expiresAtMs - this.now()); }
}

export interface ClockPort {
  now(): number;
}
```

The FE displays booking and payment countdowns and reacts to expiry. It does not extend, release, or settle a booking locally; it refreshes server state and renders the authoritative result.

### 4.3 Queue, booking, and payment states

The queue hook exposes a platform-neutral view model:

```ts
type QueueViewState =
  | { status: 'idle' }
  | { status: 'joining' }
  | { status: 'waiting'; position: number; estimatedWaitMs?: number }
  | { status: 'admitted'; admissionToken: string }
  | { status: 'session-created'; sessionId: string }
  | { status: 'expired' | 'left' | 'error'; message: string };
```

Polling frequency is adaptive according to the contract and server response. SSE or streaming is used when supported; polling remains the fallback. Refresh-safe restoration uses persisted identifiers, then revalidates with BE.

Booking and payment are explicit state machines:

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> sessionCreated
    sessionCreated --> editing
    editing --> holdRequested
    holdRequested --> held: hold accepted
    holdRequested --> editing: validation/conflict retry
    held --> paymentPending: continue to payment
    held --> expired: booking/payment deadline
    held --> cancelled: user abandons
    paymentPending --> paid: payment confirmed
    paymentPending --> expired: payment deadline
    paymentPending --> cancelled: cancellation accepted
    paid --> [*]
    expired --> [*]
    cancelled --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> ready
    ready --> attemptCreated: select method
    attemptCreated --> awaitingPayment
    awaitingPayment --> paid: status = SUCCEEDED
    awaitingPayment --> failed: status = FAILED
    awaitingPayment --> expired: status = EXPIRED / timeout
    failed --> ready: retry allowed
    failed --> [*]: retry unavailable
    paid --> [*]
    expired --> [*]
```

Every mutating request receives an idempotency key generated once per user action and reused for safe retries. The response is reconciled with server state before navigation.

## 5. Backend Services Consumed

The FE consumes the existing contracts; this architecture does not change BE ownership.

| Service | FE responsibility | Main contract usage |
|---|---|---|
| User | Optional OTP/profile UI, session presentation | OTP request/verify, profile, refresh, logout |
| Queue | Join, restore, observe, claim, leave | Queue entry and status endpoints |
| Booking | Event catalog, session, attendee checks, hold, ticket retrieval | Events, sessions, bookings, ticket endpoints |
| Payment | Show page, create attempt, SNAP redirect/callback, verify status | Payment page, attempts, status, optional page tokens |
| Notification | No direct business send from FE | Backend sends e-ticket/expiry email and remote push |

### 5.1 Shared API conventions

The API client centralizes:

- `{meta, data}` and `ErrorEnvelope` unwrapping.
- OpenAPI-generated request/response types.
- `serverTime` synchronization.
- Authentication and visitor-token injection.
- `Idempotency-Key` generation and retry reuse for mutations covered by the contract.
- `Retry-After` handling for rate limits.
- Error-code mapping into user-facing domain errors.
- Request correlation IDs and safe logging with NIK/payment data redacted.

For every mutation that the contract declares idempotent, generate the key at action start, persist it with the resumable action/session, reuse it across refresh and network retry, and clear it only after the server returns a terminal result or the action is explicitly abandoned. For queue join/claim and other mutations without a defined key, FE must follow the endpoint-specific reconciliation contract and must not invent an unsupported header.

### 5.2 Known contract gaps

The existing FE/BE alignment document identifies these gaps and they remain tracked rather than silently invented in the client:

- Anonymous queue `JoinRequest` shape.
- Queue join/claim idempotency and unknown-outcome reconciliation.
- Buyer/profile completion endpoint and response indicator.
- `EventSummary.remainingTickets`.
- Structured `EventDetail.description` and banner image fields.
- Structured event genre/category and province/location fields for catalog filtering.
- Server-side event filter, time-window, and sort parameters; V5 currently filters the fetched catalog in the browser.
- Event history/archive endpoint or retention guarantee; V5 currently derives history from past `startsAt` values or `CLOSED` status in the fetched catalog.

These are represented through typed optional fields or feature flags until BE contract changes are agreed.

## 6. Native and Web Capabilities

### 6.1 Notifications

Use `expo-notifications` for local schedules and device-token registration. Remote push delivery remains a BE concern through Expo Push Service, FCM, APNs, or the agreed provider. Push behavior must be tested in a custom development build and release build, not only Expo Go.

Required flows include booking/payment expiry reminder, payment success, queue admission, event reminder, and notification tap → deep link to the relevant route.

Web notifications are **mandatory in v1 (H1 decision, 2026-10-29 — supersedes the earlier deferral).** The web target must implement web push through a service worker + browser Notification/Push permission flow, behind the same shared domain notification flow used by native. Remote web push delivery remains a BE concern (web-push provider / VAPID or the agreed service), consumed through a web notification adapter in `packages/platform`; the shared domain flow does not change between native and web. The web push adapter covers the same required flows as native (booking/payment expiry reminder, payment success, queue admission, event reminder, notification tap → deep link).

### 6.2 QR and ticket download

The QR payload comes from BE and is rendered as a visual QR on all platforms. The FE must not place raw NIK or payment secrets in the QR unless the contract explicitly requires it.

```text
Native: QR SVG/image → expo-file-system → expo-sharing / OS share sheet
Web:    QR SVG/image → Blob or print stylesheet → browser download/print
```

### 6.3 Animation and motion

- Use Reanimated for shared transitions, queue progress, timers, card interactions, and bottom sheets.
- Use SVG or Canvas only for effects that materially need them.
- Use `.web.tsx` for complex desktop hero motion when DOM/CSS or browser APIs produce a better result.
- Respect `prefers-reduced-motion` on web and the native reduced-motion accessibility setting.
- Never make queue position, expiry, stock, or payment status dependent on animation completion.

### 6.4 React Native Web

The default implementation uses React Native primitives and renders through React Native Web. Web-specific escape hatches are allowed for SEO metadata, browser keyboard/focus behavior, payment redirects, print/download behavior, desktop navigation, hover/pointer interactions, and Canvas/CSS hero effects.

The web target must retain semantic labels, keyboard access, focus visibility, readable contrast, responsive breakpoints, and useful loading/error fallbacks for critical public content.

### 6.5 SEO strategy

SEO is supported in this stack through Expo Router’s web rendering modes. Public event pages must be prerendered or server-rendered; the app must not ship as a single SPA if those pages need to be indexed.

```text
Public home/event pages  → static or server-rendered HTML → SEO/indexing
Queue/checkout/payment   → client-rendered authenticated flow → conversion
Success/expired pages    → client state + server validation → privacy-safe details
```

Locked web configuration for the public ticket catalog:

```json
{
  "expo": {
    "web": { "output": "static" }
  }
}
```

Use `web.output: "static"` when event content can be generated during deployment. Use `web.output: "server"` when event pages need request-time data or dynamic route rendering. Expo documents that `single` produces one SPA HTML file with no statically indexable HTML, while `static` produces HTML per route and `server` renders on each request. [Expo static rendering and SEO](https://docs.expo.dev/router/web/static-rendering/) [Expo publishing websites](https://docs.expo.dev/guides/publishing-websites/)

SEO requirements:

- Route-level title, description, canonical URL, Open Graph, and Twitter metadata.
- Prerendered event name, date, venue, city, price-from, and availability messaging.
- `generateStaticParams` or server rendering for `/events/[eventId]`.
- JSON-LD Event structured data where the BE provides reliable event fields.
- `sitemap.xml`, `robots.txt`, favicon, and social share images in `public/`.
- Semantic web markup and meaningful text, with web-specific components where React Native primitives are insufficient.
- No indexing of waiting-room positions, NIK, payment state, or personal ticket details.
- V5 filter results use URL query parameters on `/browse` (`genre`, `province`, `time`, `sort`) and are client-filtered from the fetched catalog. Production must either add server-backed filter parameters or explicitly cap the catalog size and mark query-result pages `noindex` until they have reliable server/static HTML.

Therefore, React Native Web does not prevent SEO. It changes the implementation requirement: public catalog content must use Expo Router static/server rendering, while transactional screens remain interactive client flows.

#### SEO capability and trade-offs

| Capability | Benefit | Trade-off / mitigation |
|---|---|---|
| Static event HTML | Crawlable event pages, fast cacheable delivery | Content changes require a rebuild or revalidation strategy |
| Server-rendered event HTML | Fresh event metadata and dynamic routes | Requires a server runtime and adds TTFB/hosting complexity |
| Route metadata and JSON-LD | Better search snippets and social previews | Must be generated from trusted BE event data and kept privacy-safe |
| RN Web shared components | Reuse across mobile and web | Some semantic HTML/SEO details need `.web.tsx` or web-only primitives |
| Client-side queue/checkout | Correct for personalized, volatile state | These pages are not SEO targets and should be `noindex` |
| React Native Web bundle | One UI codebase | Requires bundle budgets, route splitting, and performance testing |

SEO is therefore capable for the public catalog and event discovery surface, but it is not a reason to expose authenticated transactional screens to crawlers.

## 7. Screen and Flow Mapping

| Route | Shared feature package | Primary API activity |
|---|---|---|
| `/` | events | List events, filters, history |
| `/browse` | events | Read URL filters, show upcoming filtered results, reset/remove filters |
| `/events/[eventId]` | event-detail | Event detail, categories, availability |
| `/waiting/[eventId]` | queue | Join/restore/observe/claim |
| `/checkout/[sessionId]` | booking | Buyer, attendee checks, hold |
| `/payment/[bookingId]` | payment | Page, attempt, SNAP redirect, callback verification |
| `/success/[bookingId]?orderId={orderId}` | ticket | Ticket detail, QR, download/share |
| `/expired/[resourceId]` | recovery | Re-fetch state, explain booking/payment/SNAP failure, restart |

The navigation layer only coordinates routes. It must not contain inventory rules, payment settlement logic, or duplicate validation implementations.

## 8. Security and Privacy

- Never log full NIK, payment credentials, access tokens, or QR payloads containing sensitive data.
- Store native tokens in `expo-secure-store`; use an appropriate secure cookie/session strategy on web.
- Treat all client state as tamperable.
- Do not trust client-calculated price, stock, queue position, or expiry.
- Validate deep-link parameters before rendering sensitive order data.
- Clear checkout/session state after success, expiry, logout, or explicit cancellation.
- Keep payment UI within the BE/payment-provider contract; do not collect raw card data unless the approved PCI-compliant integration requires it.

## 9. Testing Strategy

| Layer | Tooling | Coverage |
|---|---|---|
| Domain rules | **Jest** | NIK, quantity, duplicate attendees, money, timer math, state transitions |
| API adapters | MSW or contract fixtures | Envelope mapping, error codes, retries, idempotency, server clock |
| Components | React Native Testing Library | Accessible labels, loading/error/empty/expired states |
| Native adapters | Jest unit tests + local/manual Maestro flows | Notifications, secure storage, deep links, file sharing |
| Web | Local/manual Playwright | Responsive layout, keyboard flow, URL routes, download/print, reduced motion |
| End-to-end | Test BE environment | Queue → booking → payment → success/expiry |

Accessibility target: **WCAG 2.1 AA** for the web target, based on the [W3C WCAG 2.1 Recommendation](https://www.w3.org/TR/WCAG21/). Automated checks are supplemented by keyboard-only testing, screen-reader smoke tests, focus-order review, reduced-motion testing, contrast checks, form-error announcements, and manual testing of queue/payment status changes.

### 9.1 E2E tool decision

Use both tools for local/manual validation because the product has two different UI runtimes. They are intentionally excluded from cloud CI to keep the merge and OTA pipeline fast and predictable:

| Target | Tool | Why |
|---|---|---|
| Web / React Native Web | **Playwright** | Local/manual browser validation for SEO HTML, URLs, keyboard/focus behavior, responsive viewports, downloads, and print. |
| Android/iOS / React Native | **Maestro** | Local/manual validation of final native builds through the accessibility/UI layer, including permissions, deep links, notifications, and OS share flows. |

Playwright remains the browser-specific tool and Maestro remains the native-specific tool, but neither runs in cloud CI. Developers or QA run them locally against development/preview builds. [Maestro React Native support](https://docs.maestro.dev/get-started/supported-platform/react-native) [Playwright browser coverage](https://playwright.dev/docs/browsers)

SonarCloud is a static quality gate, not an E2E runner. It runs in cloud CI before OTA and fails the pipeline on agreed bugs, vulnerabilities, code smells, duplication, or coverage thresholds. Playwright and Maestro are not cloud quality gates.

Minimum acceptance scenarios:

1. Refresh while waiting preserves and then revalidates queue state.
2. Two taps on hold use one idempotency key.
3. Device clock changes do not extend a booking.
4. Stock and maximum-per-NIK errors from BE render as recoverable UI states.
5. Payment redirect/deep-link resumes the correct payment attempt.
6. Expired booking clears the local hold and cannot be paid.
7. QR ticket renders and downloads/shares on each target.
8. Reduced motion keeps timers and functional state updates active.

### 9.2 Rusuh performance and capacity treatment

The frontend must remain calm when demand is not. Backend capacity and inventory correctness are BE-owned, but the FE must avoid amplifying a launch stampede.

Initial release budgets:

| Area | Target |
|---|---|
| Public web initial JavaScript | ≤ 300 KB gzip for the landing/event route; ≤ 500 KB gzip for transactional routes |
| Public web performance | p75 LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 on the agreed mobile 4G profile |
| Public assets | CDN-cacheable images/fonts; responsive images; no unbounded hero video or Canvas workload |
| Route loading | Code-split booking/payment features; do not load payment/native-only modules on public pages |
| Queue polling | One active poller per queue session, adaptive intervals, jitter, cancellation on unmount/background, no duplicate refresh loops |
| Client request behavior | Exponential backoff for transient failures; honor `Retry-After`; deduplicate identical reads |
| Burst baseline | FE load test baseline: **50,000 concurrent** public browsers, **10,000 concurrent** waiting-room clients, and **1,000 concurrent** checkout clients; BE must confirm final launch capacity and SLOs |

Capacity tests must measure CDN hit rate, JavaScript transfer, memory, event-list rendering, queue poll volume, reconnect behavior, and recovery after a network interruption. The FE must never attempt to simulate or locally reconcile inventory under load; it displays BE responses and backs off when instructed.

## 10. Build, CI/CD, and OTA

Detailed GitHub Actions jobs, SonarCloud gates, Expo build routing, and OTA promotion rules are defined in [`PIPELINE.md`](./PIPELINE.md). Web and native QA tools are defined in this architecture's testing strategy, not in the CI/CD pipeline.

### 10.1 Build profiles

```text
development → custom dev client, local/mock BE, debug tooling
preview → internal distribution, staging BE, QA and product review
production → store build, production BE, release monitoring
web-preview → web build against staging
web-production → web deployment against production
```

### 10.2 OTA policy

For Android/iOS, OTA updates may deliver compatible JavaScript and asset changes such as UI fixes, feature flags, flow fixes, copy, styling, animation, and safe bug fixes. React Native Web is delivered through the web hosting/CDN deployment pipeline, not the native EAS OTA channel. Native changes still require a new Android/iOS build and store or internal-distribution release.

### 10.3 Branch-to-environment OTA strategy

There are exactly two app environments and two long-lived branches:

```text
feature/* ── merge request ──> develop ── native OTA: development + web deployment
                                  │
                                  └── merge request ──> main ── native OTA: production + web deployment
```

| Git event | Target app | Delivery | Required checks |
|---|---|---|---|
| Feature branch merged into `develop` | Development app + web | Native channel `development` + development web host | Typecheck, lint, unit/component tests, web-build/SEO checks, runtime compatibility |
| `develop` merged into `main` | Production app + web | Native channel `production` + production web host/CDN | Full CI, approval, release notes, rollback readiness |

Feature branches never publish directly to production. The delivery pipeline must publish the commit that exists on the target branch, keep native runtime versions compatible, record Git SHA and deployment/update IDs, and support native OTA rollback plus web artifact rollback. Native changes are detected and routed to the build pipeline instead of OTA.

A new native build is required for new native modules, permission or entitlement changes, push configuration changes, app identity changes, URL schemes, or native payment/camera/biometric/file-system integration changes.

Every native OTA update is assigned a runtime-compatible channel, tested on preview first, monitored, and rollback-capable. Every web deployment is tied to a Git SHA, tested as a web artifact, monitored, and rollback-capable. Never use OTA to bypass app-store review for native or policy-sensitive changes.

### 10.4 CI gates

```text
typecheck → lint → unit tests → component tests →
SonarCloud gate → web-build/SEO output check → bundle-size check →
preview build → production approval
```

This sequence describes the post-merge release path. Pull requests run the validation gates through SonarCloud and stop before web deployment, OTA publication, native distribution, or production approval. Native-affecting changes branch to Android/iOS build jobs; compatible JavaScript/assets use OTA, while React Native Web always uses the web deployment path.

## 11. Key Decisions

### 11.1 Expo Universal — ACCEPTED

Expo provides the framework and tooling for one React Native application targeting Android, iOS, and web. It also supports custom development builds and native extensions; Expo Go is not the production runtime.

### 11.2 React Native Web — ACCEPTED

React Native Web provides shared primitives and renders through React DOM. It maximizes reuse while preserving `.web.tsx` escape hatches for SEO, payment, print, desktop interaction, and advanced web motion.

### 11.3 TypeScript shared domain — ACCEPTED

Queue presentation, client validation, timer math, error mapping, and flow state machines are implemented once. Server-sensitive rules remain duplicated at BE by necessity; the BE result always wins.

### 11.4 Custom development builds — ACCEPTED

Expo Go is suitable for early UI exploration. Development and preview builds are required for notifications, custom native modules, app identity, deep links, credentials, and production-like QA.

### 11.5 Separate UI where justified — ACCEPTED

The target is shared product behavior and a shared design language, not forced visual identity. Platform-specific files are allowed when they improve accessibility, performance, payment compatibility, or platform conventions.

## 12. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| RN Web differs from DOM-first React | Keep web escape hatches and test real browsers with Playwright |
| Native library lacks Expo support | Prefer Expo-compatible libraries; add a config plugin or native module through a development build |
| Push behavior differs by OS | Test physical devices and release builds; keep BE delivery observable |
| OTA ships incompatible JS | Enforce runtime versions, preview channels, staged rollout, and rollback |
| SEO/indexing failure | Lock `web.output` to `static` or `server`; add a CI check that rejects `single` for public routes and verifies prerendered HTML |
| Bundle-budget regression | Add a CI bundle-size gate for public and transactional route budgets; investigate any regression before merge |
| Client logic diverges from BE | Treat API responses as authoritative; generate types from contracts and run contract validation locally or in the separate integration-validation process |
| Desktop web UX feels too mobile | Use responsive layout tokens and `.web.tsx` implementations for complex sections |
| Animation impacts accessibility/performance | Reduced-motion mode, performance budgets, and animation-independent state updates |
| Sensitive data leaks into local state/logs | Redaction, secure storage, short-lived checkout state, and security review |

## 13. Delivery Roadmap

| Phase | Deliverable |
|---|---|
| P0 | Expo Universal app, `apps/client/src/app`, `packages/domain`, `packages/api-client`, `packages/state`, `packages/ui`, `packages/design-tokens`, `packages/platform`, Expo Router, theme tokens, CI skeleton |
| P1 | API client, OpenAPI types, mock adapter, auth/session, shared error and loading states |
| P2 | Events and event detail, responsive web layout, motion system, accessibility baseline |
| P3 | Queue state machine, refresh-safe waiting room, server clock, adaptive polling/stream fallback |
| P4 | Booking checkout, NIK/attendee validation, idempotency, server hold and expiry reconciliation |
| P5 | Payment methods, SNAP redirect/callback, failure and expiry recovery |
| P6 | E-ticket QR, native share/download, web download/print, notification registration |
| P7 | Local/manual web QA and native device QA, preview builds, OTA channels, production release readiness |

## Appendix A — Glossary

| Term | Meaning |
|---|---|
| Expo | React Native framework, SDK, CLI, and optional build/update services |
| Expo Go | Generic prebuilt development container; not the production app |
| Development build | Project-specific native app containing the selected Expo/native modules |
| React Native Web | React Native compatibility layer that renders React Native components in the browser |
| EAS Build | Optional hosted build service for Android/iOS binaries |
| EAS Update | Optional OTA service for compatible JavaScript/assets |
| Server-authoritative | The backend response is the final source of truth for state and deadlines |
| Idempotency key | Stable key reused when retrying one mutating action |
