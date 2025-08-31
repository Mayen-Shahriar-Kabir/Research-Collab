import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RoleRequest() {
  const { currentUser, setCurrentUser } = useAuth();
  const [desiredRole, setDesiredRole] = useState('student');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.roleRequest) {
      setStatus(`Pending request: ${currentUser.roleRequest}`);
      setDesiredRole(currentUser.roleRequest);
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }
  
  if (currentUser.role === 'admin') {
    return <div className="page">Admins cannot request roles.</div>;
  }

  const submitRequest = async () => {
    if (isSubmitting) return;
    
    setStatus('');
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const userId = currentUser._id || currentUser.id;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const response = await fetch('http://localhost:5001/api/auth/role/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId,
          role: desiredRole 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request role');
      }
      
      // Update the current user's role request status in both state and localStorage
      const updatedUser = { 
        ...currentUser, 
        roleRequest: data.roleRequest || desiredRole
      };
      
      // Update context
      setCurrentUser(updatedUser);
      
      // Update localStorage
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error('Error saving user to localStorage:', e);
        throw new Error('Failed to save user data. Please try again.');
      }
      
      setStatus(`Successfully requested role: ${desiredRole}`);
    } catch (e) {
      console.error('Role request error:', e);
      setStatus(`Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page role-request">
      <h2 className="page-title">Request a Role</h2>
      <div className="card request-card">
        <p className="meta"><strong>Current role:</strong> {currentUser.role}</p>
        {currentUser.roleRequest && (
          <p className="meta"><strong>Pending request:</strong> {currentUser.roleRequest}</p>
        )}
        <div className="controls">
          <select value={desiredRole} onChange={e => setDesiredRole(e.target.value)}>
            <option value="student">student</option>
            <option value="faculty">faculty</option>
          </select>
          <button 
            onClick={submitRequest} 
            className="btn btn-primary"
            disabled={isSubmitting || !!currentUser.roleRequest}
          >
            {isSubmitting ? 'Submitting...' : 'Request Role'}
          </button>
        </div>
        {status && <p className="status">{status}</p>}
      </div>
    </div>
  );
}
