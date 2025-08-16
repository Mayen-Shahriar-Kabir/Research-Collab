import React, { useState } from 'react';
import ProjectSearch from '../components/ProjectSearch';
import TaskManager from '../components/TaskManager';
import MessagingSystem from '../components/MessagingSystem';

const Home = ({ user }) => {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>T1 Research Portal</h1>
          <p>Discover research opportunities, manage projects, and collaborate with faculty and students</p>
        </div>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Research Projects
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Task Manager
        </button>
        <button 
          className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'projects' && (
          <ProjectSearch userRole={user?.role || 'student'} userId={user?.id} />
        )}
        {activeTab === 'tasks' && (
          <TaskManager userId={user?.id} />
        )}
        {activeTab === 'messages' && (
          <MessagingSystem userId={user?.id} />
        )}
      </div>
    </div>
  );
};

export default Home;