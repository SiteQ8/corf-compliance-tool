import { useState, useEffect } from 'react';
import * as api from '../api/client';
import { useToast } from '../App';

const PRIORITIES = [
  { value: 'critical', label: 'Critical', color: '#ef4444', badge: 'badge-red' },
  { value: 'high',     label: 'High',     color: '#f97316', badge: 'badge-orange' },
  { value: 'medium',   label: 'Medium',   color: '#eab308', badge: 'badge-yellow' },
  { value: 'low',      label: 'Low',      color: '#22c55e', badge: 'badge-green' },
];

const STATUSES = [
  { value: 'open',          label: 'Open',          color: '#ef4444' },
  { value: 'in_progress',   label: 'In Progress',   color: '#f97316' },
  { value: 'completed',     label: 'Completed',     color: '#22c55e' },
  { value: 'accepted_risk', label: 'Accepted Risk', color: '#6b7280' },
];

const BASELINES = [
  { value: 'cyber', label: 'Cyber Resilience' },
  { value: 'or',    label: 'Operational Resilience' },
  { value: 'tprm',  label: 'TPRM' },
];

const MATURITY_LABELS = ['', 'Initial', 'Ad-hoc', 'Baseline', 'Advanced', 'Innovative'];

function GapModal({ engagement, existing, onClose, onSave }) {
  const toast = useToast();
  const [domains, setDomains] = useState({});
  const [selectedDomain, setSelectedDomain] = useState(existing?.domain_id || '');
  const [form, setForm] = useState({
    subdomain_id: existing?.subdomain_id || '',
    subdomain_name: existing?.subdomain_name || '',
    baseline: existing?.baseline || 'cyber',
    domain_id: existing?.domain_id || '',
    domain_name: existing?.domain_name || '',
    gap_description: existing?.gap_description || '',
    priority: existing?.priority || 'medium',
    owner: existing?.owner || '',
    target_date: existing?.target_date || '',
    status: existing?.status || 'open',
    current_maturity: existing?.current_maturity || 0,
    target_maturity: existing?.target_maturity || 3,
    current_compliance: existing?.current_compliance || 0,
    target_compliance: existing?.target_compliance || 100,
    notes: existing?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCorfData().then(d => setDomains({ cyber: d.CYBER_DOMAINS, or: d.OR_DOMAINS, tprm: d.TPRM_DOMAINS }));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const currentDomains = domains[form.baseline] || [];
  const currentSubdomains = currentDomains.find(d => d.id === form.domain_id)?.subdomains?.filter(s => !s.linked) || [];

  const handleSave = async () => {
    if (!form.gap_description || !form.subdomain_id) { toast('Gap description and sub-domain are required', 'error'); return; }
    setSaving(true);
    try {
      let result;
      if (existing) result = await api.updateRemediation(engagement.id, existing.id, form);
      else result = await api.createRemediation(engagement.id, form);
      onSave(result);
      onClose();
    } catch { toast('Failed to save gap', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">{existing ? 'Edit Gap / Remediation Item' : 'Add Gap / Remediation Item'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Baseline</label>
              <select className="form-select" value={form.baseline} onChange={e => { set('baseline', e.target.value); set('domain_id', ''); set('subdomain_id', ''); }}>
                {BASELINES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Domain</label>
              <select className="form-select" value={form.domain_id} onChange={e => {
                const d = (domains[form.baseline] || []).find(d => d.id === e.target.value);
                set('domain_id', e.target.value);
                set('domain_name', d?.name || '');
                set('subdomain_id', '');
              }}>
                <option value="">Select domain...</option>
                {currentDomains.map(d => <option key={d.id} value={d.id}>{d.id} — {d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sub-domain *</label>
              <select className="form-select" value={form.subdomain_id} onChange={e => {
                const s = currentSubdomains.find(s => s.id === e.target.value);
                set('subdomain_id', e.target.value);
                set('subdomain_name', s?.name || '');
              }}>
                <option value="">Select sub-domain...</option>
                {currentSubdomains.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Gap Description *</label>
            <textarea className="form-textarea" rows={3} value={form.gap_description}
              onChange={e => set('gap_description', e.target.value)}
              placeholder="Describe the specific gap, non-compliance, or deficiency identified..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Owner / Responsible Party</label>
              <input className="form-input" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Name / team" />
            </div>
            <div className="form-group">
              <label className="form-label">Target Completion Date</label>
              <input type="date" className="form-input" value={form.target_date} onChange={e => set('target_date', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Current Maturity → Target Maturity</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="form-select" value={form.current_maturity} onChange={e => set('current_maturity', Number(e.target.value))}>
                  {[0,1,2,3,4,5].map(l => <option key={l} value={l}>L{l} {MATURITY_LABELS[l] || 'Not Assessed'}</option>)}
                </select>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <select className="form-select" value={form.target_maturity} onChange={e => set('target_maturity', Number(e.target.value))}>
                  {[1,2,3,4,5].map(l => <option key={l} value={l}>L{l} {MATURITY_LABELS[l]}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Current Compliance % → Target %</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" min="0" max="100" className="form-input" value={form.current_compliance} onChange={e => set('current_compliance', Number(e.target.value))} />
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <input type="number" min="0" max="100" className="form-input" value={form.target_compliance} onChange={e => set('target_compliance', Number(e.target.value))} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes / Remediation Actions</label>
            <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Specific actions, milestones, dependencies, acceptance criteria..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '⏳' : '💾'} {existing ? 'Update' : 'Add Gap'}</button>
        </div>
      </div>
    </div>
  );
}

export default function RemediationTracker({ engagement }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', baseline: '' });

  const load = () => {
    setLoading(true);
    api.getRemediation(engagement.id, filters)
      .then(setItems)
      .catch(() => toast('Failed to load remediation plan', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [engagement.id, filters]);

  const deleteItem = async (id) => {
    if (!confirm('Remove this gap from the remediation plan?')) return;
    await api.deleteRemediation(engagement.id, id);
    setItems(p => p.filter(i => i.id !== id));
    toast('Item removed', 'info');
  };

  const quickStatus = async (item, status) => {
    const updated = await api.updateRemediation(engagement.id, item.id, { status });
    setItems(p => p.map(i => i.id === item.id ? updated : i));
  };

  const getPriority = (p) => PRIORITIES.find(pr => pr.value === p) || PRIORITIES[2];
  const getStatus = (s) => STATUSES.find(st => st.value === s) || STATUSES[0];

  const stats = {
    total: items.length,
    open: items.filter(i => i.status === 'open').length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
    completed: items.filter(i => i.status === 'completed').length,
    critical: items.filter(i => i.priority === 'critical').length,
    high: items.filter(i => i.priority === 'high').length,
  };

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: p[k] === v ? '' : v }));

  return (
    <div>
      {showModal && (
        <GapModal engagement={engagement} existing={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={item => { setItems(p => editItem ? p.map(i => i.id === item.id ? item : i) : [item, ...p]); }} />
      )}

      <div className="page-header">
        <div>
          <h1 className="section-heading">Remediation Tracker</h1>
          <p className="section-sub">Track gaps, assign owners, set target dates, and monitor progress toward compliance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true); }}>+ Add Gap</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total', val: stats.total, color: 'var(--text-primary)' },
          { label: 'Open', val: stats.open, color: '#ef4444' },
          { label: 'In Progress', val: stats.inProgress, color: '#f97316' },
          { label: 'Completed', val: stats.completed, color: '#22c55e' },
          { label: 'Critical', val: stats.critical, color: '#ef4444' },
          { label: 'High', val: stats.high, color: '#f97316' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '5px 0', alignSelf: 'center' }}>Filter:</span>
        {PRIORITIES.map(p => (
          <button key={p.value} className="btn btn-ghost btn-sm"
            style={{ borderColor: filters.priority === p.value ? p.color : 'var(--border)', color: filters.priority === p.value ? p.color : 'var(--text-muted)' }}
            onClick={() => setFilter('priority', p.value)}>{p.label}</button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
        {STATUSES.map(s => (
          <button key={s.value} className="btn btn-ghost btn-sm"
            style={{ borderColor: filters.status === s.value ? s.color : 'var(--border)', color: filters.status === s.value ? s.color : 'var(--text-muted)' }}
            onClick={() => setFilter('status', s.value)}>{s.label}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state"><div className="spinner" style={{ fontSize: 32 }}>◌</div></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-text">No remediation items</div>
          <div className="empty-sub">Add gaps identified during the assessment to track progress</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Sub-domain</th>
                <th>Gap Description</th>
                <th style={{ width: 100 }}>Priority</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 120 }}>Owner</th>
                <th style={{ width: 110 }}>Target Date</th>
                <th style={{ width: 160 }}>Maturity Progress</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const pr = getPriority(item.priority);
                const st = getStatus(item.status);
                const isOverdue = item.target_date && item.status !== 'completed' && new Date(item.target_date) < new Date();
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'var(--gold-400)' }}>{item.subdomain_id}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.baseline?.toUpperCase()}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, maxWidth: 320 }}>{item.gap_description}</div>
                      {item.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{item.notes}</div>}
                    </td>
                    <td>
                      <span className={`badge`} style={{ background: pr.color + '18', color: pr.color, border: `1px solid ${pr.color}44` }}>
                        {pr.label}
                      </span>
                    </td>
                    <td>
                      <select value={item.status} onChange={e => quickStatus(item, e.target.value)}
                        style={{
                          background: st.color + '12', border: `1px solid ${st.color}44`,
                          borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                          color: st.color, cursor: 'pointer', outline: 'none', fontFamily: 'Outfit',
                          width: '100%',
                        }}>
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.owner || '—'}</td>
                    <td style={{ fontSize: 12, color: isOverdue ? '#ef4444' : 'var(--text-secondary)' }}>
                      {item.target_date || '—'}{isOverdue && ' ⚠️'}
                    </td>
                    <td>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                        L{item.current_maturity} → L{item.target_maturity}
                      </div>
                      <div className="progress-wrap" style={{ height: 4 }}>
                        <div className="progress-bar" style={{
                          width: `${item.status === 'completed' ? 100 : Math.min(100, (item.current_maturity / item.target_maturity) * 80)}%`,
                          background: item.status === 'completed' ? '#22c55e' : '#c8a84b'
                        }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => { setEditItem(item); setShowModal(true); }}>✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => deleteItem(item.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
