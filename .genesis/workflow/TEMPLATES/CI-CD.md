# CI-CD.md — Continuous Integration & Deployment

> Generated from GENESIS grooming decisions.
> Fill `{...}` placeholders with actual project values.

---

## Overview

**CI Platform:** {GitHub Actions | GitLab CI | Jenkins | CircleCI}
**CD Platform:** {same as CI | ArgoCD | Spinnaker | other}
**Container Registry:** {ECR | GCR | Docker Hub | GHCR}
**Artifact Storage:** {S3 | GCS | Artifactory}

---

## Branching Strategy

**Strategy:** {GitFlow | Trunk-based | GitHub Flow}

```
{main/master}     ─────●─────●─────●─────●─────●─────────▶ Production
                       │     ↑     │     ↑
{develop}         ────●┼────●┼────●┼────●┼────●──────────▶ Staging
                      │└────┘│    │└────┘│
{feature/*}      ────●──────●    ●──────●               Feature branches
```

### Branch Rules

| Branch | Protected | Required Reviews | CI Required |
|--------|-----------|-----------------|-------------|
| `main` | Yes | {n} | Yes |
| `develop` | Yes | {n} | Yes |
| `feature/*` | No | - | Yes |

---

## Environments

| Environment | Branch | URL | Auto-Deploy |
|-------------|--------|-----|-------------|
| Development | `develop` | `{url}` | Yes |
| Staging | `develop` | `{url}` | Yes |
| Production | `main` | `{url}` | {Yes/No} |
| Preview | PR branches | Dynamic | Yes |

---

## CI Pipeline

### Stages

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Install │ ─▶ │  Lint   │ ─▶ │  Test   │ ─▶ │  Build  │ ─▶ │ Deploy  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Stage Details

#### 1. Install
```yaml
- name: Install dependencies
  run: |
    {install command}
  cache:
    paths:
      - {cache paths}
```

#### 2. Lint
```yaml
- name: Lint
  run: |
    {lint command}
```

#### 3. Test
```yaml
- name: Test
  run: |
    {test command}
  coverage:
    minimum: {percentage}
```

#### 4. Build
```yaml
- name: Build
  run: |
    {build command}
  artifacts:
    paths:
      - {build output}
```

#### 5. Deploy
```yaml
- name: Deploy
  run: |
    {deploy command}
  environment: {env}
  when: {condition}
```

---

## Quality Gates

### Required Checks

| Check | Blocking | Threshold |
|-------|----------|-----------|
| Lint | Yes | 0 errors |
| Type check | Yes | 0 errors |
| Unit tests | Yes | 100% pass |
| Coverage | Yes | ≥ {x}% |
| Security scan | Yes | 0 critical |
| Build | Yes | Success |

### Optional Checks

| Check | Purpose |
|-------|---------|
| Performance | Detect regressions |
| Bundle size | Track growth |
| Accessibility | A11y violations |

---

## Security Scanning

### SAST (Static Analysis)

**Tool:** {SonarQube | CodeQL | Semgrep}
**When:** Every PR

```yaml
- name: SAST Scan
  run: |
    {sast command}
  fail_on:
    - critical
    - high
```

### Dependency Scanning

**Tool:** {Dependabot | Snyk | npm audit}
**When:** Every PR + Daily

### Container Scanning

**Tool:** {Trivy | Snyk | Clair}
**When:** On image build

---

## CD Pipeline

### Deployment Strategy

**Type:** {Blue-Green | Canary | Rolling | Recreate}

### Blue-Green Deployment

```
                    ┌──────────────┐
    Traffic ───────▶│   Blue (v1)  │ ← Current
                    └──────────────┘
                    
                    ┌──────────────┐
    (Deploy) ──────▶│  Green (v2)  │ ← New
                    └──────────────┘

After validation:
                    ┌──────────────┐
    Traffic ───────▶│  Green (v2)  │ ← Current
                    └──────────────┘
```

### Canary Deployment

```
Traffic split:
  - 90% → v1 (stable)
  - 10% → v2 (canary)

Gradual rollout:
  10% → 25% → 50% → 100%
```

---

## Feature Flags

**Provider:** {LaunchDarkly | Unleash | custom}

| Flag | Default | Purpose |
|------|---------|---------|
| `{flag}` | {value} | {purpose} |

### Flag Lifecycle

1. Create flag (disabled)
2. Deploy code behind flag
3. Enable flag (gradual rollout)
4. Monitor
5. Remove flag (cleanup)

---

## Rollback

### Automatic Rollback

**Triggers:**
- Health check failures > {threshold}
- Error rate > {threshold}
- Latency p99 > {threshold}

### Manual Rollback

```bash
# Rollback to previous version
{rollback command}

# Rollback to specific version
{rollback command with version}
```

### Rollback Verification

- [ ] Health checks passing
- [ ] Error rate normal
- [ ] Key metrics stable
- [ ] No user complaints

---

## Release Process

### Versioning

**Scheme:** {SemVer | CalVer | other}
**Format:** `{format}`

### Changelog

**Tool:** {Conventional Changelog | Release Drafter | manual}
**Location:** `CHANGELOG.md`

### Release Steps

1. [ ] All PRs merged to `develop`
2. [ ] CI passing on `develop`
3. [ ] Create release branch/tag
4. [ ] Deploy to staging
5. [ ] QA verification
6. [ ] Merge to `main`
7. [ ] Deploy to production
8. [ ] Verify production
9. [ ] Create GitHub release
10. [ ] Notify stakeholders

---

## Secrets Management

### CI Secrets

| Secret | Scope | Rotation |
|--------|-------|----------|
| `{NAME}` | {where used} | {frequency} |

### Secret Injection

```yaml
env:
  {VAR_NAME}: ${{ secrets.{SECRET_NAME} }}
```

---

## Notifications

### Build Notifications

| Event | Channel | Recipients |
|-------|---------|------------|
| PR build failed | {Slack/Email} | PR author |
| Deploy to staging | {Slack} | Team channel |
| Deploy to production | {Slack} | Team channel |
| Rollback | {PagerDuty} | On-call |

---

## Pipeline Configuration

### GitHub Actions Example

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        uses: {setup action}
      - name: Install
        run: {install command}
      - name: Lint
        run: {lint command}
      - name: Test
        run: {test command}
      - name: Build
        run: {build command}

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: {deploy command}
```

---

## Metrics & Monitoring

### Pipeline Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Build time | < {minutes} | > {threshold} |
| Deploy time | < {minutes} | > {threshold} |
| Success rate | > {%} | < {threshold} |

### Deployment Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Deployment frequency | {frequency} | - |
| Lead time | < {hours} | > {threshold} |
| MTTR | < {hours} | > {threshold} |
| Change failure rate | < {%} | > {threshold} |
