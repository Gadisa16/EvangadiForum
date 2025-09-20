import "bootstrap/dist/css/bootstrap.min.css";
import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionContext } from '../../Context/QuestionContext';
import { userProvider } from '../../Context/UserProvider';
import axios from "../../axios";
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
      console.log(response.data);
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
            <button onClick={handleAskQuestion} className="qba">
              <span>Ask Question</span>
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
              <h4 className="wel">Welcome, Guest</h4>
            )}
          </div>
        </div>
        <h3 className="ns">Questions</h3>
      </div>
      {loading ? (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p className="empty-state-text">Loading questions...</p>
        </div>
      ) : error ? (
        <div className="empty-state-container">
          <div className="empty-state-icon" style={{ animation: 'none' }}>
            <i className="fas fa-exclamation-triangle text-danger"></i>
          </div>
          <p className="empty-state-text error">{error}</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <i className="fas fa-eye"></i>
          </div>
          <p className="empty-state-text">No questions available at the moment.</p>
          <p className="empty-state-text">Be the first to ask!</p>
        </div>
      ) : (
        <AnimatePresence>
          {questions.map((question, index) => (
            <motion.div
              key={question.questionid || index}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ delay: index * 0.08, duration: 0.5, type: "spring" }}
            >
              <Question
                username={capitalizeName(question.username)}
                profilePicture={question.profilePicture}
                bio = {question.bio}
                title={question.title}
                questionid={question.questionid}
                isAuthenticated={isAuthenticated}
                created_at={question.created_at}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

export default HomePage;

