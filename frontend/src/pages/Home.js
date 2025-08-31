import React from 'react';
import ProjectSearch from '../components/ProjectSearch';

const Home = ({ user }) => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Research Portal</h1>
          <p>Discover research opportunities, manage projects, and collaborate with faculty and students</p>
        </div>
      </div>

      <div className="dashboard-content">
        <ProjectSearch userRole={user?.role || 'student'} userId={user?.id} />
      </div>
    </div>
  );
};

export default Home;