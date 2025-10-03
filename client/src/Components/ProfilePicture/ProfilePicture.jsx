import './ProfilePicture.css';

const ProfilePicture = ({ profilePicture, size = 'medium', className = '' }) => {
  const getImageUrl = () => {
    if (!profilePicture) {
      return '/default_profile.webp'; // from client/public
    }
    // Already an absolute URL (e.g., Supabase public URL) or data URL
    if (/^https?:\/\//i.test(profilePicture) || profilePicture.startsWith('data:')) {
      return profilePicture;
    }
    // Legacy local uploads path from old backend
    return `${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')}${profilePicture}`;
  };

  return (
    <div className={`profile-picture ${size} ${className}`}>
      <img src={getImageUrl()} alt="Profile" />
    </div>
  );
};

export default ProfilePicture; 