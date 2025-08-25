import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TaskManager.css';

// Normalize API base and default to port 5001
const API_BASE = ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
  .replace(/\/$/, '')
  .replace(/\/api$/, ''));

const TaskManager = ({ userId, userRole, projectId, selectedTaskId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(userRole === 'student' ? 'pending' : 'all');
  const [students, setStudents] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    status: 'pending',
    comments: ''
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [workFile, setWorkFile] = useState(null);
  const [workComments, setWorkComments] = useState('');
  const [feedbackMap, setFeedbackMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    if (userRole === 'faculty' || userRole === 'admin') {
      fetchStudents();
    }
  }, [userId, projectId, userRole]);

  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const task = tasks.find(t => t._id === selectedTaskId);
      if (task) {
        setSelectedTask(task);
        setFilter('all'); // Show all tasks when viewing specific task
      }
    }
  }, [selectedTaskId, tasks]);

  const fetchTasks = async () => {
    try {
      let url = `${API_BASE}/api/tasks?`;
      if (projectId) url += `projectId=${projectId}`;
      else if (userId) url += `userId=${userId}`;
      
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users?role=student`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTask = async () => {
    if (!taskForm.title || !taskForm.assignedTo) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate,
          projectId: projectId,
          assignedTo: taskForm.assignedTo,
          createdBy: userId
        })
      });

      if (response.ok) {
        setShowAddTask(false);
        setTaskForm({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          assignedTo: '',
          status: 'pending',
          comments: ''
        });
        fetchTasks();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          userId: userId
        })
      });

      if (response.ok) {
        setTasks(tasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        ));
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update task status');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Failed to update task status');
    }
  };

  const handleTaskApproval = async (taskId, approved, comments = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          approved: approved,
          feedback: comments,
          facultyId: userId
        })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(task => 
          task._id === taskId ? updatedTask.task : task
        ));
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to approve task');
      }
    } catch (err) {
      console.error('Error approving task:', err);
      alert('Failed to approve task');
    }
  };

  const submitWorkWithFile = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', 'completed');
      formData.append('userId', userId);
      formData.append('comments', workComments);
      
      if (workFile) {
        formData.append('workFile', workFile);
      }

      const response = await fetch(`${API_BASE}/api/tasks/${taskId}/work`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setWorkFile(null);
        setWorkComments('');
        setSelectedTask(null);
        fetchTasks();
        alert('Work submitted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit work');
      }
    } catch (error) {
      console.error('Error submitting work:', error);
      alert('Failed to submit work');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#007bff';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="task-manager">
      <div className="task-header">
        <h2>{userRole === 'student' ? 'My Tasks' : 'Task Management'}</h2>
        
        <div className="task-controls">
          <div className="filter-controls">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending Tasks</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {(userRole === 'faculty' || userRole === 'admin') && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddTask(true)}
            >
              Add New Task
            </button>
          )}
        </div>
      </div>

      {showAddTask && (
        <div className="add-task-form">
          <div className="card">
            <div className="card-header">
              <h3>Add New Task</h3>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={taskForm.title}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter task title"
                    required
                  />
                </div>
                <div className="form-group col-md-6">
                  <label>Assign to Student *</label>
                  <select
                    name="assignedTo"
                    value={taskForm.assignedTo}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={taskForm.description}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                  placeholder="Enter task description"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={taskForm.priority}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group col-md-6">
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={taskForm.dueDate}
                    onChange={handleInputChange}
                    className="form-control"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="form-actions mt-3">
                <button 
                  type="button"
                  className="btn btn-outline-secondary me-2"
                  onClick={() => setShowAddTask(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddTask}
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="tasks-container">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks found for the selected filter.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task._id} className={`task-card ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
              <div className="task-header-card">
                <div className="task-title-row">
                  <h3>{task.title}</h3>
                  <div className="task-badges">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <div className="task-description">
                    <p>{task.description}</p>
                  </div>
                )}

                <div className="task-info">
                  <div className="task-meta">
                    <span className="due-date">
                      <strong>Due:</strong> {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate) && <span className="overdue-text"> (Overdue)</span>}
                    </span>
                    {task.project && (
                      <span className="project-name">
                        <strong>Project:</strong> {task.project.title}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span className="assigned-to">
                        <strong>Assigned to:</strong> {task.assignedTo.name || task.assignedTo.profile?.name || task.assignedTo.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="task-actions">
                  {userRole === 'student' && task.assignedTo && task.assignedTo._id === userId ? (
                    <div className="student-task-actions">
                      <div className="status-controls">
                        <button
                          className={`status-btn ${task.status === 'pending' ? 'active' : ''}`}
                          onClick={() => handleStatusUpdate(task._id, 'pending')}
                        >
                          📋 Pending
                        </button>
                        <button
                          className={`status-btn ${task.status === 'in_progress' ? 'active' : ''}`}
                          onClick={() => handleStatusUpdate(task._id, 'in_progress')}
                        >
                          🔄 In Progress
                        </button>
                        <button
                          className={`status-btn ${task.status === 'completed' ? 'active' : ''}`}
                          onClick={() => setSelectedTask(task)}
                        >
                          ✅ Complete & Submit
                        </button>
                      </div>
                      
                      {task.status === 'completed' && (
                        <div className="completed-note">
                          <small>✅ Work has been submitted. Click "Complete & Submit" to update or resubmit.</small>
                        </div>
                      )}
                    </div>
                  ) : userRole === 'faculty' ? (
                    <div className="faculty-task-actions">
                      <div className="status-controls">
                        <button
                          className={`status-btn ${task.status === 'pending' ? 'active' : ''}`}
                          onClick={() => handleStatusUpdate(task._id, 'pending')}
                        >
                          Pending
                        </button>
                        <button
                          className={`status-btn ${task.status === 'in_progress' ? 'active' : ''}`}
                          onClick={() => handleStatusUpdate(task._id, 'in_progress')}
                        >
                          In Progress
                        </button>
                        <button
                          className={`status-btn ${task.status === 'completed' ? 'active' : ''}`}
                          onClick={() => handleStatusUpdate(task._id, 'completed')}
                        >
                          Completed
                        </button>
                      </div>
                      
                      {task.status === 'completed' && task.updates.length > 0 && (
                        <div className="approval-controls">
                          {task.updates[task.updates.length - 1].approved ? (
                            <div className="approved-status">
                              ✅ Approved by faculty
                            </div>
                          ) : (
                            <div className="approval-buttons">
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
                              <div className="approval-buttons-row">
                                <button
                                  className="approve-btn"
                                  onClick={() => handleTaskApproval(task._id, true, feedbackMap[task._id] || 'Task approved')}
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  className="reject-btn"
                                  onClick={() => handleTaskApproval(task._id, false, feedbackMap[task._id] || 'Task needs revision')}
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="status-controls">
                      <button
                        className={`status-btn ${task.status === 'pending' ? 'active' : ''}`}
                        onClick={() => handleStatusUpdate(task._id, 'pending')}
                      >
                        Pending
                      </button>
                      <button
                        className={`status-btn ${task.status === 'in_progress' ? 'active' : ''}`}
                        onClick={() => handleStatusUpdate(task._id, 'in_progress')}
                      >
                        In Progress
                      </button>
                      <button
                        className={`status-btn ${task.status === 'completed' ? 'active' : ''}`}
                        onClick={() => handleStatusUpdate(task._id, 'completed')}
                      >
                        Completed
                      </button>
                    </div>
                  )}
                </div>

                <div className="task-dates">
                  <small>Created: {new Date(task.createdAt).toLocaleDateString()}</small>
                  {task.updatedAt !== task.createdAt && (
                    <small>Updated: {new Date(task.updatedAt).toLocaleDateString()}</small>
                  )}
                </div>
                {task.updates && task.updates.length > 0 && task.updates[task.updates.length - 1].feedback && (
                  <div className="task-feedback">
                    <small><strong>Faculty Feedback:</strong> {task.updates[task.updates.length - 1].feedback}</small>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Work Submission Modal */}
      {selectedTask && userRole === 'student' && (
        <div className="modal-overlay">
          <div className="work-submission-modal">
            <div className="modal-header">
              <h3>Submit Work for: {selectedTask.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedTask(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="task-details">
                <p><strong>Description:</strong> {selectedTask.description}</p>
                <p><strong>Due Date:</strong> {formatDate(selectedTask.dueDate)}</p>
                <p><strong>Priority:</strong> {selectedTask.priority}</p>
              </div>

              <div className="work-submission-form">
                <div className="form-group">
                  <label>Upload Work File:</label>
                  <input
                    type="file"
                    onChange={(e) => setWorkFile(e.target.files[0])}
                    className="file-input"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                  />
                  {workFile && (
                    <p className="file-selected">Selected: {workFile.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Comments (optional):</label>
                  <textarea
                    value={workComments}
                    onChange={(e) => setWorkComments(e.target.value)}
                    placeholder="Add any comments about your work..."
                    rows="4"
                    className="form-control"
                  />
                </div>

                {selectedTask.updates && selectedTask.updates.length > 0 && (
                  <div className="previous-updates">
                    <h4>Previous Updates:</h4>
                    {selectedTask.updates.slice(-3).map((update, index) => (
                      <div key={index} className="update-item">
                        <p><strong>Status:</strong> {update.status}</p>
                        {update.comments && <p><strong>Comments:</strong> {update.comments}</p>}
                        {update.workFile && (
                          <p><strong>File:</strong> 
                            <a href={`${API_BASE}${update.workFile}`} target="_blank" rel="noopener noreferrer">
                              View Previous Work
                            </a>
                          </p>
                        )}
                        <small>{new Date(update.updatedAt).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedTask(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => submitWorkWithFile(selectedTask._id)}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
