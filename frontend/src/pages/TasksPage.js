import React from 'react';
import { useParams } from 'react-router-dom';
import TaskManager from '../components/TaskManager';

const TasksPage = ({ userId, userRole }) => {
  const { taskId } = useParams();

  return (
    <div style={{ padding: '20px' }}>
      <TaskManager userId={userId} userRole={userRole} selectedTaskId={taskId} />
    </div>
  );
};

export default TasksPage;
