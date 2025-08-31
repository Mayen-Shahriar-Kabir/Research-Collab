import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
  const { currentUser: user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  console.log('Current user in AdminUsers:', user);
  console.log('Is admin:', isAdmin);

  const fetchUsers = async () => {
    if (!isAdmin) {
      console.log('Not an admin user');
      return;
    }
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching users with token:', token ? 'Token exists' : 'No token found');
      
      const response = await fetch('http://localhost:5001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to load users: ${response.statusText}`);
      }
      
      // Handle both array and object with users property
      const usersList = Array.isArray(data) ? data : (data.users || []);
      console.log('Users list:', usersList);
      setUsers(usersList);
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
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const res = await fetch(`http://localhost:5001/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to set role: ${res.statusText}`);
      }
      
      setUsers(prev => prev.map(u => u._id === targetUserId ? { 
        ...u, 
        role, 
        roleRequest: null 
      } : u));
    } catch (e) {
      alert(e.message);
    }
  };

  const freezeUser = async (targetUserId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const res = await fetch(`http://localhost:5001/api/admin/users/${targetUserId}/freeze`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to freeze user: ${res.statusText}`);
      }
      
      setUsers(prev => prev.map(u => u._id === targetUserId ? { ...u, frozen: true } : u));
      alert(data.message || 'User frozen successfully');
    } catch (e) {
      alert(e.message);
    }
  };

  const unfreezeUser = async (targetUserId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const res = await fetch(`http://localhost:5001/api/admin/users/${targetUserId}/unfreeze`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to unfreeze user: ${res.statusText}`);
      }
      
      setUsers(prev => prev.map(u => u._id === targetUserId ? { ...u, frozen: false } : u));
      alert(data.message || 'User unfrozen successfully');
    } catch (e) {
      alert(e.message);
    }
  };

  if (!isAdmin) return <div className="page">Only admins can view this page.</div>;
  if (loading) return <div className="page">Loading users... {error && <div className="error">{error}</div>}</div>;

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
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ backgroundColor: u.frozen ? '#ffebee' : 'transparent' }}>
                    <td>{u.name || '-'}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <span className={`status-badge ${u.frozen ? 'frozen' : 'active'}`}>
                        {u.frozen ? 'Frozen' : 'Active'}
                      </span>
                    </td>
                    <td>{u.roleRequest || '-'}</td>
                    <td className="actions-cell">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={u.role}
                          onChange={e => setRole(u._id, e.target.value)}
                          disabled={u.role === 'admin'}
                        >
                          <option value="student">student</option>
                          <option value="faculty">faculty</option>
                          <option value="admin">admin</option>
                        </select>
                        {u.role !== 'admin' && (
                          u.frozen ? (
                            <button 
                              className="btn btn-success" 
                              onClick={() => unfreezeUser(u._id)}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Unfreeze
                            </button>
                          ) : (
                            <button 
                              className="btn btn-danger" 
                              onClick={() => freezeUser(u._id)}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Freeze
                            </button>
                          )
                        )}
                      </div>
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
