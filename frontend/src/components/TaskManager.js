import React, { useState, useEffect } from 'react';
import './TaskManager.css';

const TaskManager = ({ userId, userRole, projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [userId, projectId]);

  const fetchTasks = async () => {
    try {
      let url = 'http://localhost:5001/api/tasks?';
      if (projectId) url += `projectId=${projectId}&`;
      if (userId) url += `userId=${userId}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task._id === taskId ? updatedTask : task
        ));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch('http://localhost:5001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          project: projectId,
          assignedTo: userId
        }),
      });
      
      if (response.ok) {
        const createdTask = await response.json();
        setTasks(prev => [createdTask, ...prev]);
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: ''
        });
        setShowAddTask(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getFilteredTasks = () => {
    if (filter === 'all') return tasks;
    return tasks.filter(task => task.status === filter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'in_progress': return '#17a2b8';
      case 'completed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  const filteredTasks = getFilteredTasks();

  return (
    <div className="task-manager">
      <div className="task-header">
        <h2>Task Management</h2>
        <div className="task-controls">
          <div className="filter-controls">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({tasks.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({tasks.filter(t => t.status === 'pending').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setFilter('in_progress')}
            >
              In Progress ({tasks.filter(t => t.status === 'in_progress').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({tasks.filter(t => t.status === 'completed').length})
            </button>
          </div>
          {(userRole === 'faculty' || userRole === 'student') && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddTask(!showAddTask)}
            >
              {showAddTask ? 'Cancel' : 'Add Task'}
            </button>
          )}
        </div>
      </div>

      {showAddTask && (
        <div className="add-task-form">
          <h3>Create New Task</h3>
          <div className="form-group">
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Task description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              className="form-control"
              rows="3"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                className="form-control"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="form-group">
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                className="form-control"
              />
            </div>
          </div>
          <div className="form-actions">
            <button onClick={createTask} className="btn btn-success">Create Task</button>
            <button onClick={() => setShowAddTask(false)} className="btn btn-secondary">Cancel</button>
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
                <div className="status-controls">
                  <button
                    className={`status-btn ${task.status === 'pending' ? 'active' : ''}`}
                    onClick={() => updateTaskStatus(task._id, 'pending')}
                  >
                    Pending
                  </button>
                  <button
                    className={`status-btn ${task.status === 'in_progress' ? 'active' : ''}`}
                    onClick={() => updateTaskStatus(task._id, 'in_progress')}
                  >
                    In Progress
                  </button>
                  <button
                    className={`status-btn ${task.status === 'completed' ? 'active' : ''}`}
                    onClick={() => updateTaskStatus(task._id, 'completed')}
                  >
                    Completed
                  </button>
                </div>
              </div>

              <div className="task-dates">
                <small>Created: {new Date(task.createdAt).toLocaleDateString()}</small>
                {task.updatedAt !== task.createdAt && (
                  <small>Updated: {new Date(task.updatedAt).toLocaleDateString()}</small>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager;
