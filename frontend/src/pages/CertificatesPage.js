import React, { useEffect, useState } from 'react';

const CertificatesPage = ({ userId }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, ''));
  const apiUrl = `${API_BASE}/api`;
  const token = localStorage.getItem('token');
  const studentId = userId;

  useEffect(() => {
    if (!studentId) return;
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${apiUrl}/certificates/student/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load certificates');
        setCertificates(Array.isArray(data?.certificates) ? data.certificates : []);
      } catch (err) {
        setError(err.message || 'Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [studentId]);

  return (
    <div className="container" style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>My Certificates</h1>
      {error && (
        <div style={{ background: '#fee', color: '#900', padding: 10, borderRadius: 6, marginBottom: 12 }}>
          {error}
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : certificates.length === 0 ? (
        <p>No certificates yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {certificates.map(c => (
            <div key={c._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 8px' }}>{c.title || 'Project Completion Certificate'}</h3>
              <p style={{ margin: '4px 0' }}><strong>Project:</strong> {c.project?.title || '—'}</p>
              <p style={{ margin: '4px 0' }}><strong>Issued by:</strong> {c.faculty?.name} ({c.faculty?.email})</p>
              {c.note && <p style={{ margin: '6px 0' }}><strong>Note:</strong> {c.note}</p>}
              <p style={{ margin: '4px 0', color: '#555' }}><small>Issued on {new Date(c.issuedAt || c.createdAt).toLocaleString()}</small></p>
              {c.fileUrl && (
                <a href={`${API_BASE}${c.fileUrl}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8 }}>View Certificate</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
