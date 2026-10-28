# Rusuh Tiket — Prototype V5

V5 is a **contract-shaped** rebuild of V1. It keeps V1's visual language (red/ember
palette, glassmorphism, Plus Jakarta Sans, `prefers-reduced-motion`, ARIA) but rewires
every page to a single **mock API layer (`api.js`)** whose core shapes follow the OpenAPI
contracts: the `{meta, data}` envelope, integer `*Minor` prices, server-authoritative
deadlines, the real enums, per-endpoint `errorCode`s, and the `Idempotency-Key` requirement
on supported mutating calls. V5 also contains explicitly marked mock-only extensions while
the backend contract is being finalized.

> This is a **prototype — no real backend**. `api.js` returns dummy data after a small
> `setTimeout` to simulate the network. When the backend is ready you swap the mock body
> of each function for a `fetch`; pages change nothing because the return shape is identical.

## Files

| File | Purpose |
|------|---------|
| `api.js` | **The required prototype API surface, mocked.** Envelope factory, `minorToIDR`, clock-skew helpers (`syncClock`/`serverNow`/`remainingMs`), `errorCode→Bahasa` map, token/idempotency/visitor helpers, `localStorage` persistence, and the contract-shaped endpoints needed by the demonstrated flow as async functions returning `{meta,data}` (and sometimes an error envelope). Includes a **User Service** mock for passwordless OTP login/registration (`requestOtp`, `verifyOtp` → `{account, isNew}`, `completeRegistration` = mirror `PATCH /me {fullName, nik}`, `getMe`, `logout`, `isLoggedIn`) and a `setBuyer(sessionId,{buyerNik,email})` mock. Holds ≥5 dummy events (incl. one `SOLD_OUT`, one `NOT_STARTED`, and past `CLOSED` events for History) plus a JSON `description` per event. Exposed as `window.API`. |
| `index.html` | **Home.** Events from `API.listEvents()`; status enum → badge/label (**Tersedia** / **Stok Menipis**); price from `minPriceMinor` via `minorToIDR`; cards show date `DD-MMM-YYYY` + `remainingTickets`; **"Konser Terdekat"** (upcoming, sorted ascending) and **"History Event"** (past / `CLOSED`, sorted desc) sections; sold-out cards disabled; loading skeletons + empty state; the **Filter Event** modal is client-side only (contract has no server filter). Hosts the **"Masuk / Daftar"** account entry + OTP login/registration modal (email → OTP → *for new emails:* fill name + NIK, email shown read-only → success pop-up). |
| `event.html` | **Event detail.** `API.getEvent(eventId)` → categories + `priceMinor` + `available`. Rich description / T&C / line-up / banner render from a dynamic **`description` JSON** field (`{longDesc, lineup, terms, bannerImage}`) — a **GAP: FE-NEED** not yet in `EventDetail`. "Masuk Antrean" joins the queue **anonymously** (`API.joinQueue(eventId)` — **no NIK/email form**) → `waiting.html`; `ADMITTED` → claim → `detail.html`. Buyer NIK/email are collected later in `detail.html`, not here. |
| `waiting.html` | **Waiting room.** Position from `API.getQueueStatus()` + `API.getMyEntry()`; **persists across refresh** (reads `rb_queue` from `localStorage`); **adaptive polling** honours `nextPollAfterMs`; zone `GUARANTEED`/`POSSIBLE`/`NOT_ENOUGH` colored green/amber/red with "jangan PHP" copy; shows only **"orang di depan" + "estimasi"** (no "laju antre"); ETA derived from `admissionRatePerMin` internally. On turn → **auto-`claim()` + auto-redirect** to `detail.html` (no manual button); `TURN_MISSED`/`EVENT_SOLD_OUT` error states. |
| `detail.html` | **Select tickets.** Session from `admissionToken` via `API.createSession()` (a fresh admission token always wins over a stale restored session). **Data Pembeli** section collects buyer **NIK + Email** here (queue is anonymous); if logged in, name/NIK/email **auto-fill** from the profile (badge "Terisi dari akun") — buyer email is used for the e-ticket. Login entry is **not** on this page (it lives on the landing). Selection is an **item list** (max = `maxSelectable`, min 1): each row = category dropdown + attendee name + attendee NIK. Each row has a **"Gunakan NIK pembeli (pembeli ikut nonton)"** checkbox that fills attendee NIK **and name** from the buyer and locks the fields; it is **single-use** — checking one row disables the checkbox on the others (prevents `ATTENDEE_NIK_DUPLICATE_IN_ORDER`). Attendee NIK on complete → `API.attendeeCheck()` (`AVAILABLE`/`ALREADY_REGISTERED`/`CHECK_LIMIT_REACHED` + `checksRemaining`; `CHECK_LIMIT_REACHED` does not block). Timer from `BookingSession.expiresAt` + `serverTime`, consistent on refresh. "Lanjut Bayar" → `API.setBuyer()` then `API.createBooking()` with `Idempotency-Key` → `payment.html`. The **"Kembali"** button shows a **confirm-leave dialog** ("you'll have to re-queue"). Errors (`CATEGORY_UNAVAILABLE`, `BUYER_QUOTA_EXHAUSTED`, `QUANTITY_EXCEEDS_LIMIT`, `SESSION_EXPIRED`) as toast/redirect. |
| `payment.html` | **Payment.** `API.getPaymentPage()`; methods **only** from the enum (`VA_BCA/BNI/BRI/PERMATA`, `QRIS`, `GOPAY`) — **no credit card**, **no service fee** (total == `amountMinor`). 10-min timer from `paymentExpiresAt` + `serverTime`. "Bayar" → `API.createAttempt()` with `Idempotency-Key` → backend returns a SNAP `redirectUrl` → user leaves for SNAP. The prototype uses `snap.html` as a local third-party simulator with success/failed callbacks. Callback pages verify `API.getPaymentStatus()` before rendering a result. Includes the optional WebView (`page-token` → `rb_pay` cookie) contract note. No `alert`/`confirm`. |
| `snap.html` | **Local SNAP simulator.** Represents the external payment provider only for V5. It sends a prototype callback outcome and redirects to the configured success or failed return URL. Production replaces it with the real SNAP URL returned by BE. |
| `success.html` | **E-tickets.** Verifies `PAID`, shows order ID, ticket quantity, total amount, masked buyer NIK, then calls `API.getTickets(bookingId)` for one card per ticket. Download = `window.print()`. |
| `expired.html` | Reads `?reason=booking|payment|payment-failed`; verifies payment status when a booking exists. Payment failure can return to payment while the booking remains payable; true expiry re-queues. |

