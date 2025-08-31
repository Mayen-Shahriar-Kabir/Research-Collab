import React from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileManager from '../components/ProfileManager';

const ProfilePage = () => {
  const { currentUser: user } = useAuth();
  
  // Use user.id (backend sends id, not _id)
  const actualUserId = user?.id;
  console.log('Actual userId being passed to ProfileManager:', actualUserId);
  
  return (
    <div style={{ padding: '20px' }}>
      <ProfileManager userId={actualUserId} />
    </div>
  );
};

export default ProfilePage;
