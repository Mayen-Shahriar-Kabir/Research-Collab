import React from 'react';
import ProfileManager from '../components/ProfileManager';

const ProfilePage = ({ userId, user }) => {
  
  return (
    <div style={{ padding: '20px' }}>
      <ProfileManager userId={userId} />
    </div>
  );
};

export default ProfilePage;
