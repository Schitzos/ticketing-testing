# SECURITY.md — Security Architecture

> Generated from GENESIS grooming decisions.
> Fill `{...}` placeholders with actual project values.

---

## Overview

**Security Model:** {defense in depth | zero trust | other}
**Compliance:** {GDPR | PCI-DSS | SOC 2 | HIPAA | none}

---

## Authentication

### Method

**Type:** {JWT | Session | OAuth 2.0 | SAML}
**Provider:** {Auth0 | Cognito | Firebase | custom}

### Token Configuration

| Setting | Value |
|---------|-------|
| Access token lifetime | {duration} |
| Refresh token lifetime | {duration} |
| Signing algorithm | {RS256 | HS256} |
| Token storage (client) | {httpOnly cookie | memory} |

### Multi-Factor Authentication

**Required:** {yes/no/optional}
**Methods:** {TOTP | SMS | Email | Push}

### Password Policy

| Rule | Value |
|------|-------|
| Minimum length | {number} |
| Require uppercase | {yes/no} |
| Require number | {yes/no} |
| Require special char | {yes/no} |
| Max age | {days or never} |
| History (no reuse) | {count} |

---

## Authorization

### Model

**Type:** {RBAC | ABAC | Permission-based}

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| {role} | {description} | {permissions} |
| {role} | {description} | {permissions} |

### Permission Matrix

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| {resource} | {roles} | {roles} | {roles} | {roles} |
| {resource} | {roles} | {roles} | {roles} | {roles} |

---

## Data Protection

### Data Classification

| Level | Description | Examples |
|-------|-------------|----------|
| Public | No restrictions | Marketing content |
| Internal | Company use only | Internal docs |
| Confidential | Need-to-know | User data, financials |
| Restricted | Highly sensitive | PII, payment data |

### Encryption

**At Rest:**
- Database: {AES-256 | TDE | other}
- Files: {S3 SSE | other}
- Key management: {KMS | Vault}

**In Transit:**
- Protocol: TLS 1.2+ (TLS 1.3 preferred)
- Certificate: {provider}

### Sensitive Data Handling

| Data Type | Storage | Access | Retention |
|-----------|---------|--------|-----------|
| Passwords | Hashed ({algorithm}) | Never exposed | Forever |
| PII | Encrypted | Role-restricted | {policy} |
| Payment | Tokenized | PCI scope only | {policy} |
| Logs | Redacted | Ops team | {days} |

---

## API Security

### Authentication

All API calls require: {Bearer token | API key | both}

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public | {n} | {period} |
| Authenticated | {n} | {period} |
| Admin | {n} | {period} |

### Input Validation

- All input validated against schema
- SQL injection: Parameterized queries
- XSS: Output encoding
- CSRF: Token validation

### Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: {policy}
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## Infrastructure Security

### Network

- VPC with private subnets
- Security groups (least privilege)
- WAF with OWASP rules
- DDoS protection

### Compute

- Hardened base images
- Regular patching
- No root/admin access
- IMDSv2 required (AWS)

### Secrets

**Management:** {Secrets Manager | Vault | Parameter Store}
**Rotation:** {automatic | manual, frequency}
**Access:** {IAM roles | service accounts}

---

## Code Security

### Static Analysis (SAST)

**Tool:** {SonarQube | CodeQL | Semgrep}
**When:** Every PR
**Blocking:** Critical/High findings

### Dependency Scanning

**Tool:** {Dependabot | Snyk | npm audit}
**When:** Every PR + scheduled
**Blocking:** Critical vulnerabilities

### Dynamic Analysis (DAST)

**Tool:** {OWASP ZAP | Burp Suite | other}
**When:** {frequency}
**Scope:** {what's tested}

### Container Scanning

**Tool:** {Trivy | Snyk | Clair}
**When:** On image build
**Blocking:** Critical vulnerabilities

---

## Logging & Monitoring

### Security Logging

| Event | Logged | Alert |
|-------|--------|-------|
| Login success | Yes | No |
| Login failure | Yes | If threshold |
| Password change | Yes | No |
| Permission change | Yes | Yes |
| Admin action | Yes | Yes |
| Data export | Yes | Yes |

### Log Protection

- Logs encrypted at rest
- Logs in separate account/project
- {retention} day retention
- Tamper detection

### Security Monitoring

**SIEM:** {service or none}
**Alerts:** {where routed}

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Active breach | Immediate |
| P1 | Critical vuln | < 1 hour |
| P2 | High vuln | < 4 hours |
| P3 | Medium vuln | < 24 hours |

### Response Team

| Role | Responsibility |
|------|----------------|
| {role} | {responsibility} |

### Playbooks

- [ ] Data breach response
- [ ] DDoS response
- [ ] Compromised credential response
- [ ] Malware response

---

## Compliance

### {Compliance Framework}

| Requirement | Implementation | Evidence |
|-------------|----------------|----------|
| {req} | {how met} | {proof} |
| {req} | {how met} | {proof} |

### Audit Trail

- All mutations logged with user, timestamp, IP
- Logs immutable and retained {duration}
- Audit reports generated {frequency}

---

## Security Checklist

### For Every PR

- [ ] No secrets in code
- [ ] No sensitive data in logs
- [ ] Input validation present
- [ ] Output encoding for user content
- [ ] Auth/authz checks on endpoints
- [ ] SAST scan passed
- [ ] Dependencies scanned

### For Security-Sensitive Changes

- [ ] Security review completed
- [ ] Threat model updated
- [ ] Penetration test (if applicable)
- [ ] Compliance impact assessed

---

## Vulnerability Management

### Disclosure

**Contact:** {security@domain.com or bug bounty}
**Response SLA:** {timeframe}

### Patching

| Severity | Patch SLA |
|----------|-----------|
| Critical | {hours} |
| High | {days} |
| Medium | {days} |
| Low | {days} |
