import React from 'react';
import ProfileManager from '../components/ProfileManager';

const ProfilePage = ({ userId, user }) => {
  console.log('ProfilePage props:', { userId, user });
  
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
        Debug: userId={userId}, user={JSON.stringify(user)}
      </div>
      <ProfileManager userId={userId} />
    </div>
  );
};

export default ProfilePage;
