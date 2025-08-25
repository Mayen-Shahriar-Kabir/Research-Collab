import React, { useEffect, useState } from 'react';

export default function BookmarksPage({ userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) fetchBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchBookmarks() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/bookmarks/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json() : await res.text();
      if (!res.ok) throw new Error((isJson && data?.message) || (typeof data === 'string' ? data : 'Failed to load bookmarks'));
      setItems(data.bookmarks || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeBookmark(projectId) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/bookmarks`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, projectId })
      });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json() : await res.text();
      if (!res.ok) throw new Error((isJson && data?.message) || (typeof data === 'string' ? data : 'Failed to remove'));
      // refetch
      fetchBookmarks();
    } catch (e) {
      alert(e.message);
    }
  }

  if (!userId) return <div className="page">Please log in.</div>;
  if (loading) return <div className="page">Loading bookmarks...</div>;

  return (
    <div className="page">
      <h2 className="page-title">Bookmarked Projects</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.length === 0 && <div className="card">No bookmarks yet.</div>}
        {items.map(p => (
          <div key={p._id} className="card" style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{p.title}</strong>
                <div style={{ fontSize: 13, color: '#666' }}>{p.domain}</div>
              </div>
              <span className={`status-badge ${p.status}`}>{p.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" onClick={() => removeBookmark(p._id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
