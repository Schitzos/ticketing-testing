# PHASE 1 — Requirement Analysis

> GENESIS Stage 1, Phase 1. **Analysis only** — no architecture/tech decisions are made here;
> those belong to Gate H1 grooming. This document extracts what the requirement says,
> what it assumes, and what it leaves open.
>
> **Source of truth:** `.genesis/requirement/Tender Rusuh Booking Ticket.pdf`
> **Supporting material:** `.genesis/prototype/Final/` (prototype V5), `.genesis/docs/api-contract/*.openapi.json`, `.genesis/docs/FE-BE-align-contract.md`
> **Status:** Draft — awaiting Gate H1 grooming.

---

## 1. Parsed Requirement Summary

**Project:** *Rusuh Booking Tiket* — an online concert-ticket booking system for **PT. Tiga Sekawan Angin Ribut** (CEO Pak Dinda, CTO Pak Jabon). This is a **vendor tender** evaluation ("Evaluasi Expertise Solution Development, 2026 H2"); 7 vendor teams compete.

**The real problem (stated explicitly):** the challenge is **not the functional features** but keeping the experience **stable and fair under extreme traffic spikes (flash crowd)** when demand far exceeds available tickets.

**Two governing principles:**
1. **Protect UX no matter what the backend is doing.** At peak load, the Waiting Room shields core services from overload so nothing crashes.
2. **"Jangan PHP" (No false hope).** A customer who has entered the queue and started booking is **guaranteed** to finish the journey end-to-end — never cut off unilaterally (session + hold preserved for the full TTL).

**Four main pages:**
| Page | Purpose |
|------|---------|
| Home | List of events whose tickets are sold online |
| Waiting Room | Virtual queue before the customer may buy |
| Detail Ticket | Choose seat category and quantity |
| Payment | Pay within a 10-minute deadline; consumable by web **and** mobile |

**Team shape assumed by the tender:** 5 people — 1 mobile dev, 2 web dev, 2 backend dev.

**Tender constraints (the 5 rules):**
- R1: built as a 5-person team (1 mobile, 2 web, 2 BE).
- R2: must follow the **company's prevailing development standards**.
- R3: tech stack is free **as long as it follows the company's tech radar**.
- R4: UI/design is free as long as feature needs are met and UX is as good as possible.
- R5: **document as well as possible; if AI tools are used, do NOT delete steering, documentation, or AI-usage supporting data.**

---

## 2. Functional Requirements (FR)

MoSCoW priority as stated in the PDF (§5). All are **MUST** except FR-09.

### 2.1 Home Page
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Show the list of all events sold online. | MUST |
| FR-02 | Available events with stock shown active/clickable. | MUST |
| FR-03 | Sold-out / unavailable events shown disabled with a status label. | MUST |
| FR-04 | Clicking an event with a queue → redirect to Waiting Room. | MUST |
| FR-05 | No queue → go straight to Detail Ticket Page. | MUST |

### 2.2 Waiting Room
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-06 | Show queue position counted from the front ("Anda antrian ke-n"). | MUST |
| FR-07 | Position auto-updates as those ahead decrease. | MUST |
| FR-08 | Auto-move to Detail Ticket Page when the turn arrives. | MUST |
| FR-09 | Show estimated wait time based on queue rate. | **COULD** (optional) |
| FR-10 | Position stays consistent across page refresh (no lost turn). | MUST |

### 2.3 Detail Ticket Page
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-11 | Show event detail + seat categories. | MUST |
| FR-12 | Each category shows available count and a distinct price. | MUST |
| FR-13 | Max **3 tickets** (combined across categories), limited by **registered NIK**; no NIK ⇒ cannot proceed. | MUST |
| FR-14 | Reject/disable quantities exceeding stock, exceeding 3, or causing the NIK/session accumulation to exceed 3 (**including other still-active bookings**). | MUST |
| FR-15 | Validate NIK format (16 digits); prevent same NIK exceeding the 3-ticket quota on the same event. | MUST |
| FR-16 | On continue-to-payment, **hold** stock (temporary reservation). | MUST |
| FR-17 | Show a booking countdown on Detail Ticket Page (~5 min). | MUST |
| FR-18 | If idle past the booking TTL: cancel session, release hold (if already at payment), release slot to next in queue, notify + redirect out. | MUST |
| FR-19 | Booking timer runs **server-authoritatively** (cannot be bypassed client-side) and stays consistent on refresh. | MUST |

