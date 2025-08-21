import React, { useState } from "react";
import { Link } from 'react-router-dom';

export default function User({ user }) {
  const [stats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    messages: 0
  });

  const [recentActivity] = useState([]);

  const hasWork =
    stats.totalProjects > 0 ||
    stats.activeTasks > 0 ||
    stats.completedTasks > 0 ||
    stats.messages > 0 ||
    recentActivity.length > 0;

  const quickActions = (() => {
    const base = [
      { title: "Browse Projects", description: "Find new research opportunities", icon: "🔍", link: "/home", color: "#667eea" },
      { title: "Manage Tasks", description: "View and update your tasks", icon: "📋", link: "/home", color: "#f093fb" },
      { title: "Messages", description: "Check your messages", icon: "💬", link: "/home", color: "#4facfe" },
      { title: "Edit Profile", description: "Update your information", icon: "👤", link: "/profile", color: "#43e97b" }
    ];
    if (user && (user.role === 'faculty' || user.role === 'admin')) {
      base.unshift({ title: "Add Project", description: "Create a new research project", icon: "➕", link: "/projects/new", color: "#ff9a9e" });
      base.unshift({ title: "Review Applications", description: "Accept or reject applicants", icon: "✅", link: "/applications-review", color: "#84fab0" });
    }
    return base;
  })();

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.name || "User"}! 👋</h1>
          <p>Here's what's happening with your research activities</p>
        </div>
        <div className="user-avatar">
          <div className="avatar-circle">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔬</div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.activeTasks}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedTasks}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats.messages}</h3>
            <p>New Messages</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link} className="action-card" style={{'--card-color': action.color}}>
                <div className="action-icon">{action.icon}</div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <div className="activity-empty">No recent activity yet.</div>
            ) : (
              recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <p className="activity-message">{activity.message}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="progress-section">
        <h2>Your Progress</h2>
        {hasWork ? (
          <div className="progress-cards">
            <div className="progress-card">
              <h3>Research Skills</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '75%'}}></div>
              </div>
              <span>75% Complete</span>
            </div>
            <div className="progress-card">
              <h3>Project Completion</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '60%'}}></div>
              </div>
              <span>60% Complete</span>
            </div>
            <div className="progress-card">
              <h3>Collaboration Score</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '85%'}}></div>
              </div>
              <span>85% Complete</span>
            </div>
          </div>
        ) : (
          <div className="progress-empty">No progress yet. Start working on projects to see your progress here.</div>
        )}
      </div>
    </div>
  );
}