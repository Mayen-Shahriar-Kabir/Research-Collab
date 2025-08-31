import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './BookmarksPage.css';

export default function BookmarksPage() {
  const { currentUser: user } = useAuth();
  const API_BASE = useMemo(() => ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, '')), []);
    
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchBookmarks();
    } else {
      setError('Please log in to view your bookmarks');
      setLoading(false);
    }
  }, [user]);

  const fetchBookmarks = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE}/api/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load bookmarks: ${response.statusText}`);
      }
      
      const data = await response.json();
      setItems(Array.isArray(data) ? data : (Array.isArray(data?.bookmarks) ? data.bookmarks : []));
      
      if (data.length === 0) {
        setMessage('You have no bookmarks yet.');
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setError(error.message || 'Failed to load bookmarks. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const removeBookmark = async (bookmarkId) => {
    if (!user?.id) return;
    
    if (!window.confirm('Are you sure you want to remove this bookmark?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE}/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove bookmark: ${response.statusText}`);
      }
      
      // Update the UI by removing the deleted bookmark
      setItems(prevItems => prevItems.filter(item => item._id !== bookmarkId));
      setMessage('Bookmark removed successfully');
      
      // Clear the message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Error removing bookmark:', error);
      setError(error.message || 'Failed to remove bookmark. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="bookmarks-container">
        <div className="bookmarks-header">
          <h2>My Bookmarks</h2>
        </div>
        <div className="bookmarks-content">
          <p>Please log in to view your bookmarks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmarks-container">
      <div className="bookmarks-header">
        <h2>My Bookmarks</h2>
        <button 
          className="refresh-button"
          onClick={fetchBookmarks}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}
      
      <div className="bookmarks-content">
        {loading ? (
          <div className="loading">Loading your bookmarks...</div>
        ) : items.length === 0 ? (
          <div className="no-bookmarks">
            <p>You don't have any bookmarks yet.</p>
            <button 
              className="browse-button"
              onClick={() => navigate('/projects')}
            >
              Browse Projects
            </button>
          </div>
        ) : (
          <div className="bookmarks-grid">
            {items.map((item) => (
              <div key={item._id} className="bookmark-card">
                <div className="bookmark-content">
                  <h3 onClick={() => navigate(`/projects/${item.project?._id || item._id}`)}>
                    {item.project?.title || item.title || 'Untitled Project'}
                  </h3>
                  <p className="bookmark-description">
                    {item.project?.description || item.description || 'No description available'}
                  </p>
                  <div className="bookmark-meta">
                    <span className="bookmark-date">
                      Added on: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="bookmark-actions">
                  <button
                    className="remove-button"
                    onClick={() => removeBookmark(item._id)}
                    disabled={loading}
                    title="Remove bookmark"
                  >
                    <span className="material-icons">bookmark_remove</span>
                    Remove
                  </button>
                  <button
                    className="view-button"
                    onClick={() => navigate(`/projects/${item.project?._id || item._id}`)}
                    title="View project"
                  >
                    <span className="material-icons">visibility</span>
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
