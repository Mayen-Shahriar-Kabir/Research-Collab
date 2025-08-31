import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TaskManager from '../components/TaskManager';

const TasksPage = () => {
  const { taskId } = useParams();
  const { currentUser, authToken } = useAuth();

  if (!currentUser || !authToken) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Please log in to access tasks</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <TaskManager 
        userId={currentUser.id} 
        userRole={currentUser.role} 
        selectedTaskId={taskId} 
      />
    </div>
  );
};

export default TasksPage;
