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
  const [greeting, setGreeting] = useState('');

  // Function to capitalize first letter of each word
  const capitalizeName = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Function to get random greeting
  const getRandomGreeting = () => {
    const greetings = [
      'Hi',
      'Hello',
      'Hey',
      'Greetings',
      'Welcome back',
      'Good to see you',
      'Hey there',
      'Hi there',
      'Hello there',
      'Welcome'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  useEffect(() => {
    if (isAuthenticated) {
      setGreeting(getRandomGreeting());
    }
  }, [isAuthenticated]);

  function handleAskQuestion() {
    if (!isAuthenticated) {
      // Save the current location for redirect after login
      navigate("/register", { state: { from: { pathname: "/ask" } } });
      return;
    }
    navigate("/ask");
  }

  useEffect(() => {
    async function fetchAllQuestions() {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/questions/all_questions");
        console.log("Full response:", response);
        console.log("Questions data:", response.data.data);
        if (response.data && response.data.data) {
          console.log("Setting questions with:", response.data.data);
          setQuestions(response.data.data);
        } else {
          setError("No questions found");
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError(error.response?.data?.msg || "Failed to fetch questions. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchAllQuestions();
  }, [setQuestions]);

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
              <h4 className="wel">{greeting}, {capitalizeName(user.userName)}!</h4>
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
        console.log("No questions available", questions),
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
