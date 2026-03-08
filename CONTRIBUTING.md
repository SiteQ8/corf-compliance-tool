# Contributing to CORF Compliance Tool

Thank you for your interest in improving the CORF Compliance Tool! This project serves the Kuwait Cybersecurity Community.

## How to Contribute

### Reporting Bugs

1. Check existing [issues](https://github.com/SiteQ8/corf-compliance-tool/issues)
2. Use the **Bug Report** template
3. Include browser, Node.js version, and steps to reproduce

### Suggesting Features

1. Use the **Feature Request** template
2. Describe the use case and how it relates to CORF compliance workflows

### Submitting Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the coding standards below
4. Test your changes
5. Commit: `git commit -m "feat: add control-level detail view"`
6. Push and open a Pull Request

## Coding Standards

### Frontend (React)
- Functional components with hooks
- Component files in `frontend/src/components/`
- Follow existing dark navy/gold theme (CSS variables in `global.css`)
- Use Recharts for any new visualizations

### Backend (Node.js)
- Express routes in `backend/routes/`
- Use parameterized queries for SQLite (prevent SQL injection)
- Return consistent JSON error responses
- Add JSDoc comments for new functions

### CORF Domain Data
- Domain structure lives in `backend/data/corf-domains.js`
- Follow the existing nested format (baseline → domain → sub-domain → controls)
- Reference CBK CORF v1.0 document for accuracy

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

## Development Setup

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## CORF-Specific Guidelines

When contributing CORF domain data or assessment logic:
- Always reference the official CBK CORF v1.0 document
- Maintain the 3-baseline structure (CR, OR, TPRM)
- Preserve the 5-level maturity model (1-Initial through 5-Innovative)
- Test with realistic assessment scenarios

## Questions?

Open a [Discussion](https://github.com/SiteQ8/corf-compliance-tool/discussions) or reach out to [@SiteQ8](https://github.com/SiteQ8).
