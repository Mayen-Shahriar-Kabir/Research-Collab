import React, { useEffect, useState } from 'react';

export default function RoleRequest({ user, setUser }) {
  const [desiredRole, setDesiredRole] = useState('student');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user?.roleRequest) {
      setStatus(`Pending request: ${user.roleRequest}`);
      setDesiredRole(user.roleRequest);
    }
  }, [user]);

  if (!user) return <div className="page">Please log in.</div>;
  if (user.role === 'admin') return <div className="page">Admins cannot request roles.</div>;

  const submitRequest = async () => {
    setStatus('');
    try {
      const res = await fetch('http://localhost:5001/api/role/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: desiredRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request role');
      setStatus(`Requested: ${data.roleRequest}`);
      // update local user state to reflect roleRequest
      const updated = { ...user, roleRequest: data.roleRequest };
      setUser?.(updated);
      try {
        localStorage.setItem('user', JSON.stringify(updated));
      } catch (e) {
        // ignore storage errors
      }
    } catch (e) {
      setStatus(e.message);
    }
  };

  return (
    <div className="page role-request">
      <h2 className="page-title">Request a Role</h2>
      <div className="card request-card">
        <p className="meta"><strong>Current role:</strong> {user.role}</p>
        {user.roleRequest && (
          <p className="meta"><strong>Pending request:</strong> {user.roleRequest}</p>
        )}
        <div className="controls">
          <select value={desiredRole} onChange={e => setDesiredRole(e.target.value)}>
            <option value="student">student</option>
            <option value="faculty">faculty</option>
          </select>
          <button className="btn btn-primary" onClick={submitRequest} disabled={!!user.roleRequest}>
            {user.roleRequest ? 'Request Pending' : 'Submit Request'}
          </button>
        </div>
        {status && <p className="status">{status}</p>}
      </div>
    </div>
  );
}
