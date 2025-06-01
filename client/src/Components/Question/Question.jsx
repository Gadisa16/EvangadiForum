import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { userProvider } from '../../Context/UserProvider';
import "./Question.css";

function Question({ title, username, questionid, isAuthenticated, created_at }) {
  const navigate = useNavigate();
  const { user } = useContext(userProvider);

  function handleClick() {
    if (!isAuthenticated) {
      // Save the current location for redirect after login
      navigate("/register", { state: { from: { pathname: `/question/${questionid}` } } });
      return;
    }
    navigate(`/question/${questionid}`);
  }

  // Format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border-top row top_question" onClick={handleClick}>
      <div className="col-md-1 d-flex flex-column align-items-md-center my-md-auto">
        <i className="fas fa-user-circle fa-3x user" />
        <p className="mb-0">{username}</p>
      </div>
      <div className="col-md-3 my-md-auto">
        <p>{title}</p>
        {created_at && (
          <small className="text-muted posted_date">Posted on {formatDate(created_at)}</small>
        )}
      </div>
      <div className="col-md text-md-end my-md-auto">
        <i className="fas fa-angle-right fa-lg" />
      </div>
    </div>
  );
}

export default Question;