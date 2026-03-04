import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import * as api from '../api/client';
import { useToast } from '../App';

const MATURITY_LABELS = ['', 'Initial', 'Ad-hoc', 'Baseline', 'Advanced', 'Innovative'];
const MATURITY_COLORS = ['#4a5a6c', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const BASELINES = [
  { key: 'cyber', label: 'Cyber Resilience', color: '#3b82f6', controls: 519 },
  { key: 'or',    label: 'Operational Resilience', color: '#22c55e', controls: 146 },
  { key: 'tprm',  label: 'Third-Party Risk Mgmt', color: '#8b5cf6', controls: 211 },
];

function MaturityBadge({ level }) {
  if (!level || level === 0) return <span className="badge badge-muted">Not Assessed</span>;
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
  const label = MATURITY_LABELS[level] || '';
  return (
    <span className="m-pill" style={{ background: colors[level] + '22', color: colors[level], border: `1px solid ${colors[level]}44` }}>
      L{level} {label}
    </span>
  );
}

export default function Dashboard({ engagement }) {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getEngagementSummary(engagement.id)
      .then(setSummary)
      .catch(() => toast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, [engagement.id]);

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" style={{ fontSize: 32 }}>◌</div>
      <div className="empty-text" style={{ marginTop: 16 }}>Loading dashboard...</div>
    </div>
  );

  const s = summary || {};
  const avgM = s.avgMaturity || 0;

  const radarData = BASELINES.map(b => ({
    baseline: b.label,
    maturity: parseFloat(((s.byBaseline?.[b.key]?.avgMaturity || 0) * 20).toFixed(1)),
    compliance: parseFloat((s.byBaseline?.[b.key]?.avgCompliance || 0).toFixed(1)),
  }));

  const barData = BASELINES.map(b => ({
    name: b.label.split(' ')[0],
    maturity: parseFloat((s.byBaseline?.[b.key]?.avgMaturity || 0).toFixed(2)),
    compliance: parseFloat((s.byBaseline?.[b.key]?.avgCompliance || 0).toFixed(1)),
    fill: b.color,
  }));

  const tierInfo = {
    1: { label: 'Tier 1 — High-Impact', badge: 'badge-red', freq: 'Annual assessment' },
    2: { label: 'Tier 2 — Medium-Impact', badge: 'badge-orange', freq: '18-month assessment' },
    3: { label: 'Tier 3 — Low-Impact', badge: 'badge-green', freq: 'Bi-annual assessment' },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-heading">{engagement.entity_name}</h1>
          <p className="section-sub">{engagement.name} · Assessor: {engagement.assessor || 'N/A'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => api.downloadExcel(engagement.id)}>⬇ Excel Report</button>
          <button className="btn btn-primary" onClick={() => api.downloadPDF(engagement.id)}>⬇ PDF Report</button>
        </div>
      </div>

      {/* Metric row */}
      <div className="metric-grid">
        <div className="metric-card gold">
          <div className="metric-label">Overall Maturity</div>
          <div className="metric-value">{avgM.toFixed(2)}<span className="metric-unit">/5</span></div>
          <div className="metric-sub">
            <MaturityBadge level={Math.round(avgM)} />
          </div>
        </div>
        <div className="metric-card blue">
          <div className="metric-label">Avg. Compliance</div>
          <div className="metric-value">{(s.avgCompliance || 0).toFixed(1)}<span className="metric-unit">%</span></div>
          <div className="metric-sub">across {s.assessed || 0} assessed sub-domains</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Sub-domains Assessed</div>
          <div className="metric-value">{s.assessed || 0}<span className="metric-unit">/{s.totalAssessments || '—'}</span></div>
          <div className="metric-sub">CR + OR + TPRM baselines</div>
        </div>
        <div className="metric-card red">
          <div className="metric-label">Open Gaps</div>
          <div className="metric-value">{s.gaps || 0}</div>
          <div className="metric-sub">{s.resolvedGaps || 0} resolved in remediation plan</div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Radar */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 15 }}>Baseline Radar Overview</div>
          <div className="card-sub">Maturity score (0–100) per baseline</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1a2a3a" />
              <PolarAngleAxis dataKey="baseline" tick={{ fill: '#7a8a9a', fontSize: 11 }} />
              <Radar name="Maturity" dataKey="maturity" stroke="#c8a84b" fill="#c8a84b" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Compliance" dataKey="compliance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ color: '#c8a84b' }}>── Maturity</span>
            <span style={{ color: '#3b82f6' }}>- - Compliance %</span>
          </div>
        </div>

        {/* Bar */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 15 }}>Maturity by Baseline</div>
          <div className="card-sub">Average maturity level (1–5 scale) per baseline</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#7a8a9a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} tick={{ fill: '#4a5a6c', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0d2040', border: '1px solid #1a2a3a', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#c8a84b' }}
                formatter={(val, name) => [val.toFixed(2), name === 'maturity' ? 'Avg Maturity' : 'Compliance %']}
              />
              <Bar dataKey="maturity" radius={[4,4,0,0]}>
                {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Baseline summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {BASELINES.map(b => {
          const bs = s.byBaseline?.[b.key] || {};
          return (
            <div key={b.key} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.controls} controls</div>
                </div>
                <MaturityBadge level={Math.round(bs.avgMaturity || 0)} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Compliance</span>
                  <span style={{ color: 'var(--text-primary)' }}>{(bs.avgCompliance || 0).toFixed(1)}%</span>
                </div>
                <div className="progress-wrap" style={{ height: 5 }}>
                  <div className="progress-bar" style={{ width: `${bs.avgCompliance || 0}%`, background: b.color }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {bs.assessed || 0} of {bs.total || 0} sub-domains assessed
              </div>
            </div>
          );
        })}
      </div>

      {/* Engagement notes */}
      {engagement.notes && (
        <div className="highlight-box">
          <strong style={{ color: 'var(--gold-500)', display: 'block', marginBottom: 4 }}>📝 Engagement Notes</strong>
          {engagement.notes}
        </div>
      )}
    </div>
  );
}
