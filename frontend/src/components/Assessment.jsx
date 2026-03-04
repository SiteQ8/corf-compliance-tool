import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../api/client';
import { useToast } from '../App';

const MATURITY_LABELS = ['', 'Initial', 'Ad-hoc', 'Baseline', 'Advanced', 'Innovative'];
const MATURITY_COLORS = ['#4a5a6c', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const BASELINES = [
  { id: 'cyber', label: 'Cyber Resilience',        badge: 'CR', color: '#3b82f6',  desc: '6 Domains · 33 Sub-domains · 519 Controls' },
  { id: 'or',    label: 'Operational Resilience',   badge: 'OR', color: '#22c55e',  desc: '8 Domains · 17 Sub-domains · 146 Controls' },
  { id: 'tprm',  label: 'TPRM',                     badge: 'TP', color: '#8b5cf6',  desc: '13 Domains · 43 Sub-domains · 211 Controls' },
];

function SubdomainRow({ sub, assessment, onUpdate, domainId, baseline }) {
  const toast = useToast();
  const [local, setLocal] = useState(assessment || { maturity_level: 0, compliance_pct: 0, status: 'applicable', notes: '', evidence: '' });
  const [showDetail, setShowDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef(null);

  useEffect(() => { setLocal(assessment || { maturity_level: 0, compliance_pct: 0, status: 'applicable', notes: '', evidence: '' }); }, [assessment]);

  const save = useCallback(async (updated) => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      try {
        await onUpdate(sub.id, { ...updated, baseline, domain_id: domainId });
      } catch { toast('Failed to save', 'error'); }
      finally { setSaving(false); }
    }, 600);
  }, [sub.id, baseline, domainId, onUpdate]);

  const update = (key, val) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    save(updated);
  };

  const isNA = local.status === 'na';
  const ml = local.maturity_level || 0;

  if (sub.linked) {
    return (
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', background: 'var(--navy-700)', fontSize: 12, color: '#3b82f6', fontStyle: 'italic' }}>
        🔗 {sub.name} — linked to {sub.linkRef}
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', opacity: isNA ? 0.5 : 1 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 200px 260px 100px 90px',
        alignItems: 'center', gap: 12, padding: '12px 18px',
        background: isNA ? 'var(--navy-900)' : 'var(--navy-700)',
        transition: 'background 0.15s',
      }}>
        {/* Name */}
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{sub.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', marginTop: 2 }}>
            {sub.id} · {sub.controls} controls {saving && '· ⏳'}
          </div>
        </div>

        {/* Maturity buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,2,3,4,5].map(lvl => (
            <button key={lvl}
              style={{
                width: 30, height: 30, borderRadius: 6, border: '1px solid',
                cursor: 'pointer', fontSize: 12, fontWeight: 700,
                transition: 'all 0.15s',
                background: ml === lvl ? MATURITY_COLORS[lvl] : 'var(--surface-2)',
                borderColor: ml === lvl ? MATURITY_COLORS[lvl] : 'var(--border)',
                color: ml === lvl ? '#fff' : 'var(--text-muted)',
              }}
              title={MATURITY_LABELS[lvl]}
              disabled={isNA}
              onClick={() => update('maturity_level', ml === lvl ? 0 : lvl)}
            >{lvl}</button>
          ))}
        </div>

        {/* Compliance slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="range" min="0" max="100" step="5"
            value={local.compliance_pct || 0}
            onChange={e => update('compliance_pct', Number(e.target.value))}
            disabled={isNA}
            className="slider"
            style={{
              flex: 1,
              background: `linear-gradient(to right, ${local.compliance_pct > 70 ? '#22c55e' : local.compliance_pct > 40 ? '#eab308' : '#ef4444'} ${local.compliance_pct}%, var(--navy-400) ${local.compliance_pct}%)`
            }}
          />
          <span style={{
            fontFamily: 'IBM Plex Mono', fontSize: 12, minWidth: 36, textAlign: 'right',
            color: local.compliance_pct > 70 ? '#22c55e' : local.compliance_pct > 40 ? '#eab308' : local.compliance_pct > 0 ? '#ef4444' : 'var(--text-muted)'
          }}>{local.compliance_pct || 0}%</span>
        </div>

        {/* N/A toggle */}
        <button
          style={{
            padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            fontFamily: 'IBM Plex Mono', fontWeight: 600,
            border: '1px solid', transition: 'all 0.15s',
            background: isNA ? 'rgba(239,68,68,0.12)' : 'transparent',
            borderColor: isNA ? '#ef4444' : 'var(--border)',
            color: isNA ? '#ef4444' : 'var(--text-muted)',
          }}
          onClick={() => update('status', isNA ? 'applicable' : 'na')}
        >{isNA ? 'N/A ✓' : 'N/A'}</button>

        {/* Detail toggle */}
        <button
          style={{
            padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', transition: 'all 0.15s',
          }}
          onClick={() => setShowDetail(p => !p)}
        >{showDetail ? '▲ Less' : '▼ More'}</button>
      </div>

      {/* Detail panel */}
      {showDetail && (
        <div style={{ padding: '12px 18px 14px', background: 'var(--navy-900)', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Evidence Reference</label>
            <input className="form-input" style={{ fontSize: 12 }}
              value={local.evidence || ''}
              onChange={e => update('evidence', e.target.value)}
              placeholder="Document name, ticket ID, screenshot ref..." />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Assessor Notes</label>
            <input className="form-input" style={{ fontSize: 12 }}
              value={local.notes || ''}
              onChange={e => update('notes', e.target.value)}
              placeholder="Observations, gaps noted, recommendations..." />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Assessment({ engagement }) {
  const toast = useToast();
  const [activeBaseline, setActiveBaseline] = useState('cyber');
  const [domains, setDomains] = useState([]);
  const [assessmentMap, setAssessmentMap] = useState({});
  const [expandedDomains, setExpandedDomains] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getCorfData(),
      api.getAssessments(engagement.id),
    ]).then(([corfData, assessments]) => {
      const domainsByBaseline = {
        cyber: corfData.CYBER_DOMAINS,
        or: corfData.OR_DOMAINS,
        tprm: corfData.TPRM_DOMAINS,
      };
      setDomains(domainsByBaseline);
      const aMap = {};
      for (const a of assessments) aMap[a.subdomain_id] = a;
      setAssessmentMap(aMap);
    })
    .catch(() => toast('Failed to load assessment data', 'error'))
    .finally(() => setLoading(false));
  }, [engagement.id]);

  const handleUpdate = useCallback(async (subId, data) => {
    const result = await api.upsertAssessment(engagement.id, subId, data);
    setAssessmentMap(prev => ({ ...prev, [subId]: result }));
  }, [engagement.id]);

  const toggleDomain = (id) => setExpandedDomains(p => ({ ...p, [id]: !p[id] }));

  const currentDomains = domains[activeBaseline] || [];

  // Stats for current baseline
  const applicable = Object.values(assessmentMap).filter(a => a.baseline === activeBaseline && a.status === 'applicable');
  const assessed = applicable.filter(a => a.maturity_level > 0);
  const avgM = assessed.length ? assessed.reduce((s, a) => s + a.maturity_level, 0) / assessed.length : 0;
  const avgC = applicable.length ? applicable.reduce((s, a) => s + a.compliance_pct, 0) / applicable.length : 0;

  const filteredDomains = search
    ? currentDomains.map(d => ({
        ...d,
        subdomains: d.subdomains.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()))
      })).filter(d => d.subdomains.length > 0)
    : currentDomains;

  if (loading) return <div className="empty-state"><div className="spinner" style={{ fontSize: 32 }}>◌</div><div className="empty-text" style={{ marginTop: 16 }}>Loading framework data...</div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-heading">Baseline Assessment</h1>
          <p className="section-sub">Set maturity level (1–5) and compliance % per sub-domain. Changes auto-save.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-gold">{assessed.length} assessed</span>
          <span className="badge badge-blue">L{avgM.toFixed(1)} avg maturity</span>
          <span className="badge badge-green">{avgC.toFixed(0)}% avg compliance</span>
        </div>
      </div>

      {/* Baseline selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {BASELINES.map(b => (
          <button key={b.id} className={`btn ${activeBaseline === b.id ? 'btn-primary' : 'btn-secondary'}`}
            style={activeBaseline === b.id ? { background: b.color, borderColor: b.color } : {}}
            onClick={() => setActiveBaseline(b.id)}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, opacity: 0.8 }}>{b.badge}</span>
            {b.label}
          </button>
        ))}
        <input className="form-input" style={{ flex: 1, maxWidth: 260, fontSize: 12, padding: '7px 12px' }}
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search sub-domains..." />
        <button className="btn btn-ghost btn-sm" onClick={() => setExpandedDomains(
          Object.fromEntries(currentDomains.map(d => [d.id, true]))
        )}>Expand All</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setExpandedDomains({})}>Collapse All</button>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 200px 260px 100px 90px',
        gap: 12, padding: '6px 18px', fontSize: 10, color: 'var(--text-muted)',
        fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.8px',
        borderBottom: '1px solid var(--border)', marginBottom: 8
      }}>
        <span>Sub-domain</span>
        <span>Maturity Level</span>
        <span>Compliance %</span>
        <span>Status</span>
        <span>Detail</span>
      </div>

      {filteredDomains.map(domain => {
        const domSubs = domain.subdomains.filter(s => !s.linked);
        const domAssessed = domSubs.filter(s => (assessmentMap[s.id]?.maturity_level || 0) > 0);
        const domAvgM = domAssessed.length ? domAssessed.reduce((acc, s) => acc + (assessmentMap[s.id]?.maturity_level || 0), 0) / domAssessed.length : 0;
        const domAvgC = domSubs.length ? domSubs.reduce((acc, s) => acc + (assessmentMap[s.id]?.compliance_pct || 0), 0) / domSubs.length : 0;
        const ml = Math.round(domAvgM);

        return (
          <div key={domain.id} className="domain-block" style={{ marginBottom: 8 }}>
            <div className="domain-header" onClick={() => toggleDomain(domain.id)}>
              <span className="domain-icon">{domain.icon}</span>
              <span className="domain-name">{domain.name}</span>
              <span className="domain-id" style={{ marginRight: 12 }}>{domain.id}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{domain.subdomains.filter(s => !s.linked).length} sub-domains</span>
                {domAvgC > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div className="progress-wrap" style={{ width: 60, height: 4 }}>
                      <div className="progress-bar" style={{ width: `${domAvgC}%`, background: domAvgC > 70 ? '#22c55e' : domAvgC > 40 ? '#eab308' : '#ef4444' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{domAvgC.toFixed(0)}%</span>
                  </div>
                )}
                {ml > 0 && (
                  <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 600,
                    background: MATURITY_COLORS[ml] + '22', color: MATURITY_COLORS[ml], border: `1px solid ${MATURITY_COLORS[ml]}44` }}>
                    L{ml}
                  </span>
                )}
              </div>
              <span className={`domain-chevron ${expandedDomains[domain.id] ? 'open' : ''}`}>▶</span>
            </div>

            {expandedDomains[domain.id] && (
              <div className="subdomain-list">
                {domain.subdomains.map(sub => (
                  <SubdomainRow key={sub.id} sub={sub} assessment={assessmentMap[sub.id]}
                    onUpdate={handleUpdate} domainId={domain.id} baseline={activeBaseline} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {filteredDomains.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">No sub-domains match "{search}"</div>
        </div>
      )}
    </div>
  );
}
