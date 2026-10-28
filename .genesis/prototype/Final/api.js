/* =============================================================================
 * Rusuh Tiket — V5 MOCK API LAYER (api.js)
 * -----------------------------------------------------------------------------
 * This file is the ONLY place that talks to "the backend". Every page calls the
 * functions exported on `window.API`. Right now each function returns dummy data
 * shaped EXACTLY like the OpenAPI contracts (envelope {meta,data}, *Minor prices,
 * serverTime + expiresAt, enums, errorCode) after a small simulated network delay.
 *
 * WIRING TO A REAL BACKEND LATER:
 *   - Set API.config.baseUrl to the gateway base (e.g. "https://api.rusuh.tiket/api/v1").
 *   - Replace each `return mockX(...)` body with a `return http(...)` call (helper
 *     `http()` is already written below — just swap which one the function uses).
 *   - The browser automatically sends the HttpOnly `rb_visitor` cookie. For mobile
 *     WebView send `X-Visitor-Token`. Mutating booking/payment calls must send
 *     `Idempotency-Key`. Helpers for all of these are provided.
 *   - Keep the return shape identical ({meta,data}) so pages need ZERO changes.
 *
 * Contracts mirrored: 2 Queue, 3 Booking, 4 Payment (+ Notification is fire-and-forget).
 * ============================================================================= */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------
  var config = {
    baseUrl: '',          // e.g. 'https://api.example.com/api/v1' when real
    useMock: true,        // flip to false once http() endpoints exist
    latencyMs: 420,       // simulated network delay for mock calls
    // skew injected into mock payloads so the clock-skew helper has something to do.
    // Positive = server clock is AHEAD of this client.
    serverSkewMs: 1500
  };

  // ---------------------------------------------------------------------------
  // Money: all prices arrive as integer minor units (IDR has no cents, so minor
  // == rupiah here, but we keep the *Minor convention from the contract).
  // ---------------------------------------------------------------------------
  function minorToIDR(minor, opts) {
    opts = opts || {};
    var n = Number(minor || 0);
    var out = 'Rp ' + n.toLocaleString('id-ID');
    if (opts.compact && n >= 1000) {
      // "Rp 450rb" / "Rp 1,2jt" style used on cards
      if (n >= 1000000) out = 'Rp ' + (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt';
      else out = 'Rp ' + Math.round(n / 1000) + 'rb';
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Clock skew: countdowns must be computed against the SERVER clock, never the
  // raw device clock. Every payload carries `serverTime`. We record the offset
  // (serverTime - clientNow) at the moment the payload arrives, then compute
  // remaining time as (expiresAt - (Date.now() + offset)).
  // ---------------------------------------------------------------------------
  var _skewOffsetMs = 0; // serverTime(ms) - clientNow(ms)

  function syncClock(serverTimeIso) {
    if (!serverTimeIso) return;
    var serverMs = new Date(serverTimeIso).getTime();
    if (!isFinite(serverMs)) return;
    _skewOffsetMs = serverMs - Date.now();
  }

  function serverNow() { return Date.now() + _skewOffsetMs; }

  // remaining ms until an absolute ISO deadline, server-authoritative, never < 0
  function remainingMs(expiresAtIso) {
    if (!expiresAtIso) return 0;
    var end = new Date(expiresAtIso).getTime();
    if (!isFinite(end)) return 0;
    return Math.max(0, end - serverNow());
  }

  function clockOffsetMs() { return _skewOffsetMs; }

  // ---------------------------------------------------------------------------
  // errorCode -> Bahasa message map (shared by every page's error handling).
  // The contract sends a stable machine `errorCode`; the UI shows friendly copy.
  // ---------------------------------------------------------------------------
  var ERROR_MESSAGES = {
    // User / auth (OTP login) — FE-NEED (User Service login flow)
    OTP_INVALID: 'Kode OTP salah. Periksa lagi, ya.',
    OTP_EXPIRED: 'Kode OTP sudah kedaluwarsa. Minta kode baru.',
    OTP_RESEND_TOO_SOON: 'Tunggu sebentar sebelum meminta kode lagi.',
    UNAUTHORIZED: 'Kamu perlu masuk dulu untuk melanjutkan.',
    // Queue
    VALIDATION_ERROR: 'Ada isian yang belum benar. Periksa lagi, ya.',
    NIK_INVALID: 'NIK harus 16 digit angka sesuai KTP.',
    EMAIL_MISMATCH: 'Email dan konfirmasi email belum sama.',
    NIK_ALREADY_IN_QUEUE: 'NIK ini sudah ada di antrean untuk event ini.',
    VISITOR_ALREADY_IN_QUEUE: 'Kamu sudah berada di antrean event ini.',
    EMAIL_ALREADY_IN_QUEUE: 'Email ini sudah dipakai mengantre untuk event ini.',
    EVENT_NOT_ON_SALE: 'Penjualan event ini belum dibuka.',
    EVENT_SOLD_OUT: 'Maaf, tiket sudah habis.',
    TURN_MISSED: 'Giliranmu terlewat. Silakan masuk antrean lagi.',
    RATE_LIMITED: 'Terlalu banyak permintaan. Coba lagi sebentar.',
    DEPENDENCY_UNAVAILABLE: 'Layanan sedang sibuk. Coba lagi sebentar.',
    NOT_FOUND: 'Data tidak ditemukan.',
    // Booking
    ADMISSION_TOKEN_INVALID: 'Sesi masuk tidak valid atau sudah dipakai. Masuk antrean lagi.',
    SESSION_EXPIRED: 'Waktu sesi pemilihan habis. Mulai lagi dari antrean.',
    CATEGORY_UNAVAILABLE: 'Kategori yang dipilih baru saja habis. Pilih kategori lain.',
    BUYER_QUOTA_EXHAUSTED: 'Kuota tiket untuk NIK pembeli ini sudah penuh.',
    QUANTITY_EXCEEDS_LIMIT: 'Jumlah tiket melebihi batas yang diizinkan.',
    MIXED_CATEGORIES_NOT_ALLOWED: 'Event ini tidak mengizinkan campur kategori dalam satu pesanan.',
    ATTENDEE_NIK_ALREADY_REGISTERED: 'NIK penonton ini sudah terdaftar di tiket lain.',
    ATTENDEE_NIK_DUPLICATE_IN_ORDER: 'Ada NIK penonton yang sama di pesanan ini.',
    IDEMPOTENCY_KEY_REUSED: 'Permintaan ini sudah diproses sebelumnya.',
    BOOKING_LOCKED: 'Pesanan sedang dikunci dan tidak bisa diubah.',
    BOOKING_VERSION_CONFLICT: 'Pesanan berubah di perangkat lain. Muat ulang, ya.',
    EDIT_LIMIT_REACHED: 'Batas perubahan pesanan sudah tercapai.',
    BOOKING_NOT_PAYABLE: 'Pesanan ini tidak dalam status menunggu pembayaran.',
    // Payment
    PAYMENT_METHOD_UNAVAILABLE: 'Metode pembayaran ini sedang tidak tersedia.',
    PAYMENT_PROVIDER_UNAVAILABLE: 'Gateway pembayaran sedang gangguan. Coba lagi.',
    PAYMENT_PAGE_TOKEN_INVALID: 'Token halaman bayar tidak valid atau kedaluwarsa.',
    // Generic fallback
    UNKNOWN: 'Terjadi kesalahan. Coba lagi.'
  };

  function messageFor(errorCode) {
    return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN;
  }

  // ---------------------------------------------------------------------------
  // Tokens / idempotency / persistence helpers
  // ---------------------------------------------------------------------------
  var LS = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // uuid-ish (good enough for a prototype; real IDs come from the server)
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Idempotency-Key: generated per "button action", reused on retry of that action.
  // We cache the key under a logical action id so a refresh/retry reuses it.
  function idempotencyKey(actionId) {
    var store = LS.get('rb_idem', {});
    if (!store[actionId]) {
      store[actionId] = (actionId + '-' + uuid()).replace(/-/g, '').slice(0, 48);
      LS.set('rb_idem', store);
    }
    return store[actionId];
  }
  function clearIdempotency(actionId) {
    var store = LS.get('rb_idem', {});
    delete store[actionId]; LS.set('rb_idem', store);
  }

  // Visitor token: in the real web app this is an HttpOnly cookie the browser
  // sends automatically. For mobile WebView it is X-Visitor-Token. We keep a
  // readable copy here only so the prototype can show "who" is in the queue.
  function visitorToken() {
    var t = LS.get('rb_visitor_token', null);
    if (!t) { t = 'vis_' + uuid(); LS.set('rb_visitor_token', t); }
    return t;
  }

  function maskNik(nik) {
    nik = String(nik || '');
    if (nik.length < 16) return nik;
    return nik.slice(0, 4) + '********' + nik.slice(-4);
  }

  // ---------------------------------------------------------------------------
  // Envelope factory + async simulation
  // ---------------------------------------------------------------------------
  function nowIsoServer() { return new Date(Date.now() + config.serverSkewMs).toISOString(); }
  function isoIn(ms) { return new Date(Date.now() + config.serverSkewMs + ms).toISOString(); }

  function ok(data, message) {
    return { meta: { code: 200, message: message || 'OK' }, data: data };
  }
  function created(data, message) {
    return { meta: { code: 201, message: message || 'Created' }, data: data };
  }
  // Error envelope mirrors the contract: data is null, errorCode travels in meta.
  function errorEnvelope(httpCode, errorCode, message) {
    return { meta: { code: httpCode, message: message || messageFor(errorCode), errorCode: errorCode }, data: null };
  }

  // Resolve after a short delay to mimic the network. Any payload carrying
  // serverTime auto-syncs the clock skew so countdowns stay server-authoritative.
  function respond(envelope, delay) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (envelope && envelope.data && envelope.data.serverTime) syncClock(envelope.data.serverTime);
        resolve(envelope);
      }, delay == null ? config.latencyMs : delay);
    });
  }
  // Reject with an error envelope (pages catch and read err.meta.errorCode).
  function fail(envelope, delay) {
    return new Promise(function (_resolve, reject) {
      setTimeout(function () { reject(envelope); }, delay == null ? config.latencyMs : delay);
    });
  }

  // ---------------------------------------------------------------------------
  // REAL-BACKEND helper (unused by mocks; here so wiring is a one-line swap).
  // ---------------------------------------------------------------------------
  function http(method, path, opts) {
    opts = opts || {};
    var headers = { 'Accept': 'application/json' };
    if (opts.body) headers['Content-Type'] = 'application/json';
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
    // Mobile WebView only — browsers send the rb_visitor cookie automatically:
    // headers['X-Visitor-Token'] = visitorToken();
    return fetch(config.baseUrl + path, {
      method: method,
      credentials: 'include', // send rb_visitor / rb_pay cookies
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      return res.json().then(function (json) {
        if (!res.ok) throw json; // error envelope
        if (json && json.data && json.data.serverTime) syncClock(json.data.serverTime);
        return json;
      });
    });
  }

  // ===========================================================================
  // DUMMY DATA (>= 3 events, one SOLD_OUT, one NOT_STARTED, some CLOSED/past)
  //
  // GAP/FE-NEED notes baked into the data below:
  //   * `remainingTickets` on each event — the contract's EventSummary has NO
  //     such field; the Home card needs it. See FE-BE-align-contract.md.
  //   * `description` (JSON: longDesc / lineup / terms / bannerImage) returned
  //     INSIDE getEvent data as if from the BE — the contract's EventDetail has
  //     no rich description/T&C/line-up/banner. See FE-BE-align-contract.md.
  // Dates are relative to a "now" around 2026-10: upcoming events have startsAt
  // in late-2026/2027, past events (CLOSED) are mid/early-2026.
  // ===========================================================================
  var CAT = function (code, name, priceMinor, available) {
    return { categoryId: uuid(), code: code, name: name, priceMinor: priceMinor, available: available };
  };

  var EVENTS = [
    {
      eventId: '11111111-1111-4111-8111-111111111111',
      slug: 'pesta-rakyat-fest-2026',
      name: 'Pesta Rakyat Fest 2026',
      venue: 'Gelora Bung Karno · Jakarta',
      city: 'Jakarta',
      category: 'Festival',
      startsAt: '2026-12-24T19:00:00+07:00',
      salesStartsAt: '2026-06-01T10:00:00+07:00',
      salesEndsAt: '2026-12-24T18:00:00+07:00',
      status: 'AVAILABLE',
      minPriceMinor: 325000,
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80&auto=format&fit=crop',
      maxTicketsPerOrder: 3,
      maxTicketsPerBuyerNik: 3,
      allowMixedCategories: true,
      categories: [
        CAT('FEST', 'Festival Access', 325000, 1240),
        CAT('GOLD', 'Golden Circle', 550000, 48),
        CAT('VIP', 'VIP Deck', 950000, 3)
      ],
      // GAP/FE-NEED: EventDetail kontrak belum punya `description` (JSON) & bannerImage
      // — FE butuh ini; lihat FE-BE-align-contract.md. Dikembalikan di dalam getEvent.
      description: {
        longDesc: 'Pesta Rakyat Fest kembali ke Gelora Bung Karno dengan line-up lintas genre, tiga panggung, dan pengalaman festival untuk puluhan ribu penonton. Harga yang kamu lihat adalah harga yang kamu bayar — tanpa biaya tersembunyi.',
        lineup: [
          { stage: 'Panggung Utama', acts: 'Senja Kolektif · Rimba · Nadira' },
          { stage: 'Panggung Senja', acts: 'Jazz Senja · Laut Biru · Teras' },
          { stage: 'Panggung Neon', acts: 'Garden Beats · Pulsar · Noktah' }
        ],
        terms: ['Tiket mengikat 1 NIK per penonton.', 'Maks 3 tiket per NIK, berlaku lintas perangkat.', 'Tiket tidak dapat dipindahtangankan setelah check-in.'],
        bannerImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80&auto=format&fit=crop'
      }
    },
    {
      eventId: '22222222-2222-4222-8222-222222222222',
      slug: 'jazz-senja-nusantara',
      name: 'Jazz Senja Nusantara',
      venue: 'Istora Senayan · Jakarta',
      city: 'Jakarta',
      category: 'Jazz',
      startsAt: '2027-01-11T20:00:00+07:00',
      salesStartsAt: '2026-07-01T10:00:00+07:00',
      salesEndsAt: '2027-01-11T19:00:00+07:00',
      status: 'AVAILABLE',
      minPriceMinor: 375000,
      image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&q=80&auto=format&fit=crop',
      maxTicketsPerOrder: 3,
      maxTicketsPerBuyerNik: 3,
      allowMixedCategories: false,
      categories: [
        CAT('REG', 'Reguler', 375000, 320),
        CAT('PREM', 'Premium Lesehan', 650000, 60)
      ],
      // GAP/FE-NEED: EventDetail kontrak belum punya `description` (JSON) & bannerImage — lihat FE-BE-align-contract.md
      description: {
        longDesc: 'Senja di Istora berubah jadi panggung jazz intim. Format lesehan terbatas, tata cahaya hangat, dan deretan musisi jazz Nusantara dalam satu malam yang tenang namun menggugah.',
        lineup: [
          { stage: 'Panggung Senja', acts: 'Dira Sugandi · Tohpati · Barry Likumahuwa' },
          { stage: 'Sesi Kolaborasi', acts: 'Nita Aartsen Trio · Tamu Spesial' }
        ],
        terms: ['Tiket mengikat 1 NIK per penonton.', 'Maks 3 tiket per NIK.', 'Pintu dibuka 1 jam sebelum acara.'],
        bannerImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&q=80&auto=format&fit=crop'
      }
    },
    {
      eventId: '33333333-3333-4333-8333-333333333333',
      slug: 'rock-in-solidarity',
      name: 'Rock In Solidarity',
      venue: 'Stadion GBT · Surabaya',
      city: 'Surabaya',
      category: 'Rock',
      startsAt: '2027-02-02T18:30:00+07:00',
      salesStartsAt: '2026-08-01T10:00:00+07:00',
      salesEndsAt: '2027-02-02T17:30:00+07:00',
      status: 'AVAILABLE',
      minPriceMinor: 525000,
      image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80&auto=format&fit=crop',
      maxTicketsPerOrder: 3,
      maxTicketsPerBuyerNik: 3,
      allowMixedCategories: true,
      categories: [
        CAT('TRIB', 'Tribun', 525000, 5600),
        CAT('FEST', 'Festival', 725000, 900)
      ],
      // GAP/FE-NEED: EventDetail kontrak belum punya `description` (JSON) & bannerImage — lihat FE-BE-align-contract.md
      description: {
        longDesc: 'Satu stadion, satu suara. Rock In Solidarity menyatukan band rock lintas generasi di Surabaya dengan sound system raksasa dan mosh pit resmi yang aman.',
        lineup: [
          { stage: 'Main Stage', acts: 'Baja Hitam · Garuda Api · Nirmala' },
          { stage: 'Second Stage', acts: 'Lorong Waktu · Palu Besi' }
        ],
        terms: ['Tiket mengikat 1 NIK per penonton.', 'Maks 3 tiket per NIK.', 'Dilarang membawa benda tajam ke venue.'],
        bannerImage: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80&auto=format&fit=crop'
      }
    },
    {
      eventId: '44444444-4444-4444-8444-444444444444',
      slug: 'symphony-under-stars',
      name: 'Symphony Under Stars',
      venue: 'Candi Prambanan · Yogyakarta',
      city: 'Yogyakarta',
      category: 'Orkestra',
      startsAt: '2027-03-15T19:30:00+07:00',
      // Sales not open yet -> NOT_STARTED
      salesStartsAt: '2099-01-01T10:00:00+07:00',
      salesEndsAt: '2027-03-15T18:30:00+07:00',
      status: 'NOT_STARTED',
      minPriceMinor: 680000,
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80&auto=format&fit=crop',
      maxTicketsPerOrder: 3,
      maxTicketsPerBuyerNik: 3,
      allowMixedCategories: false,
      categories: [
        CAT('GA', 'General Admission', 680000, 1800),
        CAT('VVIP', 'VVIP Front Row', 1500000, 120)
      ],
      // GAP/FE-NEED: EventDetail kontrak belum punya `description` (JSON) & bannerImage — lihat FE-BE-align-contract.md
      description: {
        longDesc: 'Orkestra penuh di bawah langit Prambanan. Symphony Under Stars memadukan repertoar klasik dan aransemen Nusantara dengan latar candi yang megah.',
        lineup: [
          { stage: 'Panggung Utama', acts: 'Nusantara Philharmonic · Conductor: R. Mahardika' },
          { stage: 'Bintang Tamu', acts: 'Soprano Isyana P. · Cellist Tamu' }
        ],
        terms: ['Tiket mengikat 1 NIK per penonton.', 'Maks 3 tiket per NIK.', 'Tempat duduk sesuai kategori.'],
        bannerImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80&auto=format&fit=crop'
      }
    },
    {
      eventId: '55555555-5555-4555-8555-555555555555',
      slug: 'dangdut-akbar-2026',
      name: 'Dangdut Akbar 2026',
      venue: 'JIExpo Kemayoran · Jakarta',
      city: 'Jakarta',
      category: 'Festival',
      startsAt: '2026-11-20T18:00:00+07:00',
      salesStartsAt: '2026-05-01T10:00:00+07:00',
      salesEndsAt: '2026-11-20T17:00:00+07:00',
      status: 'SOLD_OUT',
      minPriceMinor: 280000,
      image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&q=80&auto=format&fit=crop',
      maxTicketsPerOrder: 3,
      maxTicketsPerBuyerNik: 3,
      allowMixedCategories: true,
      categories: [
        CAT('GA', 'General Admission', 280000, 0)
      ],
      // GAP/FE-NEED: EventDetail kontrak belum punya `description` (JSON) & bannerImage — lihat FE-BE-align-contract.md
      description: {
        longDesc: 'Pesta dangdut terbesar tahun ini di JIExpo Kemayoran. Goyang bareng raja dan ratu dangdut dalam satu panggung megah.',
        lineup: [
          { stage: 'Panggung Akbar', acts: 'Raja Dangdut · Ratu Goyang · Orkes Melayu Bintang' }
        ],
        terms: ['Tiket mengikat 1 NIK per penonton.', 'Maks 3 tiket per NIK.', 'Tanpa biaya tersembunyi.'],
        bannerImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&q=80&auto=format&fit=crop'
      }
    },
    // ---- PAST EVENTS (CLOSED) — feed the History section on Home. ----
    // An archive endpoint would be ideal (GAP); for now History is derived
    // client-side from startsAt < serverNow / status CLOSED.
    {
      eventId: '66666666-6666-4666-8666-666666666666',
      slug: 'synthwave-nite-2026',
      name: 'Synthwave Nite 2026',
      venue: 'Eldorado Dome · Bandung',
      city: 'Bandung',
      category: 'Elektronik',
      startsAt: '2026-08-15T20:00:00+07:00', // bulan lalu relatif 2026-10
      salesStartsAt: '2026-03-01T10:00:00+07:00',
      salesEndsAt: '2026-08-15T19:00:00+07:00',
      status: 'CLOSED',
      minPriceMinor: 300000,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80&auto=format&fit=crop',
      maxTicketsPerOrder: 3,
      maxTicketsPerBuyerNik: 3,
      allowMixedCategories: true,
      categories: [
        CAT('GA', 'General Admission', 300000, 0),
        CAT('VIP', 'VIP Lounge', 600000, 0)
      ],
      // GAP/FE-NEED: EventDetail kontrak belum punya `description` (JSON) & bannerImage — lihat FE-BE-align-contract.md
      description: {
        longDesc: 'Malam neon dengan deretan DJ synthwave dan visual retro-futuristik. (Event sudah berlalu.)',
        lineup: [{ stage: 'Main Floor', acts: 'Neon Drive · Midnight Coder · Vektor' }],
        terms: ['Event sudah selesai.'],
        bannerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80&auto=format&fit=crop'
      }
    },
    {
      eventId: '77777777-7777-4777-8777-777777777777',
      slug: 'folk-di-bukit-2025',
      name: 'Folk di Bukit 2025',
      venue: 'Bukit Bintang · Yogyakarta',
      city: 'Yogyakarta',
      category: 'Folk',
      startsAt: '2025-12-10T17:00:00+07:00', // tahun lalu relatif 2026-10
      salesStartsAt: '2025-08-01T10:00:00+07:00',
      salesEndsAt: '2025-12-10T16:00:00+07:00',
      status: 'CLOSED',
      minPriceMinor: 220000,
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80&auto=format&fit=crop',
      maxTicketsPerOrder: 3,
      maxTicketsPerBuyerNik: 3,
      allowMixedCategories: false,
      categories: [
        CAT('GA', 'Festival Pass', 220000, 0)
      ],
      // GAP/FE-NEED: EventDetail kontrak belum punya `description` (JSON) & bannerImage — lihat FE-BE-align-contract.md
      description: {
        longDesc: 'Senja folk di atas bukit dengan panggung akustik dan pemandangan kota. (Event sudah berlalu.)',
        lineup: [{ stage: 'Panggung Bukit', acts: 'Senar Kayu · Daun & Angin · Perjalanan' }],
        terms: ['Event sudah selesai.'],
        bannerImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80&auto=format&fit=crop'
      }
    }
  ];

  // GAP: EventSummary kontrak belum punya remainingTickets — FE butuh ini untuk
  // card Home (lihat FE-BE-align-contract.md). Dihitung = jumlah available
  // seluruh kategori event.
  function remainingTicketsOf(ev) {
    if (!ev || !Array.isArray(ev.categories)) return 0;
    var total = 0;
    for (var i = 0; i < ev.categories.length; i++) total += Number(ev.categories[i].available || 0);
    return total;
  }

  function findEvent(eventId) {
    for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].eventId === eventId) return EVENTS[i];
    return null;
  }
  function findEventBySlug(slug) {
    for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].slug === slug) return EVENTS[i];
    return null;
  }

  function summaryOf(ev) {
    return {
      eventId: ev.eventId, slug: ev.slug, name: ev.name, venue: ev.venue,
      startsAt: ev.startsAt, salesStartsAt: ev.salesStartsAt, salesEndsAt: ev.salesEndsAt,
      status: ev.status, minPriceMinor: ev.minPriceMinor,
      // GAP/prototype: expose city + category on the summary so the client-side
      // filter (browse.html genre/location) has something to match on. The real
      // EventSummary carries neither; the catalog would need both to filter.
      city: ev.city || ((ev.venue||'').split('·').pop().trim()),
      category: ev.category || '',
      // GAP: EventSummary kontrak belum punya remainingTickets — FE butuh ini untuk
      // card Home (lihat FE-BE-align-contract.md). Dihitung = jumlah available
      // seluruh kategori event.
      remainingTickets: remainingTicketsOf(ev)
    };
  }

  // ===========================================================================
  // BOOKING SERVICE — catalog
  // ===========================================================================
  // GET /events -> EventList
  function mockListEvents() {
    return respond(ok({
      events: EVENTS.map(summaryOf),
      serverTime: nowIsoServer()
    }));
  }

  // GET /events/{eventId} -> EventDetail
  function mockGetEvent(eventId) {
    var ev = findEvent(eventId) || findEventBySlug(eventId);
    if (!ev) return fail(errorEnvelope(404, 'NOT_FOUND'));
    return respond(ok({
      event: summaryOf(ev),
      maxTicketsPerOrder: ev.maxTicketsPerOrder,
      maxTicketsPerBuyerNik: ev.maxTicketsPerBuyerNik,
      allowMixedCategories: ev.allowMixedCategories,
      categories: ev.categories.map(function (c) {
        return { categoryId: c.categoryId, code: c.code, name: c.name, priceMinor: c.priceMinor, available: c.available };
      }),
      // GAP/FE-NEED: EventDetail kontrak belum punya `description` (JSON) & bannerImage
      // — FE butuh ini; lihat FE-BE-align-contract.md. Dikembalikan BE di dalam data.
      // Struktur: { longDesc, lineup:[{stage,acts}], terms:[string], bannerImage:url }.
      description: ev.description || null,
      // _image tetap ada sebagai fallback banner bila description.bannerImage kosong.
      _image: ev.image,
      serverTime: nowIsoServer()
    }));
  }

  // ===========================================================================
  // QUEUE SERVICE
  // ===========================================================================
  // POST /events/{eventId}/queue-entries -> QueueEntry (WAITING or ADMITTED)
  // CHANGED: antrean kini anonim (NIK/email pindah ke detail). JoinRequest kontrak
  // perlu disesuaikan — lihat FE-BE-align-contract.md. Antrean diprioritaskan dulu;
  // body boleh kosong/opsional, tanpa validasi NIK/email/consent.
  function mockJoinQueue(eventId, body) {
    body = body || {};

    var ev = findEvent(eventId);
    if (!ev) return fail(errorEnvelope(404, 'NOT_FOUND'));
    if (ev.status === 'SOLD_OUT') return fail(errorEnvelope(410, 'EVENT_SOLD_OUT'));
    if (ev.status === 'NOT_STARTED' || ev.status === 'CLOSED') return fail(errorEnvelope(409, 'EVENT_NOT_ON_SALE'));

    var entryId = uuid();
    // Start inside the POSSIBLE band (just over guaranteedUntilSeq=900) so the demo
    // begins amber then drains into GUARANTEED and finally ADMITTED within ~1 minute.
    // Raise this to >1600 to demo the NOT_ENOUGH (red) zone from the start.
    var seq = 1100 + Math.floor(Math.random() * 400); // ~1100–1500 ahead
    // FR-05: if nobody is ahead and a slot is free, admit immediately. For the demo
    // we keep WAITING so the waiting-room screen is exercised; flip FORCE_ADMIT to test.
    var FORCE_ADMIT = false;
    var status = FORCE_ADMIT ? 'ADMITTED' : 'WAITING';

    var entry = {
      entryId: entryId,
      seq: seq,
      status: status,
      queueToken: 'qt_' + uuid(),
      visitorToken: visitorToken(),        // real app: mobile only
      statusUrl: '/api/v1/queue-status/' + eventId,
      claimDeadline: status === 'ADMITTED' ? isoIn(60 * 1000) : null,
      joinedAt: nowIsoServer(),
      serverTime: nowIsoServer()
    };

    // Persist so refresh does NOT reset the queue (requirement: position survives refresh).
    // CHANGED: no buyerNikMasked/email here — queue is anonymous now; buyer data
    // is collected later on detail.html via setBuyer.
    LS.set('rb_queue', {
      eventId: eventId, entryId: entryId, seq: seq, startSeq: seq,
      status: status, buyerNikMasked: null, email: null,
      joinedAt: entry.joinedAt
    });

    return respond(created(entry));
  }

  // GET /queue-status/{eventId} -> StatusDocument (public, cacheable)
  function mockGetQueueStatus(eventId) {
    var ev = findEvent(eventId);
    if (!ev) return fail(errorEnvelope(404, 'NOT_FOUND'));

    var q = LS.get('rb_queue', null);
    // The "server" drains the queue over wall-clock time since join, so the
    // position advances naturally across refreshes instead of resetting.
    var admissionRatePerMin = 1400;
    var servingSeq = 0;
    if (q && q.eventId === eventId) {
      var elapsedMin = (serverNow() - new Date(q.joinedAt).getTime()) / 60000;
      var drained = Math.floor(elapsedMin * admissionRatePerMin + (elapsedMin * 2200)); // a touch faster for a lively demo
      servingSeq = Math.min(q.seq, (q.startSeq - q.seq) + drained + Math.floor(q.seq * 0.0));
      servingSeq = Math.max(0, (q.seq - Math.max(0, q.seq - drained)));
      servingSeq = Math.min(q.seq, drained); // seqs served so far
    }

    var guaranteedUntilSeq = servingSeq + 900;
    var possibleUntilSeq = servingSeq + 1600;

    return respond(ok({
      eventId: eventId,
      saleState: ev.status === 'NOT_STARTED' ? 'NOT_STARTED' : (ev.status === 'CLOSED' ? 'CLOSED' : 'OPEN'),
      servingSeq: servingSeq,
      guaranteedUntilSeq: guaranteedUntilSeq,
      possibleUntilSeq: possibleUntilSeq,
      soldOut: ev.status === 'SOLD_OUT',
      remainingTickets: ev.status === 'SOLD_OUT' ? 0 : 4200,
      admissionRatePerMin: admissionRatePerMin,
      nextPollAfterMs: 2500, // adaptive — pages should honour this instead of a fixed interval
      poll: { farMs: 15000, midMs: 6000, nearMs: 2500, farAbove: 5000, midAbove: 1500 },
      preTurnNotifyPosition: 200,
      categories: ev.categories.map(function (c) {
        return { code: c.code, name: c.name, state: c.available === 0 ? 'SOLD_OUT' : (c.available < 50 ? 'LIMITED' : 'AVAILABLE') };
      }),
      updatedAt: nowIsoServer(),
      serverTime: nowIsoServer()
    }));
  }

  // GET /queue-entries/me?eventId -> EntryStatus (exact position near turn)
  function mockGetMyEntry(eventId) {
    var q = LS.get('rb_queue', null);
    if (!q || q.eventId !== eventId) return fail(errorEnvelope(404, 'NOT_FOUND'));

    var admissionRatePerMin = 1400;
    var elapsedMin = (serverNow() - new Date(q.joinedAt).getTime()) / 60000;
    var drained = Math.floor(elapsedMin * admissionRatePerMin + (elapsedMin * 2200));
    var exactPosition = Math.max(0, q.seq - drained);

    var zone = 'GUARANTEED';
    if (exactPosition > 1600) zone = 'NOT_ENOUGH';
    else if (exactPosition > 900) zone = 'POSSIBLE';

    var status = exactPosition <= 0 ? 'ADMITTED' : 'WAITING';
    if (status === 'ADMITTED') { q.status = 'ADMITTED'; LS.set('rb_queue', q); }

    return respond(ok({
      entryId: q.entryId,
      seq: q.seq,
      status: status,
      exactPosition: exactPosition,
      zone: zone,
      claimDeadline: status === 'ADMITTED' ? isoIn(60 * 1000) : null,
      serverTime: nowIsoServer()
    }));
  }

  // POST /queue-entries/{entryId}/claim -> ClaimResponse (admissionToken TTL 60s)
  function mockClaim(entryId) {
    var q = LS.get('rb_queue', null);
    if (!q || q.entryId !== entryId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    // Demo: a rare miss to exercise the TURN_MISSED error state.
    if (Math.random() < 0.0) return fail(errorEnvelope(410, 'TURN_MISSED'));

    var admissionToken = 'adm_' + uuid();
    LS.set('rb_admission', { eventId: q.eventId, admissionToken: admissionToken, issuedAt: nowIsoServer() });
    return respond(ok({
      admissionToken: admissionToken,
      // The sessionId does not exist until the admission token is exchanged.
      // The detail page performs that exchange, then replaces its URL with
      // detail.html?sessionId=... for refresh-safe routing.
      bookingUrl: 'detail.html?eventId=' + encodeURIComponent(q.eventId),
      serverTime: nowIsoServer()
    }));
  }

  // DELETE /queue-entries/{entryId}
  function mockLeaveQueue(entryId) {
    LS.del('rb_queue');
    return respond({ meta: { code: 204, message: 'Left queue' }, data: null });
  }

  // ===========================================================================
  // BOOKING SERVICE — session / hold / tickets
  // ===========================================================================
  // POST /booking-sessions -> BookingSession
  function mockCreateSession(admissionToken) {
    var adm = LS.get('rb_admission', null);
    if (!admissionToken || !adm || adm.admissionToken !== admissionToken) {
      return fail(errorEnvelope(403, 'ADMISSION_TOKEN_INVALID'));
    }
    var ev = findEvent(adm.eventId);
    if (!ev) return fail(errorEnvelope(404, 'NOT_FOUND'));
    var q = LS.get('rb_queue', null);

    var sessionId = uuid();
    var maxSelectable = Math.min(ev.maxTicketsPerOrder, ev.maxTicketsPerBuyerNik);
    var session = {
      sessionId: sessionId,
      eventId: ev.eventId,
      phase: 'SELECTING',
      reservedUnits: maxSelectable,
      maxSelectable: maxSelectable,
      // CHANGED: NIK pembeli belum ada saat antre (antrean anonim), jadi awalnya null.
      // detail.html mengirimkannya via API.setBuyer(sessionId, {buyerNik, email}).
      buyerNikMasked: (q && q.buyerNikMasked) || null,
      email: (q && q.email) || null,
      allowMixedCategories: ev.allowMixedCategories,
      expiresAt: isoIn(5 * 60 * 1000),     // 5-minute selection window
      serverTime: nowIsoServer(),
      submitGraceSeconds: 10,
      selectionWarningSeconds: 60,
      editEnabled: true,
      maxEdits: 2,
      categories: ev.categories.map(function (c) {
        return { categoryId: c.categoryId, code: c.code, name: c.name, priceMinor: c.priceMinor, available: c.available };
      }),
      booking: null
    };
    LS.set('rb_session', { sessionId: sessionId, eventId: ev.eventId, expiresAt: session.expiresAt });
    // admission token is single-use — consume it so re-POST fails like the real server
    LS.del('rb_admission');
    LS.set('rb_session_full', session);
    return respond(created(session));
  }

  // GET /booking-sessions/current?eventId -> BookingSession (restore on refresh)
  function mockGetCurrentSession(eventId) {
    var s = LS.get('rb_session_full', null);
    if (!s || s.eventId !== eventId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    // Re-fetch keeps the SAME absolute expiresAt so the timer is consistent across refresh.
    if (remainingMs(s.expiresAt) <= 0) return fail(errorEnvelope(410, 'SESSION_EXPIRED'));
    s.serverTime = nowIsoServer();
    LS.set('rb_session_full', s);
    return respond(ok(s));
  }

  // POST /booking-sessions/{sessionId}/buyer -> BookingSession  (FE-NEED)
  // CHANGED/FE-NEED: karena antrean kini anonim, NIK + email PEMBELI dikumpulkan
  // di sini (bukan saat join). Kontrak BookingSession perlu endpoint ini —
  // lihat FE-BE-align-contract.md. Validasi NIK 16 digit + email, simpan
  // buyerNikMasked ke sesi, kembalikan BookingSession terbaru.
  function mockSetBuyer(sessionId, buyer) {
    buyer = buyer || {};
    var s = LS.get('rb_session_full', null);
    if (!s || s.sessionId !== sessionId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    if (remainingMs(s.expiresAt) <= 0) return fail(errorEnvelope(410, 'SESSION_EXPIRED'));
    if (!/^[0-9]{16}$/.test(String(buyer.buyerNik || ''))) return fail(errorEnvelope(422, 'NIK_INVALID'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(buyer.email || ''))) {
      return fail(errorEnvelope(422, 'VALIDATION_ERROR', 'Format email belum benar.'));
    }
    s.buyerNikMasked = maskNik(buyer.buyerNik);
    s.email = buyer.email;
    s.serverTime = nowIsoServer();
    LS.set('rb_session_full', s);
    // keep the queue record roughly in sync for any refresh path
    var q = LS.get('rb_queue', null);
    if (q && q.eventId === s.eventId) { q.buyerNikMasked = s.buyerNikMasked; q.email = s.email; LS.set('rb_queue', q); }
    return respond(ok(s));
  }

  // POST /booking-sessions/{sessionId}/attendee-checks -> AttendeeCheck
  function mockAttendeeCheck(sessionId, nik) {
    if (!/^[0-9]{16}$/.test(String(nik || ''))) return fail(errorEnvelope(422, 'NIK_INVALID'));
    var store = LS.get('rb_checks', { remaining: 10, used: {} });
    if (store.remaining <= 0) {
      LS.set('rb_checks', store);
      return respond(ok({ result: 'CHECK_LIMIT_REACHED', checksRemaining: 0, serverTime: nowIsoServer() }));
    }
    store.remaining -= 1;
    // Deterministic demo: NIK ending in an even digit => already registered.
    var last = parseInt(nik.slice(-1), 10);
    var result = (last % 2 === 0 && last !== 0) ? 'ALREADY_REGISTERED' : 'AVAILABLE';
    LS.set('rb_checks', store);
    return respond(ok({ result: result, checksRemaining: store.remaining, serverTime: nowIsoServer() }));
  }

  // POST /bookings (Idempotency-Key REQUIRED) -> Booking
  function mockCreateBooking(body, idemKey) {
    body = body || {};
    if (!idemKey || idemKey.length < 16) return fail(errorEnvelope(400, 'VALIDATION_ERROR', 'Idempotency-Key wajib.'));
    if (!body.sessionId) return fail(errorEnvelope(400, 'VALIDATION_ERROR'));
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 3) {
      return fail(errorEnvelope(422, 'QUANTITY_EXCEEDS_LIMIT'));
    }
    var s = LS.get('rb_session_full', null);
    if (!s || s.sessionId !== body.sessionId) return fail(errorEnvelope(410, 'SESSION_EXPIRED'));
    if (remainingMs(s.expiresAt) <= 0) return fail(errorEnvelope(410, 'SESSION_EXPIRED'));
    if (!s.buyerNikMasked || !s.email) return fail(errorEnvelope(422, 'VALIDATION_ERROR', 'Data pembeli wajib diisi.'));

    var ev = findEvent(s.eventId);
    // mixed-category rule
    if (!ev.allowMixedCategories) {
      var firstCat = body.items[0].categoryId;
      for (var i = 0; i < body.items.length; i++) {
        if (body.items[i].categoryId !== firstCat) return fail(errorEnvelope(422, 'MIXED_CATEGORIES_NOT_ALLOWED'));
      }
    }
    // duplicate attendee NIK in order
    var seen = {};
    for (var j = 0; j < body.items.length; j++) {
      var n = body.items[j].attendee && body.items[j].attendee.nik;
      if (!/^[0-9]{16}$/.test(String(n || ''))) return fail(errorEnvelope(422, 'NIK_INVALID'));
      if (seen[n]) return fail(errorEnvelope(409, 'ATTENDEE_NIK_DUPLICATE_IN_ORDER'));
      seen[n] = true;
    }

    // compute amount from catalog prices (never trust client totals)
    var amountMinor = 0, items = [];
    body.items.forEach(function (it) {
      var cat = null;
      for (var k = 0; k < s.categories.length; k++) if (s.categories[k].categoryId === it.categoryId) cat = s.categories[k];
      if (!cat) return;
      amountMinor += cat.priceMinor;
      items.push({
        itemId: uuid(),
        categoryId: it.categoryId,
        categoryCode: cat.code,
        categoryName: cat.name,
        attendeeNikMasked: maskNik(it.attendee.nik),
        attendeeName: it.attendee.fullName
      });
    });

    var bookingId = uuid();
    var booking = {
      bookingId: bookingId,
      orderId: null,
      publicRef: 'RB-' + String(10000 + Math.floor(Math.random() * 89999)),
      status: 'PENDING_PAYMENT',
      amountMinor: amountMinor,
      currency: 'IDR',
      ticketQuantity: items.length,
      buyerNikMasked: s.buyerNikMasked || null,
      paymentExpiresAt: isoIn(10 * 60 * 1000),  // 10-minute payment window
      serverTime: nowIsoServer(),
      version: 1,
      canEdit: true,
      editableUntil: isoIn(10 * 60 * 1000),
      editsRemaining: 2,
      lockReason: null,
      paymentPageUrl: 'payment.html?bookingId=' + bookingId,
      items: items
    };
    // PROTOTYPE ONLY: orderId is aliased to publicRef here for simplicity.
    // In production the real BE may return distinct values: orderId is the internal
    // system reference and publicRef (e.g. "RB-12345") is the customer-facing ID.
    // FE must always display publicRef to the user and use bookingId for API calls.
    booking.orderId = booking.publicRef;
    LS.set('rb_booking', { bookingId: bookingId, eventId: s.eventId, booking: booking });
    // selection consumed
    return respond(created(booking), config.latencyMs + 300);
  }

  // GET /bookings/{bookingId} -> Booking
  function mockGetBooking(bookingId) {
    var b = LS.get('rb_booking', null);
    if (!b || b.bookingId !== bookingId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    b.booking.serverTime = nowIsoServer();
    return respond(ok(b.booking));
  }

  // GET /bookings/{bookingId}/tickets -> TicketList
  function mockGetTickets(bookingId) {
    var b = LS.get('rb_booking', null);
    if (!b || b.bookingId !== bookingId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    if (b.booking.status !== 'PAID') return fail(errorEnvelope(409, 'BOOKING_NOT_PAYABLE'));
    var ev = findEvent(b.eventId);
    var tickets = b.booking.items.map(function (it, idx) {
      return {
        ticketCode: 'RSH-' + b.booking.publicRef.replace('RB-', '') + '-' + (idx + 1),
        categoryCode: it.categoryCode || 'GA',
        attendeeName: it.attendeeName,
        attendeeNikMasked: it.attendeeNikMasked,
        qrPayload: 'RSHQR|' + b.booking.bookingId + '|' + (it.itemId) + '|' + (ev ? ev.slug : 'event')
      };
    });
    return respond(ok({
      bookingId: bookingId,
      orderId: b.booking.orderId || b.booking.publicRef,
      publicRef: b.booking.publicRef,
      ticketQuantity: b.booking.ticketQuantity || tickets.length,
      amountMinor: b.booking.amountMinor,
      buyerNikMasked: b.booking.buyerNikMasked || null,
      tickets: tickets,
      _event: ev ? summaryOf(ev) : null,
      serverTime: nowIsoServer()
    }));
  }

  // ===========================================================================
  // PAYMENT SERVICE
  // ===========================================================================
  // GET /payments/{bookingId}/page -> PaymentPage (NO credit card, NO service fee)
  function mockGetPaymentPage(bookingId) {
    var b = LS.get('rb_booking', null);
    if (!b || b.bookingId !== bookingId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    if (b.booking.status !== 'PENDING_PAYMENT') return fail(errorEnvelope(409, 'BOOKING_NOT_PAYABLE'));
    return respond(ok({
      bookingId: bookingId,
      methods: ['VA_BCA', 'VA_BNI', 'VA_BRI', 'VA_PERMATA', 'QRIS', 'GOPAY'], // enum ONLY
      amountMinor: b.booking.amountMinor,                                     // no hidden fees
      paymentExpiresAt: b.booking.paymentExpiresAt,
      serverTime: nowIsoServer(),
      currentAttempt: LS.get('rb_attempt', null),
      canEdit: b.booking.canEdit,
      editableUntil: b.booking.editableUntil,
      _booking: b.booking // prototype convenience for the order summary
    }));
  }

  // POST /payments/{bookingId}/attempts (Idempotency-Key) -> Attempt
  // Production direction: the backend creates a SNAP payment and returns a
  // redirect URL. The HTML page below uses snap.html as a local third-party
  // simulation so the callback flow can be demonstrated without a backend.
  function mockCreateAttempt(bookingId, method, idemKey) {
    var b = LS.get('rb_booking', null);
    if (!b || b.bookingId !== bookingId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    if (!idemKey || idemKey.length < 16) return fail(errorEnvelope(400, 'VALIDATION_ERROR', 'Idempotency-Key wajib.'));
    var allowed = ['VA_BCA', 'VA_BNI', 'VA_BRI', 'VA_PERMATA', 'QRIS', 'GOPAY'];
    if (allowed.indexOf(method) === -1) return fail(errorEnvelope(422, 'PAYMENT_METHOD_UNAVAILABLE'));
    if (b.booking.status !== 'PENDING_PAYMENT') return fail(errorEnvelope(409, 'BOOKING_NOT_PAYABLE'));

    var instruction;
    if (method === 'QRIS' || method === 'GOPAY') {
      // GOPAY often returns a deeplink; QRIS a QR string. We give QRIS a QR and GOPAY a deeplink+QR.
      if (method === 'QRIS') instruction = { type: 'QR', qrString: '00020101021226' + Date.now() + 'RUSUHTIKET5204' };
      else instruction = { type: 'DEEPLINK', deeplinkUrl: 'gojek://gopay/pay?ref=' + bookingId, qrString: '00020101021226' + Date.now() + 'GOPAY' };
    } else {
      var bankMap = { VA_BCA: 'BCA', VA_BNI: 'BNI', VA_BRI: 'BRI', VA_PERMATA: 'PERMATA' };
      instruction = { type: 'VA', bank: bankMap[method], vaNumber: '8808' + String(Math.floor(1e10 + Math.random() * 9e9)) };
    }

    var snapUrl = new URL('snap.html', location.href);
    snapUrl.searchParams.set('bookingId', bookingId);
    snapUrl.searchParams.set('attemptNo', String((LS.get('rb_attempt', { attemptNo: 0 }).attemptNo || 0) + 1));

    var attempt = {
      attemptNo: (LS.get('rb_attempt', { attemptNo: 0 }).attemptNo || 0) + 1,
      method: method,
      status: 'PENDING',
      bookingVersion: b.booking.version,
      expiresAt: b.booking.paymentExpiresAt,
      redirectUrl: snapUrl.href,
      successReturnUrl: 'success.html?bookingId=' + encodeURIComponent(bookingId) + '&orderId=' + encodeURIComponent(b.booking.orderId || b.booking.publicRef),
      failedReturnUrl: 'expired.html?bookingId=' + encodeURIComponent(bookingId) + '&reason=payment-failed',
      instruction: instruction,
      serverTime: nowIsoServer()
    };
    LS.set('rb_attempt', attempt);
    // Demo: the "gateway" settles after a few seconds. Status poll will see SUCCEEDED.
    LS.set('rb_attempt_settle_at', serverNow() + 6000);
    return respond(created(attempt));
  }

  // GET /payments/{bookingId}/status -> PaymentStatus
  function mockGetPaymentStatus(bookingId) {
    var b = LS.get('rb_booking', null);
    if (!b || b.bookingId !== bookingId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    var attempt = LS.get('rb_attempt', null);
    var settleAt = LS.get('rb_attempt_settle_at', null);

    var bookingStatus = b.booking.status;
    if (attempt && settleAt && serverNow() >= settleAt && attempt.status === 'PENDING') {
      // settle (SUCCEEDED). To demo a failure path, set DEMO_FAIL true below.
      var DEMO_FAIL = false;
      attempt.status = DEMO_FAIL ? 'FAILED' : 'SUCCEEDED';
      bookingStatus = DEMO_FAIL ? 'PENDING_PAYMENT' : 'PAID';
      b.booking.status = DEMO_FAIL ? 'PENDING_PAYMENT' : 'PAID';
      LS.set('rb_attempt', attempt);
      LS.set('rb_booking', b);
    }
    // payment window elapsed with no success -> EXPIRED
    if (bookingStatus === 'PENDING_PAYMENT' && remainingMs(b.booking.paymentExpiresAt) <= 0) {
      bookingStatus = 'EXPIRED';
      b.booking.status = 'EXPIRED';
      if (attempt) { attempt.status = 'EXPIRED'; LS.set('rb_attempt', attempt); }
      LS.set('rb_booking', b);
    }

    return respond(ok({
      bookingId: bookingId,
      orderId: b.booking.orderId || b.booking.publicRef,
      bookingStatus: bookingStatus,
      paymentExpiresAt: b.booking.paymentExpiresAt,
      attempt: LS.get('rb_attempt', null),
      serverTime: nowIsoServer()
    }), 300);
  }

  // Prototype-only stand-in for the backend receiving SNAP's server callback.
  // Real FE code never marks a payment paid; it redirects to a callback page,
  // then asks the backend for the authoritative status.
  function mockSnapCallback(bookingId, outcome) {
    var b = LS.get('rb_booking', null);
    if (!b || b.bookingId !== bookingId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    var attempt = LS.get('rb_attempt', null);
    if (!attempt) return fail(errorEnvelope(409, 'BOOKING_NOT_PAYABLE'));
    if (remainingMs(b.booking.paymentExpiresAt) <= 0) {
      b.booking.status = 'EXPIRED';
      attempt.status = 'EXPIRED';
    } else if (outcome === 'success') {
      b.booking.status = 'PAID';
      attempt.status = 'SUCCEEDED';
    } else {
      b.booking.status = 'PENDING_PAYMENT';
      attempt.status = 'FAILED';
    }
    LS.set('rb_attempt', attempt);
    LS.set('rb_booking', b);
    return respond(ok({
      bookingId: bookingId,
      bookingStatus: b.booking.status,
      attempt: attempt,
      serverTime: nowIsoServer()
    }));
  }

  // POST /payments/{bookingId}/page-tokens -> PageToken  (WebView handoff)
  // Real flow: mobile calls this, opens pageUrl in a WebView, the web page calls
  // POST /payment-page-sessions with the token to set the rb_pay cookie, then the
  // same payment page is reused. See README "WebView".
  function mockCreatePageToken(bookingId) {
    var b = LS.get('rb_booking', null);
    if (!b || b.bookingId !== bookingId) return fail(errorEnvelope(404, 'NOT_FOUND'));
    return respond(created({
      pageToken: 'pgt_' + uuid(),
      pageUrl: 'payment.html?bookingId=' + bookingId,
      expiresAt: isoIn(60 * 1000)
    }));
  }

  // ===========================================================================
  // NOTIFICATION SERVICE — fire-and-forget (email). Prototype logs only.
  // ===========================================================================
  function mockNotify(kind, payload) {
    // Real app: the backend emits these; the client rarely calls them directly.
    try { console.debug('[notify]', kind, payload || {}); } catch (e) {}
    return respond(ok({ queued: true, kind: kind, serverTime: nowIsoServer() }), 120);
  }

  // ===========================================================================
  // USER SERVICE — passwordless OTP login (FE-NEED)
  // FE-NEED: mirrors a User Service login/register flow (requestOtp / verifyOtp /
  // getMe / logout). Lets Home show an account entry point and lets detail.html
  // auto-fill the buyer NIK + email. See FE-BE-align-contract.md.
  //
  // DEMO notes:
  //   * verifyOtp accepts the fixed demo code '123456'.
  //   * The demo account carries a plaintext NIK in rb_user._nikPlain PURELY so
  //     the prototype can auto-fill the buyer field. IN PRODUCTION the FE NEVER
  //     receives a plaintext NIK — it only ever sees a masked value; real
  //     auto-fill uses data the user themselves saved on their own device.
  // ===========================================================================
  function emailLooksValid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '')); }

  function maskEmail(email) {
    email = String(email || '');
    var at = email.indexOf('@');
    if (at <= 1) return email;
    var name = email.slice(0, at), domain = email.slice(at);
    return name.slice(0, 1) + '***' + name.slice(-1) + domain;
  }

  // POST /auth/otp/request -> { expiresInSeconds, resendAfterSeconds }
  function mockRequestOtp(email) {
    if (!emailLooksValid(email)) return fail(errorEnvelope(422, 'VALIDATION_ERROR', 'Format email belum benar.'));
    var last = LS.get('rb_otp_last', 0);
    if (last && (Date.now() - last) < 30 * 1000) return fail(errorEnvelope(429, 'OTP_RESEND_TOO_SOON'));
    LS.set('rb_otp_last', Date.now());
    LS.set('rb_otp_email', email);
    return respond(ok({ expiresInSeconds: 300, resendAfterSeconds: 30, serverTime: nowIsoServer() }));
  }

  // Accounts "DB" keyed by email — persists registered profiles across sessions
  // so we can tell a NEW email (needs registration) from a RETURNING one.
  function accountsDb() { return LS.get('rb_accounts', {}); }
  function saveAccount(email, profile) {
    var db = accountsDb(); db[email.toLowerCase()] = profile; LS.set('rb_accounts', db);
  }
  function findAccount(email) { return accountsDb()[String(email || '').toLowerCase()] || null; }

  // POST /auth/otp/verify -> { accessToken, account|null, isNew }
  // - Returning email  -> isNew:false, account filled, session established.
  // - New email        -> isNew:true,  account:null, NO session yet; the client
  //                       must call completeRegistration() with fullName + NIK.
  function mockVerifyOtp(email, code) {
    if (!emailLooksValid(email)) return fail(errorEnvelope(422, 'VALIDATION_ERROR', 'Format email belum benar.'));
    if (String(code || '') !== '123456') return fail(errorEnvelope(401, 'OTP_INVALID'));

    var existing = findAccount(email);
    if (existing) {
      // returning user → establish session immediately
      LS.set('rb_user', existing);
      return respond(ok({ accessToken: 'tok_' + uuid(), account: existing, isNew: false, serverTime: nowIsoServer() }));
    }
    // new user → OTP verified, but registration (name + NIK) still required.
    // Hold a short-lived "pending registration" marker; no session yet.
    LS.set('rb_pending_reg', { email: email, verifiedAt: nowIsoServer() });
    return respond(ok({ accessToken: null, account: null, isNew: true, serverTime: nowIsoServer() }));
  }

  // POST /auth/register (completes a NEW account after OTP) -> { accessToken, account }
  // Mirrors PATCH /me { fullName, nik } right after first OTP verify (ADR-020:
  // account created on first login; here the client supplies name + NIK to finish).
  function mockCompleteRegistration(payload) {
    payload = payload || {};
    var pending = LS.get('rb_pending_reg', null);
    if (!pending || !pending.email) return fail(errorEnvelope(401, 'UNAUTHORIZED', 'Verifikasi OTP dulu.'));
    var fullName = String(payload.fullName || '').trim();
    var nik = String(payload.nik || '');
    if (fullName.length < 2) return fail(errorEnvelope(400, 'VALIDATION_ERROR', 'Nama lengkap wajib diisi.'));
    if (!/^[0-9]{16}$/.test(nik)) return fail(errorEnvelope(422, 'NIK_INVALID'));

    var email = pending.email;
    var profile = {
      accountId: 'acc_' + uuid(),
      email: email,
      emailMasked: maskEmail(email),
      fullName: fullName,
      nikMasked: maskNik(nik),
      hasNik: true,
      // prototype-only, for auto-fill convenience; never present in production FE.
      _nikPlain: nik,
      _emailPlain: email
    };
    saveAccount(email, profile);
    LS.set('rb_user', profile);
    LS.del('rb_pending_reg');
    return respond(created({ accessToken: 'tok_' + uuid(), account: profile, serverTime: nowIsoServer() }));
  }

  // GET /auth/me -> profile
  function mockGetMe() {
    var u = LS.get('rb_user', null);
    if (!u) return fail(errorEnvelope(401, 'UNAUTHORIZED'));
    return respond(ok(u));
  }

  // POST /auth/logout
  function mockLogout() {
    LS.del('rb_user'); LS.del('rb_pending_reg');
    return respond(ok({ loggedOut: true }));
  }

  function isLoggedIn() { return !!LS.get('rb_user', null); }

  // ---------------------------------------------------------------------------
  // Session reset (used by "start over" flows / expired page CTA)
  // ---------------------------------------------------------------------------
  function resetFlow() {
    // NOTE: rb_user (login) is intentionally preserved across flow resets.
    ['rb_queue', 'rb_admission', 'rb_session', 'rb_session_full', 'rb_booking',
     'rb_attempt', 'rb_attempt_settle_at', 'rb_checks', 'rb_idem'].forEach(LS.del);
  }

  // ---------------------------------------------------------------------------
  // GENRE + LOCATION helpers (client-side filter support for browse.html)
  // The contract's EventSummary carries neither a structured province nor a
  // normalized genre, so the prototype derives both:
  //   - genre  = ev.category (falls back to "Etc" if not a listed music genre)
  //   - province = mapped from the event's city (venue tail), else "lainnya"
  // Real catalog would expose `category` + a structured location to filter on BE.
  // ---------------------------------------------------------------------------
  var PROVINCES = [
    {id:'aceh',name:'Aceh'},{id:'sumut',name:'Sumatra Utara'},{id:'sumbar',name:'Sumatra Barat'},
    {id:'riau',name:'Riau'},{id:'kepri',name:'Kepulauan Riau'},{id:'jambi',name:'Jambi'},
    {id:'sumsel',name:'Sumatra Selatan'},{id:'babel',name:'Kepulauan Bangka Belitung'},
    {id:'bengkulu',name:'Bengkulu'},{id:'lampung',name:'Lampung'},
    {id:'dki-jakarta',name:'DKI Jakarta'},{id:'jabar',name:'Jawa Barat'},{id:'banten',name:'Banten'},
    {id:'jateng',name:'Jawa Tengah'},{id:'diy',name:'DI Yogyakarta'},{id:'jatim',name:'Jawa Timur'},
    {id:'bali',name:'Bali'},{id:'ntb',name:'Nusa Tenggara Barat'},{id:'ntt',name:'Nusa Tenggara Timur'},
    {id:'kalbar',name:'Kalimantan Barat'},{id:'kalteng',name:'Kalimantan Tengah'},
    {id:'kalsel',name:'Kalimantan Selatan'},{id:'kaltim',name:'Kalimantan Timur'},
    {id:'kaltara',name:'Kalimantan Utara'},{id:'sulut',name:'Sulawesi Utara'},
    {id:'sulteng',name:'Sulawesi Tengah'},{id:'sulsel',name:'Sulawesi Selatan'},
    {id:'sultra',name:'Sulawesi Tenggara'},{id:'gorontalo',name:'Gorontalo'},
    {id:'sulbar',name:'Sulawesi Barat'},{id:'maluku',name:'Maluku'},{id:'malut',name:'Maluku Utara'},
    {id:'papua',name:'Papua'},{id:'papbar',name:'Papua Barat'},{id:'papsel',name:'Papua Selatan'},
    {id:'papteng',name:'Papua Tengah'},{id:'pappeg',name:'Papua Pegunungan'},
    {id:'papbd',name:'Papua Barat Daya'}
  ];

  // Map a known demo city to a province id. Extend as the catalog grows.
  var CITY_TO_PROVINCE = {
    'jakarta':'dki-jakarta', 'surabaya':'jatim', 'yogyakarta':'diy', 'bandung':'jabar'
  };
  var KNOWN_GENRES = ['Festival','Jazz','Rock','Elektronik','Folk','Orkestra'];

  function cityOf(ev){ return (ev.venue||'').split('·').pop().trim(); }
  function provinceIdOf(ev){
    var c = cityOf(ev).toLowerCase();
    return CITY_TO_PROVINCE[c] || 'lainnya';
  }
  function genreOf(ev){
    var cat = ev.category || '';
    return KNOWN_GENRES.indexOf(cat) > -1 ? cat : 'Etc';
  }

  // ---------------------------------------------------------------------------
  // Public surface
  // ---------------------------------------------------------------------------
  global.API = {
    config: config,
    // utils
    minorToIDR: minorToIDR,
    syncClock: syncClock,
    serverNow: serverNow,
    remainingMs: remainingMs,
    clockOffsetMs: clockOffsetMs,
    messageFor: messageFor,
    maskNik: maskNik,
    uuid: uuid,
    idempotencyKey: idempotencyKey,
    clearIdempotency: clearIdempotency,
    visitorToken: visitorToken,
    storage: LS,
    resetFlow: resetFlow,
    ERROR_MESSAGES: ERROR_MESSAGES,
    // filter helpers (client-side genre/location — browse.html)
    PROVINCES: PROVINCES,
    cityOf: cityOf,
    provinceIdOf: provinceIdOf,
    genreOf: genreOf,
    // catalog
    listEvents: mockListEvents,
    getEvent: mockGetEvent,
    // user / auth (FE-NEED)
    requestOtp: mockRequestOtp,
    verifyOtp: mockVerifyOtp,
    completeRegistration: mockCompleteRegistration,
    getMe: mockGetMe,
    logout: mockLogout,
    isLoggedIn: isLoggedIn,
    // queue
    joinQueue: mockJoinQueue,
    getQueueStatus: mockGetQueueStatus,
    getMyEntry: mockGetMyEntry,
    claim: mockClaim,
    leaveQueue: mockLeaveQueue,
    // booking
    createSession: mockCreateSession,
    getCurrentSession: mockGetCurrentSession,
    setBuyer: mockSetBuyer,
    attendeeCheck: mockAttendeeCheck,
    createBooking: mockCreateBooking,
    getBooking: mockGetBooking,
    getTickets: mockGetTickets,
    // payment
    getPaymentPage: mockGetPaymentPage,
    createAttempt: mockCreateAttempt,
    getPaymentStatus: mockGetPaymentStatus,
    snapCallback: mockSnapCallback,
    createPageToken: mockCreatePageToken,
    // notification
    notify: mockNotify
  };
})(window);
