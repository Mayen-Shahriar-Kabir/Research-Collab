import React, { useEffect, useMemo, useState } from 'react';
import './PcRequestsPage.css';

export default function PcRequestsPage({ user }) {
  const API_BASE = useMemo(() => ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, '')), []);

  const [form, setForm] = useState({ desiredStart: '', desiredEnd: '', purpose: '', preferredComputer: '' });
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [computers, setComputers] = useState([]);

  const loadMyRequests = async () => {
    if (!user?._id && !user?.id) return;
    try {
      const uid = user._id || user.id;
      const res = await fetch(`${API_BASE}/api/pc-requests/mine?studentId=${encodeURIComponent(uid)}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : (Array.isArray(data?.requests) ? data.requests : []));
    } catch (e) {
      // ignore
    }
  };

  const loadComputers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/computers?status=active`);
      const data = await res.json();
      let list = Array.isArray(data) ? data : (Array.isArray(data?.computers) ? data.computers : []);
      if (!list.length) {
        const resAll = await fetch(`${API_BASE}/api/computers`);
        const dataAll = await resAll.json();
        list = Array.isArray(dataAll) ? dataAll : (Array.isArray(dataAll?.computers) ? dataAll.computers : []);
      }
      setComputers(list);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    loadMyRequests();
    loadComputers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const uid = user?._id || user?.id;
      const payload = {
        studentId: uid,
        desiredStart: form.desiredStart ? new Date(form.desiredStart).toISOString() : '',
        desiredEnd: form.desiredEnd ? new Date(form.desiredEnd).toISOString() : '',
        purpose: form.purpose,
      };
      if (form.preferredComputer) payload.preferredComputer = form.preferredComputer;

      const res = await fetch(`${API_BASE}/api/pc-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Request failed');
      setMessage('PC request submitted');
      setForm({ desiredStart: '', desiredEnd: '', purpose: '', preferredComputer: '' });
      loadMyRequests();
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'student') {
    return <div className="pcm-container"><div className="pcm-note">Only students can request PCs.</div></div>;
  }

  return (
    <div className="pcm-container">
      <header className="pcm-header">
        <h2>PC Requests</h2>
      </header>

      <section className="pcm-card">
        <h3 className="pcm-card-title">New Request</h3>
        <form onSubmit={submit} className="pcm-form pcm-stack">
          <div className="pcm-grid pcm-grid-2">
            <label className="pcm-label-block">
              <span className="pcm-label">Start</span>
              <input type="datetime-local" className="pcm-input" value={form.desiredStart} onChange={e => setForm({ ...form, desiredStart: e.target.value })} required />
            </label>
            <label className="pcm-label-block">
              <span className="pcm-label">End</span>
              <input type="datetime-local" className="pcm-input" value={form.desiredEnd} onChange={e => setForm({ ...form, desiredEnd: e.target.value })} required />
            </label>
          </div>
          <label className="pcm-label-block">
            <span className="pcm-label">Purpose</span>
            <input type="text" className="pcm-input" placeholder="e.g., Lab work, data analysis" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
          </label>
          <label className="pcm-label-block">
            <span className="pcm-label">Preferred PC (optional)</span>
            <select className="pcm-input" value={form.preferredComputer} onChange={e => setForm({ ...form, preferredComputer: e.target.value })}>
              <option value="">No preference</option>
              {computers.map(c => (
                <option key={c._id} value={c._id}>{c.name} {c.location ? ` • ${c.location}` : ''}</option>
              ))}
            </select>
          </label>
          <div className="pcm-actions">
            <button className="pcm-btn pcm-btn-primary" type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit Request'}</button>
          </div>
          {error && <div className="pcm-alert pcm-alert-error">{error}</div>}
          {message && <div className="pcm-alert pcm-alert-ok">{message}</div>}
        </form>
      </section>

      <section className="pcm-card">
        <h3 className="pcm-card-title">Available PCs</h3>
        <div className="pcm-list">
          {computers.map(c => (
            <div key={c._id} className="pcm-item">
              <div className="pcm-item-main">
                <div className="pcm-item-title">{c.name}</div>
                <div className="pcm-item-meta">{c.location} • <span className={`status status-${c.status}`}>{c.status}</span></div>
              </div>
              {c.specs && <div className="pcm-item-sub">{c.specs}</div>}
              {Array.isArray(c.tags) && c.tags.length > 0 && (
                <div className="pcm-chips">
                  {c.tags.map(t => <span key={t} className="chip">{t}</span>)}
                </div>
              )}
              <div className="pcm-actions" style={{ justifyContent: 'space-between' }}>
                <div className="pcm-inline">
                  {form.preferredComputer === c._id && <span className="pcm-badge">Selected</span>}
                </div>
                <button type="button" className="pcm-btn" onClick={() => setForm({ ...form, preferredComputer: c._id })}>
                  Choose this PC
                </button>
              </div>
            </div>
          ))}
          {computers.length === 0 && <div className="pcm-empty">No active PCs at the moment.</div>}
        </div>
      </section>

      <section className="pcm-card">
        <h3 className="pcm-card-title">My Requests</h3>
        <div className="pcm-list">
          {requests.map(r => (
            <div key={r._id} className="pcm-item">
              <div className="pcm-item-main">
                <div className="pcm-item-title">{r.purpose}</div>
                <div className="pcm-item-meta">{new Date(r.desiredStart).toLocaleString()} → {new Date(r.desiredEnd).toLocaleString()}</div>
              </div>
              <div className="pcm-row pcm-row-wrap pcm-gap">
                <div className={`pcm-badge status status-${r.status}`}>{r.status}</div>
                {r.preferredComputer && <div className="pcm-badge">Preferred: {r.preferredComputer?.name}</div>}
                {r.computer && <div className="pcm-badge">Allocated: {r.computer?.name}</div>}
              </div>
              {r.slotStart && <div className="pcm-item-sub"><b>Slot:</b> {new Date(r.slotStart).toLocaleString()} → {new Date(r.slotEnd).toLocaleString()}</div>}
              {r.adminNote && <div className="pcm-note"><b>Note:</b> {r.adminNote}</div>}
            </div>
          ))}
          {requests.length === 0 && <div className="pcm-empty">No requests yet.</div>}
        </div>
      </section>
    </div>
  );
}
