// ── Statement of Applicability ─────────────────────────────────────────────
import { useState, useEffect } from 'react';
import * as api from '../api/client';
import { useToast } from '../App';

const BASELINES_META = [
  { key: 'cyber', label: 'Cyber Resilience Baselines',      color: '#3b82f6' },
  { key: 'or',    label: 'Operational Resilience Baselines', color: '#22c55e' },
  { key: 'tprm',  label: 'TPRM Baselines',                   color: '#8b5cf6' },
];

export function SoABuilder({ engagement }) {
  const toast = useToast();
  const [domains, setDomains] = useState({});
  const [soaMap, setSoaMap] = useState({});
  const [justifications, setJustifications] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'na' | 'applicable'

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCorfData(), api.getSoa(engagement.id)])
      .then(([corfData, soaItems]) => {
        setDomains({ cyber: corfData.CYBER_DOMAINS, or: corfData.OR_DOMAINS, tprm: corfData.TPRM_DOMAINS });
        const m = {};
        const j = {};
        for (const s of soaItems) {
          m[s.ref_id] = s.applicable === 0 ? false : true;
          if (s.justification) j[s.ref_id] = s.justification;
        }
        setSoaMap(m);
        setJustifications(j);
      })
      .catch(() => toast('Failed to load SoA data', 'error'))
      .finally(() => setLoading(false));
  }, [engagement.id]);

  const getApplicable = (id) => soaMap[id] !== false;

  const toggle = async (id, level, baseline) => {
    const newVal = !getApplicable(id);
    setSoaMap(p => ({ ...p, [id]: newVal }));
    try {
      await api.upsertSoa(engagement.id, id, { ref_level: level, baseline, applicable: newVal, justification: justifications[id] || null });
    } catch { toast('Failed to save SoA', 'error'); }
  };

  const updateJustification = async (id, val) => {
    setJustifications(p => ({ ...p, [id]: val }));
    setTimeout(async () => {
      try { await api.upsertSoa(engagement.id, id, { ref_level: 'subdomain', applicable: getApplicable(id), justification: val }); }
      catch {}
    }, 800);
  };

  const exportSoA = async () => {
    setSaving(true);
    const items = [];
    for (const [bKey, domList] of Object.entries(domains)) {
      for (const domain of domList) {
        items.push({ ref_id: domain.id, ref_level: 'domain', baseline: bKey, applicable: getApplicable(domain.id), justification: justifications[domain.id] || null });
        for (const sub of domain.subdomains.filter(s => !s.linked)) {
          items.push({ ref_id: sub.id, ref_level: 'subdomain', baseline: bKey, applicable: getApplicable(sub.id), justification: justifications[sub.id] || null });
        }
      }
    }
    try {
      await api.bulkUpsertSoa(engagement.id, items);
      toast('SoA saved successfully', 'success');
    } catch { toast('Failed to save SoA', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="empty-state"><div className="spinner" style={{ fontSize: 32 }}>◌</div></div>;

  const naCount = Object.values(soaMap).filter(v => v === false).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-heading">Statement of Applicability</h1>
          <p className="section-sub">Formal declaration of applicable CORF domains. Submit to CBK before any assessment.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-red">{naCount} marked N/A</span>
          <button className="btn btn-secondary" onClick={() => setFilter(f => f === 'na' ? 'all' : 'na')}>
            {filter === 'na' ? 'Show All' : 'Show N/A Only'}
          </button>
          <button className="btn btn-primary" onClick={exportSoA} disabled={saving}>{saving ? '⏳' : '💾'} Save SoA</button>
        </div>
      </div>

      <div className="warning-box" style={{ marginBottom: 20 }}>
        <strong>⚠️ CBK Regulatory Note:</strong> Exclusions must be formally justified. Acceptable grounds: entity does not offer relevant services; function implemented centrally at group level; legal constraints prevent local implementation. CBK reserves the right to reject insufficiently substantiated exclusions.
      </div>

      {BASELINES_META.map(bm => {
        const domList = domains[bm.key] || [];
        return (
          <div key={bm.key} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 4, height: 20, background: bm.color, borderRadius: 2 }} />
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: 'var(--text-primary)' }}>{bm.label}</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Ref ID</th>
                    <th>Domain / Sub-domain</th>
                    <th style={{ width: 150 }}>Applicability</th>
                    <th style={{ width: 300 }}>Justification (if N/A)</th>
                  </tr>
                </thead>
                <tbody>
                  {domList.map(domain => {
                    const domApplicable = getApplicable(domain.id);
                    const subRows = domain.subdomains.filter(s => !s.linked);
                    if (filter === 'na' && domApplicable && subRows.every(s => getApplicable(s.id))) return null;
                    return (
                      <>
                        <tr key={domain.id} style={{ background: 'var(--surface-2)' }}>
                          <td><span className="mono" style={{ fontSize: 11, color: 'var(--gold-400)' }}>{domain.id}</span></td>
                          <td><strong style={{ color: 'var(--text-primary)' }}>{domain.icon} {domain.name}</strong></td>
                          <td>
                            <button
                              style={{
                                padding: '4px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                                fontFamily: 'IBM Plex Mono', fontWeight: 600, border: '1px solid', transition: 'all 0.15s',
                                background: domApplicable ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                borderColor: domApplicable ? '#22c55e' : '#ef4444',
                                color: domApplicable ? '#22c55e' : '#ef4444',
                              }}
                              onClick={() => toggle(domain.id, 'domain', bm.key)}
                            >{domApplicable ? '✓ Applicable' : '✗ Not Applicable'}</button>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {!domApplicable && (
                              <input className="form-input" style={{ fontSize: 11, padding: '5px 8px' }}
                                value={justifications[domain.id] || ''}
                                onChange={e => updateJustification(domain.id, e.target.value)}
                                placeholder="Provide justification..." />
                            )}
                          </td>
                        </tr>
                        {subRows.map(sub => {
                          const subApplicable = getApplicable(sub.id);
                          if (filter === 'na' && subApplicable) return null;
                          return (
                            <tr key={sub.id}>
                              <td><span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub.id}</span></td>
                              <td style={{ paddingLeft: 28, color: 'var(--text-muted)', fontSize: 13 }}>↳ {sub.name}</td>
                              <td>
                                <button
                                  style={{
                                    padding: '3px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                                    fontFamily: 'IBM Plex Mono', border: '1px solid', transition: 'all 0.15s',
                                    background: subApplicable ? 'transparent' : 'rgba(239,68,68,0.08)',
                                    borderColor: subApplicable ? 'var(--border)' : '#ef4444',
                                    color: subApplicable ? 'var(--text-muted)' : '#ef4444',
                                  }}
                                  onClick={() => toggle(sub.id, 'subdomain', bm.key)}
                                >{subApplicable ? '✓' : '✗ N/A'}</button>
                              </td>
                              <td>
                                {!subApplicable && (
                                  <input className="form-input" style={{ fontSize: 11, padding: '5px 8px' }}
                                    value={justifications[sub.id] || ''}
                                    onChange={e => updateJustification(sub.id, e.target.value)}
                                    placeholder="Required justification..." />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
