import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import 'quill-emoji/dist/quill-emoji.css';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from "react-hook-form";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestionContext } from '../../Context/QuestionContext';
import { userProvider } from '../../Context/UserProvider';
import axios from "../axios";
import "./QuestionDetail.css";
import Reply from './Reply';

// Import Quill modules

// Configure DOMPurify to allow images
DOMPurify.addHook('afterSanitizeAttributes', function(node) {
  if (node.tagName === 'IMG') {
    node.setAttribute('style', 'max-width: 100%; height: 200px;');
  }
});

// Function to convert relative image URLs to absolute URLs
const convertImageUrls = (html) => {
  if (!html) return '';
  // Get the base URL without the /api suffix
  const baseUrl = axios.defaults.baseURL.replace('/api', '');
  return html.replace(/src="\/uploads\//g, `src="${baseUrl}/uploads/`);
};

function QuestionDetail() {
  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(userProvider);
  const { questions } = useContext(QuestionContext);
  const { questionid } = useParams();
  const [dbAnswer, setdbAnswer] = useState([]);
  const [answerVotes, setAnswerVotes] = useState({});
  const [replies, setReplies] = useState({});
  const quillRef = useRef(null);

  // Configure Quill modules
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              const formData = new FormData();
              formData.append('image', file);

              try {
                const response = await axios.post('/upload-image', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem("token")}`
                  }
                });

                if (response.data && response.data.url) {
                  const quill = this.quill;
                  const range = quill.getSelection(true);
                  // Get the base URL without the /api suffix
                  const baseUrl = axios.defaults.baseURL.replace('/api', '');
                  const fullImageUrl = `${baseUrl}${response.data.url}`;
                  quill.insertEmbed(range.index, 'image', fullImageUrl);
                } else {
                  console.error('Invalid response format:', response.data);
                }
              } catch (error) {
                console.error('Error uploading image:', error);
                // Show error to user
                alert('Failed to upload image. Please try again.');
              }
            }
          };
        }
      }
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ];

  useEffect(() => {
    async function getAns() {
      try {
        const ans = await axios.get(`/answers/all-answers/${questionid}`);
        setdbAnswer(ans.data.data);
        
        // Only fetch votes and replies if user is authenticated
        if (isAuthenticated) {
          const votes = {};
          for (const answer of ans.data.data) {
            try {
              const response = await axios.get(`/answers/${answer.answerid}/votes`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
              });
              votes[answer.answerid] = response.data;

              // Fetch replies for each answer
              const repliesResponse = await axios.get(
                `/replies/all-replies/${answer.answerid}`,
                {
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                }
              );
              setReplies(prev => ({
                ...prev,
                [answer.answerid]: repliesResponse.data.data
              }));
            } catch (error) {
              console.error('Error fetching votes or replies:', error);
            }
          }
          setAnswerVotes(votes);
        }
      } catch (error) {
        console.log(error);
      }
    }
  
    if (questionid) {
      getAns();
    }
  }, [questionid, isAuthenticated]);

  const selectedQuestion = questions.find(
    (ques) => ques.questionid === questionid
  );

  async function handleClick(data) {
    if (!isAuthenticated) {
      navigate("/register", { state: { from: { pathname: `/question/${questionid}` } } });
      return;
    }

    try {
      // Sanitize HTML content
      const sanitizedAnswer = DOMPurify.sanitize(data.answer);
      
      const response = await axios.post(
        "/answers/postanswers",
        {
          answer: sanitizedAnswer,
          questionid: questionid,
          userid: user.userId,
        },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      if (response.data) {
        const ans = await axios.get(`/answers/all-answers/${questionid}`);
        setdbAnswer(ans.data.data);
        setValue("answer", ""); // Clear the editor after posting
      }
    } catch (error) {
      console.error("Error posting answer:", error.response?.data || error);
      alert("Failed to post answer. Please try again.");
    }
  }

  const handleVote = async (answerId, voteType) => {
    if (!isAuthenticated) {
      navigate("/register", { state: { from: { pathname: `/question/${answerId}` } } });
      return;
    }

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
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setAnswerVotes(prev => ({
        ...prev,
        [answerId]: response.data
      }));
    }
  };

  return (
    <div className="top mx-auto" style={{ width: "86%" }}>
      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title">Question</h4>
          <h5 className="card-subtitle mb-2 text-muted">Title: {selectedQuestion?.title}</h5>
          <div className="card-text">
            {parse(DOMPurify.sanitize(convertImageUrls(selectedQuestion?.description), {
              ADD_TAGS: ['img'],
              ADD_ATTR: ['src', 'alt', 'style']
            }))}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title">
            {dbAnswer.length === 0 
              ? "No Answers From The Community yet, be the first to answer" 
              : `${dbAnswer.length} ${dbAnswer.length === 1 ? 'Answer' : 'Answers'} From The Community`}
          </h4>
        </div>
      </div>

      {dbAnswer.map((answerData, index) => (
        <div className="card mb-3 info_question" key={index}>
          <div className="card-body row ms-2">
            <div className="col-md-1 d-flex flex-column align-items-center">
              <i className="fas fa-user-circle fa-3x user mb-2" />
              <p className="username">{answerData.username}</p>
            </div>
            <div className="col-md-11 ps-5">
              <div className="answer-text">
                {parse(DOMPurify.sanitize(convertImageUrls(answerData.answer), {
                  ADD_TAGS: ['img'],
                  ADD_ATTR: ['src', 'alt', 'style']
                }))}
              </div>
            </div>
            <div className="d-flex justify-content-end" style={{ marginLeft: "-40px" }}>
              <div className="vote-buttons">
                <button
                  className={`vote-button ${answerVotes[answerData.answerid]?.userVote === 'like' ? 'voted' : ''}`}
                  onClick={() => handleVote(answerData.answerid, 'like')}
                  title={isAuthenticated ? "Like" : "Sign in to like"}
                >
                  <i className="fas fa-thumbs-up"></i>
                  {answerVotes[answerData.answerid]?.votes?.likes > 0 && (
                    <span className="vote-count">{answerVotes[answerData.answerid]?.votes?.likes}</span>
                  )}
                </button>
                <button
                  className={`vote-button ${answerVotes[answerData.answerid]?.userVote === 'dislike' ? 'voted' : ''}`}
                  onClick={() => handleVote(answerData.answerid, 'dislike')}
                  title={isAuthenticated ? "Dislike" : "Sign in to dislike"}
                >
                  <i className="fas fa-thumbs-down"></i>
                  {answerVotes[answerData.answerid]?.votes?.dislikes > 0 && (
                    <span className="vote-count">{answerVotes[answerData.answerid]?.votes?.dislikes}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <Reply
              answerId={answerData.answerid}
              replies={replies[answerData.answerid] || []}
              setReplies={setReplies}
              user={user}
            />
          )}
        </div>
      ))}

      <div className="card answer text-center mb-5">
        <div className="card-body">
          <h2 className="pt-3">Answer The Top Question.</h2>
          <p className="lead mb-3">Share your knowledge and help others</p>

          {isAuthenticated ? (
            <form onSubmit={handleSubmit(handleClick)}>
              <div className="form-group">
                <div className="rich-text-editor">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    modules={modules}
                    formats={formats}
                    value={watch("answer") || ""}
                    onChange={(content) => {
                      setValue("answer", content);
                      trigger("answer");
                    }}
                    placeholder="Your answer..."
                    className={`w-75 mx-auto ${errors.answer ? "invalid" : ""}`}
                    preserveWhitespace={true}
                  />
                </div>
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
          ) : (
            <div className="text-center">
              <p className="text-muted">Please sign in to post an answer</p>
              <button
                className="btn btn-primary mt-3"
                onClick={() => navigate("/register", { state: { from: { pathname: `/question/${questionid}` } } })}
              >
                Sign In to Answer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionDetail;
