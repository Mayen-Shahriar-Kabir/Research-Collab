import React from 'react';
import { useAuth } from '../context/AuthContext';
import ProjectManagement from '../components/ProjectManagement';

const ProjectManagementPage = () => {
  const { currentUser, authToken } = useAuth();
  
  if (!currentUser || !authToken) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Please log in to access project management</h3>
      </div>
    );
  }

  if (currentUser.role !== 'faculty') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Access denied. Only faculty members can manage projects.</h3>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <ProjectManagement user={currentUser} />
    </div>
  );
};

export default ProjectManagementPage;
