import React from 'react';
import MessagingSystem from '../components/MessagingSystem';

const MessagesPage = ({ userId, userRole }) => {
  return (
    <div style={{ padding: '20px' }}>
      <MessagingSystem userId={userId} userRole={userRole} />
    </div>
  );
};

export default MessagesPage;
