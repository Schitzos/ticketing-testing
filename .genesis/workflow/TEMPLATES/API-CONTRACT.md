# API-CONTRACT.md — API Specifications

> Generated from GENESIS grooming decisions.
> Fill `{...}` placeholders with actual project values.
> Generate OpenAPI specs in `{path-to-openapi-specs}/` folder.

---

## Overview

**API Style:** {REST | GraphQL | gRPC}
**Base URL:** `{base-url}`
**Version:** {v1, v2, etc.}
**Authentication:** {method}

---

## Authentication

### Method
{JWT | OAuth 2.0 | API Key | Session | other}

### Headers
```
Authorization: Bearer {token}
X-API-Key: {api-key}
{other headers}
```

### Token Lifecycle
- **Acquisition:** {how to get token}
- **Expiration:** {duration}
- **Refresh:** {refresh mechanism}

---

## Common Patterns

### Request Format
```json
{
  "data": { ... },
  "meta": {
    "idempotencyKey": "{uuid}",
    "timestamp": "{ISO 8601}"
  }
}
```

### Response Format
```json
{
  "data": { ... },
  "meta": {
    "requestId": "{uuid}",
    "timestamp": "{ISO 8601}"
  }
}
```

### Error Format
```json
{
  "error": {
    "code": "{ERROR_CODE}",
    "message": "{Human readable message}",
    "details": { ... }
  },
  "meta": {
    "requestId": "{uuid}",
    "timestamp": "{ISO 8601}"
  }
}
```

### Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Endpoints

### {Domain 1}: {domain name}

#### {Operation 1}
```
{METHOD} {path}
```

**Purpose:** {what it does}

**Request:**
```json
{
  "field1": "{type}",
  "field2": "{type}"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "{uuid}",
    "field1": "{value}"
  }
}
```

**Errors:**
| Code | When |
|------|------|
| `VALIDATION_ERROR` | {condition} |
| `NOT_FOUND` | {condition} |

---

#### {Operation 2}
```
{METHOD} {path}
```

**Purpose:** {what it does}

...

---

### {Domain 2}: {domain name}

...

---

## Pagination

### Request Parameters
```
?page={number}&limit={number}
?cursor={cursor}&limit={number}
```

### Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true,
    "nextCursor": "{cursor}"
  }
}
```

---

## Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Default | {n} requests | per {period} |
| Authenticated | {n} requests | per {period} |
| Premium | {n} requests | per {period} |

### Rate Limit Headers
```
X-RateLimit-Limit: {limit}
X-RateLimit-Remaining: {remaining}
X-RateLimit-Reset: {timestamp}
```

---

## Webhooks

### Events
| Event | Trigger | Payload |
|-------|---------|---------|
| `{event.type}` | {when fired} | {payload structure} |

### Webhook Format
```json
{
  "event": "{event.type}",
  "timestamp": "{ISO 8601}",
  "data": { ... },
  "signature": "{HMAC signature}"
}
```

### Signature Verification
```
signature = HMAC-SHA256(webhook_secret, request_body)
```

---

## OpenAPI Specifications

Full OpenAPI 3.0 specs are in:

```
{path-to-openapi-specs}/
├── {domain1}.openapi.json
├── {domain2}.openapi.json
└── ...
```

### Generating Specs
{instructions for generating/updating OpenAPI specs}

---

## Versioning

### Strategy
{URL versioning | Header versioning | Query param}

### Deprecation Policy
- Deprecation notice: {lead time}
- Sunset period: {duration}
- Communication: {how deprecated APIs are announced}

---

## SDK / Client Libraries

| Platform | Package | Status |
|----------|---------|--------|
| JavaScript | {package} | {status} |
| Python | {package} | {status} |
| {other} | {package} | {status} |

---

## Testing

### Sandbox Environment
- **URL:** `{sandbox-url}`
- **Credentials:** {how to get test credentials}
- **Data:** {test data available}

### Test Cards / Data
| Scenario | Test Value |
|----------|------------|
| {scenario} | {value} |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| {version} | {date} | {changes} |
