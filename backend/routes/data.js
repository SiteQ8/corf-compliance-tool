const express = require('express');
const router = express.Router({ mergeParams: true }); // inherits :engagementId
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

// ── Statement of Applicability ───────────────────────────────────────────────

// GET /api/engagements/:engagementId/soa
router.get('/soa', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM soa WHERE engagement_id = ? ORDER BY baseline, ref_id').all(req.params.engagementId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/engagements/:engagementId/soa/:refId
router.put('/soa/:refId', (req, res) => {
  try {
    const { ref_level, baseline, applicable, justification, approved_by } = req.body;
    const existing = db.prepare('SELECT id FROM soa WHERE engagement_id = ? AND ref_id = ?')
      .get(req.params.engagementId, req.params.refId);

    if (existing) {
      db.prepare(`
        UPDATE soa SET applicable = ?, justification = ?, approved_by = ?,
          approved_at = CASE WHEN ? = 1 THEN NULL ELSE datetime('now') END
        WHERE id = ?
      `).run(applicable ? 1 : 0, justification ?? null, approved_by ?? null, applicable ? 1 : 0, existing.id);
      res.json(db.prepare('SELECT * FROM soa WHERE id = ?').get(existing.id));
    } else {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO soa (id, engagement_id, ref_id, ref_level, baseline, applicable, justification, approved_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, req.params.engagementId, req.params.refId, ref_level, baseline,
             applicable ? 1 : 0, justification ?? null, approved_by ?? null);
      res.status(201).json(db.prepare('SELECT * FROM soa WHERE id = ?').get(id));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/engagements/:engagementId/soa/bulk
router.post('/soa/bulk', (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });

    const bulk = db.transaction(() => {
      for (const item of items) {
        const existing = db.prepare('SELECT id FROM soa WHERE engagement_id = ? AND ref_id = ?')
          .get(req.params.engagementId, item.ref_id);
        if (existing) {
          db.prepare(`UPDATE soa SET applicable = ?, justification = ? WHERE id = ?`)
            .run(item.applicable ? 1 : 0, item.justification ?? null, existing.id);
        } else {
          db.prepare(`INSERT INTO soa (id, engagement_id, ref_id, ref_level, baseline, applicable, justification) VALUES (?,?,?,?,?,?,?)`)
            .run(uuidv4(), req.params.engagementId, item.ref_id, item.ref_level, item.baseline,
                 item.applicable ? 1 : 0, item.justification ?? null);
        }
      }
    });
    bulk();
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Risk Profile ─────────────────────────────────────────────────────────────

// GET /api/engagements/:engagementId/risk-profile
router.get('/risk-profile', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM risk_profiles WHERE engagement_id = ?').get(req.params.engagementId);
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/engagements/:engagementId/risk-profile
router.put('/risk-profile', (req, res) => {
  try {
    const {
      total_assets, market_share, branches, customers, services_breadth,
      is_fmi, cloud_adoption, ai_ml_usage, third_party_deps,
      cyber_history, cyber_workforce, notes
    } = req.body;

    // Calculate tier score
    let score = 0;
    if (total_assets > 5000) score += 3; else if (total_assets > 1000) score += 2; else if (total_assets > 0) score += 1;
    if (market_share > 15) score += 3; else if (market_share > 5) score += 2; else if (market_share > 0) score += 1;
    if (is_fmi) score += 3;
    if (cloud_adoption === 'high') score += 2; else if (cloud_adoption === 'medium') score += 1;
    if (ai_ml_usage === 'extensive') score += 2; else if (ai_ml_usage === 'moderate') score += 1;
    if (third_party_deps === 'high') score += 2; else if (third_party_deps === 'medium') score += 1;
    if (cyber_history === 'incidents') score += 3; else if (cyber_history === 'material_findings') score += 2; else if (cyber_history === 'minor_findings') score += 1;
    if (customers > 1000) score += 2; else if (customers > 100) score += 1;
    const tier = score >= 12 ? 1 : score >= 6 ? 2 : 3;

    const existing = db.prepare('SELECT id FROM risk_profiles WHERE engagement_id = ?').get(req.params.engagementId);
    if (existing) {
      db.prepare(`
        UPDATE risk_profiles SET total_assets=?, market_share=?, branches=?, customers=?, services_breadth=?,
          is_fmi=?, cloud_adoption=?, ai_ml_usage=?, third_party_deps=?, cyber_history=?,
          cyber_workforce=?, calculated_tier=?, notes=?
        WHERE engagement_id = ?
      `).run(total_assets, market_share, branches, customers, services_breadth,
             is_fmi ? 1 : 0, cloud_adoption, ai_ml_usage, third_party_deps,
             cyber_history, cyber_workforce, tier, notes, req.params.engagementId);
    } else {
      db.prepare(`
        INSERT INTO risk_profiles (id, engagement_id, total_assets, market_share, branches, customers, services_breadth,
          is_fmi, cloud_adoption, ai_ml_usage, third_party_deps, cyber_history, cyber_workforce, calculated_tier, notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(uuidv4(), req.params.engagementId, total_assets, market_share, branches, customers, services_breadth,
             is_fmi ? 1 : 0, cloud_adoption, ai_ml_usage, third_party_deps,
             cyber_history, cyber_workforce, tier, notes);
    }
    res.json(db.prepare('SELECT * FROM risk_profiles WHERE engagement_id = ?').get(req.params.engagementId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Remediation ──────────────────────────────────────────────────────────────

// GET /api/engagements/:engagementId/remediation
router.get('/remediation', (req, res) => {
  try {
    const { status, priority, baseline } = req.query;
    let query = 'SELECT * FROM remediation WHERE engagement_id = ?';
    const params = [req.params.engagementId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (priority) { query += ' AND priority = ?'; params.push(priority); }
    if (baseline) { query += ' AND baseline = ?'; params.push(baseline); }
    query += ' ORDER BY CASE priority WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, target_date';
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/engagements/:engagementId/remediation
router.post('/remediation', (req, res) => {
  try {
    const {
      subdomain_id, subdomain_name, baseline, domain_id, domain_name,
      gap_description, priority, owner, target_date, status,
      current_maturity, target_maturity, current_compliance, target_compliance,
      actions, notes
    } = req.body;
    if (!subdomain_id || !gap_description) return res.status(400).json({ error: 'subdomain_id and gap_description are required' });
    const id = uuidv4();
    db.prepare(`
      INSERT INTO remediation (id, engagement_id, subdomain_id, subdomain_name, baseline, domain_id, domain_name,
        gap_description, priority, owner, target_date, status, current_maturity, target_maturity,
        current_compliance, target_compliance, actions, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(id, req.params.engagementId, subdomain_id, subdomain_name, baseline, domain_id, domain_name,
           gap_description, priority ?? 'medium', owner ?? null, target_date ?? null, status ?? 'open',
           current_maturity ?? 0, target_maturity ?? 3, current_compliance ?? 0, target_compliance ?? 100,
           actions ? JSON.stringify(actions) : null, notes ?? null);
    res.status(201).json(db.prepare('SELECT * FROM remediation WHERE id = ?').get(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/engagements/:engagementId/remediation/:remId
router.patch('/remediation/:remId', (req, res) => {
  try {
    const allowed = ['gap_description', 'priority', 'owner', 'target_date', 'status',
                     'current_maturity', 'target_maturity', 'current_compliance', 'target_compliance', 'actions', 'notes'];
    const updates = allowed.filter(f => req.body[f] !== undefined);
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    const sets = updates.map(f => `${f} = ?`).join(', ');
    const vals = updates.map(f => f === 'actions' ? JSON.stringify(req.body[f]) : req.body[f]);
    db.prepare(`UPDATE remediation SET ${sets} WHERE id = ? AND engagement_id = ?`)
      .run(...vals, req.params.remId, req.params.engagementId);
    res.json(db.prepare('SELECT * FROM remediation WHERE id = ?').get(req.params.remId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/engagements/:engagementId/remediation/:remId
router.delete('/remediation/:remId', (req, res) => {
  try {
    db.prepare('DELETE FROM remediation WHERE id = ? AND engagement_id = ?').run(req.params.remId, req.params.engagementId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
