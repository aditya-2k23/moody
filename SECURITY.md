# Security Policy

Thank you for your interest in keeping **Moody** secure. We take security seriously and appreciate the community's help in identifying and fixing vulnerabilities.

## Supported Versions

Only the latest major version of Moody is currently supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 3.x     | ✅                 |
| 2.x     | ⚠️ Limited support |
| 1.x     | ❌                 |

## Reporting a Vulnerability

If you discover a security vulnerability within Moody, please do **not** open a public issue on GitHub. Instead, please report it privately to protect user data and system integrity.

### How to Report

Please email us at **[holaaditya123@gmail.com](mailto:holaaditya123@gmail.com)** with the subject line: `[SECURITY] Vulnerability Report - Moody`.

In your report, please include:

1. **Type of vulnerability** (e.g., XSS, SQL Injection, Authentication Bypass).
2. **Full paths** of source file(s) related to the manifestation of the bug.
3. **Step-by-step instructions** to reproduce the issue.
4. **Proof-of-concept** or screenshots, if applicable.
5. **Impact** of the vulnerability.

### Response Timeline

* **Acknowledgment:** We will acknowledge your report within 48 hours.
* **Assessment:** We will assess the severity and impact within 1 week.
* **Fix:** We aim to release a patch for critical vulnerabilities as soon as possible.

## Out of Scope

The following are generally considered out of scope:

* Attacks requiring physical access to a user's device.
* Social engineering attacks.
* Vulnerabilities in third-party dependencies (unless a patch is available and we haven't updated).
* Large-scale Denial of Service (DoS) attacks outside normal abuse-prevention controls.

## Current Security Controls (High Level)

Moody currently uses layered controls, including:

1. Firebase ID token verification for protected API routes.
2. User-scoped authorization checks on chat/history/memory routes.
3. Request validation and payload-size limits on sensitive endpoints.
4. Per-endpoint rate limiting and Retry-After behavior.
5. Security response headers (CSP, HSTS, frame/type/referrer protections).

## Disclosure Policy

We ask that you give us a reasonable amount of time to fix the issue before making it public. Once the issue is resolved, we will credit you in the release notes (unless you prefer to remain anonymous).
