import React, { createContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../axios";

export const userProvider = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({ userName: "", userId: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await axios.get("/users/check", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      setUser({
        userName: data.username,
        userId: data.userid,
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
      setUser({ userName: "", userId: "" });
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post("/users/login", credentials);
      const { token, username, userid } = response.data;
      
      localStorage.setItem("token", token);
      setUser({ userName: username, userId: userid });
      setIsAuthenticated(true);
      
      // Redirect to the page they tried to access or home
      const from = location.state?.from?.pathname || "/home";
      navigate(from, { replace: true });
      
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { 
        success: false, 
        error: error.response?.data?.msg || "Login failed. Please try again." 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser({ userName: "", userId: "" });
    setIsAuthenticated(false);
    navigate("/");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <userProvider.Provider value={value}>
      {children}
    </userProvider.Provider>
  );
};