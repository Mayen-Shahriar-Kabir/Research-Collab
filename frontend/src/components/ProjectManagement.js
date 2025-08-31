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
  const [feedbackMap, setFeedbackMap] = useState({});
  const [showCgpaModal, setShowCgpaModal] = useState(false);
  const [cgpaRange, setCgpaRange] = useState({ min: '', max: '' });
  const [cgpaFilter, setCgpaFilter] = useState({ min: '', max: '' });
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [editMode, setEditMode] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    domain: '',
    requirements: '',
    maxStudents: '',
    deadline: '',
    requiredTasksCount: ''
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: ''
  });

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    title: '',
    description: '',
    domain: '',
    requirements: '',
    maxStudents: 1,
    deadline: ''
  });

  // Get user info from props or localStorage
  React.useEffect(() => {
    console.log('ProjectManagement useEffect triggered with user:', user);
    if (user && (user._id || user.id)) {
      console.log('Setting current user and fetching projects for user ID:', user._id || user.id);
      setCurrentUser(user);
    } else {
      // Try to get user from localStorage if not passed as prop
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('Using stored user:', parsedUser);
          setCurrentUser(parsedUser);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      } else {
        console.log('No user or user._id found:', user);
      }
    }
  }, [user]);

  // Fetch projects when currentUser is set
  React.useEffect(() => {
    if (currentUser && (currentUser._id || currentUser.id)) {
      console.log('Current user set, now fetching projects for:', currentUser._id || currentUser.id);
      setError(''); // Clear any existing errors before fetching
      fetchProjects();
    }
  }, [currentUser]);

  // Normalize API base and derive apiUrl
  const API_BASE = ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, ''));
  const apiUrl = `${API_BASE}/api`;
  const token = localStorage.getItem('token');
  const userId = currentUser?.id || currentUser?._id;
  
  console.log('Current API setup:', { API_BASE, apiUrl, hasToken: !!token, userId });

  useEffect(() => {
    if (userId) {
      fetchProjects();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectData();
    }
  }, [selectedProject, cgpaFilter]);

  const fetchProjects = async () => {
    try {
      console.log('=== fetchProjects CALLED ===');
      console.log('Current user state:', currentUser);
      console.log('User ID for API call:', userId);
      setLoading(true);
      setError('');
      console.log('Fetching projects from:', `${apiUrl}/projects`);
      const token = localStorage.getItem('token');
      console.log('Using auth token:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Test basic API connectivity first
      console.log('=== Testing API connectivity ===');
      try {
        const testResponse = await fetch(`${apiUrl}/projects`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('API test response status:', testResponse.status);
        console.log('API test response ok:', testResponse.ok);
        
        if (!testResponse.ok) {
          throw new Error(`API test failed: ${testResponse.status} ${testResponse.statusText}`);
        }
        
        const testResult = await testResponse.json();
        console.log('API test result:', testResult);
      } catch (apiError) {
        console.error('API connectivity test failed:', apiError);
        throw new Error(`Backend server connection failed: ${apiError.message}`);
      }
      
      // Now fetch filtered projects
      const url = new URL(`${apiUrl}/projects`);
      if (userId) {
        url.searchParams.append('facultyId', userId);
      }
      
      console.log('Fetching filtered projects from URL:', url.toString());
      console.log('Faculty ID being used:', userId);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // Handle different API response formats
      let projectsData = [];
      if (Array.isArray(result)) {
        projectsData = result;
      } else if (result.data && Array.isArray(result.data)) {
        projectsData = result.data;
      } else if (result.projects && Array.isArray(result.projects)) {
        projectsData = result.projects;
      } else {
        projectsData = [];
      }
      
      // Debug logging
      console.log('API Response:', result);
      console.log('Parsed projects data:', projectsData);
      console.log('Current userId:', userId);
      console.log('Projects count:', projectsData.length);
      console.log('Setting projects state with:', projectsData);
      
      if (projectsData.length > 0) {
        console.log('Projects with faculty info:', projectsData.map(p => ({
          id: p._id,
          title: p.title, 
          facultyId: p.faculty?._id, 
          facultyName: p.faculty?.name,
          rawFaculty: p.faculty
        })));
      } else {
        console.log('No projects found. Possible reasons:');
        console.log('1. No projects exist for this faculty');
        console.log('2. Faculty ID mismatch');
        console.log('3. Database connection issue');
        console.log('4. API response format changed');
      }
      
      setProjects(projectsData);
      setError(''); // Clear any previous errors since projects loaded successfully
      console.log('Projects state updated. Current projects length:', projectsData.length);
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0]);
        console.log('Selected first project:', projectsData[0].title);
      }
    } catch (err) {
      console.error('=== ERROR in fetchProjects ===');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Error name:', err.name);
      
      let errorMessage = 'Failed to fetch project data';
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Backend server connection failed. Check if server is running on port 5001.';
      } else if (err.message.includes('404')) {
        errorMessage = 'API endpoint not found (404 error).';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server error (500). Check backend logs.';
      } else if (err.message.includes('No authentication token')) {
        errorMessage = 'Authentication token missing. Please log in again.';
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      
      console.error('Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Approve/Reject a completed task (faculty only)
  const handleTaskApproval = async (taskId, approved, comments = '') => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${apiUrl}/tasks/${taskId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          approved,
          feedback: comments,
          facultyId: userId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update approval');
      }

      // Update tasks list with returned task
      setTasks(prev => prev.map(t => (t._id === taskId ? data.task : t)));
    } catch (err) {
      setError(err.message || 'Failed to update approval');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (studentId) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${apiUrl}/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProject._id,
          studentId,
          facultyId: userId
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to issue certificate');
      }
      alert('Certificate issued successfully');
    } catch (err) {
      setError(err.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectData = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      
      // Try each API call individually to identify which one fails
      console.log('Fetching applications for project:', selectedProject._id);
      try {
        const appsUrl = new URL(`${apiUrl}/applications`);
        appsUrl.searchParams.set('facultyId', userId);
        appsUrl.searchParams.set('projectId', selectedProject._id);
        if (cgpaFilter.min) appsUrl.searchParams.set('minCgpa', cgpaFilter.min);
        if (cgpaFilter.max) appsUrl.searchParams.set('maxCgpa', cgpaFilter.max);
        
        console.log('Applications API URL:', appsUrl.toString());
        
        const appsResponse = await fetch(appsUrl.toString(), {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!appsResponse.ok) {
          console.error('Applications API failed:', appsResponse.status, appsResponse.statusText);
          const errorText = await appsResponse.text();
          console.error('Applications API error response:', errorText);
          setApplications([]);
        } else {
          const appsData = await appsResponse.json();
          console.log('Raw applications response:', appsData);
          
          // Handle different response formats
          let applicationsArray = [];
          if (Array.isArray(appsData)) {
            applicationsArray = appsData;
          } else if (appsData.data && Array.isArray(appsData.data)) {
            applicationsArray = appsData.data;
          } else if (appsData.applications && Array.isArray(appsData.applications)) {
            applicationsArray = appsData.applications;
          }
          
          // Filter applications for the selected project
          const projectApplications = applicationsArray.filter(app => 
            app.project && (app.project._id === selectedProject._id || app.project === selectedProject._id)
          );
          setApplications(projectApplications);
          console.log('Applications loaded:', projectApplications.length);
        }
      } catch (appErr) {
        console.error('Applications fetch error:', appErr);
        setApplications([]);
      }

      // Fetch students
      console.log('Fetching students for project:', selectedProject._id);
      try {
        const studentsResponse = await fetch(
          `${apiUrl}/projects/${selectedProject._id}/students?facultyId=${userId}`,
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        if (!studentsResponse.ok) {
          console.error('Students API failed:', studentsResponse.status, studentsResponse.statusText);
          const errorText = await studentsResponse.text();
          console.error('Students API error response:', errorText);
          setStudents([]);
        } else {
          const studentsData = await studentsResponse.json();
          console.log('Students API response:', studentsData);
          setStudents(studentsData.students || []);
          console.log('Students loaded:', studentsData.students?.length || 0);
        }
      } catch (studErr) {
        console.error('Students fetch error:', studErr);
        setStudents([]);
      }

      // Fetch tasks
      console.log('Fetching tasks for project:', selectedProject._id);
      try {
        const tasksResponse = await fetch(
          `${apiUrl}/tasks/project/${selectedProject._id}`,
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        if (!tasksResponse.ok) {
          console.error('Tasks API failed:', tasksResponse.status, tasksResponse.statusText);
          const errorText = await tasksResponse.text();
          console.error('Tasks API error response:', errorText);
          setTasks([]);
        } else {
          const tasksData = await tasksResponse.json();
          console.log('Tasks API response:', tasksData);
          setTasks(tasksData.tasks || []);
          console.log('Tasks loaded:', tasksData.tasks?.length || 0);
        }
      } catch (taskErr) {
        console.error('Tasks fetch error:', taskErr);
        setTasks([]);
      }

      console.log('All project data fetching completed');

    } catch (err) {
      console.error('Error in fetchProjectData:', err);
      // Don't set error for project data issues since main projects are working
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setProjectForm({
      title: project.title || '',
      description: project.description || '',
      domain: project.domain || '',
      requirements: project.requirements || '',
      maxStudents: project.maxStudents || '',
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
      requiredTasksCount: project.requiredTasksCount || ''
    });
    setEditMode(false);
    setActiveTab('overview');
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...projectForm,
          facultyId: userId
        })
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setSelectedProject(updatedProject.project);
        setEditMode(false);
        fetchProjects();
        alert('Project updated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update project');
      }
    } catch (err) {
      setError('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId, status) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${apiUrl}/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          facultyId: userId
        })
      });

      const data = await response.json();
      if (response.ok) {
        fetchProjectData();
        alert(`Application ${status} successfully!`);
      } else {
        throw new Error(data.message || `Failed to ${status} application`);
      }
    } catch (err) {
      console.error('Application action error:', err);
      setError(err.message || `Failed to ${status} application`);
      alert(err.message || `Failed to ${status} application`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...taskForm,
          projectId: selectedProject._id,
          createdBy: userId
        })
      });

      if (response.ok) {
        setTaskForm({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          assignedTo: ''
        });
        fetchProjectData();
        alert('Task created successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create task');
      }
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };


  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newProjectForm,
          faculty: userId,
          requirements: newProjectForm.requirements.split('\n').filter(req => req.trim())
        })
      });

      if (response.ok) {
        setNewProjectForm({
          title: '',
          description: '',
          domain: '',
          requirements: '',
          maxStudents: 1,
          deadline: ''
        });
        setShowCreateProject(false);
        fetchProjects();
        alert('Project created successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create project');
      }
    } catch (err) {
      setError('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleCgpaFilter = () => {
    setCgpaFilter({ min: cgpaRange.min, max: cgpaRange.max });
    setShowCgpaModal(false);
  };

  const clearCgpaFilter = () => {
    setCgpaFilter({ min: '', max: '' });
    setCgpaRange({ min: '', max: '' });
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="project-details">
        <div className="detail-header">
          <h3>Project Details</h3>
          <button 
            className="edit-btn"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Cancel' : 'Edit Project'}
          </button>
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateProject} className="project-form">
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={projectForm.title}
                onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Domain:</label>
              <input
                type="text"
                value={projectForm.domain}
                onChange={(e) => setProjectForm({...projectForm, domain: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Requirements:</label>
              <textarea
                value={projectForm.requirements}
                onChange={(e) => setProjectForm({...projectForm, requirements: e.target.value})}
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Max Students:</label>
                <input
                  type="number"
                  value={projectForm.maxStudents}
                  onChange={(e) => setProjectForm({...projectForm, maxStudents: e.target.value})}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Required Tasks Count:</label>
                <input
                  type="number"
                  value={projectForm.requiredTasksCount}
                  onChange={(e) => setProjectForm({...projectForm, requiredTasksCount: e.target.value})}
                  min="0"
                  placeholder="Number of tasks required for completion"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Deadline:</label>
              <input
                type="date"
                value={projectForm.deadline}
                onChange={(e) => setProjectForm({...projectForm, deadline: e.target.value})}
              />
            </div>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div className="project-info">
            <p><strong>Title:</strong> {selectedProject?.title}</p>
            <p><strong>Description:</strong> {selectedProject?.description}</p>
            <p><strong>Domain:</strong> {selectedProject?.domain}</p>
            <p><strong>Requirements:</strong> {selectedProject?.requirements}</p>
            <p><strong>Max Students:</strong> {selectedProject?.maxStudents}</p>
            <p><strong>Current Students:</strong> {students.length}</p>
            <p><strong>Required Tasks:</strong> {selectedProject?.requiredTasksCount || 'Not set'}</p>
            <p><strong>Deadline:</strong> {selectedProject?.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'Not set'}</p>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Applications</h4>
          <div className="stat-number">{applications.length}</div>
        </div>
        <div className="stat-card">
          <h4>Students</h4>
          <div className="stat-number">{students.length}</div>
        </div>
        <div className="stat-card">
          <h4>Tasks</h4>
          <div className="stat-number">{tasks.length}</div>
        </div>
        <div className="stat-card">
          <h4>Completed Tasks</h4>
          <div className="stat-number">{tasks.filter(t => t.status === 'completed').length}</div>
        </div>
      </div>

      {/* Students & Certificates */}
      <div className="students-section">
        <h3>Current Students</h3>
        {students.length === 0 ? (
          <p>No students added yet.</p>
        ) : (
          <div className="students-list">
            {students.map(s => (
              <div key={s._id} className="student-item">
                <div className="student-info">
                  <strong>{s.name}</strong>
                  <span style={{ marginLeft: 8 }}>{s.email}</span>
                </div>
                <div className="student-actions">
                  <button
                    className="issue-cert-btn"
                    onClick={() => handleIssueCertificate(s._id)}
                    disabled={loading || !selectedProject}
                  >
                    {loading ? 'Working...' : 'Issue Certificate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="applications-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Project Applications</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(cgpaFilter.min || cgpaFilter.max) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>
                CGPA: {cgpaFilter.min || '0'} - {cgpaFilter.max || '4.0'}
              </span>
              <button className="btn btn-sm btn-outline-secondary" onClick={clearCgpaFilter}>
                Clear
              </button>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => setShowCgpaModal(true)}>
            Shortlist by CGPA
          </button>
        </div>
      </div>
      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div className="applications-list">
          {applications.map(app => (
            <div key={app._id} className="application-card">
              <div className="applicant-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>{app.student?.name}</h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{app.student?.email}</p>
                  </div>
                  <span className={`status ${app.status}`} style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>{app.status}</span>
                </div>

                {/* Academic Details Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '8px',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
                }}>
                  {app.student?.cgpa && (
                    <div>
                      <strong style={{ color: '#495057', fontSize: '13px' }}>CGPA:</strong>
                      <div style={{ color: '#28a745', fontWeight: 'bold', fontSize: '15px' }}>
                        {app.student.cgpa.toFixed(2)}/4.0
                      </div>
                    </div>
                  )}
                  {app.student?.institution && (
                    <div>
                      <strong style={{ color: '#495057', fontSize: '13px' }}>Institution:</strong>
                      <div style={{ fontSize: '14px', marginTop: '2px' }}>{app.student.institution}</div>
                    </div>
                  )}
                  {app.student?.program && (
                    <div>
                      <strong style={{ color: '#495057', fontSize: '13px' }}>Program:</strong>
                      <div style={{ fontSize: '14px', marginTop: '2px' }}>{app.student.program}</div>
                    </div>
                  )}
                  {app.student?.department && (
                    <div>
                      <strong style={{ color: '#495057', fontSize: '13px' }}>Department:</strong>
                      <div style={{ fontSize: '14px', marginTop: '2px' }}>{app.student.department}</div>
                    </div>
                  )}
                </div>

                {/* Academic Interests */}
                {app.student?.academicInterests && app.student.academicInterests.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#495057' }}>Academic Interests:</strong>
                    <div style={{ marginTop: '4px' }}>
                      {app.student.academicInterests.map((interest, idx) => (
                        <span key={idx} style={{
                          display: 'inline-block',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          marginRight: '6px',
                          marginBottom: '4px'
                        }}>
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Message */}
                {app.message && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#495057' }}>Application Message:</strong>
                    <div style={{ 
                      marginTop: '4px', 
                      padding: '8px', 
                      backgroundColor: '#fff3cd', 
                      borderRadius: '4px',
                      fontSize: '14px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {app.message}
                    </div>
                  </div>
                )}
              </div>
              {app.status === 'pending' && (
                <div className="application-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => handleApplicationAction(app._id, 'accepted')}
                    disabled={loading}
                  >
                    Accept
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleApplicationAction(app._id, 'rejected')}
                    disabled={loading}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="tasks-section">
      <div className="tasks-header">
        <h3>Project Tasks</h3>
      </div>

      {students.length > 0 && (
        <div className="create-task-section">
          <h4>Create New Task</h4>
          <form onSubmit={handleCreateTask} className="task-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Assign to:</label>
                <select
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({...taskForm, assignedTo: e.target.value})}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date:</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                />
              </div>
            </div>
            <button type="submit" className="create-task-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </div>
      )}

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <p>No tasks created yet.</p>
        ) : (
          tasks.map(task => (
            <div key={task._id} className="task-card">
              <div className="task-header">
                <h4>{task.title}</h4>
                <span className={`priority ${task.priority}`}>{task.priority}</span>
              </div>
              <p>{task.description}</p>
              <div className="task-meta">
                <p><strong>Assigned to:</strong> {task.assignedTo?.name}</p>
                <p><strong>Status:</strong> <span className={`status ${task.status}`}>{task.status}</span></p>
                {task.dueDate && (
                  <p><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</p>
                )}
              </div>
              {task.updates && task.updates.length > 0 && (
                <div className="task-updates">
                  <h5>Recent Updates:</h5>
                  {task.updates.slice(-2).map((update, index) => (
                    <div key={index} className="update-item">
                      <p><strong>Status:</strong> {update.status}</p>
                      {update.comments && <p><strong>Comments:</strong> {update.comments}</p>}
                      {update.workFile && (
                        <p><strong>Work File:</strong> 
                          <a href={`${API_BASE}${update.workFile}`} target="_blank" rel="noopener noreferrer">
                            View File
                          </a>
                        </p>
                      )}
                      <small>{new Date(update.updatedAt).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              )}

              {/* Faculty approval controls */}
              {task.status === 'completed' && task.updates && task.updates.length > 0 && (
                <div className="approval-controls" style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                  {task.updates[task.updates.length - 1].approved ? (
                    <div className="approved-status" style={{ color: '#28a745', fontWeight: 600 }}>
                      ✅ Approved by faculty
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Feedback (optional):</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Add feedback for the student..."
                          value={feedbackMap[task._id] || ''}
                          onChange={(e) => setFeedbackMap(prev => ({ ...prev, [task._id]: e.target.value }))}
                        />
                      </div>
                      <div className="approval-buttons-row" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          type="button"
                          className="approve-btn"
                          onClick={() => handleTaskApproval(task._id, true, feedbackMap[task._id] || 'Task approved')}
                          disabled={loading}
                        >
                          ✅ Approve
                        </button>
                        <button
                          type="button"
                          className="reject-btn"
                          onClick={() => handleTaskApproval(task._id, false, feedbackMap[task._id] || 'Task needs revision')}
                          disabled={loading}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Main component return
  return (
    <div className="project-management">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>My Projects</h2>
          <button 
            className="create-project-btn"
            onClick={() => setShowCreateProject(!showCreateProject)}
          >
            {showCreateProject ? 'Cancel' : '+ New Project'}
          </button>
        </div>

        {showCreateProject && (
          <div className="create-project-form">
            <h3>Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={newProjectForm.title}
                  onChange={(e) => setNewProjectForm({...newProjectForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({...newProjectForm, description: e.target.value})}
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Domain:</label>
                <input
                  type="text"
                  value={newProjectForm.domain}
                  onChange={(e) => setNewProjectForm({...newProjectForm, domain: e.target.value})}
                  placeholder="e.g., NLP, CV, HCI"
                  required
                />
              </div>
              <div className="form-group">
                <label>Requirements (one per line):</label>
                <textarea
                  value={newProjectForm.requirements}
                  onChange={(e) => setNewProjectForm({...newProjectForm, requirements: e.target.value})}
                  rows="2"
                  placeholder="Python&#10;Machine Learning"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Max Students:</label>
                  <input
                    type="number"
                    value={newProjectForm.maxStudents}
                    onChange={(e) => setNewProjectForm({...newProjectForm, maxStudents: e.target.value})}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Deadline:</label>
                  <input
                    type="date"
                    value={newProjectForm.deadline}
                    onChange={(e) => setNewProjectForm({...newProjectForm, deadline: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        )}

        {loading && <p>Loading...</p>}
        
        
        {projects.length === 0 && !loading && !showCreateProject ? (
          <div className="no-projects">
            <p>No projects found.</p>
            <p>Create your first project using the "+ New Project" button above.</p>
          </div>
        ) : (
          <div className="projects-list">
            {projects.map(project => (
              <div
                key={project._id}
                className={`project-item ${selectedProject?._id === project._id ? 'active' : ''}`}
                onClick={() => handleProjectSelect(project)}
              >
                <h4>{project.title}</h4>
                <p>{project.domain}</p>
                <small>{project.currentStudents?.length || 0} / {project.maxStudents || 0} students</small>
              </div>
            ))}
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

        {!userId ? (
          <div className="no-user">
            <h2>Authentication Required</h2>
            <p>Please log in to manage your projects.</p>
          </div>
        ) : selectedProject ? (
          <>
            <div className="project-header">
              <h1>{selectedProject.title}</h1>
              <div className="tabs">
                <button
                  className={activeTab === 'overview' ? 'active' : ''}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={activeTab === 'applications' ? 'active' : ''}
                  onClick={() => setActiveTab('applications')}
                >
                  Applications ({applications.length})
                </button>
                <button
                  className={activeTab === 'tasks' ? 'active' : ''}
                  onClick={() => setActiveTab('tasks')}
                >
                  Tasks ({tasks.length})
                </button>
              </div>
            </div>

            <div className="tab-content">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'applications' && renderApplications()}
              {activeTab === 'tasks' && renderTasks()}
            </div>
          </>
        ) : (
          <div className="no-selection">
            <h2>Select a project to manage</h2>
            <p>Choose a project from the sidebar to view details, manage applications, and assign tasks.</p>
          </div>
        )}
      </div>

      {/* CGPA Filter Modal */}
      {showCgpaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Filter by CGPA Range</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Minimum CGPA:
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  placeholder="e.g., 3.0"
                  value={cgpaRange.min}
                  onChange={(e) => setCgpaRange({ ...cgpaRange, min: e.target.value })}
                  className="form-control"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Maximum CGPA:
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  placeholder="e.g., 4.0"
                  value={cgpaRange.max}
                  onChange={(e) => setCgpaRange({ ...cgpaRange, max: e.target.value })}
                  className="form-control"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowCgpaModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleCgpaFilter}
                  disabled={!cgpaRange.min && !cgpaRange.max}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
