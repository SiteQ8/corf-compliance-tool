# Changelog

All notable changes to the CORF Compliance Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-03-08

### Added
- Initial release of CORF Compliance Tool
- Full-stack React + Node.js + SQLite application
- CBK CORF v1.0 framework data (27 domains, 93 sub-domains, 876 controls)
- Three baselines: Cyber Resilience, Operational Resilience, Third-Party Risk Management
- Dashboard with real-time maturity/compliance metrics and Recharts visualizations
- Baseline Assessment module with maturity scoring (1-5) and compliance % per sub-domain
- Statement of Applicability (SoA) builder with N/A justification fields
- Inherent Risk Profiling & Tier Calculator (11 CBK dimensions, Tier 1/2/3)
- Remediation Tracker with priority, status, ownership, and overdue detection
- PDF report generation (cover page, executive summary, domain tables, remediation plan)
- Excel report generation (5 worksheets, color-coded, CBK-ready format)
- Multi-engagement support (create, switch, delete engagements)
- Auto-save with debounce on assessment changes
- Docker Compose deployment with Nginx reverse proxy
- REST API with 22 endpoints
- Dark navy/gold themed UI
- Security policy, contributing guidelines, code of conduct
- GitHub Actions CI (lint, syntax check)
- Issue and PR templates
