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

  // Normalize API base and derive apiUrl
  const API_BASE = ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, ''));
  const apiUrl = `${API_BASE}/api`;
  const token = localStorage.getItem('token');
  const userId = user?.id;

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectData();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Debug logging
      console.log('All projects:', data);
      console.log('Current userId:', userId);
      console.log('Projects with faculty info:', data.map(p => ({ 
        title: p.title, 
        facultyId: p.faculty?._id, 
        facultyName: p.faculty?.name 
      })));
      
      // Filter projects owned by current faculty
      const myProjects = data.filter(project => 
        project.faculty && (
          project.faculty._id === userId || 
          project.faculty._id.toString() === userId ||
          project.faculty === userId ||
          project.faculty.toString() === userId
        )
      );
      
      console.log('My projects:', myProjects);
      setProjects(myProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectData = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      
      // Fetch applications
      const appsResponse = await fetch(
        `${apiUrl}/projects/${selectedProject._id}/applications?facultyId=${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const appsData = await appsResponse.json();
      console.log('Applications response:', appsData);
      console.log('Applications with status:', appsData.applications?.map(app => ({ 
        id: app._id, 
        student: app.student?.name, 
        status: app.status 
      })));
      setApplications(appsData.applications || []);

      // Fetch students
      const studentsResponse = await fetch(
        `${apiUrl}/projects/${selectedProject._id}/students?facultyId=${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const studentsData = await studentsResponse.json();
      setStudents(studentsData.students || []);

      // Fetch tasks
      const tasksResponse = await fetch(
        `${apiUrl}/tasks/project/${selectedProject._id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const tasksData = await tasksResponse.json();
      setTasks(tasksData.tasks || []);

    } catch (err) {
      setError('Failed to fetch project data');
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

      if (response.ok) {
        fetchProjectData();
        alert(`Application ${status} successfully!`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to ${status} application`);
      }
    } catch (err) {
      setError(`Failed to ${status} application`);
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
    </div>
  );

  const renderApplications = () => (
    <div className="applications-section">
      <h3>Project Applications</h3>
      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div className="applications-list">
          {applications.map(app => (
            <div key={app._id} className="application-card">
              <div className="applicant-info">
                <h4>{app.student?.name}</h4>
                <p>{app.student?.email}</p>
                <p><strong>Interests:</strong> {app.student?.academicInterests}</p>
                <p><strong>Message:</strong> {app.message}</p>
                <p><strong>Status:</strong> <span className={`status ${app.status}`}>{app.status}</span></p>
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
            </div>
          ))
        )}
      </div>
    </div>
  );

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
            <p>Create your first project to get started!</p>
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

        {selectedProject ? (
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
    </div>
  );
};

export default ProjectManagement;