## Key changes vs V1

1. **Everything is data-driven through `api.js`** — V1 hard-coded event/category/price strings in each page.
2. **Prices are `*Minor` integers** rendered with `minorToIDR()`; V1 used pre-formatted strings like `"Rp 450rb"`.
3. **Server-authoritative countdowns** — the booking (5 min) and payment (10 min) **timers** are computed from the server clock, `remainingMs = expiresAt − serverNow()` where `serverNow = Date.now() + (serverTime − clientNow)`. V1 used raw `Date.now()`, so the countdown drifted with the device clock and reset on every refresh.
4. **Real + anonymous queue** — the **waiting-room position** itself: join (no NIK/email) / status / my-entry / claim / leave, with **adaptive polling**, **zones**, and a position that **survives refresh** (persisted via `rb_queue`), plus **auto-claim + auto-redirect** on turn. UI shows only "orang di depan" + "estimasi". V1 faked a draining counter with `setInterval` that reset on reload.
5. **Ticket selection redesigned to an item list** (min 1, max `maxSelectable`) with per-ticket attendee name + NIK, live `attendee-checks`, `allowMixedCategories`, and a **single-use "Gunakan NIK pembeli (pembeli ikut nonton)"** checkbox that auto-fills attendee name+NIK from the buyer. V1 was a single category + quantity stepper + one buyer NIK.
6. **Buyer NIK + email collected at checkout** (queue is anonymous) with a **confirm-leave dialog** on back; **auto-filled from the account** when logged in.
7. **Login / Registration (User Service, landing only)** — passwordless OTP; a **new email must complete registration** (name + NIK; email shown read-only for the e-ticket) and sees a **success pop-up**; returning emails sign straight in. Profile powers the checkout auto-fill.
8. **SNAP payment handoff** — VA per bank / QRIS / GoPay remain the selected method enum, but the final payment UI is owned by SNAP. V5 redirects to a local SNAP simulator and verifies the backend status after the callback; **credit card** and **"biaya layanan"** remain out of scope.
9. **`Idempotency-Key`** generated and reused per button action on `POST /bookings` and `POST /payments/.../attempts`.
10. **Per-endpoint `errorCode` → Bahasa** messages surfaced as toasts/inline/states instead of V1's fake "just sold out" randomiser.
11. **No `alert`/`confirm`**; defensive null-checks everywhere so empty state never throws.

