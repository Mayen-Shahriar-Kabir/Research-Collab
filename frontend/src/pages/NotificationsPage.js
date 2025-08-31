import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NotificationsPage.css';

export default function NotificationsPage() {
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
      fetchNotifications();
    } else {
      setError('Please log in to view notifications');
      setLoading(false);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load notifications: ${response.statusText}`);
      }
      
      const data = await response.json();
      const notifications = Array.isArray(data) ? data : (Array.isArray(data?.notifications) ? data.notifications : []);
      
      // Sort by createdAt in descending order (newest first)
      const sortedNotifications = [...notifications].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setItems(sortedNotifications);
      
      if (sortedNotifications.length === 0) {
        setMessage('You have no notifications.');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const markAsRead = async (notificationId, isRead = true) => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/${isRead ? 'read' : 'unread'}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark as ${isRead ? 'read' : 'unread'}: ${response.statusText}`);
      }
      
      // Optimistically update the UI
      setItems(prevItems => 
        prevItems.map(item => 
          item._id === notificationId 
            ? { ...item, read: isRead, readAt: isRead ? new Date().toISOString() : undefined }
            : item
        )
      );
      
      setMessage(`Notification marked as ${isRead ? 'read' : 'unread'}`);
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Error updating notification status:', error);
      setError(error.message || 'Failed to update notification status');
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!user?.id) return;
    
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.statusText}`);
      }
      
      // Optimistically update the UI
      setItems(prevItems => prevItems.filter(item => item._id !== notificationId));
      setMessage('Notification deleted successfully');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError(error.message || 'Failed to delete notification');
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id || items.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark all as read: ${response.statusText}`);
      }
      
      // Optimistically update the UI
      setItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          read: true,
          readAt: item.readAt || new Date().toISOString()
        }))
      );
      
      setMessage('All notifications marked as read');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError(error.message || 'Failed to mark all as read');
    }
  };

  if (!user) {
    return (
      <div className="notifications-container">
        <div className="notifications-header">
          <h2>My Notifications</h2>
        </div>
        <div className="notifications-content">
          <p>Please log in to view your notifications.</p>
        </div>
      </div>
    );
  }

  // Format notification time relative to now
  const formatNotificationTime = (dateString) => {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    // For dates older than yesterday, show the date
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>My Notifications</h2>
        <div className="notification-actions-header">
          <button 
            onClick={markAllAsRead}
            disabled={loading || items.length === 0 || items.every(item => item.read)}
            className="mark-all-read-button"
            title="Mark all as read"
          >
            <span className="material-icons">mark_email_read</span>
            Mark All Read
          </button>
          <button 
            onClick={fetchNotifications}
            disabled={loading}
            className="refresh-button"
            title="Refresh notifications"
          >
            <span className="material-icons">refresh</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}
      
      <div className="notifications-content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading your notifications...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="no-notifications">
            <div className="empty-state">
              <span className="material-icons">notifications_off</span>
              <p>You don't have any notifications yet.</p>
              <p>We'll let you know when something important happens.</p>
            </div>
          </div>
        ) : (
          <ul className="notifications-list">
            {items.map(notification => (
              <li 
                key={notification._id} 
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => {
                  // Mark as read when clicked if unread
                  if (!notification.read) {
                    markAsRead(notification._id, true);
                  }
                  // Navigate to the relevant page if a link is provided
                  if (notification.link) {
                    navigate(notification.link);
                  }
                }}
              >
                <div className="notification-icon">
                  {notification.type === 'success' ? (
                    <span className="material-icons success">check_circle</span>
                  ) : notification.type === 'error' ? (
                    <span className="material-icons error">error</span>
                  ) : notification.type === 'warning' ? (
                    <span className="material-icons warning">warning</span>
                  ) : (
                    <span className="material-icons">info</span>
                  )}
                </div>
                
                <div className="notification-content">
                  <h4 className="notification-title">{notification.title || 'New notification'}</h4>
                  {notification.body && (
                    <p className="notification-message">{notification.body}</p>
                  )}
                  <div className="notification-meta">
                    <span className="notification-time">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                    {notification.type && (
                      <span className="notification-source">
                        • {notification.type}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="notification-actions">
                  {!notification.read ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id, true);
                      }}
                      className="mark-read-button"
                      title="Mark as read"
                    >
                      <span className="material-icons">mark_email_read</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id, false);
                      }}
                      className="mark-unread-button"
                      title="Mark as unread"
                    >
                      <span className="material-icons">mark_email_unread</span>
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    className="delete-button"
                    title="Delete notification"
                  >
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
