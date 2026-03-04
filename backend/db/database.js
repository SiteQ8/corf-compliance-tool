const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'corf.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- Engagements (one per assessment project)
  CREATE TABLE IF NOT EXISTS engagements (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'bank',
    assessor    TEXT,
    start_date  TEXT,
    status      TEXT NOT NULL DEFAULT 'in_progress',
    notes       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Assessment results per sub-domain
  CREATE TABLE IF NOT EXISTS assessments (
    id              TEXT PRIMARY KEY,
    engagement_id   TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    baseline        TEXT NOT NULL,  -- 'cyber' | 'or' | 'tprm'
    domain_id       TEXT NOT NULL,
    subdomain_id    TEXT NOT NULL,
    maturity_level  INTEGER NOT NULL DEFAULT 0,
    compliance_pct  REAL NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'applicable', -- 'applicable' | 'na'
    evidence        TEXT,
    notes           TEXT,
    assessed_by     TEXT,
    assessed_at     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(engagement_id, subdomain_id)
  );

  -- Statement of Applicability
  CREATE TABLE IF NOT EXISTS soa (
    id              TEXT PRIMARY KEY,
    engagement_id   TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    ref_id          TEXT NOT NULL,  -- domain_id or subdomain_id
    ref_level       TEXT NOT NULL,  -- 'domain' | 'subdomain'
    baseline        TEXT NOT NULL,
    applicable      INTEGER NOT NULL DEFAULT 1,
    justification   TEXT,
    approved_by     TEXT,
    approved_at     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(engagement_id, ref_id)
  );

  -- Inherent Risk Profile (tier calculator inputs)
  CREATE TABLE IF NOT EXISTS risk_profiles (
    id              TEXT PRIMARY KEY,
    engagement_id   TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    total_assets    REAL,
    market_share    REAL,
    branches        INTEGER,
    customers       REAL,
    services_breadth TEXT,
    is_fmi          INTEGER NOT NULL DEFAULT 0,
    cloud_adoption  TEXT DEFAULT 'low',
    ai_ml_usage     TEXT DEFAULT 'none',
    third_party_deps TEXT DEFAULT 'low',
    cyber_history   TEXT DEFAULT 'clean',
    cyber_workforce INTEGER,
    calculated_tier INTEGER,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(engagement_id)
  );

  -- Remediation Plan
  CREATE TABLE IF NOT EXISTS remediation (
    id              TEXT PRIMARY KEY,
    engagement_id   TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    subdomain_id    TEXT NOT NULL,
    subdomain_name  TEXT NOT NULL,
    baseline        TEXT NOT NULL,
    domain_id       TEXT NOT NULL,
    domain_name     TEXT NOT NULL,
    gap_description TEXT NOT NULL,
    priority        TEXT NOT NULL DEFAULT 'medium',  -- 'critical' | 'high' | 'medium' | 'low'
    owner           TEXT,
    target_date     TEXT,
    status          TEXT NOT NULL DEFAULT 'open',   -- 'open' | 'in_progress' | 'completed' | 'accepted_risk'
    current_maturity INTEGER DEFAULT 0,
    target_maturity  INTEGER DEFAULT 3,
    current_compliance REAL DEFAULT 0,
    target_compliance  REAL DEFAULT 100,
    actions         TEXT,  -- JSON array of action steps
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Triggers for updated_at
const triggers = [
  ['engagements', 'engagement'],
  ['assessments', 'assessment'],
  ['soa', 'soa_item'],
  ['risk_profiles', 'risk_profile'],
  ['remediation', 'remediation_item'],
];

for (const [table, prefix] of triggers) {
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_${prefix}_timestamp
    AFTER UPDATE ON ${table}
    BEGIN
      UPDATE ${table} SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
}

module.exports = db;
