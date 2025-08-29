import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import MatchingSuggestions from '../components/MatchingSuggestions';

const Dashboard = ({ userId, userRole }) => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get userId from props or localStorage
      let currentUserId = userId;
      if (!currentUserId) {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            currentUserId = parsedUser.id || parsedUser._id;
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      console.log('Dashboard userId:', currentUserId);
      console.log('Token exists:', !!token);
      
      if (!currentUserId) {
        throw new Error('User ID is not available');
      }
      
      // Fetch user profile
      const userResponse = await fetch(`http://localhost:5001/api/profile/${currentUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!userResponse.ok) {
        throw new Error(`Profile API failed: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      setUser(userData.profile);

      // Fetch user's projects
      const projectsResponse = await fetch(`http://localhost:5001/api/projects/user/${currentUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!projectsResponse.ok) {
        throw new Error(`Projects API failed: ${projectsResponse.status}`);
      }
      
      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects || []);

      // Fetch user's tasks
      const tasksResponse = await fetch(`http://localhost:5001/api/tasks/student/${currentUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!tasksResponse.ok) {
        throw new Error(`Tasks API failed: ${tasksResponse.status}`);
      }
      
      const tasksData = await tasksResponse.json();
      setTasks(tasksData.tasks || []);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard data: ${err.message}`);
      setLoading(false);
    }
  };

  const getTaskStatusCounts = () => {
    const counts = { pending: 0, in_progress: 0, completed: 0, approved: 0 };
    tasks.forEach(task => {
      counts[task.status]++;
      const latestUpdate = task.updates[task.updates.length - 1];
      if (latestUpdate && latestUpdate.approved) {
        counts.approved++;
      }
    });
    return counts;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    if (percentage >= 40) return '#FFC107';
    return '#F44336';
  };

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  const taskCounts = getTaskStatusCounts();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <p>Welcome back, {user?.name}!</p>
      </div>

      <div className="dashboard-grid">
        {/* Academic Info Card */}
        <div className="dashboard-card academic-info">
          <h3>Academic Information</h3>
          <div className="academic-details">
            <div className="cgpa-display">
              <span className="cgpa-label">CGPA</span>
              <span className="cgpa-value">{user?.cgpa || 'Not set'}</span>
            </div>
            <div className="institution">
              <strong>Institution:</strong> {user?.institution || 'Not specified'}
            </div>
            <div className="interests">
              <strong>Interests:</strong> {user?.academicInterests?.join(', ') || 'None specified'}
            </div>
          </div>
        </div>

        {/* Task Overview Card */}
        <div className="dashboard-card task-overview">
          <h3>Task Overview</h3>
          <div className="task-stats">
            <div className="task-stat">
              <span className="stat-number">{taskCounts.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="task-stat">
              <span className="stat-number">{taskCounts.in_progress}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="task-stat">
              <span className="stat-number">{taskCounts.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="task-stat approved">
              <span className="stat-number">{taskCounts.approved}</span>
              <span className="stat-label">Approved</span>
            </div>
          </div>
        </div>

        {/* Project Progress Card */}
        <div className="dashboard-card project-progress">
          <h3>Project Progress</h3>
          {projects.length === 0 ? (
            <p className="no-projects">No projects assigned yet</p>
          ) : (
            <div className="projects-list">
              {projects.map(project => (
                <div key={project._id} className="project-item">
                  <div className="project-header">
                    <h4>{project.title}</h4>
                    <span className="progress-percentage">
                      {project.progressPercentage || 0}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${project.progressPercentage || 0}%`,
                        backgroundColor: getProgressColor(project.progressPercentage || 0)
                      }}
                    ></div>
                  </div>
                  <div className="project-details">
                    <span className="project-domain">{project.domain}</span>
                    <span className="project-status">{project.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Card */}
        <div className="dashboard-card recent-activity">
          <h3>Recent Tasks</h3>
          {tasks.length === 0 ? (
            <p className="no-tasks">No tasks assigned yet</p>
          ) : (
            <div className="recent-tasks">
              {tasks.slice(0, 5).map(task => (
                <div key={task._id} className="task-item">
                  <div className="task-info">
                    <h5>{task.title}</h5>
                    <span className={`task-status ${task.status}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  {task.updates.length > 0 && (
                    <div className="task-approval">
                      {task.updates[task.updates.length - 1].approved ? (
                        <span className="approved">✓ Approved</span>
                      ) : task.status === 'completed' ? (
                        <span className="pending-approval">⏳ Pending Approval</span>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Faculty Matching Suggestions Card */}
        <div className="dashboard-card matching-suggestions-card">
          <MatchingSuggestions 
            userId={userId || (user && (user.id || user._id))} 
            userRole={userRole || user?.role || 'student'} 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
