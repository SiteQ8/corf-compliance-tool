import { useState, useEffect, useMemo } from 'react';
import * as api from '../api/client';
import { useToast } from '../App';

const TIER_INFO = {
  1: {
    label: 'Tier 1 — High-Impact',
    color: '#ef4444',
    freq: 'Annual CORF Assessment by CBK',
    desc: 'Systemically significant entities — major domestic banks (D-SIBs), large foreign bank branches, and Financial Market Infrastructures (FMIs) operating national payment, clearing, or settlement systems. Subject to frequent and detailed CBK oversight.',
    examples: 'Large Kuwaiti banks (D-SIBs), KNET, CBK-designated FMIs',
  },
  2: {
    label: 'Tier 2 — Medium-Impact',
    color: '#f97316',
    freq: 'CORF Assessment every 18 months',
    desc: 'Mid-sized entities with moderate systemic relevance, substantial market presence, and operational complexity. Subject to additional supervisory touchpoints and thematic reviews as needed.',
    examples: 'Mid-sized banks, some foreign bank branches, larger exchange companies',
  },
  3: {
    label: 'Tier 3 — Low-Impact',
    color: '#22c55e',
    freq: 'CORF Assessment every 2 years',
    desc: 'Entities with limited market share, small customer base, narrow service offerings, and lower cyber risk exposure. Unless triggered by major incidents, emerging risks, or regulatory findings.',
    examples: 'Small exchange companies, niche finance companies, smaller service providers',
  },
};

const FIELDS = [
  { id: 'total_assets', label: 'Total Assets (KWD millions)', type: 'number', placeholder: 'e.g. 5000', dim: 'Financial Scale' },
  { id: 'market_share', label: 'Market Share (%)', type: 'number', placeholder: 'e.g. 12.5', dim: 'Market Share' },
  { id: 'branches', label: 'Number of Branches / Channels', type: 'number', placeholder: 'e.g. 45', dim: 'Branch Network' },
  { id: 'customers', label: 'Customer Base (thousands)', type: 'number', placeholder: 'e.g. 250', dim: 'Customer Base' },
  {
    id: 'services_breadth', label: 'Breadth of Services', type: 'select', dim: 'Services',
    options: [
      { value: 'retail', label: 'Retail banking only' },
      { value: 'retail_corporate', label: 'Retail + Corporate banking' },
      { value: 'retail_corporate_investment', label: 'Retail + Corporate + Investment' },
      { value: 'full_service', label: 'Full service incl. digital/cross-border' },
    ]
  },
  {
    id: 'cloud_adoption', label: 'Cloud Adoption Level', type: 'select', dim: 'Tech Complexity',
    options: [
      { value: 'none', label: 'None — fully on-premise' },
      { value: 'low', label: 'Low — minimal cloud usage' },
      { value: 'medium', label: 'Medium — hybrid cloud' },
      { value: 'high', label: 'High — cloud-first strategy' },
    ]
  },
  {
    id: 'ai_ml_usage', label: 'AI / ML Usage', type: 'select', dim: 'Tech Complexity',
    options: [
      { value: 'none', label: 'None' },
      { value: 'limited', label: 'Limited — experimental only' },
      { value: 'moderate', label: 'Moderate — production use cases' },
      { value: 'extensive', label: 'Extensive — core operations' },
    ]
  },
  {
    id: 'third_party_deps', label: 'Third-Party / Outsourcing Level', type: 'select', dim: 'Outsourcing',
    options: [
      { value: 'low', label: 'Low — mostly in-house' },
      { value: 'medium', label: 'Medium — some critical services outsourced' },
      { value: 'high', label: 'High — heavily reliant on third parties' },
    ]
  },
  {
    id: 'cyber_history', label: 'Regulatory / Audit History', type: 'select', dim: 'Supervisory History',
    options: [
      { value: 'clean', label: 'Clean — no material findings' },
      { value: 'minor_findings', label: 'Minor findings — addressed' },
      { value: 'material_findings', label: 'Material findings — in remediation' },
      { value: 'incidents', label: 'Cyber incidents / significant weaknesses' },
    ]
  },
  { id: 'cyber_workforce', label: 'Dedicated Cyber Workforce (FTEs)', type: 'number', placeholder: 'e.g. 35', dim: 'Cyber Workforce' },
];

function calcTier(f) {
  let score = 0;
  if (f.total_assets > 5000) score += 3; else if (f.total_assets > 1000) score += 2; else if (f.total_assets > 0) score += 1;
  if (f.market_share > 15) score += 3; else if (f.market_share > 5) score += 2; else if (f.market_share > 0) score += 1;
  if (f.is_fmi) score += 3;
  if (f.cloud_adoption === 'high') score += 2; else if (f.cloud_adoption === 'medium') score += 1;
  if (f.ai_ml_usage === 'extensive') score += 2; else if (f.ai_ml_usage === 'moderate') score += 1;
  if (f.third_party_deps === 'high') score += 2; else if (f.third_party_deps === 'medium') score += 1;
  if (f.cyber_history === 'incidents') score += 3; else if (f.cyber_history === 'material_findings') score += 2; else if (f.cyber_history === 'minor_findings') score += 1;
  if (f.customers > 1000) score += 2; else if (f.customers > 100) score += 1;
  if (f.services_breadth === 'full_service') score += 2; else if (f.services_breadth === 'retail_corporate_investment') score += 1;
  return { tier: score >= 12 ? 1 : score >= 6 ? 2 : 3, score, max: 22 };
}

