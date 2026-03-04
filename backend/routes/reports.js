const express = require('express');
const router = express.Router({ mergeParams: true });
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const db = require('../db/database');
const { CYBER_DOMAINS, OR_DOMAINS, TPRM_DOMAINS, MATURITY_LEVELS } = require('../data/corf-domains');

const MATURITY_LABELS = ['Not Assessed', 'Initial', 'Ad-hoc', 'Baseline', 'Advanced', 'Innovative'];
const ALL_DOMAINS = [
  ...CYBER_DOMAINS.map(d => ({ ...d, baseline: 'cyber' })),
  ...OR_DOMAINS.map(d => ({ ...d, baseline: 'or' })),
  ...TPRM_DOMAINS.map(d => ({ ...d, baseline: 'tprm' })),
];

// ─── PDF REPORT ──────────────────────────────────────────────────────────────
router.get('/pdf', async (req, res) => {
  try {
    const engagement = db.prepare('SELECT * FROM engagements WHERE id = ?').get(req.params.engagementId);
    if (!engagement) return res.status(404).json({ error: 'Engagement not found' });

    const assessments = db.prepare('SELECT * FROM assessments WHERE engagement_id = ?').all(req.params.engagementId);
    const remItems = db.prepare('SELECT * FROM remediation WHERE engagement_id = ? ORDER BY priority').all(req.params.engagementId);
    const profile = db.prepare('SELECT * FROM risk_profiles WHERE engagement_id = ?').get(req.params.engagementId);
    const aMap = Object.fromEntries(assessments.map(a => [a.subdomain_id, a]));

    // Build stats
    const applicable = assessments.filter(a => a.status === 'applicable');
    const assessed = applicable.filter(a => a.maturity_level > 0);
    const avgMaturity = assessed.length ? assessed.reduce((s, a) => s + a.maturity_level, 0) / assessed.length : 0;
    const avgCompliance = applicable.length ? applicable.reduce((s, a) => s + a.compliance_pct, 0) / applicable.length : 0;

    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `CORF Assessment Report — ${engagement.entity_name}` } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CORF-Report-${engagement.entity_name.replace(/\s+/g, '-')}.pdf"`);
    doc.pipe(res);

    const NAVY = '#0a1f3c';
    const GOLD = '#c8a84b';
    const LIGHT = '#f5f5f0';

    // Cover page
    doc.rect(0, 0, doc.page.width, 200).fill(NAVY);
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(28).text('CORF Assessment Report', 50, 60);
    doc.fillColor('#ffffff').fontSize(14).text(engagement.entity_name, 50, 100);
    doc.fillColor('#aabbcc').fontSize(11)
      .text(`Engagement: ${engagement.name}`, 50, 125)
      .text(`Assessor: ${engagement.assessor || 'N/A'}`, 50, 142)
      .text(`Report Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, 159);

    doc.fillColor(NAVY).fontSize(9).text('CBK Cyber & Operational Resilience Framework v1.0 — Dec 2025', 50, 185);

    doc.moveDown(8);

    // Executive summary
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(16).text('Executive Summary', { underline: false });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('#333333');

    const summaryData = [
      ['Overall Maturity Level', `${avgMaturity.toFixed(2)} / 5 (${MATURITY_LABELS[Math.round(avgMaturity)] || 'N/A'})`],
      ['Average Compliance', `${avgCompliance.toFixed(1)}%`],
      ['Sub-domains Assessed', `${assessed.length} of ${applicable.length} applicable`],
      ['Supervisory Tier', profile?.calculated_tier ? `Tier ${profile.calculated_tier}` : 'Not Profiled'],
      ['Open Remediation Items', `${remItems.filter(r => r.status !== 'completed').length}`],
      ['Critical / High Gaps', `${remItems.filter(r => r.priority === 'critical' || r.priority === 'high').length}`],
    ];

    let tableY = doc.y;
    summaryData.forEach(([label, value], i) => {
      doc.rect(50, tableY, 240, 22).fill(i % 2 === 0 ? '#f0f4f8' : '#ffffff');
      doc.rect(290, tableY, 255, 22).fill(i % 2 === 0 ? '#f0f4f8' : '#ffffff');
      doc.fillColor('#555555').text(label, 58, tableY + 6, { width: 225 });
      doc.fillColor(NAVY).font('Helvetica-Bold').text(value, 298, tableY + 6, { width: 240 });
      doc.font('Helvetica');
      tableY += 22;
    });

    doc.moveDown(2);

    // Domain overview table
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(14).text('Domain Assessment Overview');
    doc.moveDown(0.5);

    const headers = ['Domain', 'Baseline', 'Avg Maturity', 'Avg Compliance', 'N/A Count'];
    const colWidths = [200, 70, 80, 90, 55];
    let hx = 50;
    doc.rect(50, doc.y, 495, 20).fill(NAVY);
    headers.forEach((h, i) => {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(h, hx + 4, doc.y - 16, { width: colWidths[i] - 4 });
      hx += colWidths[i];
    });
    doc.moveDown(0.2);

    let rowIdx = 0;
    for (const domain of ALL_DOMAINS) {
      const subApplicable = domain.subdomains.filter(s => !s.linked && (aMap[s.id]?.status !== 'na'));
      const subAssessed = subApplicable.filter(s => (aMap[s.id]?.maturity_level || 0) > 0);
      const naCount = domain.subdomains.filter(s => !s.linked && aMap[s.id]?.status === 'na').length;
      const dAvgM = subAssessed.length ? subAssessed.reduce((acc, s) => acc + (aMap[s.id]?.maturity_level || 0), 0) / subAssessed.length : 0;
      const dAvgC = subApplicable.length ? subApplicable.reduce((acc, s) => acc + (aMap[s.id]?.compliance_pct || 0), 0) / subApplicable.length : 0;

      const rowY = doc.y;
      doc.rect(50, rowY, 495, 20).fill(rowIdx % 2 === 0 ? '#f8fafc' : '#ffffff');
      let cx = 50;
      const rowData = [
        `${domain.icon} ${domain.name}`,
        domain.baseline.toUpperCase(),
        dAvgM > 0 ? `L${dAvgM.toFixed(1)} ${MATURITY_LABELS[Math.round(dAvgM)]}` : 'Not Assessed',
        `${dAvgC.toFixed(1)}%`,
        `${naCount}`,
      ];
      rowData.forEach((val, i) => {
        doc.fillColor('#333333').font('Helvetica').fontSize(8).text(val, cx + 4, rowY + 6, { width: colWidths[i] - 4 });
        cx += colWidths[i];
      });
      doc.moveDown(0.2);
      rowIdx++;

      if (doc.y > doc.page.height - 100) doc.addPage();
    }

    // Remediation table
    if (remItems.length > 0) {
      doc.addPage();
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(14).text('Remediation Plan');
      doc.moveDown(0.5);

      const PRIORITY_COLORS = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#16a34a' };

      for (const item of remItems) {
        if (doc.y > doc.page.height - 130) doc.addPage();
        const startY = doc.y;
        doc.rect(50, startY, 495, 14).fill(NAVY);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8)
          .text(`${item.subdomain_id} — ${item.subdomain_name}`, 58, startY + 3)
          .text(`[${(item.priority || 'medium').toUpperCase()}]`, 450, startY + 3);
        doc.moveDown(0.1);
        doc.fillColor('#333333').font('Helvetica').fontSize(8)
          .text(`Gap: ${item.gap_description}`, 58, doc.y, { width: 435 });
        const detailY = doc.y;
        doc.text(`Owner: ${item.owner || '—'}  |  Target: ${item.target_date || '—'}  |  Status: ${item.status}`, 58, detailY + 4, { width: 435 });
        doc.text(`Maturity: L${item.current_maturity} → L${item.target_maturity}  |  Compliance: ${item.current_compliance}% → ${item.target_compliance}%`, 58, doc.y + 4);
        doc.rect(50, startY, 495, doc.y - startY + 8).stroke('#dddddd');
        doc.moveDown(0.8);
      }
    }

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ─── EXCEL REPORT ─────────────────────────────────────────────────────────────
router.get('/excel', async (req, res) => {
  try {
    const engagement = db.prepare('SELECT * FROM engagements WHERE id = ?').get(req.params.engagementId);
    if (!engagement) return res.status(404).json({ error: 'Engagement not found' });

    const assessments = db.prepare('SELECT * FROM assessments WHERE engagement_id = ?').all(req.params.engagementId);
    const remItems = db.prepare('SELECT * FROM remediation WHERE engagement_id = ? ORDER BY priority').all(req.params.engagementId);
    const soaItems = db.prepare('SELECT * FROM soa WHERE engagement_id = ?').all(req.params.engagementId);
    const profile = db.prepare('SELECT * FROM risk_profiles WHERE engagement_id = ?').get(req.params.engagementId);
    const aMap = Object.fromEntries(assessments.map(a => [a.subdomain_id, a]));
    const soaMap = Object.fromEntries(soaItems.map(s => [s.ref_id, s]));

    const wb = new ExcelJS.Workbook();
    wb.creator = 'CORF Compliance Tool';
    wb.created = new Date();

    const NAVY = { argb: 'FF0A1F3C' };
    const GOLD = { argb: 'FFC8A84B' };
    const WHITE = { argb: 'FFFFFFFF' };
    const LIGHT_BLUE = { argb: 'FFE8F0FA' };
    const GREEN = { argb: 'FF22c55e' };
    const YELLOW = { argb: 'FFEAB308' };
    const RED = { argb: 'FFEF4444' };
    const ORANGE = { argb: 'FFF97316' };

    const headerStyle = (ws, row, cols) => {
      for (let c = 1; c <= cols; c++) {
        const cell = row.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: NAVY };
        cell.font = { bold: true, color: WHITE, size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FFC8A84B' } } };
      }
    };

    // ── Sheet 1: Dashboard ──────────────────────────────────────────────────
    const wsDash = wb.addWorksheet('Dashboard', { properties: { tabColor: { argb: 'FFC8A84B' } } });
    wsDash.columns = [{ width: 35 }, { width: 25 }, { width: 20 }, { width: 20 }, { width: 20 }];

    const titleRow = wsDash.addRow(['CBK CORF Compliance Report — ' + engagement.entity_name]);
    titleRow.getCell(1).font = { bold: true, size: 14, color: GOLD };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: NAVY };
    wsDash.mergeCells('A1:E1');
    wsDash.addRow(['Engagement', engagement.name, '', 'Assessor', engagement.assessor || 'N/A']);
    wsDash.addRow(['Entity Type', engagement.entity_type, '', 'Status', engagement.status]);
    wsDash.addRow(['Generated', new Date().toISOString().split('T')[0], '', 'CORF Version', '1.0 — Dec 2025']);
    wsDash.addRow([]);

    const applicable = assessments.filter(a => a.status === 'applicable');
    const assessed = applicable.filter(a => a.maturity_level > 0);
    const avgMaturity = assessed.length ? assessed.reduce((s, a) => s + a.maturity_level, 0) / assessed.length : 0;
    const avgCompliance = applicable.length ? applicable.reduce((s, a) => s + a.compliance_pct, 0) / applicable.length : 0;

    const summRow = wsDash.addRow(['METRIC', 'VALUE', '', 'METRIC', 'VALUE']);
    headerStyle(wsDash, summRow, 5);

    const summData = [
      ['Overall Maturity', `${avgMaturity.toFixed(2)} / 5`],
      ['Average Compliance', `${avgCompliance.toFixed(1)}%`],
      ['Sub-domains Assessed', `${assessed.length} / ${applicable.length}`],
      ['Supervisory Tier', profile?.calculated_tier ? `Tier ${profile.calculated_tier}` : 'Not Profiled'],
      ['Open Gaps', `${remItems.filter(r => r.status !== 'completed').length}`],
      ['Critical Gaps', `${remItems.filter(r => r.priority === 'critical').length}`],
    ];
    for (let i = 0; i < summData.length; i += 2) {
      const row = wsDash.addRow([summData[i][0], summData[i][1], '', summData[i + 1]?.[0] || '', summData[i + 1]?.[1] || '']);
      row.getCell(1).font = { bold: true };
      row.getCell(4).font = { bold: true };
    }

    // ── Sheet 2: Assessment Results ─────────────────────────────────────────
    const wsAssess = wb.addWorksheet('Assessment Results', { properties: { tabColor: { argb: 'FF3B82F6' } } });
    wsAssess.columns = [
      { header: 'Baseline', key: 'baseline', width: 12 },
      { header: 'Domain ID', key: 'domain_id', width: 10 },
      { header: 'Domain Name', key: 'domain_name', width: 32 },
      { header: 'Sub-domain ID', key: 'subdomain_id', width: 14 },
      { header: 'Sub-domain Name', key: 'subdomain_name', width: 48 },
      { header: 'Controls', key: 'controls', width: 10 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Maturity Level', key: 'maturity_level', width: 14 },
      { header: 'Maturity Label', key: 'maturity_label', width: 16 },
      { header: 'Compliance %', key: 'compliance_pct', width: 14 },
      { header: 'Evidence', key: 'evidence', width: 30 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Assessed By', key: 'assessed_by', width: 16 },
      { header: 'Assessed At', key: 'assessed_at', width: 16 },
    ];
    headerStyle(wsAssess, wsAssess.getRow(1), 14);

    for (const domain of ALL_DOMAINS) {
      for (const sub of domain.subdomains.filter(s => !s.linked)) {
        const a = aMap[sub.id];
        const row = wsAssess.addRow({
          baseline: domain.baseline.toUpperCase(),
          domain_id: domain.id,
          domain_name: domain.name,
          subdomain_id: sub.id,
          subdomain_name: sub.name,
          controls: sub.controls,
          status: a?.status || 'not_assessed',
          maturity_level: a?.maturity_level || 0,
          maturity_label: MATURITY_LABELS[a?.maturity_level || 0],
          compliance_pct: a?.compliance_pct || 0,
          evidence: a?.evidence || '',
          notes: a?.notes || '',
          assessed_by: a?.assessed_by || '',
          assessed_at: a?.assessed_at || '',
        });
        // Color code by maturity
        const ml = a?.maturity_level || 0;
        const mColors = [null, 'FFEF4444', 'FFF97316', 'FFEAB308', 'FF22C55E', 'FF3B82F6'];
        if (mColors[ml]) {
          row.getCell('maturity_level').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: mColors[ml] } };
          row.getCell('maturity_level').font = { color: WHITE, bold: true };
          row.getCell('maturity_label').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: mColors[ml] } };
          row.getCell('maturity_label').font = { color: WHITE };
        }
        if (a?.status === 'na') row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }; });
      }
    }
    wsAssess.autoFilter = { from: 'A1', to: 'N1' };

    // ── Sheet 3: SoA ────────────────────────────────────────────────────────
    const wsSoa = wb.addWorksheet('Statement of Applicability', { properties: { tabColor: { argb: 'FF10B981' } } });
    wsSoa.columns = [
      { header: 'Baseline', key: 'baseline', width: 12 },
      { header: 'Ref ID', key: 'ref_id', width: 12 },
      { header: 'Level', key: 'ref_level', width: 12 },
      { header: 'Name', key: 'name', width: 50 },
      { header: 'Applicable', key: 'applicable', width: 14 },
      { header: 'Justification (if N/A)', key: 'justification', width: 50 },
      { header: 'Approved By', key: 'approved_by', width: 16 },
    ];
    headerStyle(wsSoa, wsSoa.getRow(1), 7);

    for (const domain of ALL_DOMAINS) {
      const ds = soaMap[domain.id];
      const dRow = wsSoa.addRow({
        baseline: domain.baseline.toUpperCase(), ref_id: domain.id, ref_level: 'Domain',
        name: `${domain.icon} ${domain.name}`, applicable: ds?.applicable === 0 ? 'Not Applicable' : 'Applicable',
        justification: ds?.justification || '', approved_by: ds?.approved_by || '',
      });
      dRow.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: LIGHT_BLUE }; c.font = { bold: true }; });
      if (ds?.applicable === 0) dRow.getCell('applicable').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };

      for (const sub of domain.subdomains.filter(s => !s.linked)) {
        const ss = soaMap[sub.id];
        const sRow = wsSoa.addRow({
          baseline: domain.baseline.toUpperCase(), ref_id: sub.id, ref_level: 'Sub-domain',
          name: `    ↳ ${sub.name}`, applicable: ss?.applicable === 0 ? 'Not Applicable' : 'Applicable',
          justification: ss?.justification || '', approved_by: ss?.approved_by || '',
        });
        if (ss?.applicable === 0) {
          sRow.getCell('applicable').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          sRow.getCell('justification').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
        }
      }
    }

    // ── Sheet 4: Remediation Plan ───────────────────────────────────────────
    const wsRem = wb.addWorksheet('Remediation Plan', { properties: { tabColor: { argb: 'FFEF4444' } } });
    wsRem.columns = [
      { header: 'Baseline', key: 'baseline', width: 10 },
      { header: 'Domain', key: 'domain_id', width: 10 },
      { header: 'Sub-domain', key: 'subdomain_id', width: 12 },
      { header: 'Sub-domain Name', key: 'subdomain_name', width: 40 },
      { header: 'Gap Description', key: 'gap_description', width: 50 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Owner', key: 'owner', width: 18 },
      { header: 'Target Date', key: 'target_date', width: 14 },
      { header: 'Current Maturity', key: 'current_maturity', width: 16 },
      { header: 'Target Maturity', key: 'target_maturity', width: 16 },
      { header: 'Current Compliance%', key: 'current_compliance', width: 20 },
      { header: 'Target Compliance%', key: 'target_compliance', width: 20 },
      { header: 'Actions', key: 'actions', width: 50 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    headerStyle(wsRem, wsRem.getRow(1), 15);

    const priorityColors = { critical: 'FFDC2626', high: 'FFEA580C', medium: 'FFD97706', low: 'FF16A34A' };

    for (const item of remItems) {
      let actions = '';
      try { actions = JSON.parse(item.actions || '[]').join('; '); } catch {}
      const row = wsRem.addRow({
        baseline: item.baseline.toUpperCase(), domain_id: item.domain_id, subdomain_id: item.subdomain_id,
        subdomain_name: item.subdomain_name, gap_description: item.gap_description,
        priority: (item.priority || 'medium').toUpperCase(), status: item.status,
        owner: item.owner || '', target_date: item.target_date || '',
        current_maturity: item.current_maturity, target_maturity: item.target_maturity,
        current_compliance: item.current_compliance, target_compliance: item.target_compliance,
        actions, notes: item.notes || '',
      });
      const pColor = priorityColors[item.priority] || 'FFD97706';
      row.getCell('priority').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pColor } };
      row.getCell('priority').font = { color: WHITE, bold: true };
      if (item.status === 'completed') row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: GREEN };
    }
    wsRem.autoFilter = { from: 'A1', to: 'O1' };

    // ── Sheet 5: Risk Profile ───────────────────────────────────────────────
    const wsRisk = wb.addWorksheet('Risk Profile & Tier', { properties: { tabColor: { argb: 'FFC8A84B' } } });
    wsRisk.columns = [{ width: 35 }, { width: 30 }];
    wsRisk.addRow(['INHERENT RISK PROFILE', '']).getCell(1).font = { bold: true, size: 13, color: GOLD };
    wsRisk.addRow([]);
    const riskFields = [
      ['Total Assets (KWD M)', profile?.total_assets],
      ['Market Share (%)', profile?.market_share],
      ['Branches / Channels', profile?.branches],
      ['Customer Base (thousands)', profile?.customers],
      ['Services Breadth', profile?.services_breadth],
      ['Designated FMI Operator', profile?.is_fmi ? 'Yes' : 'No'],
      ['Cloud Adoption Level', profile?.cloud_adoption],
      ['AI/ML Usage', profile?.ai_ml_usage],
      ['Third-Party Dependencies', profile?.third_party_deps],
      ['Regulatory/Audit History', profile?.cyber_history],
      ['Dedicated Cyber Workforce (FTEs)', profile?.cyber_workforce],
      ['', ''],
      ['CALCULATED SUPERVISORY TIER', profile?.calculated_tier ? `TIER ${profile.calculated_tier}` : 'Not Calculated'],
    ];
    for (const [label, val] of riskFields) {
      const row = wsRisk.addRow([label, val ?? '']);
      row.getCell(1).font = { bold: true };
      if (label === 'CALCULATED SUPERVISORY TIER') {
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: NAVY };
        row.getCell(1).font = { bold: true, color: WHITE };
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: GOLD };
        row.getCell(2).font = { bold: true, size: 14 };
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="CORF-Report-${engagement.entity_name.replace(/\s+/g, '-')}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

module.exports = router;
