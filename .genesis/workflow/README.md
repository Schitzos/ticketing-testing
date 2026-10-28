# Final Workflow — Requirement to Production

> Generic, reusable workflow that takes raw requirements and produces
> production-ready documentation, task lists, and implementation-ready specs.

---

## What This Workflow Does

```
RAW REQUIREMENT → [5 Phases + 5 Human Gates] → READY FOR IMPLEMENTATION
```

**Input:** A raw requirement (PDF, doc, conversation, idea)

**Output:** (all under `.genesis/docs/` — see GENESIS.md "Output Layout")
- Complete architecture documentation
- API contracts
- Flow & sequence diagrams
- Task list with dependencies
- Skills mapped to tasks
- Project-specific rules
- Implementation readiness checklist

> **Standard layout:** every GENESIS run writes to a single `.genesis/` root — `.genesis/docs/` (numbered `01-08` phase/gate trail + un-numbered deliverable docs + `api-contract/` + `mock-fixtures/`), `.genesis/requirement/` (raw input), `.genesis/prototype/`, `.genesis/workflow/` (this workflow), and `AGENTS.md` at the repo root. GENESIS.md "Output Layout" is authoritative.

---

## Design: Two Stages

```
┌─────────────────────────────────────────┐
│  STAGE 1: GENESIS (this workflow)       │
│  Raw requirement → Production-ready docs│
│  5 phases, 5 human gates                │
│  Critical grooming, not passive Q&A     │
└──────────────┬──────────────────────────┘
               │ produces
               ↓
┌─────────────────────────────────────────┐
│  STAGE 2: IMPLEMENTATION                │
│  WORKFLOW.md executes the tasks         │
│  5 phases + REVIEW step, 4 human gates  │
│  Code, review, test, verify, release    │
└─────────────────────────────────────────┘
```

---

## Files

| File | Purpose | Read When |
|------|---------|-----------|
| `README.md` | This file — entry point | First |
| `GENESIS.md` | The meta-workflow (5 phases) | Starting a new project |
| `GROOMING-PROTOCOL.md` | How agent challenges decisions | During grooming |
| `GROOMING-CHECKLIST.md` | All questions to ask | During grooming |
| `WORKFLOW.md` | Implementation pipeline | After Genesis completes |
| `RULES.md` | MUST/NEVER/ASK rules | Reference |
| `SKILLS-PROTOCOL.md` | Skill discovery protocol | During implementation |
| `TRACKING.md` | Branch/commit/PR conventions | Setting up |
| `TEMPLATES.md` | Task dispatch templates | Dispatching agents |
| `RECOVERY.md` | Failure protocols | On failure |
| `GLOSSARY.md` | Term definitions | Reference |
| `METRICS.md` | Observability metrics | Sprint review |
| `TEMPLATES/` | Doc templates to fill | Phases 2-5 |

---

## Quick Start

### For a New Project

1. **Give the agent your raw requirement**
   - PDF, document, conversation, or verbal description
   - The messier, the more grooming helps

2. **Go through grooming (Gate H1)**
   - Agent asks critical questions
   - Agent challenges weak decisions
   - Agent suggests alternatives
   - You defend or adjust

3. **Review generated docs (Gate H2)**
   - Agent produces all documentation
   - You verify accuracy and completeness

4. **Review task breakdown (Gate H3)**
   - Agent decomposes into epics/stories
   - You verify scope and priorities

5. **Review skills & rules (Gate H4)**
   - Agent discovers required skills
   - Agent generates project rules
   - You verify applicability

6. **Final approval (Gate H5)**
   - Readiness checklist complete
   - All blockers resolved
   - Go/No-Go decision

7. **Implementation begins**
   - Hand off to `WORKFLOW.md`
   - Execute task by task

---

## Reading Order

```
README.md → GLOSSARY.md → GENESIS.md → GROOMING-PROTOCOL.md
```

Establish shared vocabulary first, then know the 5 phases, 5 gates, and critical grooming mindset. Everything else is reference.

---

## Key Principles

### Critical Grooming
The agent doesn't just accept answers. It challenges, questions, and recommends.
See `GROOMING-PROTOCOL.md`.

### Human Gates
Nothing proceeds without human verification. The agent stops and waits at each gate.

### AI Quality Gate
Before any PR opens, the agent reviews its own work from 7 perspectives (acceptance criteria, architecture, contracts, edge cases, security, tests, style). This is not optional and has no human gate — it is the agent's professional responsibility to catch issues before human review time is spent on them.
See `WORKFLOW.md §Phase 3.5`.

### Production-Grade
This isn't about "making it work" — it's about making it deployable, observable, secure, and maintainable.

### Skill-Aware
The agent discovers and loads skills dynamically based on task requirements.
See `SKILLS-PROTOCOL.md`.
