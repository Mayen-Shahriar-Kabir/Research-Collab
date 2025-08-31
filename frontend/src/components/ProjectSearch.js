import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProjectSearch.css';
import { useNavigate } from 'react-router-dom';

const ProjectSearch = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const userId = currentUser?._id || currentUser?.id;
  const userRole = currentUser?.role;
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedProjects, setBookmarkedProjects] = useState(new Set());
  const [uniqueFaculty, setUniqueFaculty] = useState([]);
  const [filters, setFilters] = useState({
    faculty: '',
    status: '',
    search: ''
  });

  const applyFilters = useCallback(() => {
    let filtered = projects;

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
  }, [projects, filters]);

  useEffect(() => {
    fetchProjects();
    if (isAuthenticated && userRole === 'student' && userId) {
      fetchBookmarks();
    }
  }, [isAuthenticated, userRole, userId]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/projects');
      if (response.ok) {
        const data = await response.json();
        // Handle new API response format with success and data fields
        const projectsArray = data.success ? data.data : (Array.isArray(data) ? data : []);
        setProjects(projectsArray);
        
        // Extract unique faculty for filters
        const faculty = [...new Set(projectsArray.map(p => p.faculty?.name || p.faculty?.profile?.name).filter(Boolean))];
        
        setUniqueFaculty(faculty.sort());
      } else {
        const errorData = await response.json();
        console.error('Error fetching projects:', errorData);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/bookmarks/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const bookmarkIds = new Set(data.bookmarks.map(bookmark => bookmark._id));
        setBookmarkedProjects(bookmarkIds);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      faculty: '',
      status: '',
      search: ''
    });
  };

  const applyToProject = async (projectId) => {
    if (!isAuthenticated || !userId) {
      alert('Please log in to apply for projects');
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication token not found. Please log in again.');
      navigate('/login');
      return;
    }

    try {
      console.log('Sending application with userId:', userId, 'projectId:', projectId);
      
      // Create application data with required fields
      const applicationData = {
        student: userId,
        project: projectId,
        message: 'I am interested in joining this research project.',
        cvUrl: '',  // Required by backend schema
        sampleWorkUrl: ''  // Required by backend schema
      };

      console.log('Sending application data:', JSON.stringify(applicationData, null, 2));
      
      const response = await fetch('http://localhost:5001/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(applicationData),
        credentials: 'include'
      });
      
      console.log('Application response status:', response.status);
      
      let responseText;
      try {
        responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
        
        if (response.ok) {
          console.log('Application successful:', data);
          alert('Application submitted successfully!');
          fetchProjects(); // Refresh projects
        } else {
          const errorMessage = data?.message || 
                             data?.error || 
                             `Server error: ${response.status} ${response.statusText}`;
          console.error('Application failed:', { status: response.status, data });
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error processing response:', {
          status: response.status,
          statusText: response.statusText,
          response: responseText,
          error: error.message
        });
        throw error;
      }
    } catch (error) {
      console.error('Error applying to project:', error);
      alert('Error submitting application');
    }
  };

  const toggleBookmark = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const isBookmarked = bookmarkedProjects.has(projectId);
      
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch('http://localhost:5001/api/bookmarks', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId, projectId })
        });
        
        if (response.ok) {
          setBookmarkedProjects(prev => {
            const newSet = new Set(prev);
            newSet.delete(projectId);
            return newSet;
          });
        }
      } else {
        // Add bookmark
        const response = await fetch('http://localhost:5001/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId, projectId })
        });
        
        if (response.ok) {
          setBookmarkedProjects(prev => new Set([...prev, projectId]));
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Error updating bookmark');
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
          <div className="search-row">
            <input
              type="text"
              placeholder="Search projects by title or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="main-search-input"
            />
          </div>
          <div className="filter-row">
            <select
              value={filters.faculty}
              onChange={(e) => handleFilterChange('faculty', e.target.value)}
              className="filter-select"
            >
              <option value="">All Faculty</option>
              {uniqueFaculty.map(faculty => (
                <option key={faculty} value={faculty}>{faculty}</option>
              ))}
            </select>
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
                  <strong>Faculty:</strong> {project.faculty?.name || project.faculty?.profile?.name || 'N/A'}
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
                        {student.name || student.profile?.name || student.email}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="no-students">No students assigned yet</p>
                )}
              </div>

              {userRole === 'student' && (
                <div className="project-actions">
                  <button 
                    onClick={() => toggleBookmark(project._id)}
                    className={`btn ${bookmarkedProjects.has(project._id) ? 'btn-bookmarked' : 'btn-bookmark'}`}
                    title={bookmarkedProjects.has(project._id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                  >
                    {bookmarkedProjects.has(project._id) ? '★ Bookmarked' : '☆ Bookmark'}
                  </button>
                  {project.status === 'available' && (
                    <button 
                      onClick={() => applyToProject(project._id)}
                      className="btn btn-primary"
                      disabled={project.currentStudents.length >= project.maxStudents}
                    >
                      {project.currentStudents.length >= project.maxStudents ? 'Full' : 'Apply'}
                    </button>
                  )}
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