### 2.4 Payment Page
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-20 | Choose a payment method from available partners. | MUST |
| FR-21 | Show a **10-minute** payment countdown from booking. | MUST |
| FR-22 | On timely success, email the e-ticket to the customer. | MUST |
| FR-23 | If not completed in 10 min: cancel booking, send "payment expired" email, release stock to next in queue. | MUST |
| FR-24 | Payment API consumable by **both web and mobile** (shared backend API). | MUST |
| FR-25 | Handle payment-gateway callbacks (success/fail/pending) **idempotently**. | MUST |

---

## 3. Non-Functional Requirements (NFR)

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Availability / UX | UX preserved regardless of backend state; at peak, Waiting Room protects core services from overload so they don't crash. |
| NFR-02 | Reliability | "Jangan PHP": a customer with a slot/booking is guaranteed to finish the journey without being cut off (session & hold kept for the full TTL). |
| NFR-03 | Scalability | Handle sudden flash-crowd spikes far beyond ticket capacity; auto-scaling on the stateless layer. |
| NFR-04 | Consistency | No oversell. Stock decrement/lock must be **atomic** (distributed lock / atomic counter). |
| NFR-05 | Fairness | FCFS; queue position is fair and cannot be jumped. |
| NFR-06 | Performance | Queue-position and home-page updates are low-latency (**p95 < 1s**) under high load. |
| NFR-07 | Security | Detail/Payment pages token-protected (no bypassing the queue). Payment data follows security standards (e.g. PCI-DSS at the gateway). |
| NFR-08 | Portability | Payment API platform-agnostic (REST/JSON) — consumable by web & mobile with no backend change. |
| NFR-09 | Observability | Queue metrics, conversion rate, and expired rate monitored in real time for operations. |
| NFR-10 | Resilience | One service failing (e.g. email) must not cancel the transaction; async with retry & dead-letter queue. |

---

## 4. Business Rules (BR)

| ID | Rule |
|----|------|
| BR-01 | Max 3 tickets per NIK per event (accumulated across categories). If NIK is not used, the quota of 3 is counted **per purchase session**. |
| BR-02 | The same NIK cannot exceed 3 tickets on the same event, even via different sessions/devices. |
| BR-03 | Booking time limit (filling in Detail Ticket Page) = ~5 min from access granted (TTL Booking). |
| BR-04 | If TTL Booking expires: session cancelled → hold released (if any) → slot given to next in queue. |
| BR-05 | Payment time limit = 10 min from booking created (TTL Payment). |
| BR-06 | If TTL Payment expires: booking cancelled → stock released → expired email sent → slot to next in queue. |
| BR-07 | One customer holds **only one active slot at a time** for the same event. |
| BR-08 | Paid stock is final; held stock cannot be bought by another customer. |

---

## 5. Actors & Roles

| Actor | Type | Role |
|-------|------|------|
| Customer | Human | Choose event, queue, select tickets, pay. |
| Queue Service | System | Virtual queue, access tokens, real-time position. |
| Booking Service | System | Ticket stock, temporary holds, booking status. |
| Payment Gateway | External system | Process web/mobile payments, send status callbacks. |
| Notification/Email Service | System | Send e-ticket email or booking-expired notice. |
| Mobile App | Client system | Consumes the **same** payment API as web. |

> The provided API contracts imply a **sixth** service — **User Service** (`.genesis/docs/api-contract/1. User Service API.openapi.json`) — not named in the PDF's actor table. Flagged as an unknown (§8).

---

## 6. Scope

**In scope:** event list + availability; virtual waiting room with real-time position; category selection with distinct prices and a 3-ticket/customer cap; payment flow with 10-min timeout and automatic stock release; email notifications (success + expired); a payment API consumable by web and mobile, plus a **web-based payment page reusable inside mobile apps (WebView/embedded browser)** for a consistent payment experience without rebuilding native payment UI.

**Out of scope:** admin/back-office event creation & management (assumed to exist separately); internal implementation of the payment partner (delegated to a 3rd-party gateway); loyalty programs, discounts, and vouchers.

### ✅ Team scope boundary — FRONT-END ONLY (user, 2026-10-29)

