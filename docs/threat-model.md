# Threat Model

This document identifies potential threats to the School Management Platform and outlines prevention, detection, and mitigation strategies.

| Threat | Attack Vector | Affected Module | Impact | Likelihood | Prevention | Detection | Mitigation | Recovery |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Account Takeover** | Credential stuffing, Phishing | Auth | CRITICAL | MEDIUM | MFA, Strong password policy, Rate limiting | Login failure spikes, IP change alerts | Session revocation, Account lock | Password reset, MFA re-setup |
| **Cross-Tenant Leakage** | IDOR, BOLA, Misconfigured queries | All | CRITICAL | LOW | Strict tenant-context enforcement, Automated cross-tenant tests | Unusual ID access patterns | Immediate session block | Data cleanup, Notification |
| **SQL Injection** | Unsanitized input in raw queries | Database | CRITICAL | LOW | Prisma (parameterized queries), No raw SQL | Database audit logs | WAF, DB role restriction | Restore from backup |
| **Stored XSS** | Malicious rich text, filenames | All | HIGH | MEDIUM | HTML Sanitization, CSP, Output encoding | CSP violation reports | Content deletion | Cache purge |
| **SSRF** | URL previews, Webhooks | Integrations | HIGH | LOW | IP Whitelisting, Blocking loopback/internal ranges | Egress monitoring | Block malicious IP/URL | Infrastructure audit |
| **Malware Upload** | Document management | Storage | HIGH | MEDIUM | File signature validation, Magic bytes check, Asynchronous scanning | Malware scan alerts | File quarantine | Cleanup storage |
| **Session Hijacking** | Token theft, XSS | Auth | HIGH | LOW | HttpOnly/Secure cookies, Session rotation, IP binding | Concurrent session alerts | Revoke all sessions | Session re-issue |
| **API Abuse** | Scraping, Brute-force | API | MEDIUM | HIGH | Rate limiting, Throttling, WAF | Rate limit trigger logs | IP block | Auto-unblock after delay |
| **Insider Threat** | Malicious admin, staff | All | HIGH | MEDIUM | Strict RBAC, Dual-control for sensitive actions | Audit logs, Unusual export detection | Revoke permissions | Audit review, Data rollback |
| **WebSocket Abuse** | Room hijacking, DoS | Realtime | MEDIUM | LOW | Auth connection guards, Subscription authorization | Socket connection spikes | Kill socket connection | Re-connection limit |

*(This model is updated continuously as new features are added.)*
