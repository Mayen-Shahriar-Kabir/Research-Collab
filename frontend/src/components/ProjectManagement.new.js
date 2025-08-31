import React, { useState, useEffect } from 'react';
import './ProjectManagement.css';

const ProjectManagement = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  
  // API configuration
  const API_BASE = ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, ''));
  const apiUrl = `${API_BASE}/api`;
  const token = localStorage.getItem('token');
  const userId = user?.id;

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/projects?facultyId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
      
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestProject = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: "Sample Research Project",
          description: "This is a test project for the research collaboration platform.",
          domain: "Computer Science",
          requirements: "Basic programming knowledge, interest in research",
          maxStudents: 3,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          faculty: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create test project');
      }

      const newProject = await response.json();
      setProjects(prev => [...prev, newProject]);
      setSelectedProject(newProject);
      setShowCreateProject(false);
      setError('');
      alert('Test project created successfully!');
    } catch (err) {
      console.error('Error creating test project:', err);
      setError(`Failed to create test project: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-management">
      <div className="sidebar">
        <h2>My Projects</h2>
        <button 
          onClick={() => setShowCreateProject(!showCreateProject)}
          disabled={loading}
        >
          {showCreateProject ? 'Cancel' : '+ New Project'}
        </button>

        {showCreateProject && (
          <div className="create-project-form">
            <h3>Create New Project</h3>
            <button 
              onClick={handleCreateTestProject}
              disabled={loading}
              className="create-test-project-btn"
            >
              {loading ? 'Creating...' : 'Create Test Project'}
            </button>
          </div>
        )}

        {projects.length > 0 ? (
          <div className="project-list">
            {projects.map(project => (
              <div 
                key={project._id}
                className={`project-item ${selectedProject?._id === project._id ? 'active' : ''}`}
                onClick={() => setSelectedProject(project)}
              >
                <h4>{project.title}</h4>
                <span>{project.domain}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-projects">
            <p>No projects found</p>
            <button 
              onClick={handleCreateTestProject}
              disabled={loading}
              className="create-test-project-btn"
            >
              {loading ? 'Creating...' : 'Create Test Project'}
            </button>
          </div>
        )}
      </div>

      <div className="main-content">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {selectedProject ? (
          <div className="project-details">
            <h2>{selectedProject.title}</h2>
            <p>{selectedProject.description}</p>
            <div className="project-meta">
              <span>Domain: {selectedProject.domain}</span>
              <span>Max Students: {selectedProject.maxStudents}</span>
              <span>Deadline: {new Date(selectedProject.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <div className="no-project-selected">
            <p>Select a project to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManagement;
