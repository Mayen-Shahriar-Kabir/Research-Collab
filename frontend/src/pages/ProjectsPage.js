import React from 'react';
import ProjectSearch from '../components/ProjectSearch';

const ProjectsPage = ({ userRole, userId }) => {
  return (
    <div style={{ padding: '20px' }}>
      <ProjectSearch userRole={userRole} userId={userId} />
    </div>
  );
};

export default ProjectsPage;
