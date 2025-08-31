import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './NotificationBadge.css';

const NotificationBadge = () => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Normalize API base URL
  const API_BASE = ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, ''));

  useEffect(() => {
    if (currentUser?.id) {
      fetchUnreadCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchUnreadCount = async () => {
    if (!currentUser?.id || loading) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/notifications?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const notifications = await response.json();
        const unread = Array.isArray(notifications) 
          ? notifications.filter(n => !n.read).length 
          : 0;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || unreadCount === 0) {
    return null;
  }

  return (
    <span className="notification-badge">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default NotificationBadge;
