import React, { useEffect, useState } from 'react';

export default function ApplicationsReview({ user }) {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    if (user?.id) fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filter]);

  if (!user) return <div className="page">Please log in.</div>;
  if (user.role !== 'faculty' && user.role !== 'admin') {
    return <div className="page">Only faculty/admin can review applications.</div>;
  }

  async function fetchApps() {
    setLoading(true);
    setError('');
    try {
      const url = new URL('http://localhost:5001/api/applications');
      url.searchParams.set('facultyId', user.id);
      if (filter) url.searchParams.set('status', filter);
      const res = await fetch(url.toString());
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json() : await res.text();
      if (!res.ok) throw new Error((isJson && data?.message) || (typeof data === 'string' ? data : 'Failed to fetch applications'));
      setApps(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, action) {
    try {
      const res = await fetch(`http://localhost:5001/api/applications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyId: user.id, action })
      });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json() : await res.text();
      if (!res.ok) throw new Error((isJson && data?.message) || (typeof data === 'string' ? data : 'Failed to update'));
      // Refresh list
      fetchApps();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="page">
      <h2 className="page-title">Applications Review</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-control" style={{ maxWidth: 240 }}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchApps}>Refresh</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div>Loading applications...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {apps.length === 0 && <div className="card">No applications found.</div>}
          {apps.map((app) => (
            <div key={app._id} className="card" style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{app.student?.name || app.student?.email}</strong>
                  <div style={{ fontSize: 13, color: '#666' }}>{app.student?.email}</div>
                </div>
                <span className={`status-badge ${app.status}`}>{app.status}</span>
              </div>

              <div>
                <div><strong>Project:</strong> {app.project?.title}</div>
                <div><strong>Domain:</strong> {app.project?.domain}</div>
              </div>

              {app.message && (
                <div>
                  <strong>Message:</strong>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{app.message}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {app.status !== 'accepted' && (
                  <button className="btn btn-success" onClick={() => updateStatus(app._id, 'accept')}>Accept</button>
                )}
                {app.status !== 'rejected' && (
                  <button className="btn btn-danger" onClick={() => updateStatus(app._id, 'reject')}>Reject</button>
                )}
                {app.status !== 'shortlisted' && (
                  <button className="btn btn-secondary" onClick={() => updateStatus(app._id, 'shortlist')}>Shortlist</button>
                )}
              </div>

              <div style={{ fontSize: 12, color: '#777' }}>
                Applied on {new Date(app.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
