const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
const engagementsRouter = require('./routes/engagements');
const dataRouter        = require('./routes/data');
const reportsRouter     = require('./routes/reports');

app.use('/api/engagements', engagementsRouter);
app.use('/api/engagements/:engagementId', dataRouter);
app.use('/api/engagements/:engagementId/reports', reportsRouter);

// CORF domain reference data (static)
const { CYBER_DOMAINS, OR_DOMAINS, TPRM_DOMAINS, MATURITY_LEVELS, TIERING_DIMENSIONS } = require('./data/corf-domains');
app.get('/api/corf-data', (_req, res) => {
  res.json({ CYBER_DOMAINS, OR_DOMAINS, TPRM_DOMAINS, MATURITY_LEVELS, TIERING_DIMENSIONS });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', framework: 'CBK CORF v1.0', date: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🛡️  CORF Compliance Tool API running on http://localhost:${PORT}`);
  console.log(`📋  CBK Cyber & Operational Resilience Framework v1.0`);
  console.log(`🗄️  SQLite database: ./data/corf.db\n`);
});

module.exports = app;
