import React, { useEffect, useMemo, useState } from 'react';
import './AdminPcManagement.css';

export default function AdminPcManagement({ user }) {
  const API_BASE = useMemo(() => ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, '')), []);

  const [computers, setComputers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ name: '', location: '', specs: '', status: 'active', tags: '' });
  const [alloc, setAlloc] = useState({ requestId: '', computerId: '', slotStart: '', slotEnd: '', adminNote: '' });
  const [filterStatus, setFilterStatus] = useState('pending');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const adminId = user?._id || user?.id;

  const loadComputers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/computers`);
      const data = await res.json();
      setComputers(Array.isArray(data) ? data : (Array.isArray(data?.computers) ? data.computers : []));
    } catch (e) { /* ignore */ }
  };

  const loadRequests = async () => {
    if (!adminId) return;
    try {
      const res = await fetch(`${API_BASE}/api/pc-requests?adminId=${encodeURIComponent(adminId)}&status=${encodeURIComponent(filterStatus)}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : (Array.isArray(data?.requests) ? data.requests : []));
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    loadComputers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, user]);

  const createComputer = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const body = {
        adminId,
        name: form.name,
        location: form.location,
        specs: form.specs,
        status: form.status,
        tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      const res = await fetch(`${API_BASE}/api/computers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Create failed');
      setMessage('Computer created');
      setForm({ name: '', location: '', specs: '', status: 'active', tags: '' });
      loadComputers();
    } catch (e) {
      setError(e.message);
    }
  };

  const approve = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const body = {
        adminId,
        computerId: alloc.computerId,
        slotStart: alloc.slotStart ? new Date(alloc.slotStart).toISOString() : '',
        slotEnd: alloc.slotEnd ? new Date(alloc.slotEnd).toISOString() : '',
        adminNote: alloc.adminNote || ''
      };
      const res = await fetch(`${API_BASE}/api/pc-requests/${encodeURIComponent(alloc.requestId)}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Approval failed');
      setMessage('Request approved');
      setAlloc({ requestId: '', computerId: '', slotStart: '', slotEnd: '', adminNote: '' });
      loadRequests();
    } catch (e) { setError(e.message); }
  };

  const reject = async (requestId) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/pc-requests/${encodeURIComponent(requestId)}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, adminNote: 'Not available' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Reject failed');
      setMessage('Request rejected');
      loadRequests();
    } catch (e) { setError(e.message); }
  };

  if (!user || user.role !== 'admin') {
    return <div className="pcm-container"><div className="pcm-note">Only admins can access this page.</div></div>;
  }

  return (
    <div className="pcm-container">
      <header className="pcm-header">
        <h2>PC Management</h2>
        {error && <div className="pcm-alert pcm-alert-error">{error}</div>}
        {message && <div className="pcm-alert pcm-alert-ok">{message}</div>}
      </header>

      <section className="pcm-card">
        <h3 className="pcm-card-title">Add Computer</h3>
        <form onSubmit={createComputer} className="pcm-form">
          <div className="pcm-grid pcm-grid-2">
            <input className="pcm-input" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input className="pcm-input" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
          <input className="pcm-input" placeholder="Specs" value={form.specs} onChange={e => setForm(f => ({ ...f, specs: e.target.value }))} />
          <div className="pcm-grid pcm-grid-2">
            <select className="pcm-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">active</option>
              <option value="maintenance">maintenance</option>
              <option value="retired">retired</option>
            </select>
            <input className="pcm-input" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
          <div className="pcm-actions">
            <button className="pcm-btn pcm-btn-primary" type="submit">Create</button>
          </div>
        </form>
      </section>

      <section className="pcm-card">
        <h3 className="pcm-card-title">Computers</h3>
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
            </div>
          ))}
          {computers.length === 0 && <div className="pcm-empty">No computers found.</div>}
        </div>
      </section>

      <section className="pcm-card">
        <div className="pcm-row pcm-row-between pcm-row-center">
          <h3 className="pcm-card-title">PC Requests</h3>
          <label className="pcm-inline">
            <span className="pcm-label">Filter</span>
            <select className="pcm-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
        </div>

        <div className="pcm-list">
          {requests.map(r => (
            <div key={r._id} className="pcm-item">
              <div className="pcm-item-main">
                <div className="pcm-item-title">{r.purpose}</div>
                <div className="pcm-item-meta">{new Date(r.desiredStart).toLocaleString()} → {new Date(r.desiredEnd).toLocaleString()}</div>
              </div>
              <div className="pcm-row pcm-row-wrap pcm-gap">
                <div className="pcm-badge">{r.student?.name || r.student}</div>
                <div className={`pcm-badge status status-${r.status}`}>{r.status}</div>
              </div>
              {r.status === 'pending' && (
                <div className="pcm-stack">
                  <div className="pcm-grid pcm-grid-4">
                    <select className="pcm-input" value={alloc.computerId} onChange={e => setAlloc(a => ({ ...a, computerId: e.target.value, requestId: r._id }))}>
                      <option value="">Select Computer</option>
                      {computers.filter(c => c.status === 'active').map(c => (
                        <option key={c._id} value={c._id}>{c.name} — {c.location}</option>
                      ))}
                    </select>
                    <input className="pcm-input" type="datetime-local" value={alloc.slotStart} onChange={e => setAlloc(a => ({ ...a, slotStart: e.target.value, requestId: r._id }))} />
                    <input className="pcm-input" type="datetime-local" value={alloc.slotEnd} onChange={e => setAlloc(a => ({ ...a, slotEnd: e.target.value, requestId: r._id }))} />
                    <input className="pcm-input" placeholder="Admin note" value={alloc.adminNote} onChange={e => setAlloc(a => ({ ...a, adminNote: e.target.value, requestId: r._id }))} />
                  </div>
                  <div className="pcm-actions">
                    <button className="pcm-btn pcm-btn-primary" onClick={approve} disabled={!alloc.requestId || !alloc.computerId || !alloc.slotStart || !alloc.slotEnd}>Approve</button>
                    <button className="pcm-btn pcm-btn-ghost" onClick={() => reject(r._id)}>Reject</button>
                  </div>
                </div>
              )}
              {r.status === 'approved' && r.computer && (
                <div className="pcm-approved">
                  <div><b>Allocated PC:</b> {r.computer.name || r.computer}</div>
                  <div><b>Slot:</b> {new Date(r.slotStart).toLocaleString()} → {new Date(r.slotEnd).toLocaleString()}</div>
                </div>
              )}
              {r.adminNote && <div className="pcm-note"><b>Note:</b> {r.adminNote}</div>}
            </div>
          ))}
          {requests.length === 0 && <div className="pcm-empty">No requests.</div>}
        </div>
      </section>
    </div>
  );
}
