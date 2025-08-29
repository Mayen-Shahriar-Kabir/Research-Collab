import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function NotificationsPage({ userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchNotifications() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5001/api/notifications?userId=${encodeURIComponent(userId)}`);
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json() : await res.text();
      if (!res.ok) throw new Error((isJson && data?.message) || (typeof data === 'string' ? data : 'Failed to load notifications'));
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRead(id, read) {
    try {
      const res = await fetch(`http://localhost:5001/api/notifications/${id}/${read ? 'unread' : 'read'}`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to update');
      fetchNotifications();
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(id) {
    try {
      const res = await fetch(`http://localhost:5001/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setItems(prev => prev.filter(n => n._id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  if (!userId) return <div className="page">Please log in.</div>;
  if (loading) return <div className="page">Loading notifications...</div>;

  return (
    <div className="page">
      <h2 className="page-title">Notifications</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.length === 0 && <div className="card">No notifications.</div>}
        {items.map(n => (
          <div key={n._id} className="card" style={{ display: 'grid', gap: 8, opacity: n.read ? 0.75 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{n.title || 'Notification'}</strong>
                <div style={{ fontSize: 12, color: '#666' }}>{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {n.read && <span className="status-badge done">Read</span>}
            </div>
            <div>{n.body}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {n.link && (
                <Link to={n.link.startsWith('/') ? n.link : `/${n.link}`} className="btn">
                  Open
                </Link>
              )}
              <button className="btn" onClick={() => toggleRead(n._id, n.read)}>{n.read ? 'Mark Unread' : 'Mark Read'}</button>
              <button className="btn btn-danger" onClick={() => remove(n._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
