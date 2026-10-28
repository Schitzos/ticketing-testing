# EDGE-CASES.md — Error Handling & Edge Cases

> Generated from GENESIS grooming decisions.
> Fill `{...}` placeholders with actual project values.

---

## Overview

This document defines how the system handles errors, edge cases, and exceptional conditions.

---

## Error Taxonomy

### Error Categories

| Category | Code Range | Description |
|----------|------------|-------------|
| Validation | `E1xxx` | Input validation failures |
| Authentication | `E2xxx` | Auth/session errors |
| Authorization | `E3xxx` | Permission errors |
| Resource | `E4xxx` | Not found, conflict |
| External | `E5xxx` | Third-party failures |
| System | `E9xxx` | Internal errors |

### Error Code Reference

| Code | Name | User Message | Action |
|------|------|--------------|--------|
| `E1001` | {name} | {message} | {action} |
| `E1002` | {name} | {message} | {action} |
| ... | ... | ... | ... |

---

## Network Errors

### Connection Lost

**Condition:** Device loses network connectivity
**Detection:** {how detected}
**User Experience:**
- {what user sees}
- {what user can do}

**Recovery:**
1. {step 1}
2. {step 2}

### Timeout

**Condition:** Request exceeds timeout threshold
**Timeout Values:**
- API calls: `{seconds}`
- File uploads: `{seconds}`
- Long-running operations: `{seconds}`

**User Experience:**
- {what user sees}

**Recovery:**
- Retry with exponential backoff
- Max retries: `{number}`

### Server Unreachable

**Condition:** Server returns 5xx or no response
**User Experience:**
- {what user sees}

**Recovery:**
- {recovery steps}

---

## Authentication Edge Cases

### Token Expired

**Condition:** Access token expires during session
**Detection:** 401 response from API
**Handling:**
1. Attempt token refresh
2. If refresh fails → redirect to login
3. Preserve user's current state for restoration

### Session Conflict

**Condition:** User logged in on multiple devices
**Handling:** {policy}

### Invalid Credentials

**Condition:** Wrong password or locked account
**Rate Limiting:**
- Max attempts: `{number}`
- Lockout duration: `{duration}`

---

## Data Edge Cases

### Empty States

| Screen | Empty Condition | Display |
|--------|-----------------|---------|
| {screen} | {when empty} | {what to show} |
| {screen} | {when empty} | {what to show} |

### Stale Data

**Condition:** Cached data is outdated
**Detection:** {how detected}
**Handling:**
- Background refresh on focus
- Pull-to-refresh
- Staleness indicator

### Concurrent Modification

**Condition:** Two users modify same resource
**Detection:** {how detected — optimistic locking, version check}
**Handling:**
- {conflict resolution strategy}

---

## Input Validation

### Field Validation Rules

| Field | Rules | Error Message |
|-------|-------|---------------|
| {field} | {rules} | {message} |
| {field} | {rules} | {message} |

### Sanitization

| Input Type | Sanitization |
|------------|--------------|
| Text | {rules} |
| HTML | {rules} |
| File | {rules} |

---

## Payment Edge Cases

### Payment Timeout

**Condition:** Payment gateway doesn't respond
**Handling:**
1. {step}
2. {step}

### Double Payment

**Condition:** User submits payment twice
**Prevention:** {idempotency strategy}
**Detection:** {how detected}
**Resolution:** {how resolved}

### Payment Declined

**Condition:** Card declined or insufficient funds
**User Experience:**
- {what user sees}
- {what they can do}

---

## External Service Failures

### {Service Name} Unavailable

**Condition:** {service} API returns error or timeout
**Graceful Degradation:**
- {what still works}
- {what is disabled}
**User Communication:** {how user is informed}
**Fallback:** {if any}

---

## Rate Limiting

### Client Rate Limits

| Operation | Limit | Window | Exceeded Action |
|-----------|-------|--------|-----------------|
| {operation} | {n} | {time} | {action} |
| {operation} | {n} | {time} | {action} |

### Server Rate Limits

| Endpoint | Limit | Window | Response |
|----------|-------|--------|----------|
| {endpoint} | {n} | {time} | {response} |

---

## Offline Behavior

### Offline Capabilities

| Feature | Offline Support | Sync Strategy |
|---------|-----------------|---------------|
| {feature} | {yes/no/partial} | {how synced} |
| {feature} | {yes/no/partial} | {how synced} |

### Offline Queue

**Queued Operations:** {what is queued}
**Queue Persistence:** {where stored}
**Sync on Reconnect:** {how processed}
**Conflict Resolution:** {strategy}

---

## Device/Platform Edge Cases

### Low Storage

**Detection:** {how detected}
**Handling:** {what to do}

### Low Memory

**Detection:** {how detected}
**Handling:** {what to do}

### Background/Foreground

**Going to Background:**
- {what happens to in-flight requests}
- {state preservation}

**Returning to Foreground:**
- {refresh strategy}
- {session validation}

---

## Logging & Monitoring

### Error Logging

| Error Type | Log Level | Alert |
|------------|-----------|-------|
| Validation | warn | No |
| Auth failure | warn | If threshold exceeded |
| 5xx errors | error | Yes |
| Unhandled exception | error | Yes |

### Error Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| Error rate | > {x}% |
| 5xx rate | > {x}% |
| Timeout rate | > {x}% |

---

## Recovery Patterns

### Retry Strategy

```
retry_config:
  max_attempts: {number}
  initial_delay: {ms}
  max_delay: {ms}
  backoff_multiplier: {number}
  retryable_errors:
    - {error code}
    - {error code}
```

### Circuit Breaker

```
circuit_breaker:
  failure_threshold: {number}
  success_threshold: {number}
  timeout: {seconds}
```

### Fallback Chain

```
{primary} → {fallback 1} → {fallback 2} → {error state}
```
