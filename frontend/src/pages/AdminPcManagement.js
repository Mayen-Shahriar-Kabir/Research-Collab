import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPcManagement.css';

export default function AdminPcManagement() {
  const { currentUser: user } = useAuth();
  const API_BASE = useMemo(() => ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, '')), []);

  const [computers, setComputers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', location: '', specs: '', status: 'active', tags: '' });
  const [alloc, setAlloc] = useState({ requestId: '', computerId: '', slotStart: '', slotEnd: '', adminNote: '' });
  const [userAlloc, setUserAlloc] = useState({ userId: '', computerId: '', startTime: '', endTime: '', purpose: '' });
  const [filterStatus, setFilterStatus] = useState('pending');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  const [allocations, setAllocations] = useState([]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Error loading users:', data);
        return;
      }
      setUsers(Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : []));
    } catch (e) {
      console.error('Network error loading users:', e);
    }
  };

  const loadComputers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Loading computers with token:', token ? 'present' : 'missing');
      const res = await fetch(`${API_BASE}/api/computers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      console.log('Computers API response:', res.status, data);
      if (!res.ok) {
        console.error('Error loading computers:', data);
        setError(data.message || 'Failed to load computers');
        return;
      }
      setComputers(Array.isArray(data) ? data : (Array.isArray(data?.computers) ? data.computers : []));
    } catch (e) {
      console.error('Network error loading computers:', e);
      setError('Failed to load computers');
    }
  };

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Loading PC requests with token:', token ? 'present' : 'missing', 'status:', filterStatus);
      const res = await fetch(`${API_BASE}/api/pc-requests?status=${encodeURIComponent(filterStatus)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      console.log('PC requests API response:', res.status, data);
      if (!res.ok) {
        console.error('Error loading requests:', data);
        setError(data.message || 'Failed to load requests');
        return;
      }
      setRequests(Array.isArray(data) ? data : (Array.isArray(data?.requests) ? data.requests : []));
    } catch (e) {
      console.error('Network error loading requests:', e);
      setError('Failed to load requests');
    }
  };

  const loadAllocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/pc-requests?status=approved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Error loading allocations:', data);
        return;
      }
      setAllocations(Array.isArray(data) ? data : (Array.isArray(data?.requests) ? data.requests : []));
    } catch (e) {
      console.error('Network error loading allocations:', e);
    }
  };

  useEffect(() => {
    loadComputers();
    loadUsers();
    loadAllocations();
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
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/computers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
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

  const approveRequest = async () => {
    if (!alloc.requestId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/pc-requests/${alloc.requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alloc)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Approval failed');
      setMessage('Request approved');
      setAlloc({ requestId: '', computerId: '', slotStart: '', slotEnd: '', adminNote: '' });
      loadRequests();
    } catch (e) { setError(e.message); }
  };

  const rejectRequest = async (requestId) => {
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/pc-requests/${encodeURIComponent(requestId)}/reject`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ adminNote: 'Not available' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Reject failed');
      setMessage('Request rejected');
      loadRequests();
    } catch (e) { setError(e.message); }
  };

  const allocateUserToComputer = async () => {
    if (!userAlloc.userId || !userAlloc.computerId || !userAlloc.startTime || !userAlloc.endTime) {
      setError('Please fill all allocation fields');
      return;
    }
    
    setError('');
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/allocate-pc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userAlloc.userId,
          computerId: userAlloc.computerId,
          startTime: userAlloc.startTime,
          endTime: userAlloc.endTime,
          purpose: userAlloc.purpose || 'Admin direct allocation'
        })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Allocation failed');
      
      setMessage('User allocated to computer successfully');
      setUserAlloc({ userId: '', computerId: '', startTime: '', endTime: '', purpose: '' });
      loadRequests();
      loadAllocations();
    } catch (e) {
      setError(e.message);
    }
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

      {/* Tab Navigation */}
      <div className="pcm-tabs">
        <button 
          className={`pcm-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          PC Requests
        </button>
        <button 
          className={`pcm-tab ${activeTab === 'computers' ? 'active' : ''}`}
          onClick={() => setActiveTab('computers')}
        >
          Manage Computers
        </button>
        <button 
          className={`pcm-tab ${activeTab === 'allocate' ? 'active' : ''}`}
          onClick={() => setActiveTab('allocate')}
        >
          Allocate User
        </button>
      </div>

      {activeTab === 'computers' && (
        <>
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
        </>
      )}

      {activeTab === 'allocate' && (
        <section className="pcm-card">
          <h3 className="pcm-card-title">Allocate User to Computer</h3>
          <div className="pcm-form">
            <div className="pcm-grid pcm-grid-2">
              <select className="pcm-input" value={userAlloc.userId} onChange={e => setUserAlloc(u => ({ ...u, userId: e.target.value }))}>
                <option value="">Select User</option>
                {users.filter(u => u.role === 'student').map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <select className="pcm-input" value={userAlloc.computerId} onChange={e => setUserAlloc(u => ({ ...u, computerId: e.target.value }))}>
                <option value="">Select Computer</option>
                {computers.filter(c => c.status === 'active').map(c => (
                  <option key={c._id} value={c._id}>{c.name} — {c.location}</option>
                ))}
              </select>
            </div>
            <div className="pcm-grid pcm-grid-2">
              <input className="pcm-input" type="datetime-local" placeholder="Start Time" value={userAlloc.startTime} onChange={e => setUserAlloc(u => ({ ...u, startTime: e.target.value }))} />
              <input className="pcm-input" type="datetime-local" placeholder="End Time" value={userAlloc.endTime} onChange={e => setUserAlloc(u => ({ ...u, endTime: e.target.value }))} />
            </div>
            <input className="pcm-input" placeholder="Purpose (optional)" value={userAlloc.purpose} onChange={e => setUserAlloc(u => ({ ...u, purpose: e.target.value }))} />
            <div className="pcm-actions">
              <button className="pcm-btn pcm-btn-primary" onClick={allocateUserToComputer} disabled={!userAlloc.userId || !userAlloc.computerId || !userAlloc.startTime || !userAlloc.endTime}>
                Allocate User
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'requests' && (
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
                      <button className="pcm-btn pcm-btn-primary" onClick={approveRequest} disabled={!alloc.requestId || !alloc.computerId || !alloc.slotStart || !alloc.slotEnd}>Approve</button>
                      <button className="pcm-btn pcm-btn-ghost" onClick={() => rejectRequest(r._id)}>Reject</button>
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
      )}
    </div>
  );
}
