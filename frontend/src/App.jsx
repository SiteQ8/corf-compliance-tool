import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import './styles/global.css';
import * as api from './api/client';
import Dashboard from './components/Dashboard';
import Assessment from './components/Assessment';
import SoABuilder from './components/SoABuilder';
import TierCalculator from './components/TierCalculator';
import RemediationTracker from './components/RemediationTracker';

// ── Toast context ─────────────────────────────────────────────────────────────
export const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{icons[t.type]}</span>{t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ── Engagement modal ──────────────────────────────────────────────────────────
const ENTITY_TYPES = [
  { value: 'bank_kuwaiti', label: 'Kuwaiti Bank' },
  { value: 'bank_foreign', label: 'Foreign Bank Branch' },
  { value: 'exchange', label: 'Exchange Company' },
  { value: 'finance', label: 'Finance Company' },
  { value: 'epayment', label: 'E-Payment of Funds Company' },
  { value: 'credit_info', label: 'Credit Information Company' },
  { value: 'open_banking', label: 'Open Banking Service Provider' },
];

function EngagementModal({ existing, onClose, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: existing?.name || '',
    entity_name: existing?.entity_name || '',
    entity_type: existing?.entity_type || 'bank_kuwaiti',
    assessor: existing?.assessor || '',
    start_date: existing?.start_date || new Date().toISOString().split('T')[0],
    notes: existing?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.entity_name.trim()) {
      toast('Engagement name and entity name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const result = existing
        ? await api.updateEngagement(existing.id, form)
        : await api.createEngagement(form);
      onSave(result);
      toast(existing ? 'Engagement updated' : 'Engagement created', 'success');
      onClose();
    } catch (e) {
      toast('Failed to save engagement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{existing ? 'Edit Engagement' : 'New Engagement'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Engagement Name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Q1-2025 CORF Assessment" />
            </div>
            <div className="form-group">
              <label className="form-label">Entity Name *</label>
              <input className="form-input" value={form.entity_name} onChange={e => set('entity_name', e.target.value)}
                placeholder="e.g. Kuwait National Bank" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Entity Type</label>
              <select className="form-select" value={form.entity_type} onChange={e => set('entity_type', e.target.value)}>
                {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lead Assessor</label>
              <input className="form-input" value={form.assessor} onChange={e => set('assessor', e.target.value)}
                placeholder="Name / firm" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{opacity: 0}}>_</label>
              <div className="info-box">CORF v1.0 — CBK Dec 2025. All data stored locally in SQLite.</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Assessment scope, methodology, observations..." rows={3} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving...' : existing ? '💾 Update' : '🚀 Create Engagement'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'assessment', icon: '✅', label: 'Assessment' },
  { id: 'soa', icon: '📋', label: 'Statement of Applicability' },
  { id: 'tier', icon: '🏷️', label: 'Tier Calculator' },
  { id: 'remediation', icon: '🔧', label: 'Remediation Tracker' },
];

function AppInner() {
  const toast = useToast();
  const [page, setPage] = useState('home');
  const [engagements, setEngagements] = useState([]);
  const [activeEngagement, setActiveEngagement] = useState(null);
  const [showEngModal, setShowEngModal] = useState(false);
  const [editingEng, setEditingEng] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEngagements()
      .then(data => {
        setEngagements(data);
        if (data.length > 0 && !activeEngagement) setActiveEngagement(data[0]);
      })
      .catch(() => toast('Could not connect to backend. Is the server running?', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const openEngagement = (eng) => {
    setActiveEngagement(eng);
    setPage('dashboard');
  };

  const deleteEng = async (id) => {
    if (!confirm('Delete this engagement? All associated data will be permanently removed.')) return;
    await api.deleteEngagement(id);
    const updated = engagements.filter(e => e.id !== id);
    setEngagements(updated);
    if (activeEngagement?.id === id) {
      setActiveEngagement(updated[0] || null);
      setPage('home');
    }
    toast('Engagement deleted', 'info');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🛡️</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--gold-500)' }}>CORF Compliance Tool</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }} className="spinner">◌ Connecting to backend...</div>
    </div>
  );

  // ── Landing/Home page ─────────────────────────────────────────────────────
  if (!activeEngagement || page === 'home') {
    return (
      <>
        {showEngModal && <EngagementModal existing={editingEng} onClose={() => { setShowEngModal(false); setEditingEng(null); }}
          onSave={eng => { setEngagements(p => editingEng ? p.map(e => e.id === eng.id ? eng : e) : [eng, ...p]); setActiveEngagement(eng); setPage('dashboard'); }} />}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🛡️</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: 'var(--gold-500)', marginBottom: 8 }}>
              CORF Compliance Tool
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>
              Open-source compliance assessment tool for the CBK Cyber & Operational Resilience Framework v1.0.<br />
              Built for the Kuwait Cybersecurity Community.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <span className="badge badge-gold">519 CR Controls</span>
              <span className="badge badge-blue">146 OR Controls</span>
              <span className="badge badge-purple">211 TPRM Controls</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)', fontSize: 18 }}>
              Engagements
            </h2>
            <button className="btn btn-primary" onClick={() => { setEditingEng(null); setShowEngModal(true); }}>
              + New Engagement
            </button>
          </div>

          {engagements.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">📂</div>
              <div className="empty-text">No engagements yet</div>
              <div className="empty-sub">Create your first engagement to begin a CORF assessment</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {engagements.map(eng => (
                <div key={eng.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openEngagement(eng)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="badge badge-muted mono" style={{ fontSize: 9 }}>{eng.entity_type}</span>
                    <span className={`badge ${eng.status === 'completed' ? 'badge-green' : eng.status === 'in_progress' ? 'badge-blue' : 'badge-muted'}`}>
                      {eng.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: 'var(--text-primary)', marginBottom: 2 }}>{eng.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--gold-400)', marginBottom: 10 }}>{eng.entity_name}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    <span>👤 {eng.assessor || 'No assessor'}</span>
                    <span>📅 {eng.start_date || 'No date'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-gold">{eng.assessed_count || 0} assessed</span>
                    <span className="badge badge-red">{eng.gap_count || 0} gaps</span>
                    {eng.resolved_count > 0 && <span className="badge badge-green">{eng.resolved_count} resolved</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingEng(eng); setShowEngModal(true); }}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteEng(eng.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="divider" />
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            CBK Cyber & Operational Resilience Framework v1.0 — Issued December 2025<br />
            Open-source · Kuwait Cybersecurity Community · CORWG@cbk.gov.kw
          </div>
        </div>
      </>
    );
  }

  // ── Main app shell ────────────────────────────────────────────────────────
  return (
    <>
      {showEngModal && <EngagementModal existing={editingEng} onClose={() => { setShowEngModal(false); setEditingEng(null); }}
        onSave={eng => { setEngagements(p => editingEng ? p.map(e => e.id === eng.id ? eng : e) : [eng, ...p]); setActiveEngagement(eng); }} />}

      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🛡️</div>
            <div className="logo-title">CORF Tool</div>
            <div className="logo-sub">CBK · Kuwait</div>
          </div>

          <div className="sidebar-section-label">Navigation</div>
          {NAV.map(n => (
            <div key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              <span className="nav-item-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}

          <div className="sidebar-section-label">Engagements</div>
          {engagements.map(eng => (
            <div key={eng.id}
              className={`nav-item ${activeEngagement?.id === eng.id && page !== 'home' ? 'active' : ''}`}
              style={{ fontSize: 12 }}
              onClick={() => { setActiveEngagement(eng); setPage('dashboard'); }}>
              <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: 'var(--text-muted)' }}>●</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eng.entity_name}</span>
            </div>
          ))}

          <div className="sidebar-engagement">
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
              onClick={() => { setEditingEng(null); setShowEngModal(true); }}>
              + New Engagement
            </button>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12, marginTop: 6 }}
              onClick={() => setPage('home')}>
              ← All Engagements
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="main-area">
          {/* Topbar */}
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--gold-500)' }}>
                {activeEngagement.entity_name}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>/</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {NAV.find(n => n.id === page)?.label || 'Dashboard'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-muted mono" style={{ fontSize: 10 }}>{activeEngagement.entity_type}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingEng(activeEngagement); setShowEngModal(true); }}>✏️ Edit</button>
              <button className="btn btn-secondary btn-sm" onClick={() => api.downloadPDF(activeEngagement.id)}>⬇ PDF</button>
              <button className="btn btn-primary btn-sm" onClick={() => api.downloadExcel(activeEngagement.id)}>⬇ Excel</button>
            </div>
          </div>

          {/* Page */}
          <div className="page-content">
            {page === 'dashboard'   && <Dashboard engagement={activeEngagement} />}
            {page === 'assessment'  && <Assessment engagement={activeEngagement} />}
            {page === 'soa'         && <SoABuilder engagement={activeEngagement} />}
            {page === 'tier'        && <TierCalculator engagement={activeEngagement} />}
            {page === 'remediation' && <RemediationTracker engagement={activeEngagement} />}
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
