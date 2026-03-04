# 🛡️ CORF Compliance Tool

> Open-source compliance assessment tool for the **CBK Cyber & Operational Resilience Framework (CORF) v1.0**  
> Built for the **Kuwait Cybersecurity Community** — by security consultants, for security consultants.

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![Framework: CORF v1.0](https://img.shields.io/badge/CORF-v1.0%20Dec%202025-blue.svg)](https://www.cbk.gov.kw)
[![Stack: React + Node + SQLite](https://img.shields.io/badge/Stack-React%20%2B%20Node%20%2B%20SQLite-green.svg)]()

---

## 📋 About

The **CORF Compliance Tool** is a full-stack web application that helps security consultants, assessors, and compliance officers conduct structured assessments against the Central Bank of Kuwait's **Cyber and Operational Resilience Framework (CORF)**, issued December 2025.

It replaces manual spreadsheets with a structured, database-backed tool featuring automated scoring, PDF/Excel reporting, and a full remediation tracker.

### Framework Coverage

| Baseline | Domains | Sub-domains | Controls |
|---|---|---|---|
| Cyber Resilience (CR) | 6 | 33 | 519 |
| Operational Resilience (OR) | 8 | 17 | 146 |
| Third-Party Risk Management (TPRM) | 13 | 43 | 211 |
| **Total** | **27** | **93** | **876** |

---

## ✨ Features

### 📊 Dashboard
- Real-time maturity and compliance metrics
- Recharts radar + bar charts per baseline
- Overall CORF posture summary

### ✅ Baseline Assessment
- Full domain/sub-domain accordion UI for all 3 baselines
- **Maturity scoring**: 1-Initial → 2-Ad-hoc → 3-Baseline → 4-Advanced → 5-Innovative
- **Compliance %** slider per sub-domain
- Mark sub-domains as **Not Applicable (N/A)**
- Evidence reference + assessor notes per sub-domain
- **Auto-save** with debounce

### 📋 Statement of Applicability (SoA)
- Complete SoA builder covering all 93 sub-domains
- Toggle applicable / not applicable per domain and sub-domain
- Justification fields for N/A exclusions (CBK requirement)
- Bulk save to database

### 🏷️ Inherent Risk Profiling & Tier Calculator
- 11 CBK tiering dimensions fully implemented
- Real-time tier estimate (Tier 1 / 2 / 3)
- Scoring model based on CORF Framework Section 10
- Save profile to database for reporting

### 🔧 Remediation Tracker
- Add, edit, and track remediation items per sub-domain
- Priority levels: Critical / High / Medium / Low
- Status: Open / In Progress / Completed / Accepted Risk
- Owner assignment + target date with overdue detection
- Maturity uplift tracking (current → target)
- Inline status updates

### 📄 Export
- **PDF Report**: Cover page, executive summary, domain table, remediation plan
- **Excel Report**: 5 worksheets — Dashboard, Assessment Results, SoA, Remediation Plan, Risk Profile
- Color-coded, CBK-ready format

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

```bash
# Clone the repo
git clone https://github.com/your-org/corf-compliance-tool.git
cd corf-compliance-tool

# Backend
cd backend
npm install
npm run dev        # Runs on http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev        # Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173)

### Docker (Recommended for production)

```bash
docker-compose up --build
```

Opens on [http://localhost:80](http://localhost:80)

---

## 🏗️ Architecture

```
corf-compliance-tool/
├── backend/
│   ├── server.js              # Express entry point
│   ├── db/database.js         # SQLite schema & initialization
│   ├── routes/
│   │   ├── engagements.js     # Engagements + assessments CRUD
│   │   ├── data.js            # SoA, risk profile, remediation
│   │   └── reports.js         # PDF + Excel generation
│   └── data/corf-domains.js   # Full CORF domain structure (source of truth)
│
└── frontend/
    ├── src/
    │   ├── App.jsx             # Shell, routing, engagement management
    │   ├── api/client.js       # Axios API client
    │   ├── styles/global.css   # Dark navy/gold theme
    │   └── components/
    │       ├── Dashboard.jsx
    │       ├── Assessment.jsx
    │       ├── SoABuilder.jsx
    │       ├── TierCalculator.jsx
    │       └── RemediationTracker.jsx
    └── vite.config.js
```

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| PDF Export | PDFKit |
| Excel Export | ExcelJS |
| Container | Docker + Nginx |

---

## 📡 API Reference

```
GET    /api/health
GET    /api/corf-data                           # Full domain structure

GET    /api/engagements                         # List engagements
POST   /api/engagements                         # Create engagement
GET    /api/engagements/:id
PATCH  /api/engagements/:id
DELETE /api/engagements/:id
GET    /api/engagements/:id/summary

GET    /api/engagements/:id/assessments
PUT    /api/engagements/:id/assessments/:subId  # Upsert assessment
POST   /api/engagements/:id/assessments/bulk

GET    /api/engagements/:id/soa
PUT    /api/engagements/:id/soa/:refId
POST   /api/engagements/:id/soa/bulk

GET    /api/engagements/:id/risk-profile
PUT    /api/engagements/:id/risk-profile

GET    /api/engagements/:id/remediation
POST   /api/engagements/:id/remediation
PATCH  /api/engagements/:id/remediation/:remId
DELETE /api/engagements/:id/remediation/:remId

GET    /api/engagements/:id/reports/pdf
GET    /api/engagements/:id/reports/excel
```

---

## 🤝 Contributing

Contributions from the Kuwait Cybersecurity Community are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/add-control-detail`)
3. Commit your changes (`git commit -m 'Add full control-level detail'`)
4. Push to the branch (`git push origin feature/add-control-detail`)
5. Open a Pull Request

### Roadmap
- [ ] Full 876 individual control entries with descriptions
- [ ] Evidence file attachment support
- [ ] Multi-user / role-based access (assessor vs reviewer)
- [ ] Gap auto-detection from low-scoring sub-domains
- [ ] CORWG report templates
- [ ] Comparison view between assessment periods
- [ ] Sector-level benchmarking (anonymized)

---

## ⚠️ Disclaimer

This is a **community tool** intended to support CORF preparation and self-assessment. It does not replace:
- Official CBK CORF assessments
- Independent third-party assessments (required annually per CORF Toolkit)
- CBK supervisory review and formal tier classification

Always refer to the official [CBK CORF documentation](https://www.cbk.gov.kw) for authoritative requirements.

**Framework Reference:** Cyber and Operational Resilience Framework for All Local Banks and Financial Institutions, Version 1.0, Central Bank of Kuwait, December 2025.

---

## 📬 Contact

CBK CORWG: [CORWG@cbk.gov.kw](mailto:CORWG@cbk.gov.kw)  
Community: Open a GitHub Issue or Discussion

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

*Built with ❤️ for the Kuwait Cybersecurity Community*
