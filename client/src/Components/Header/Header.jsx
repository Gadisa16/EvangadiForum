import React, { useContext, useState, useEffect } from "react";
import { FaBell, FaCog, FaSignOutAlt, FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../../Context/NotificationContext";
import { userProvider } from "../../Context/UserProvider";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import "./Header.css";
import axios from "../../axios";

function Header() {
  const { user, isAuthenticated, logout } = useContext(userProvider);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [profilePicture, setProfilePicture] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.notification_id);
    // Navigate to the relevant content based on notification type
    switch (notification.type) {
      case 'answer':
      case 'comment':
        navigate(`/question/${notification.reference_id}`);
        break;
      case 'mention':
        navigate(`/profile/${notification.sender_id}`);
        break;
      default:
        break;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Ensure axios is available and correctly configured
        const response = await axios.get("/users/profile");
        setProfilePicture(response.data.profilePicture);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    // Fetch profile picture when the component mounts
    fetchProfile();
  
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Evangadi Forum</Link>
      </div>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/home">Home</Link>
            <Link to="/ask">Ask Question</Link>
            <div className="notification-container"
              onMouseEnter={() => setShowNotifications(true)}
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div 
                className="notification-icon"
                
              >
                <FaBell style={{width:"30px", height:"30px" }}/>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    <button 
                      className="mark-all-read"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-item">
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.notification_id}
                          className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="notification-content">
                            <p>{notification.sender_username} {notification.content}</p>
                            <small>{formatTimeAgo(notification.created_at)}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="profile-dropdown" 
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <div
                className="profile-icon">
                <ProfilePicture profilePicture={profilePicture} size="medium" />
              </div>
              {showDropdown && (
                <div className="dropdown-menu" style={{ display: 'block' }}>
                  <Link to="/profile" className="dropdown-item">
                    <FaUser /> Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <FaCog /> Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item">
                    <FaSignOutAlt /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/register">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Header;
