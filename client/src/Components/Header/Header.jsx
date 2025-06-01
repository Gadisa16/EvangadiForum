import React, { useContext, useEffect, useState } from "react";
import { FaCog, FaSignOutAlt, FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { userProvider } from "../../Context/UserProvider";
import axios from "../../axios";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import "./Header.css";

function Header() {
  const { user, isAuthenticated, logout } = useContext(userProvider);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get("/users/profile");
      setProfilePicture(response.data.profilePicture);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <div
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className="profile-icon-container"
    >
      {children}
    </div>
  ));

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
            <div className="profile-dropdown">
              <CustomToggle>
                <div className="profile-icon">
                  <ProfilePicture profilePicture={profilePicture} size="medium" />
                </div>
              </CustomToggle>
              <div className="dropdown-menu">
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
            </div>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Header;