This team's deliverable is the **FE production app**; the **Backend is delivered by a separate team**. The requirement's full system scope above still defines the *product*, but our *build scope* is the client. BE services (Queue/Booking/Payment/Notification/User) are a **consumed integration contract** (`.genesis/docs/api-contract/` + `.genesis/docs/FE-BE-align-contract.md`), not our implementation. BE-side NFRs (NFR-03 scaling, NFR-04 atomicity/no-oversell, NFR-09 server metrics, NFR-10 async resilience) are **dependencies we rely on**; FE-side NFRs (UX continuity / "jangan PHP", fair position display, perceived latency, client token handling, platform-agnostic consumption, FR-24 WebView-reusable payment page) are **ours to own**. FE stack locked to Expo + React Native + React Native Web, Clean Architecture, TS domain, Zustand (per `.genesis/docs/FE-Flow-Diagrams.md`).

---

## 7. Assumptions (stated in the requirement, §11)

- A1: Event data (schedule, category, price, capacity) is already available from a back-office system.
- A2: Customers have an account/identity (e.g. email) for e-ticket delivery.
- A3: The payment partner provides a payment-status callback mechanism.

### Stated Risks & Mitigations (§11)
| Risk | Mitigation (as stated) |
|------|------------------------|
| Oversell at peak | Atomic counter / distributed lock on hold-stock operation. |
| Core overload by flash crowd | Virtual Waiting Room as throttle; auto-scale stateless layer. |
| Lost turn on refresh | Persistent token-based queue position, not browser session. |
| Email send failure | Async with retry & DLQ; booking status stays valid. |
| Double-charge | Idempotent callback with idempotency key. |
| One person hoarding via many sessions | 3-quota bound to NIK (16 digits) across sessions/devices; atomic validation at booking. |
| Fake/invalid NIK | Validate 16-digit format; optional further verification to a population service if available. |
| Customer holding a slot by idling | Server-authoritative TTL Booking; session auto-ends & slot released to next. |

---

## 8. Unknowns, Ambiguities & Gaps (for grooming)

> These are the things the requirement does **not** settle. Each becomes a grooming item at H1.
> Letter codes map to the grooming agenda in `PHASE-1-GROOMING-AGENDA.md`.

### ✅ RESOLVED by user (2026-10-29)