## GAPs (not in the current contract; see `docs/FE-BE-align-contract.md` for the full list + proposals)

- **`EventDetail.description` (JSON)** — long description, line-up, T&C, and `bannerImage` are returned as a dynamic `description` object by the mock `getEvent()` and marked **GAP: FE-NEED** in the UI. Production needs this field (or a CMS endpoint) on `EventDetail`.
- **`EventSummary.remainingTickets`** — Home cards show a ticket count that the contract's list summary doesn't carry (mocked).
- **Anonymous `JoinRequest`** — the contract's join body requires NIK/email/consent; V5 joins anonymously and collects buyer NIK/email later at checkout via a mock **`setBuyer`** (proposed `POST /booking-sessions/{id}/buyer`).
- **Profile-complete indicator on `verify`** — the contract's `verify` doesn't say whether a new account still needs name+NIK; V5 relies on a mock `isNew` (production should use `GET /me.hasNik`).
- **Success summary fields** are now defined in the Booking/TicketList contract: `orderId`, amount, quantity, masked buyer NIK, and required `qrPayload`. V5 demonstrates the response shape with the local mock.
- Home **genre/province/time/sort filter**, **"Konser Terdekat"** sort, and **"History Event"** (past events) are all **client-side** — `GET /events` exposes no `sort`/`limit`/`filter`/`near` params.

## Switching mock → real backend

In `api.js`:

1. Set `API.config.baseUrl = 'https://<gateway>/api/v1'` and `API.config.useMock = false`.
2. Replace each mock function body with the provided `http()` helper, e.g.:

   ```js
   // before (mock)
   function mockListEvents(){ return respond(ok({ events: EVENTS.map(summaryOf), serverTime: nowIsoServer() })); }
   // after (real)
   function mockListEvents(){ return http('GET', '/events'); }
   ```

3. **Auth/headers** are already handled by `http()`:
   - Web sends the HttpOnly **`rb_visitor`** cookie automatically (`credentials:'include'`).
   - Mobile WebView: send **`X-Visitor-Token`** (uncomment the line in `http()`).
   - Mutating booking/payment calls pass **`Idempotency-Key`** via `opts.idempotencyKey`
     (use `API.idempotencyKey(actionId)` to generate/reuse).
   - Payment WebView handoff, when needed: `POST /payments/{id}/page-tokens` → open `pageUrl` → `POST /payment-page-sessions {pageToken}` sets the **`rb_pay`** cookie → reuse the payment route. The normal payment path is the BE-provided SNAP `redirectUrl`.
4. Keep every return as `{meta,data}` and keep calling `syncClock(data.serverTime)` so the
   pages' countdowns stay server-authoritative. No page code needs to change.

## Run it

Static files — no build. Open `index.html` in a browser (or serve the folder) and walk:
**(optional) Masuk / Daftar → Home → Event → Masuk Antrean → Waiting Room → Pilih Tiket → Pembayaran → Sukses**.

- **Login / Register:** click **"Masuk / Daftar"** (top-right). Use any email + OTP **`123456`**. A *new* email is asked to complete registration (name + NIK) and gets a success pop-up; a returning email signs straight in. Once logged in, buyer name/NIK/email auto-fill at checkout.
- The local `snap.html` page lets you choose a successful or failed provider callback so both payment outcomes can be demonstrated end-to-end.
- To exercise failure/expiry, flip the `DEMO_FAIL` / `FORCE_ADMIT` / window-timeout switches noted in `api.js`.
- Tip: clear `localStorage` for a fully clean run (stale flow state can otherwise send you to `expired.html`).
