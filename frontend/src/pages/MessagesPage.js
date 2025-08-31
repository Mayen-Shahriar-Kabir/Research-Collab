import React from 'react';
import { useAuth } from '../context/AuthContext';
import MessagingSystem from '../components/MessagingSystem';

const MessagesPage = () => {
  const { currentUser: user, authToken } = useAuth();
  
  if (!user || !authToken) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Please log in to access messages</h3>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <MessagingSystem userId={user.id} userRole={user.role} />
    </div>
  );
};

export default MessagesPage;
