import React, { useState, useEffect } from 'react';
import './ProfileManager.css';

const ProfileManager = ({ userId }) => {
  const [profile, setProfile] = useState(() => {
    // Try to load profile from localStorage on initial render
    try {
      const savedProfile = localStorage.getItem(`profile_${userId}`);
      return savedProfile ? JSON.parse(savedProfile) : null;
    } catch (error) {
      console.error('Error loading profile from localStorage:', error);
      return null;
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newInterest, setNewInterest] = useState('');
  const [newPublication, setNewPublication] = useState({ title: '', url: '' });
  const [pubFile, setPubFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    console.log('ProfileManager useEffect triggered with userId:', userId);
    if (userId) {
      // Check if we have cached profile data
      const savedProfile = localStorage.getItem(`profile_${userId}`);
      if (savedProfile && !profile) {
        try {
          setProfile(JSON.parse(savedProfile));
          setLoading(false);
        } catch (error) {
          console.error('Error parsing saved profile:', error);
          fetchProfile();
        }
      } else if (!profile) {
        fetchProfile();
      } else {
        setLoading(false);
      }
    } else {
      console.log('No userId provided, skipping profile fetch');
      setLoading(false);
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for userId:', userId);
      
      if (!userId) {
        console.error('No userId provided');
        setLoading(false);
        return;
      }
      
      const url = `http://localhost:5001/api/profile/${userId}`;
      console.log('Making request to URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        setProfile(data);
        // Save to localStorage for persistence
        try {
          localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
        } catch (error) {
          console.error('Error saving profile to localStorage:', error);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to fetch profile:', errorData);
        
        setProfile({
          profile: {
            name: '',
            email: '',
            institution: '',
            academicInterests: [],
            publications: [],
            profilePhoto: null,
            cgpa: '',
            studentId: '',
            program: '',
            department: ''
          }
        });
      }
    } catch (error) {
      console.error('Network error fetching profile:', error);
      
      setProfile({
        profile: {
          name: '',
          email: '',
          institution: '',
          academicInterests: [],
          publications: [],
          profilePhoto: null,
          cgpa: '',
          studentId: '',
          program: '',
          department: ''
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePubFileChange = (e) => {
    const file = e.target.files[0];
    setPubFile(file || null);
  };

  const uploadPublicationFile = async () => {
    if (!userId) return alert('Please log in');
    if (!newPublication.title.trim()) return alert('Please provide a title');
    if (!pubFile) return alert('Please choose a file');

    const formData = new FormData();
    formData.append('file', pubFile);
    formData.append('title', newPublication.title.trim());
    if (newPublication.url) formData.append('url', newPublication.url);

    try {
      const res = await fetch(`http://localhost:5001/api/profile/${userId}/publications/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to upload publication');
      // Refresh profile to show latest publications
      await fetchProfile();
      setPubFile(null);
      setNewPublication({ title: '', url: '' });
      alert('Publication uploaded');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      alert('Error: No user ID available. Please log in again.');
      return;
    }
    
    try {
      const url = `http://localhost:5001/api/profile/${userId}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile.profile),
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        // Update localStorage with new data
        try {
          localStorage.setItem(`profile_${userId}`, JSON.stringify(updatedProfile));
        } catch (error) {
          console.error('Error saving updated profile to localStorage:', error);
        }
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        alert('Failed to update profile: ' + errorData.message);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error: ' + error.message);
    }
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setProfile(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          academicInterests: [...(prev.profile?.academicInterests || []), newInterest.trim()]
        }
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (index) => {
    setProfile(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        academicInterests: (prev.profile?.academicInterests || []).filter((_, i) => i !== index)
      }
    }));
  };

  const addPublication = () => {
    if (newPublication.title.trim()) {
      setProfile(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          publications: [...(prev.profile?.publications || []), newPublication]
        }
      }));
      setNewPublication({ title: '', url: '' });
    }
  };

  const removePublication = (index) => {
    setProfile(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        publications: (prev.profile?.publications || []).filter((_, i) => i !== index)
      }
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;
    
    const formData = new FormData();
    formData.append('profilePhoto', photoFile);
    
    try {
      const response = await fetch(`http://localhost:5001/api/profile/${userId}/photo`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            profilePhoto: data.profilePhoto
          }
        }));
        setPhotoFile(null);
        setPhotoPreview(null);
        alert('Profile photo updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo');
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  if (!userId) {
    return (
      <div className="profile-manager">
        <div className="profile-header">
          <h2>Profile Information</h2>
        </div>
        <div className="profile-content">
          <p>Please log in to view and edit your profile.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-manager">
        <div className="profile-header">
          <h2>Profile Information</h2>
        </div>
        <div className="profile-content">
          <p>Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-manager">
      <div className="profile-header">
        <h2>Profile Information</h2>
        <button 
          className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-content">
        
        {/* Profile Photo Section */}
        <div className="form-group profile-photo-section">
          <label>Profile Photo</label>
          <div className="photo-container">
            <div className="photo-display">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="profile-photo-preview" />
              ) : profile.profile?.profilePhoto ? (
                <img src={`http://localhost:5001${profile.profile.profilePhoto}`} alt="Profile" className="profile-photo" />
              ) : (
                <div className="photo-placeholder">
                  <span>📷</span>
                  <p>No photo uploaded</p>
                </div>
              )}
            </div>
            {isEditing && (
              <div className="photo-controls">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="photo-input"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="btn btn-secondary">
                  Choose Photo
                </label>
                {photoFile && (
                  <button onClick={uploadPhoto} className="btn btn-primary">
                    Upload Photo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Name</label>
          {isEditing ? (
            <input
              type="text"
              value={profile.profile?.name || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                profile: { ...prev.profile, name: e.target.value }
              }))}
              className="form-control"
            />
          ) : (
            <p className="profile-value">{profile.profile?.name || 'Not specified'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Student ID</label>
          {isEditing ? (
            <input
              type="text"
              value={profile.profile?.studentId || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                profile: { ...prev.profile, studentId: e.target.value }
              }))}
              className="form-control"
              placeholder="Enter your student ID"
            />
          ) : (
            <p className="profile-value">{profile.profile?.studentId || 'Not specified'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Program</label>
          {isEditing ? (
            <select
              value={profile.profile?.program || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                profile: { ...prev.profile, program: e.target.value }
              }))}
              className="form-control"
            >
              <option value="">Select Program</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
          ) : (
            <p className="profile-value">{profile.profile?.program || 'Not specified'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Department</label>
          {isEditing ? (
            <input
              type="text"
              value={profile.profile?.department || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                profile: { ...prev.profile, department: e.target.value }
              }))}
              className="form-control"
              placeholder="Enter your department"
            />
          ) : (
            <p className="profile-value">{profile.profile?.department || 'Not specified'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Institution</label>
          {isEditing ? (
            <input
              type="text"
              value={profile.profile?.institution || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                profile: { ...prev.profile, institution: e.target.value }
              }))}
              className="form-control"
            />
          ) : (
            <p className="profile-value">{profile.profile?.institution || 'Not specified'}</p>
          )}
        </div>

        <div className="form-group">
          <label>CGPA</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              min="0"
              max="4.0"
              value={profile.profile?.cgpa || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                profile: { ...prev.profile, cgpa: e.target.value }
              }))}
              className="form-control"
              placeholder="Enter CGPA (0.00 - 4.00)"
            />
          ) : (
            <p className="profile-value">{profile.profile?.cgpa || 'Not specified'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Academic Interests</label>
          <div className="interests-container">
            {profile.profile?.academicInterests?.map((interest, index) => (
              <div key={index} className="interest-tag">
                <span>{interest}</span>
                {isEditing && (
                  <button 
                    onClick={() => removeInterest(index)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="add-interest">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add new interest"
                className="form-control"
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
              />
              <button onClick={addInterest} className="btn btn-secondary">Add</button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Publications</label>
          <div className="publications-container">
            {profile.profile?.publications?.map((pub, index) => (
              <div key={index} className="publication-item">
                <div className="publication-content">
                  <h4>{pub.title}</h4>
                  {pub.url && (
                    <a href={pub.url} target="_blank" rel="noopener noreferrer">
                      View Publication
                    </a>
                  )}
                  {pub.file && (
                    <a href={`http://localhost:5001${pub.file}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 10 }}>
                      Download File
                    </a>
                  )}
                </div>
                {isEditing && (
                  <button 
                    onClick={() => removePublication(index)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="add-publication">
              <input
                type="text"
                value={newPublication.title}
                onChange={(e) => setNewPublication(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Publication title"
                className="form-control"
              />
              <input
                type="url"
                value={newPublication.url}
                onChange={(e) => setNewPublication(prev => ({ ...prev, url: e.target.value }))}
                placeholder="Publication URL (optional)"
                className="form-control"
              />
              <div className="add-publication-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={addPublication} className="btn btn-secondary">Add Link Only</button>
                <input type="file" onChange={handlePubFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" />
                <button onClick={uploadPublicationFile} className="btn btn-primary">Upload File</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
