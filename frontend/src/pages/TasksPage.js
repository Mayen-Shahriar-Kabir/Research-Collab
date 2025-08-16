import React from 'react';
import TaskManager from '../components/TaskManager';

const TasksPage = ({ userId, userRole }) => {
  return (
    <div style={{ padding: '20px' }}>
      <TaskManager userId={userId} userRole={userRole} />
    </div>
  );
};

export default TasksPage;
