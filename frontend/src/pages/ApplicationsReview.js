import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ApplicationsReview() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [showCgpaModal, setShowCgpaModal] = useState(false);
  const [cgpaRange, setCgpaRange] = useState({ min: '', max: '' });
  const [cgpaFilter, setCgpaFilter] = useState({ min: '', max: '' });
  const [debugInfo, setDebugInfo] = useState({});

  const fetchApps = useCallback(async () => {
    if (!currentUser?.id) {
      console.error('No current user ID found');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const url = new URL('http://localhost:5001/api/applications');
      url.searchParams.set('facultyId', currentUser.id);
      if (filter) url.searchParams.set('status', filter);
      if (cgpaFilter.min) url.searchParams.set('minCgpa', cgpaFilter.min);
      if (cgpaFilter.max) url.searchParams.set('maxCgpa', cgpaFilter.max);
      
      console.log('Fetching applications from:', url.toString());
      console.log('Current user ID:', currentUser.id);
      console.log('Current filter:', filter);
      
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      const isJson = (response.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await response.json() : await response.text();
      
      if (!response.ok) {
        const errorMessage = isJson 
          ? (data.message || `Server error: ${response.status}`)
          : `Server error: ${response.status} ${response.statusText}`;
        console.error('Error response:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('Fetched applications data:', data);
      console.log('Number of applications:', Array.isArray(data) ? data.length : 'Not an array');
      setApps(Array.isArray(data) ? data : []);
      
      // Store debug info
      setDebugInfo({
        facultyId: currentUser.id,
        filter,
        cgpaFilter,
        responseCount: Array.isArray(data) ? data.length : 0,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [currentUser, filter, cgpaFilter]);

  const handleCgpaFilter = () => {
    setCgpaFilter({ min: cgpaRange.min, max: cgpaRange.max });
    setShowCgpaModal(false);
    // fetchApps will be called automatically due to useEffect dependency
  };

  const clearCgpaFilter = () => {
    setCgpaFilter({ min: '', max: '' });
    setCgpaRange({ min: '', max: '' });
  };

  async function updateApplicationStatus(appId, action) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, facultyId: currentUser.id })
      });
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : await res.text();
      if (!res.ok) throw new Error((isJson && data?.message) || (typeof data === 'string' ? data : 'Failed to update'));
      // Refresh list
      fetchApps();
      alert(`Application ${action}ed successfully!`);
    } catch (e) {
      alert(e.message);
    }
  }

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    fetchApps();
  }, [currentUser, fetchApps]);

  if (!currentUser) {
    return <div className="page">Please log in to view applications.</div>;
  }
  
  if (currentUser.role !== 'faculty' && currentUser.role !== 'admin') {
    return <div className="page">Only faculty and administrators can review applications.</div>;
  }

  return (
    <div className="page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title">Research Project Applications</h2>
        {debugInfo.lastUpdated && (
          <small className="text-muted" style={{ fontSize: '0.8rem' }}>
            Last updated: {new Date(debugInfo.lastUpdated).toLocaleString()}
          </small>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ minWidth: '200px' }}>
              <label className="form-label">Filter by Status</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
                className="form-select"
                disabled={loading}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="form-label">CGPA Range</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min CGPA"
                  value={cgpaFilter.min}
                  onChange={(e) => setCgpaFilter({...cgpaFilter, min: e.target.value})}
                  min="0"
                  max="4"
                  step="0.01"
                  style={{ width: '100px' }}
                  disabled={loading}
                />
                <span style={{ display: 'flex', alignItems: 'center' }}>to</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max CGPA"
                  value={cgpaFilter.max}
                  onChange={(e) => setCgpaFilter({...cgpaFilter, max: e.target.value})}
                  min="0"
                  max="4"
                  step="0.01"
                  style={{ width: '100px' }}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button 
                className="btn btn-primary"
                onClick={fetchApps}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                  </>
                ) : 'Apply Filters'}
              </button>
              
              {(cgpaFilter.min || cgpaFilter.max) && (
                <button 
                  className="btn btn-outline-secondary"
                  onClick={clearCgpaFilter}
                  disabled={loading}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div>Loading applications...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {apps.length === 0 && (
            <div className="card">
              <div className="card-body">
                <h5>No applications found</h5>
                <p className="mb-0">
                  {filter ? `No ${filter} applications found. ` : 'No applications found. '}
                  Try adjusting your filters or check back later.
                </p>
                <button 
                  className="btn btn-link p-0 mt-2" 
                  onClick={() => {
                    setFilter('');
                    setCgpaFilter({ min: '', max: '' });
                  }}
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
          {apps.map((app) => (
            <div key={app._id} className="card" style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '16px' }}>{app.student?.name || app.student?.email}</strong>
                    <div style={{ fontSize: 13, color: '#666' }}>{app.student?.email}</div>
                  </div>
                  
                  {/* Academic Details Section */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px'
                  }}>
                    {app.student?.cgpa && (
                      <div>
                        <strong style={{ color: '#495057' }}>CGPA:</strong>
                        <span style={{ color: '#28a745', fontWeight: 'bold', marginLeft: '8px' }}>
                          {app.student.cgpa.toFixed(2)}/4.0
                        </span>
                      </div>
                    )}
                    {app.student?.institution && (
                      <div>
                        <strong style={{ color: '#495057' }}>Institution:</strong>
                        <span style={{ marginLeft: '8px' }}>{app.student.institution}</span>
                      </div>
                    )}
                    {app.student?.program && (
                      <div>
                        <strong style={{ color: '#495057' }}>Program:</strong>
                        <span style={{ marginLeft: '8px' }}>{app.student.program}</span>
                      </div>
                    )}
                    {app.student?.department && (
                      <div>
                        <strong style={{ color: '#495057' }}>Department:</strong>
                        <span style={{ marginLeft: '8px' }}>{app.student.department}</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`status-badge ${app.status}`}>{app.status}</span>
              </div>

              <div>
                <div><strong>Project:</strong> {app.project?.title}</div>
                <div><strong>Domain:</strong> {app.project?.domain}</div>
                {app.student?.academicInterests && app.student.academicInterests.length > 0 && (
                  <div><strong>Interests:</strong> {app.student.academicInterests.join(', ')}</div>
                )}
              </div>

              {app.message && (
                <div>
                  <strong>Message:</strong>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{app.message}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {app.status !== 'accepted' && (
                  <button className="btn btn-success" onClick={() => updateApplicationStatus(app._id, 'accept')}>Accept</button>
                )}
                {app.status !== 'rejected' && (
                  <button className="btn btn-danger" onClick={() => updateApplicationStatus(app._id, 'reject')}>Reject</button>
                )}
                {app.status !== 'shortlisted' && (
                  <button className="btn btn-secondary" onClick={() => updateApplicationStatus(app._id, 'shortlist')}>Shortlist</button>
                )}
              </div>

              <div style={{ fontSize: 12, color: '#777' }}>
                Applied on {new Date(app.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CGPA Filter Modal */}
      {showCgpaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Filter by CGPA Range</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Minimum CGPA:
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  placeholder="e.g., 3.0"
                  value={cgpaRange.min}
                  onChange={(e) => setCgpaRange({ ...cgpaRange, min: e.target.value })}
                  className="form-control"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Maximum CGPA:
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  placeholder="e.g., 4.0"
                  value={cgpaRange.max}
                  onChange={(e) => setCgpaRange({ ...cgpaRange, max: e.target.value })}
                  className="form-control"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowCgpaModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleCgpaFilter}
                  disabled={!cgpaRange.min && !cgpaRange.max}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
