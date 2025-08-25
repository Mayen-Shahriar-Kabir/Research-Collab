import React, { useEffect, useState } from 'react';

export default function AdminUsers({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setError('');
    try {
      const res = await fetch(`http://localhost:5001/api/users?adminId=${user.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load users');
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setRole = async (targetUserId, role) => {
    try {
      const res = await fetch(`http://localhost:5001/api/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to set role');
      setUsers(prev => prev.map(u => u._id === targetUserId ? { ...u, role, roleRequest: null } : u));
    } catch (e) {
      alert(e.message);
    }
  };

  if (!isAdmin) return <div className="page">Only admins can view this page.</div>;
  if (loading) return <div className="page">Loading users...</div>;

  return (
    <div className="page admin-users">
      <h2 className="page-title">Admin: Manage Users</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card" style={{ marginTop: 16 }}>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{u.name || '-'}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.roleRequest || '-'}</td>
                    <td className="actions-cell">
                      <select
                        value={u.role}
                        onChange={e => setRole(u._id, e.target.value)}
                      >
                        <option value="student">student</option>
                        <option value="faculty">faculty</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
