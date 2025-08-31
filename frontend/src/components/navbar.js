import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBadge from './NotificationBadge';
import './Navbar.css';

export default function Navbar() {
  const { currentUser: user, logout: authLogout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  // Normalize API base to avoid double /api or trailing slashes
  const API_BASE = ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, ''));

  // Memoize auth check to prevent unnecessary re-renders
  const hideOnAuth = useMemo(() => 
    ['/login', '/register'].includes(pathname),
    [pathname]
  );

  // Poll unread notifications periodically - only if user is logged in
  useEffect(() => {
    if (!user?._id && !user?.id) return;
    
    let timer;
    const load = async () => {
      const uid = user._id || user.id;
      try {
        const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace(/\/$/, '');
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/notifications?userId=${encodeURIComponent(uid)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch notifications');
        
        const data = await res.json();
        if (Array.isArray(data)) {
          const count = data.filter(n => !n.read).length;
          setUnread(count);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    load();
    timer = setInterval(load, 15000);
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user, API_BASE]);

  const handleLogout = (e) => {
    e?.preventDefault();
    const success = authLogout();
    if (success) {
      navigate('/login');
    }
  };

  const linkClass = (path) =>
    `nav-link ${pathname === path ? "active" : ""}`;

  // Early return after all hooks
  if (hideOnAuth) return null;

  return (
    <nav className="modern-navbar">
      <div className="navbar-container">
        {/* Left Navigation - Brand and Main Links */}
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <span>Research Portal</span>
          </Link>
          
          {user && (
            <ul className="nav-links">
              <li>
                <Link className={linkClass("/home")} to="/home" aria-label="Home">
                  <i className="nav-icon">🏠</i>
                  <span className="label">Home</span>
                </Link>
              </li>
              {user.role !== 'admin' && (
                <li>
                  <Link className={linkClass("/projects")} to="/projects" aria-label="Projects">
                    <i className="nav-icon">📁</i>
                    <span className="label">Projects</span>
                  </Link>
                </li>
              )}
              {user.role !== 'admin' && (
                <li>
                  <Link className={linkClass("/tasks")} to="/tasks" aria-label="Tasks">
                    <i className="nav-icon">✅</i>
                    <span className="label">Tasks</span>
                  </Link>
                </li>
              )}
              <li>
                <Link className={linkClass("/messages")} to="/messages" aria-label="Messages">
                  <i className="nav-icon">💬</i>
                  <span className="label">Messages</span>
                </Link>
              </li>
              {/* Dashboard - Available to non-admin users */}
              {user.role !== 'admin' && (
                <li>
                  <Link className={linkClass("/dashboard")} to="/dashboard" aria-label="Dashboard">
                    <i className="nav-icon">📊</i>
                    <span className="label">Dashboard</span>
                  </Link>
                </li>
              )}
              
              {user.role === 'faculty' && (
                <li>
                  <Link className={linkClass("/project-management")} to="/project-management" aria-label="Manage Projects">
                    <i className="nav-icon">⚙️</i>
                    <span className="label">Manage Projects</span>
                  </Link>
                </li>
              )}
              {user.role === 'admin' && (
                <>
                  <li>
                    <Link className={linkClass("/admin/pc")} to="/admin/pc" aria-label="PC Management">
                      <i className="nav-icon">🖥️</i>
                      <span className="label">PC Management</span>
                    </Link>
                  </li>
                  <li>
                    <Link className={linkClass("/admin/users")} to="/admin/users" aria-label="Manage Users">
                      <i className="nav-icon">👥</i>
                      <span className="label">Manage Users</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          )}
        </div>

        {/* Right Navigation - User Controls */}
        <div className="navbar-right">
          <ul className="nav-links">
            {user ? (
              <>
                {user.role !== 'admin' && (
                  <li>
                    <Link className={linkClass("/bookmarks")} to="/bookmarks" aria-label="Bookmarks">
                      <i className="nav-icon">🔖</i>
                      <span className="label">Bookmarks</span>
                    </Link>
                  </li>
                )}
                <li>
                  <Link className={linkClass("/profile")} to="/profile" aria-label="Profile">
                    <i className="nav-icon">👤</i>
                    <span className="label">Profile</span>
                  </Link>
                </li>
                {user.role !== 'admin' && !user.roleRequest && (
                  <li>
                    <Link className={linkClass("/role-request")} to="/role-request" aria-label="Request Role">
                      <i className="nav-icon">📝</i>
                      <span className="label">Request Role</span>
                    </Link>
                  </li>
                )}
                <li>
                  <Link className={linkClass("/notifications")} to="/notifications" aria-label="Notifications">
                    <div className="nav-link-with-badge">
                      <i className="nav-icon">🔔</i>
                      <span className="label">Notifications</span>
                      <NotificationBadge />
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className={linkClass("/logout")}
                    onClick={handleLogout}
                    aria-label="Logout"
                  >
                    <i className="nav-icon">🚪</i>
                    <span className="label">Logout</span>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link className={linkClass("/login")} to="/login" aria-label="Login">
                    <i className="nav-icon">🔐</i>
                    <span className="label">Login</span>
                  </Link>
                </li>
                <li>
                  <Link className={linkClass("/register")} to="/register" aria-label="Register">
                    <i className="nav-icon">📝</i>
                    <span className="label">Register</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-toggle" 
          onClick={(e) => {
            e.preventDefault();
            const container = e.target.closest('.navbar-container');
            if (container) {
              container.classList.toggle('mobile-open');
              // Close menu when clicking outside
              if (container.classList.contains('mobile-open')) {
                const handleClickOutside = (event) => {
                  if (!container.contains(event.target)) {
                    container.classList.remove('mobile-open');
                    document.removeEventListener('click', handleClickOutside);
                  }
                };
                setTimeout(() => document.addEventListener('click', handleClickOutside), 100);
              }
            }
          }}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}