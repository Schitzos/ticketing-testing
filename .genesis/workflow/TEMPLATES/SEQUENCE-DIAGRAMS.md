# SEQUENCE-DIAGRAMS.md — Technical Sequences

> Generated from GENESIS grooming decisions.
> Fill `{...}` placeholders with actual project values.

---

## Overview

Technical sequence diagrams showing system component interactions.

---

## Sequence 1: {sequence name}

**Purpose:** {what this sequence accomplishes}
**Trigger:** {what initiates this sequence}

```
┌──────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│Client│     │ Gateway  │     │ Service  │     │ Database │
└──┬───┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
   │              │                │                │
   │ 1. Request   │                │                │
   │─────────────▶│                │                │
   │              │                │                │
   │              │ 2. Validate    │                │
   │              │───────────────▶│                │
   │              │                │                │
   │              │                │ 3. Query       │
   │              │                │───────────────▶│
   │              │                │                │
   │              │                │ 4. Result      │
   │              │                │◀───────────────│
   │              │                │                │
   │              │ 5. Response    │                │
   │              │◀───────────────│                │
   │              │                │                │
   │ 6. Response  │                │                │
   │◀─────────────│                │                │
   │              │                │                │
```

### Steps

| # | From | To | Action | Data |
|---|------|----|---------|----|
| 1 | Client | Gateway | {action} | {data} |
| 2 | Gateway | Service | {action} | {data} |
| 3 | Service | Database | {action} | {data} |
| 4 | Database | Service | {action} | {data} |
| 5 | Service | Gateway | {action} | {data} |
| 6 | Gateway | Client | {action} | {data} |

### Error Cases

| Step | Error | Handling |
|------|-------|----------|
| {step} | {error} | {how handled} |

---

## Sequence 2: {sequence name}

...

---

## Authentication Sequence

```
┌──────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│Client│     │   API    │     │   Auth   │     │   DB     │
└──┬───┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
   │              │                │                │
   │ 1. Login     │                │                │
   │─────────────▶│                │                │
   │              │ 2. Validate    │                │
   │              │───────────────▶│                │
   │              │                │ 3. Check user  │
   │              │                │───────────────▶│
   │              │                │ 4. User data   │
   │              │                │◀───────────────│
   │              │ 5. Token       │                │
   │              │◀───────────────│                │
   │ 6. Token     │                │                │
   │◀─────────────│                │                │
```

---

## Data Sync Sequence

```
┌──────┐     ┌──────────┐     ┌──────────┐
│Client│     │   API    │     │   DB     │
└──┬───┘     └────┬─────┘     └────┬─────┘
   │              │                │
   │ 1. Fetch     │                │
   │─────────────▶│                │
   │              │ 2. Query       │
   │              │───────────────▶│
   │              │ 3. Data        │
   │              │◀───────────────│
   │ 4. Response  │                │
   │◀─────────────│                │
   │              │                │
   │ ... later ...│                │
   │              │                │
   │ 5. Update    │                │
   │─────────────▶│                │
   │              │ 6. Write       │
   │              │───────────────▶│
   │              │ 7. Confirm     │
   │              │◀───────────────│
   │ 8. Success   │                │
   │◀─────────────│                │
```

---

## Webhook Sequence

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ External │     │ Gateway  │     │ Handler  │     │   DB     │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. Webhook     │                │                │
     │───────────────▶│                │                │
     │                │ 2. Verify sig  │                │
     │                │───────────────▶│                │
     │                │ 3. Process     │                │
     │                │                │───────────────▶│
     │                │ 4. Store       │                │
     │                │                │◀───────────────│
     │ 5. 200 OK      │                │                │
     │◀───────────────│                │                │
```

---

## Background Job Sequence

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Queue   │     │  Worker  │     │ Service  │     │   DB     │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. Dequeue     │                │                │
     │◀───────────────│                │                │
     │                │ 2. Process     │                │
     │                │───────────────▶│                │
     │                │                │ 3. Update      │
     │                │                │───────────────▶│
     │                │                │ 4. Done        │
     │                │◀───────────────│◀───────────────│
     │ 5. Ack         │                │                │
     │◀───────────────│                │                │
```

---

## Component Interactions

### {Component A} ↔ {Component B}

**Communication:** {sync/async, protocol}
**Contract:** See `API-CONTRACT.md` section {X}

---

## Timing Constraints

| Sequence | Step | Max Duration | Timeout Action |
|----------|------|--------------|----------------|
| {sequence} | {step} | {duration} | {action} |
