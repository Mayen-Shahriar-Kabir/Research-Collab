import React from 'react';
import ProfileManager from '../components/ProfileManager';

const ProfilePage = ({ userId, user }) => {
  console.log('ProfilePage props:', { userId, user });
  console.log('User ID from user object:', user?.id);
  console.log('User ID from user._id:', user?._id);
  
  // Use user.id or user._id as fallback
  const actualUserId = userId || user?.id || user?._id;
  console.log('Actual userId being passed to ProfileManager:', actualUserId);
  
  return (
    <div style={{ padding: '20px' }}>
      <ProfileManager userId={actualUserId} />
    </div>
  );
};

export default ProfilePage;
