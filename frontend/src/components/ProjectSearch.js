import React, { useState, useEffect } from 'react';
import './ProjectSearch.css';

const ProjectSearch = ({ userRole, userId }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    domain: '',
    faculty: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, filters]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = projects;

    if (filters.domain) {
      filtered = filtered.filter(project => 
        project.domain.toLowerCase().includes(filters.domain.toLowerCase())
      );
    }

    if (filters.faculty) {
      filtered = filtered.filter(project => 
        project.faculty?.profile?.name?.toLowerCase().includes(filters.faculty.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    if (filters.search) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      domain: '',
      faculty: '',
      status: '',
      search: ''
    });
  };

  const applyToProject = async (projectId) => {
    try {
      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student: userId,
          project: projectId,
          message: 'I am interested in joining this research project.'
        }),
      });
      
      if (response.ok) {
        alert('Application submitted successfully!');
      }
    } catch (error) {
      console.error('Error applying to project:', error);
      alert('Error submitting application');
    }
  };

  const getAvailabilityStatus = (project) => {
    const spotsLeft = project.maxStudents - project.currentStudents.length;
    if (spotsLeft > 0) {
      return `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} available`;
    }
    return 'Full';
  };

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="project-search">
      <div className="search-header">
        <h2>Research Projects</h2>
        <div className="search-filters">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Filter by domain..."
              value={filters.domain}
              onChange={(e) => handleFilterChange('domain', e.target.value)}
              className="filter-input"
            />
            <input
              type="text"
              placeholder="Filter by faculty name..."
              value={filters.faculty}
              onChange={(e) => handleFilterChange('faculty', e.target.value)}
              className="filter-input"
            />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="no-projects">
            <p>No projects found matching your criteria.</p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-header">
                <h3>{project.title}</h3>
                <span className={`status-badge ${project.status}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="project-info">
                <p className="domain">
                  <strong>Domain:</strong> {project.domain}
                </p>
                <p className="faculty">
                  <strong>Faculty:</strong> {project.faculty?.profile?.name || 'N/A'}
                </p>
                <p className="availability">
                  <strong>Availability:</strong> {getAvailabilityStatus(project)}
                </p>
              </div>

              <div className="project-description">
                <p>{project.description}</p>
              </div>

              {project.requirements && project.requirements.length > 0 && (
                <div className="requirements">
                  <strong>Requirements:</strong>
                  <ul>
                    {project.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="project-students">
                <strong>Current Students:</strong>
                {project.currentStudents.length > 0 ? (
                  <div className="students-list">
                    {project.currentStudents.map(student => (
                      <span key={student._id} className="student-tag">
                        {student.profile?.name || student.email}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="no-students">No students assigned yet</p>
                )}
              </div>

              {userRole === 'student' && project.status === 'available' && (
                <div className="project-actions">
                  <button 
                    onClick={() => applyToProject(project._id)}
                    className="btn btn-primary"
                    disabled={project.currentStudents.length >= project.maxStudents}
                  >
                    {project.currentStudents.length >= project.maxStudents ? 'Full' : 'Apply'}
                  </button>
                </div>
              )}

              <div className="project-dates">
                <small>Created: {new Date(project.createdAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectSearch;
