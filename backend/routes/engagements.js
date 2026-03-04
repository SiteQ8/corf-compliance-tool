const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

// ── Engagements ──────────────────────────────────────────────────────────────

// GET /api/engagements
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT e.*,
        (SELECT COUNT(*) FROM assessments a WHERE a.engagement_id = e.id AND a.maturity_level > 0) AS assessed_count,
        (SELECT COUNT(*) FROM remediation r WHERE r.engagement_id = e.id) AS gap_count,
        (SELECT COUNT(*) FROM remediation r WHERE r.engagement_id = e.id AND r.status = 'completed') AS resolved_count
      FROM engagements e ORDER BY e.updated_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/engagements
router.post('/', (req, res) => {
  try {
    const { name, entity_name, entity_type, assessor, start_date, notes } = req.body;
    if (!name || !entity_name) return res.status(400).json({ error: 'name and entity_name are required' });
    const id = uuidv4();
    db.prepare(`
      INSERT INTO engagements (id, name, entity_name, entity_type, assessor, start_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, entity_name, entity_type || 'bank', assessor || null, start_date || null, notes || null);
    res.status(201).json(db.prepare('SELECT * FROM engagements WHERE id = ?').get(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/engagements/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM engagements WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/engagements/:id
router.patch('/:id', (req, res) => {
  try {
    const fields = ['name', 'entity_name', 'entity_type', 'assessor', 'start_date', 'status', 'notes'];
    const updates = fields.filter(f => req.body[f] !== undefined);
    if (!updates.length) return res.status(400).json({ error: 'No valid fields provided' });
    const sets = updates.map(f => `${f} = ?`).join(', ');
    const vals = updates.map(f => req.body[f]);
    db.prepare(`UPDATE engagements SET ${sets} WHERE id = ?`).run(...vals, req.params.id);
    res.json(db.prepare('SELECT * FROM engagements WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/engagements/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM engagements WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Assessments ──────────────────────────────────────────────────────────────

// GET /api/engagements/:id/assessments
router.get('/:id/assessments', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM assessments WHERE engagement_id = ? ORDER BY baseline, domain_id, subdomain_id').all(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/engagements/:id/assessments/:subdomainId  (upsert)
router.put('/:id/assessments/:subdomainId', (req, res) => {
  try {
    const { baseline, domain_id, maturity_level, compliance_pct, status, evidence, notes, assessed_by } = req.body;
    const existing = db.prepare('SELECT id FROM assessments WHERE engagement_id = ? AND subdomain_id = ?')
      .get(req.params.id, req.params.subdomainId);

    if (existing) {
      db.prepare(`
        UPDATE assessments SET
          maturity_level = ?, compliance_pct = ?, status = ?,
          evidence = ?, notes = ?, assessed_by = ?, assessed_at = datetime('now')
        WHERE id = ?
      `).run(maturity_level ?? 0, compliance_pct ?? 0, status ?? 'applicable',
             evidence ?? null, notes ?? null, assessed_by ?? null, existing.id);
      res.json(db.prepare('SELECT * FROM assessments WHERE id = ?').get(existing.id));
    } else {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO assessments (id, engagement_id, baseline, domain_id, subdomain_id, maturity_level, compliance_pct, status, evidence, notes, assessed_by, assessed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(id, req.params.id, baseline, domain_id, req.params.subdomainId,
             maturity_level ?? 0, compliance_pct ?? 0, status ?? 'applicable',
             evidence ?? null, notes ?? null, assessed_by ?? null);
      res.status(201).json(db.prepare('SELECT * FROM assessments WHERE id = ?').get(id));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/engagements/:id/assessments/bulk  (bulk upsert)
router.post('/:id/assessments/bulk', (req, res) => {
  try {
    const { items } = req.body; // array of assessment items
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });

    const upsert = db.transaction(() => {
      for (const item of items) {
        const existing = db.prepare('SELECT id FROM assessments WHERE engagement_id = ? AND subdomain_id = ?')
          .get(req.params.id, item.subdomain_id);
        if (existing) {
          db.prepare(`
            UPDATE assessments SET maturity_level = ?, compliance_pct = ?, status = ?,
              evidence = ?, notes = ?, assessed_by = ?, assessed_at = datetime('now')
            WHERE id = ?
          `).run(item.maturity_level ?? 0, item.compliance_pct ?? 0, item.status ?? 'applicable',
                 item.evidence ?? null, item.notes ?? null, item.assessed_by ?? null, existing.id);
        } else {
          db.prepare(`
            INSERT INTO assessments (id, engagement_id, baseline, domain_id, subdomain_id, maturity_level, compliance_pct, status, evidence, notes, assessed_by, assessed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(uuidv4(), req.params.id, item.baseline, item.domain_id, item.subdomain_id,
                 item.maturity_level ?? 0, item.compliance_pct ?? 0, item.status ?? 'applicable',
                 item.evidence ?? null, item.notes ?? null, item.assessed_by ?? null);
        }
      }
    });
    upsert();
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/engagements/:id/summary  (computed metrics)
router.get('/:id/summary', (req, res) => {
  try {
    const assessments = db.prepare('SELECT * FROM assessments WHERE engagement_id = ?').all(req.params.id);
    const applicable = assessments.filter(a => a.status === 'applicable');
    const assessed = applicable.filter(a => a.maturity_level > 0);

    const avgMaturity = assessed.length
      ? assessed.reduce((s, a) => s + a.maturity_level, 0) / assessed.length : 0;
    const avgCompliance = applicable.length
      ? applicable.reduce((s, a) => s + a.compliance_pct, 0) / applicable.length : 0;

    const byBaseline = {};
    for (const b of ['cyber', 'or', 'tprm']) {
      const bItems = applicable.filter(a => a.baseline === b);
      const bAssessed = bItems.filter(a => a.maturity_level > 0);
      byBaseline[b] = {
        total: bItems.length,
        assessed: bAssessed.length,
        avgMaturity: bAssessed.length ? bAssessed.reduce((s, a) => s + a.maturity_level, 0) / bAssessed.length : 0,
        avgCompliance: bItems.length ? bItems.reduce((s, a) => s + a.compliance_pct, 0) / bItems.length : 0,
      };
    }

    const gaps = db.prepare(`SELECT COUNT(*) as cnt FROM remediation WHERE engagement_id = ? AND status != 'accepted_risk'`).get(req.params.id);
    const resolvedGaps = db.prepare(`SELECT COUNT(*) as cnt FROM remediation WHERE engagement_id = ? AND status = 'completed'`).get(req.params.id);

    res.json({
      totalAssessments: applicable.length,
      assessed: assessed.length,
      avgMaturity: parseFloat(avgMaturity.toFixed(2)),
      avgCompliance: parseFloat(avgCompliance.toFixed(1)),
      byBaseline,
      gaps: gaps.cnt,
      resolvedGaps: resolvedGaps.cnt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
