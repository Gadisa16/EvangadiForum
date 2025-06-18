import "bootstrap/dist/css/bootstrap.min.css";
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionContext } from '../../Context/QuestionContext';
import { userProvider } from '../../Context/UserProvider';
import axios from "../axios";
import Question from '../Question/Question';
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(userProvider);
  const { questions, setQuestions } = useContext(QuestionContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState({
    questionsCount: 0,
    answersCount: 0,
    profileCompletion: 0,
    activityScore: 0
  });
  const [userProfile, setUserProfile] = useState({
    bio: '',
    username: ''
  });

  // Function to capitalize first letter of each word
  const capitalizeName = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setUserProfile({
        bio: response.data.bio || '',
        username: response.data.username || ''
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/users/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/questions/all_questions");
      
      if (response.data && Array.isArray(response.data.data)) {
        setQuestions(response.data.data);
      } else {
        setQuestions([]);
        console.warn('Unexpected response format:', response.data);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.response?.data?.msg || "Failed to load questions. Please try again later.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  function handleAskQuestion() {
    if (!isAuthenticated) {
      navigate("/register", { state: { from: { pathname: "/ask" } } });
      return;
    }
    navigate("/ask");
  }

  useEffect(() => {
    fetchQuestions();
    if (isAuthenticated) {
      fetchUserStats();
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const greeting = ["Welcome back", "Hey", "Hy", "greetings", "Hello", "Hi", "Good to see you"];
  function getGreeting() {
    const randomGreeting = greeting[Math.floor(Math.random() * greeting.length)];
    return randomGreeting;
  }

  return (
    <div className="top mx-auto" style={{ width: "86%" }}>
      <div className="homp">
        <div className="row hed mb-5">
          <div className="col-md-6 d-flex justify-content-center justify-content-md-start">
            <button onClick={handleAskQuestion} className="qb">
              Ask Question
            </button>
          </div>
          <div className="col-md-6 d-flex justify-content-center justify-content-md-end">
            {isAuthenticated ? (
              <div className="user-welcome">
                <div className="user-stats">
                  <h3>{getGreeting()}, {capitalizeName(userProfile.username)}!</h3>
                  {userProfile.bio && (
                    <p className="user-bio">{userProfile.bio}</p>
                  )}
                  <div className="progress-section">
                    <div className="progress-label">
                      <span>Profile Completion</span>
                      <span>{userStats.profileCompletion}%</span>
                    </div>
                    <div className="progress">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${userStats.profileCompletion}%` }}
                        aria-valuenow={userStats.profileCompletion} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <div className="progress-section">
                    <div className="progress-label">
                      <span>Activity Score</span>
                      <span>{userStats.activityScore}</span>
                    </div>
                    <div className="progress">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${Math.min((userStats.activityScore) / 2, 100)}%` }}
                        aria-valuenow={userStats.activityScore} 
                        aria-valuemin="0" 
                        aria-valuemax="200"
                      ></div>
                    </div>
                  </div>
                  <div className="stats-info">
                    <div className="stat-item">
                      <i className="fas fa-question-circle"></i>
                      <span>{userStats.questionsCount} Questions</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-comment-dots"></i>
                      <span>{userStats.answersCount} Answers</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <h4 className="wel">Welcome Guest</h4>
            )}
          </div>
        </div>
        <h3 className="ns">Questions</h3>
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="text-danger text-center">{error}</div>
      ) : questions.length === 0 ? (
        <div className="text-center">No questions available</div>
      ) : (
        questions.map((question, index) => (
          <Question
            key={question.questionid || index}
            title={question.title}
            username={capitalizeName(question.username)}
            questionid={question.questionid}
            isAuthenticated={isAuthenticated}
            created_at={question.created_at}
          />
        ))
      )}
    </div>
  );
}

export default HomePage;

