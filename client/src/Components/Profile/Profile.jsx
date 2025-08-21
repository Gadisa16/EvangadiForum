import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../axios";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import "./Profile.css";
import { toast } from "react-toastify";
import BackButton from "../BackButton/BackButton";

const Profile = () => {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    bio: "",
    firstname: "",
    lastname: "",
    profilePicture: null,
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  // const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get("/users/profile");
      const userData = response.data;
      
      // Set profile data with existing values or empty strings
      setProfile({
        username: userData.username || "",
        email: userData.email || "",
        bio: userData.bio || "",
        firstname: userData.firstname || "",
        lastname: userData.lastname || "",
        profilePicture: userData.profilePicture || null,
      });

      // Set preview URL to profile picture or null (which will trigger default avatar)
      setPreviewUrl(userData.profilePicture || null);
      setLoading(false);
    } catch (err) {
      // setError("Failed to load profile");
      toast.error("Failed to load profile");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        // setError("File size should be less than 5MB");
        toast.error("File size should be less than 5MB");
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        // setError("Only JPG, PNG and GIF files are allowed");
        toast.error("Only JPG, PNG and GIF files are allowed");
        return;
      }

      setProfile((prev) => ({
        ...prev,
        profilePicture: file,
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setError(null);
    // setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("username", profile.username);
      formData.append("bio", profile.bio);
      formData.append("firstname", profile.firstname);
      formData.append("lastname", profile.lastname);
      if (profile.profilePicture && profile.profilePicture instanceof File) {
        formData.append("profilePicture", profile.profilePicture);
      }

      const response = await axios.put("/users/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // setSuccess("Profile updated successfully");
      toast.success("Profile updated successfully");
      setProfile(response.data.user);
      if (response.data.user.profilePicture) {
        setPreviewUrl(response.data.user.profilePicture);
      }
    } catch (err) {
      // setError(err.response?.data?.msg || "Failed to update profile");
      toast.error(err.response?.data?.msg || "Failed to update profile");
    }
  };

  const handleProfilePictureClick = () => {
    document.getElementById('profilePicture').click();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h2>Profile Settings</h2>
      {/* {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>} */}
      <form onSubmit={handleSubmit} className="profile-form position-relative">
        <BackButton />
        <div className="profile-picture-section" onClick={handleProfilePictureClick}>
          <ProfilePicture profilePicture={previewUrl} size="xlarge" />
          <div className="profile-picture-overlay">
            <img src="/camera.png" alt="Change profile picture" />
          </div>
          <input
            type="file"
            id="profilePicture"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={profile.username}
            onChange={handleChange}
            placeholder="Enter your username"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={profile.email}
            disabled
            className="disabled-input"
            placeholder="Your email address"
          />
        </div>
        <div className="form-group">
          <label htmlFor="firstname">First Name</label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            value={profile.firstname}
            onChange={handleChange}
            placeholder="Enter your first name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastname">Last Name</label>
          <input
            type="text"
            id="lastname"
            name="lastname"
            value={profile.lastname}
            onChange={handleChange}
            placeholder="Enter your last name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
            rows="4"
          />
        </div>
        <button type="submit" className="update-button">
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default Profile; 