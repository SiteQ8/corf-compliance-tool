# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |

## Reporting a Vulnerability

The CORF Compliance Tool handles sensitive compliance assessment data. We take security seriously.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email: **Site@hotmail.com**
3. Subject: `[CORF Security] Brief description`
4. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact on assessment data
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment** within 48 hours
- **Status update** within 7 days
- **Resolution target** within 30 days for critical issues

### Scope

**In scope:**
- SQL injection in assessment/engagement APIs
- Authentication/authorization bypass
- Cross-site scripting (XSS) in the frontend
- Sensitive data exposure (assessment data, credentials)
- Path traversal in report generation
- Docker container security issues
- Dependency vulnerabilities

**Out of scope:**
- CORF framework content accuracy (refer to CBK)
- Denial of service against local deployments
- Issues requiring physical access

## Data Handling

The CORF Compliance Tool stores sensitive compliance assessment data. When deploying:

- Use HTTPS in production
- Restrict database file permissions
- Enable authentication if exposing to a network
- Regularly backup the SQLite database
- Do not commit `.env` files or database files to version control

## Recognition

Security researchers who responsibly disclose vulnerabilities will be acknowledged in our CHANGELOG with their permission.