- **C1 / U3 — NIK is mandatory. RESOLVED.** NIK is always required (FR-13 wins; BR-01's "per-session when NIK not used" clause is void — there is no NIK-less path). One **buyer NIK** may reserve up to **3 tickets** for one event. **Every one of those 3 tickets must carry an attendee NIK** (each ticket is tied to a NIK). The buyer's own NIK **may** be used as the attendee NIK on **exactly one** of the 3 tickets (buyer attends too) — this is the prototype's single-use "Gunakan NIK pembeli" checkbox. The remaining tickets carry other attendees' NIKs. Quota of 3 is enforced per buyer-NIK per event, atomically, across sessions/devices (BR-02).
- **C2 / U7 — Timer values are BE-configurable. RESOLVED.** The booking TTL (~5 min) and payment TTL (10 min) are **configuration values owned by the backend**, not hard-coded constants. FE renders whatever absolute `expiresAt`/`serverTime` the server returns (server-authoritative, FR-19). The "5 min" / "10 min" in the PDF are defaults/examples; the authoritative values come from BE config at runtime.

**Identity & auth**
- U1: PDF names no **User Service**, but an OpenAPI contract exists for one (passwordless OTP in the prototype). Is auth/login in scope for this build, or assumed external like back-office? The prototype treats it as in-scope (landing-page OTP).
- U2: NIK is the quota key, but the PDF says "registered NIK" and "customers have an email identity." Relationship between account, email, and NIK is unspecified — is NIK captured per booking (prototype's approach) or tied to a verified account?
- U3: FR-13/BR-01 conflict surface: BR-01 says quota is per-session **when NIK is not used**, but FR-13 says "no NIK ⇒ cannot proceed." So is NIK always mandatory, or is there a NIK-less path? (Prototype makes NIK mandatory at checkout.) **Needs resolution.**

**Queue semantics**
- U4: What counts as "a queue exists" (FR-04) vs "no queue" (FR-05)? Threshold/policy undefined.
- U5: Fairness (NFR-05) "cannot be jumped" — admission model (token bucket? fixed admit rate? capacity-based)? Undefined.
- U6: Is queue position shown as absolute number only, or also ETA? FR-09 (ETA) is COULD; prototype shows position + estimate but hides "rate."

**Timers & lifecycle**
- U7: TTL Booking is "e.g. 5 min" and TTL Payment is "10 min from booking created." Are these the final authoritative values, and does the payment clock start at booking creation or at payment-page entry? (FR-21 says "from booking"; prototype starts payment timer from `paymentExpiresAt`.)
- U8: BR-07 "one active slot per customer per event" — "customer" keyed by what (NIK? account? device/visitor token?) given the queue is anonymous in the prototype?

**Payment**
- U9: Which concrete payment methods/partners? PDF says "available partners"; contracts/prototype enumerate VA (BCA/BNI/BRI/PERMATA), QRIS, GoPay — is that the agreed set? Credit card explicitly out in the prototype.
- U10: Is the "reusable web payment page in WebView" a hard deliverable (page-token handoff) or satisfied by a shared REST API alone? PDF implies both; prototype notes an optional page-token/WebView contract.
- U11: Refund / payment-failed-but-booking-still-payable behavior — prototype's `expired.html` supports "failed can return to payment"; PDF only covers success and hard expiry.

**Architecture & delivery (all deferred to grooming — no decision in Phase 1)**
- U12: Monolith vs microservices. The contract set is split into Queue/Booking/Payment/Notification/User services — strongly implies service-oriented, but the tech-radar/company-standard constraint (R2/R3) governs the final choice.
- U13: Data stores for stock atomicity (SQL with row locks? Redis atomic counters?), queue backing store, cache. NFR-04 demands atomicity but names no technology.
- U14: Cloud/infra, containers, auto-scaling mechanism (NFR-03) — unspecified; constrained by company tech radar.
- U15: Observability stack for NFR-09 metrics — unspecified.
- U16: Email provider for Notification Service — unspecified.
- U17: What exactly is the tender **deliverable**? A working system, or the documentation + design + prototype package (given R5's heavy documentation emphasis and the existing prototype/contracts)? This frames the whole effort.

**Non-OCR-able requirement sections**
- U18: §8 Sequence Diagram, §9 Wireframe, §10 State Tiket & Booking are **image-only** in the PDF and could not be text-extracted. The prototype V5 and OpenAPI contracts appear to embody them, but the images themselves have **not been visually verified** in this phase. Recommend confirming the prototype/contracts match those diagrams during Doc Generation (Phase 2), or providing the images.

---

## 9. External Dependencies

- Back-office event system (source of event/category/price/capacity data) — **assumed existing, out of scope**.
- Third-party payment gateway with status callbacks (SNAP-style redirect in the prototype) — **external**.
- Email delivery provider (Notification Service) — **external/unspecified**.
- (Possible) population/NIK verification service — **optional**, only "if available."

---

## 10. Existing Material Inventory (reconcile, don't re-invent)

| Artifact | Location | Role in GENESIS |
|----------|----------|-----------------|
| Requirement PDF | `.genesis/requirement/Tender Rusuh Booking Ticket.pdf` | **Source of truth** |
| Prototype V5 (web) | `.genesis/prototype/Final/` | Reference FE behavior + mock API shapes |
| OpenAPI contracts | `.genesis/docs/api-contract/*.openapi.json` (User, Queue, Booking, Payment, Notification + 2 internal) | Draft API contracts to be hardened in Phase 2 |
| FE↔BE alignment doc | `.genesis/docs/FE-BE-align-contract.md` | Known GAPs list (FE-NEED items) |

> Per Source-of-Truth rule: where the prototype or a contract contradicts the requirement PDF, **the PDF wins** and the discrepancy is escalated, not silently adopted.

---

## 11. Phase 1 Exit

- [x] Requirement parsed (text sections fully; image diagrams flagged U18)
- [x] FR / NFR / BR extracted verbatim
- [x] Actors, scope, assumptions, risks captured
- [x] Unknowns & contradictions listed (U1–U18)
- [x] Grooming agenda prepared → `PHASE-1-GROOMING-AGENDA.md`
- [ ] **GATE H1 — grooming session (human). STOP here.**
