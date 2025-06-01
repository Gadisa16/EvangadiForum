import React from 'react';
import './ProfilePicture.css';

const ProfilePicture = ({ profilePicture, size = 'medium', className = '' }) => {
  const getImageUrl = () => {
    if (!profilePicture) {
      return '/default_profile.webp';
    }
    if (profilePicture.startsWith('data:') || profilePicture.startsWith('http')) {
      return profilePicture;
    }
    return `http://localhost:3000${profilePicture}`;
  };

  return (
    <div className={`profile-picture ${size} ${className}`}>
      <img src={getImageUrl()} alt="Profile" />
    </div>
  );
};

export default ProfilePicture; 