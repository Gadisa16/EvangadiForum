import React, { useContext, useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { useParams } from 'react-router-dom';
import { QuestionContext } from '../../Context/QuestionContext';
import { userProvider } from '../../Context/UserProvider';
import axios from "../axios";
import "./QuestionDetail.css";

function QuestionDetail() {
  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const token = localStorage.getItem("token");
  const [user, setUser] = useContext(userProvider);

  const { questions } = useContext(QuestionContext);
  const { questionid } = useParams();
  const [dbAnswer, setdbAnswer] = useState([]);
  const [answerVotes, setAnswerVotes] = useState({});
  
  useEffect(() => {
    async function getAns() {
      try {
        const ans = await axios.get(
          `/answers/all-answers/${questionid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setdbAnswer(ans.data.data);
        
        // Fetch votes for each answer immediately after getting answers
        const votes = {};
        for (const answer of ans.data.data) {
          try {
            const response = await axios.get(`/answers/${answer.answerid}/votes`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            votes[answer.answerid] = response.data;
          } catch (error) {
            console.error('Error fetching votes:', error);
          }
        }
        setAnswerVotes(votes);
      } catch (error) {
        console.log(error);
      }
    }

    if (questionid) {
      getAns();
    }
  }, [questionid, token]);

  const selectedQuestion = questions.find(
    (ques) => ques.questionid === questionid
  );

  async function handleClick(data) {
    try {
      await axios.post(
        "/answers/postanswers",
        {
          answer: data.answer,
          questionid: questionid,
          userid: user.userId,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const ans = await axios.get(
        `/answers/all-answers/${questionid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the dbAnswer state with the fetched answers
      setdbAnswer(ans.data.data);
      setValue("answer", ""); // Clear the textarea after posting
    } catch (error) {
      console.log(error);
    }
  }

  const handleVote = async (answerId, voteType) => {
    try {
      // Optimistically update the UI
      const currentVotes = answerVotes[answerId] || { votes: { likes: 0, dislikes: 0 }, userVote: null };
      const newVotes = { ...currentVotes };
      
      // If clicking the same vote type, remove the vote
      if (currentVotes.userVote === voteType) {
        newVotes.userVote = null;
        newVotes.votes[voteType === 'like' ? 'likes' : 'dislikes']--;
      } else {
        // If changing vote type, update counts
        if (currentVotes.userVote === 'like') {
          newVotes.votes.likes--;
        } else if (currentVotes.userVote === 'dislike') {
          newVotes.votes.dislikes--;
        }
        newVotes.userVote = voteType;
        newVotes.votes[voteType === 'like' ? 'likes' : 'dislikes']++;
      }

      // Update state immediately
      setAnswerVotes(prev => ({
        ...prev,
        [answerId]: newVotes
      }));

      // Make the API call
      const response = await axios.post(
        `/answers/${answerId}/vote`,
        { voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update with server response to ensure consistency
      setAnswerVotes(prev => ({
        ...prev,
        [answerId]: {
          votes: response.data.votes,
          userVote: response.data.userVote
        }
      }));

      // Show success message
      const message = response.data.message === 'Vote removed' 
        ? 'Vote removed successfully' 
        : 'Vote recorded successfully';
      
      console.log(message);
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update on error
      const response = await axios.get(`/answers/${answerId}/votes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnswerVotes(prev => ({
        ...prev,
        [answerId]: response.data
      }));
    }
  };

  return (
    <div className="container top">
      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title">Question</h4>
          <h5 className="card-subtitle mb-2 text-muted">Title: {selectedQuestion?.title}</h5>
          <p className="card-text">{selectedQuestion?.description}</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title">Answers From The Community</h4>
        </div>
      </div>

      {dbAnswer.map((answerData, index) => (
        <div className="card mb-3 info_question" key={index}>
          <div className="card-body row">
            <div className="col-md-4 d-flex flex-column align-items-center">
              <i className="fas fa-user-circle fa-3x user mb-2" />
              <p className="username">{answerData.username}</p>
            </div>
            <div className="col-md-8">
              <p className="answer-text">{answerData.answer}</p>
            </div>
            <div className="d-flex justify-content-end" style={{ marginLeft: "-40px" }}>
              <div className="vote-buttons">
                <button
                  className={`vote-button ${answerVotes[answerData.answerid]?.userVote === 'like' ? 'voted' : ''}`}
                  onClick={() => handleVote(answerData.answerid, 'like')}
                  title="Like"
                >
                  <i className="fas fa-thumbs-up"></i>
                  {answerVotes[answerData.answerid]?.votes?.likes > 0 && (
                    <span className="vote-count">{answerVotes[answerData.answerid]?.votes?.likes}</span>
                  )}
                </button>
                <button
                  className={`vote-button ${answerVotes[answerData.answerid]?.userVote === 'dislike' ? 'voted' : ''}`}
                  onClick={() => handleVote(answerData.answerid, 'dislike')}
                  title="Dislike"
                >
                  <i className="fas fa-thumbs-down"></i>
                  {answerVotes[answerData.answerid]?.votes?.dislikes > 0 && (
                    <span className="vote-count">{answerVotes[answerData.answerid]?.votes?.dislikes}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="card answer text-center mb-5">
        <div className="card-body">
          <h2 className="pt-3">Answer The Top Question.</h2>
          <p className="lead mb-3">Share your knowledge and help others</p>

          <form onSubmit={handleSubmit(handleClick)}>
            <div className="form-group">
              <textarea
                className={`form-control w-75 mx-auto ${errors.answer ? "is-invalid" : ""}`}
                rows="6"
                placeholder="Your answer..."
                {...register("answer", {
                  required: "Answer is required",
                  maxLength: {
                    value: 300,
                    message: "Maximum allowed length is 300",
                  },
                })}
                onKeyUp={() => {
                  trigger("answer");
                }}
              />
              {errors.answer && (
                <div className="invalid-feedback">
                  {errors.answer.message}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-success mt-3"
            >
              Post Your Answer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default QuestionDetail;
