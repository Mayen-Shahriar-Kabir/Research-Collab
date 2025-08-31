import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MatchingSuggestions.css';

// Normalize API base URL
const API_BASE = ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
  .replace(/\/$/, '')
  .replace(/\/api$/, ''));

const MatchingSuggestions = ({ userId, userRole }) => {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    // Use currentUser from AuthContext as fallback
    const effectiveUserId = userId || currentUser?.id;
    const effectiveUserRole = userRole || currentUser?.role;
    
    console.log('MatchingSuggestions useEffect - effectiveUserId:', effectiveUserId, 'effectiveUserRole:', effectiveUserRole);
    
    if (effectiveUserId && effectiveUserRole) {
      fetchMatches(effectiveUserId, effectiveUserRole);
    } else {
      console.log('Missing user data - waiting for auth context');
      setLoading(false);
      setError('Please log in to view matching suggestions.');
    }
  }, [userId, userRole, currentUser]);

  const fetchMatches = async (effectiveUserId, effectiveUserRole) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const targetUserId = effectiveUserId || userId;
      const targetUserRole = effectiveUserRole || userRole;

      console.log('Fetching matches from:', `${API_BASE}/api/matching/suggestions/${targetUserId}?role=${targetUserRole}`);
      console.log('Token exists:', !!token);
      console.log('TargetUserId:', targetUserId, 'TargetUserRole:', targetUserRole);
      
      const response = await fetch(`${API_BASE}/api/matching/suggestions/${targetUserId}?role=${targetUserRole}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        setMatches(data.matches || []);
        if (data.message) {
          setError(data.message);
        }
      } else {
        console.error('API Error:', data);
        setError(data.message || `Failed to fetch matches (${response.status})`);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (commonInterestsCount) => {
    return '#4CAF50'; // Green for all matches since they have common interests
  };

  if (loading) {
    return (
      <div className="matching-suggestions">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading matching suggestions...</p>
        </div>
      </div>
    );
  }

  if (error && matches.length === 0) {
    return (
      <div className="matching-suggestions">
        <div className="error-message">
          <h3>No Matches Available</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matching-suggestions">
      <div className="suggestions-header">
        <h2>
          {userRole === 'student' ? 'Recommended Faculty' : 'Recommended Students'}
        </h2>
        <button onClick={fetchMatches} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="no-matches">
          <p>No matches found. Try updating your academic interests in your profile.</p>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((match, index) => {
            const person = userRole === 'student' ? match.faculty : match.student;
            return (
              <div key={person._id} className="match-card">
                <div className="match-header">
                  <div className="profile-info">
                    {person.profilePhoto ? (
                      <img 
                        src={`${API_BASE}${person.profilePhoto}`} 
                        alt={person.name}
                        className="profile-photo"
                      />
                    ) : (
                      <div className="profile-placeholder">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="person-details">
                      <h3>{person.name}</h3>
                      <p className="department">{person.department}</p>
                      {userRole === 'faculty' && person.program && (
                        <p className="program">{person.program}</p>
                      )}
                      {userRole === 'faculty' && person.cgpa && (
                        <p className="cgpa">CGPA: {person.cgpa}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="match-indicator">
                    <div 
                      className="match-badge"
                      style={{ backgroundColor: getMatchColor(match.commonInterests.length) }}
                    >
                      ✓ Match
                    </div>
                    <span className="interests-count">
                      {match.commonInterests.length} common interest{match.commonInterests.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="match-details">
                  {match.commonInterests && match.commonInterests.length > 0 && (
                    <div className="common-interests">
                      <h4>Common Interests</h4>
                      <div className="interests-tags">
                        {match.commonInterests.map((interest, idx) => (
                          <span key={idx} className="interest-tag">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="match-actions">
                  <button 
                    className="view-profile-btn"
                    onClick={() => setSelectedMatch(match)}
                  >
                    View Details
                  </button>
                  <button className="contact-btn">
                    Contact
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMatch && (
        <div className="match-modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="match-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {userRole === 'student' ? selectedMatch.faculty.name : selectedMatch.student.name}
              </h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedMatch(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="match-indicator-large">
                <div 
                  className="match-badge-large"
                  style={{ backgroundColor: getMatchColor(selectedMatch.commonInterests.length) }}
                >
                  ✓ Match
                </div>
                <span>{selectedMatch.commonInterests.length} common interest{selectedMatch.commonInterests.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="detailed-info">
                <div className="info-section">
                  <h3>Academic Interests</h3>
                  <div className="interests-tags">
                    {(userRole === 'student' ? 
                      selectedMatch.faculty.academicInterests : 
                      selectedMatch.student.academicInterests
                    )?.map((interest, idx) => (
                      <span key={idx} className="interest-tag">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedMatch.commonInterests && selectedMatch.commonInterests.length > 0 && (
                  <div className="info-section">
                    <h3>Common Interests</h3>
                    <div className="interests-tags">
                      {selectedMatch.commonInterests.map((interest, idx) => (
                        <span key={idx} className="interest-tag common">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMatch.relevantProjects && selectedMatch.relevantProjects.length > 0 && (
                  <div className="info-section">
                    <h3>Relevant Projects</h3>
                    <div className="projects-detailed">
                      {selectedMatch.relevantProjects.map((project, idx) => (
                        <div key={project._id} className="project-detailed">
                          <h4>{project.title}</h4>
                          <p>Domain: {project.domain}</p>
                          <span className={`status ${project.status}`}>
                            {project.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingSuggestions;
