import React from 'react';
import { useAuth } from '../context/AuthContext';
import ProjectSearch from '../components/ProjectSearch';
import { Navigate } from 'react-router-dom';

const ProjectsPage = () => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <ProjectSearch 
        userRole={currentUser?.role} 
        userId={currentUser?._id || currentUser?.id} 
      />
    </div>
  );
};

export default ProjectsPage;