export default function TierCalculator({ engagement }) {
  const toast = useToast();
  const [form, setForm] = useState({
    total_assets: '', market_share: '', branches: '', customers: '',
    services_breadth: 'retail', is_fmi: false,
    cloud_adoption: 'low', ai_ml_usage: 'none',
    third_party_deps: 'low', cyber_history: 'clean', cyber_workforce: '', notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getRiskProfile(engagement.id)
      .then(data => { if (data && data.id) setForm(f => ({ ...f, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [engagement.id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { tier, score, max } = useMemo(() => calcTier(form), [form]);
  const info = TIER_INFO[tier];

  const save = async () => {
    setSaving(true);
    try {
      await api.saveRiskProfile(engagement.id, { ...form, is_fmi: form.is_fmi ? 1 : 0 });
      toast('Risk profile saved', 'success');
    } catch { toast('Failed to save profile', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="empty-state"><div className="spinner" style={{ fontSize: 32 }}>◌</div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-heading">Inherent Risk Profiling & Tier Calculator</h1>
          <p className="section-sub">CBK determines supervisory tier based on 11 dimensions of inherent risk exposure. Complete the profile below.</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? '⏳ Saving...' : '💾 Save Profile'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Form */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ fontSize: 15, marginBottom: 16 }}>Entity Risk Profile</div>
            <div className="form-row">
              {FIELDS.slice(0, 4).map(f => (
                <div key={f.id} className="form-group">
                  <label className="form-label">{f.label} <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>({f.dim})</span></label>
                  <input type="number" className="form-input" placeholder={f.placeholder}
                    value={form[f.id] || ''}
                    onChange={e => set(f.id, e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              ))}
            </div>
            <div className="form-row">
              {FIELDS.slice(4).filter(f => f.type === 'select').map(f => (
                <div key={f.id} className="form-group">
                  <label className="form-label">{f.label} <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>({f.dim})</span></label>
                  <select className="form-select" value={form[f.id]} onChange={e => set(f.id, e.target.value)}>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Dedicated Cyber Workforce (FTEs) <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>(Cyber Workforce)</span></label>
                <input type="number" className="form-input" placeholder="e.g. 35"
                  value={form.cyber_workforce || ''}
                  onChange={e => set('cyber_workforce', e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                <div>
                  <label className="form-label">Infrastructure Role <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>(FMI Designation)</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10 }}>
                    <input type="checkbox" id="fmi" style={{ width: 16, height: 16, accentColor: 'var(--gold-500)', cursor: 'pointer' }}
                      checked={!!form.is_fmi}
                      onChange={e => set('is_fmi', e.target.checked)} />
                    <label htmlFor="fmi" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      Designated as Financial Market Infrastructure (FMI) — payment gateway, clearing, settlement system
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)}
                placeholder="Additional context for CBK supervisors..." />
            </div>
          </div>

          <div className="info-box">
            <strong>ℹ️ Note:</strong> This is an indicative tier estimate based on key dimensions. CBK determines final tier assignment using the full 68-criteria Inherent Risk Profiling template, including supervisory-specific inputs. Submit your completed profile to CBK for official tier classification.
          </div>
        </div>

        {/* Result */}
        <div>
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Estimated Supervisory Tier
            </div>
            <div style={{
              width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: info.color + '18', border: `3px solid ${info.color}`,
              boxShadow: `0 0 32px ${info.color}33`,
            }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, color: info.color, lineHeight: 1 }}>{tier}</span>
              <span style={{ fontSize: 10, color: info.color, textTransform: 'uppercase', letterSpacing: 1 }}>Tier</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--text-primary)', marginBottom: 6 }}>{info.label}</div>
            <div style={{ padding: '8px 16px', background: info.color + '18', border: `1px solid ${info.color}33`, borderRadius: 6, fontSize: 12, color: info.color, fontFamily: 'IBM Plex Mono', marginBottom: 16 }}>
              {info.freq}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>{info.desc}</p>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 16 }}>
              Examples: {info.examples}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Risk Score</span><span style={{ color: 'var(--text-primary)' }}>{score} / {max}</span>
              </div>
              <div className="progress-wrap" style={{ height: 8 }}>
                <div className="progress-bar" style={{ width: `${(score / max) * 100}%`, background: info.color }} />
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              ★ CBK reviews tier assignments periodically and in response to material changes in operational profile.
            </div>
          </div>

          {/* Tier reference */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(t => {
              const ti = TIER_INFO[t];
              return (
                <div key={t} style={{
                  padding: '10px 14px', borderRadius: 8, border: '1px solid',
                  background: tier === t ? ti.color + '12' : 'var(--surface-1)',
                  borderColor: tier === t ? ti.color : 'var(--border)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: ti.color, minWidth: 24, textAlign: 'center' }}>{t}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: tier === t ? ti.color : 'var(--text-secondary)' }}>{ti.label.split('—')[1]?.trim()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ti.freq}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
