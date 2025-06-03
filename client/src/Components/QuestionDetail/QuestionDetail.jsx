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
  const { questions, setQuestions } = useContext(QuestionContext);
  const { questionid } = useParams();
  const [dbAnswer, setdbAnswer] = useState([]);
  const [answerVotes, setAnswerVotes] = useState({});
  const [replies, setReplies] = useState({});
  const [questionData, setQuestionData] = useState(null);
  const quillRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingContent, setEditingContent] = useState({
    type: null, // 'question', 'answer', or 'reply'
    id: null,
    content: null
  });

  // Fetch question data when component mounts
  useEffect(() => {
    async function fetchQuestion() {
      try {
        const response = await axios.get(`/questions/${questionid}`);
        setQuestionData(response.data.data);
      } catch (error) {
        console.error('Error fetching question:', error);
      }
    }

    if (questionid) {
      fetchQuestion();
    }
  }, [questionid]);

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
    if (!user) {
      alert('Please login to vote');
      return;
    }

    try {
      // Optimistically update UI
      const updatedAnswers = dbAnswer.map(answer => {
        if (answer.answerid === answerId) {
          const currentVote = answer.userVote || 0;
          const voteChange = currentVote === voteType ? -voteType : (currentVote === 0 ? voteType : voteType * 2);
          return {
            ...answer,
            votes: answer.votes + voteChange,
            userVote: currentVote === voteType ? 0 : voteType
          };
        }
        return answer;
      });
      setdbAnswer(updatedAnswers);

      // Make API call
      const response = await axios.post(
        `/answers/${answerId}/vote`,
        { voteType },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        // Update with server response
        const updatedAnswers = dbAnswer.map(answer => {
          if (answer.answerid === answerId) {
            return {
              ...answer,
              votes: response.data.votes,
              userVote: response.data.userVote
            };
          }
          return answer;
        });
        setdbAnswer(updatedAnswers);
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update
      const updatedAnswers = dbAnswer.map(answer => {
        if (answer.answerid === answerId) {
          return {
            ...answer,
            votes: answer.votes,
            userVote: answer.userVote
          };
        }
        return answer;
      });
      setdbAnswer(updatedAnswers);
      alert('Failed to register vote. Please try again.');
    }
  };

  const handleReplyVote = async (replyId, voteType) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    try {
      // Optimistically update UI
      const updatedReplies = Object.entries(replies).reduce((acc, [answerId, answerReplies]) => {
        acc[answerId] = answerReplies.map(reply => {
          if (reply.replyid === replyId) {
            const currentVote = reply.userVote || 0;
            const voteChange = currentVote === voteType ? -voteType : (currentVote === 0 ? voteType : voteType * 2);
            return {
              ...reply,
              votes: reply.votes + voteChange,
              userVote: currentVote === voteType ? 0 : voteType
            };
          }
          return reply;
        });
        return acc;
      }, {});
      setReplies(updatedReplies);

      // Make API call
      const response = await axios.post(
        `/replies/${replyId}/vote`,
        { voteType },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        // Update with server response
        const updatedReplies = Object.entries(replies).reduce((acc, [answerId, answerReplies]) => {
          acc[answerId] = answerReplies.map(reply => {
            if (reply.replyid === replyId) {
              return {
                ...reply,
                votes: response.data.votes,
                userVote: response.data.userVote
              };
            }
            return reply;
          });
          return acc;
        }, {});
        setReplies(updatedReplies);
      }
    } catch (error) {
      console.error('Error voting on reply:', error);
      // Revert optimistic update
      const updatedReplies = Object.entries(replies).reduce((acc, [answerId, answerReplies]) => {
        acc[answerId] = answerReplies.map(reply => {
          if (reply.replyid === replyId) {
            return {
              ...reply,
              votes: reply.votes,
              userVote: reply.userVote
            };
          }
          return reply;
        });
        return acc;
      }, {});
      setReplies(updatedReplies);
      alert('Failed to register vote. Please try again.');
    }
  };

  // Add click handler for images
  const handleImageClick = (e) => {
    if (e.target.tagName === 'IMG') {
      setSelectedImage(e.target.src);
    }
  };

  // Add click handler for modal close
  const handleModalClose = () => {
    setSelectedImage(null);
  };

  // Add click handler for modal background
  const handleModalBackgroundClick = (e) => {
    if (e.target.className === 'image-modal show') {
      setSelectedImage(null);
    }
  };

  // Function to handle edit button click
  const handleEditClick = (type, id, content) => {
    setEditingContent({
      type,
      id,
      content
    });
  };

  // Function to handle content update
  const handleContentUpdate = async (updatedContent) => {
    try {
      let endpoint = '';
      let data = {};

      switch (editingContent.type) {
        case 'question':
          endpoint = `/questions/${questionid}`;
          data = { description: updatedContent };
          break;
        case 'answer':
          endpoint = `/answers/${editingContent.id}`;
          data = { answer: updatedContent };
          break;
        case 'reply':
          endpoint = `/replies/${editingContent.id}`;
          data = { reply: updatedContent };
          break;
        default:
          return;
      }

      const response = await axios.put(endpoint, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.data) {
        // Refresh the content
        if (editingContent.type === 'question') {
          // Refresh question
          const updatedQuestions = questions.map(q => 
            q.questionid === questionid 
              ? { ...q, description: updatedContent }
              : q
          );
          setQuestions(updatedQuestions);
        } else if (editingContent.type === 'answer') {
          // Refresh answers
          const updatedAnswers = dbAnswer.map(a =>
            a.answerid === editingContent.id
              ? { ...a, answer: updatedContent }
              : a
          );
          setdbAnswer(updatedAnswers);
        } else if (editingContent.type === 'reply') {
          // Refresh replies
          const updatedReplies = replies[editingContent.id].map(r =>
            r.replyid === editingContent.id
              ? { ...r, reply: updatedContent }
              : r
          );
          setReplies(prev => ({
            ...prev,
            [editingContent.id]: updatedReplies
          }));
        }

        // Clear editing state
        setEditingContent({ type: null, id: null, content: null });
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to update content. Please try again.');
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingContent({ type: null, id: null, content: null });
  };

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
    <div className="top mx-auto" style={{ width: "86%" }}>
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <h4 className="card-title mb-0 me-2">Question</h4>
            {user.userId === questionData?.userid && (
              <button
                className="btn btn-link p-0 edit-button"
                style={{top: "16px", right: "16px" }}
                onClick={() => handleEditClick('question', questionid, questionData.description)}
              >
                <i className="fas fa-pencil-alt"></i>
              </button>
            )}
          </div>
          <h5 className="card-subtitle mb-2 text-muted">Title: {questionData?.title}</h5>
          {questionData?.created_at && (
            <small className="text-muted d-block mb-3 posted_date">Posted on {formatDate(questionData.created_at)}</small>
          )}
          <div className="position-relative">
            {editingContent.type === 'question' ? (
              <div className="rich-text-editor">
                <ReactQuill
                  theme="snow"
                  modules={modules}
                  formats={formats}
                  value={editingContent.content}
                  onChange={(content) => setEditingContent(prev => ({ ...prev, content }))}
                />
                <div className="mt-3">
                  <button 
                    className="btn btn-success me-2"
                    onClick={() => handleContentUpdate(editingContent.content)}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="card-text" onClick={handleImageClick}>
                {parse(DOMPurify.sanitize(convertImageUrls(questionData?.description), {
                  ADD_TAGS: ['img'],
                  ADD_ATTR: ['src', 'alt', 'style']
                }))}
              </div>
            )}
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
              {editingContent.type === 'answer' && editingContent.id === answerData.answerid ? (
                <div className="rich-text-editor">
                  <ReactQuill
                    theme="snow"
                    modules={modules}
                    formats={formats}
                    value={editingContent.content}
                    onChange={(content) => setEditingContent(prev => ({ ...prev, content }))}
                  />
                  <div className="mt-3">
                    <button 
                      className="btn btn-success me-2"
                      onClick={() => handleContentUpdate(editingContent.content)}
                    >
                      Save Changes
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="answer-text position-relative" onClick={handleImageClick}>
                  {parse(DOMPurify.sanitize(convertImageUrls(answerData.answer), {
                    ADD_TAGS: ['img'],
                    ADD_ATTR: ['src', 'alt', 'style']
                  }))}
                  {answerData.created_at && (
                    <small className="text-muted d-block mt-2 posted_date">Answered on {formatDate(answerData.created_at)}</small>
                  )}
                  {user.userId === answerData.userid && (
                    <button
                      className="btn btn-link edit-button"
                      onClick={() => handleEditClick('answer', answerData.answerid, answerData.answer)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                  )}
                </div>
              )}
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
              onEditReply={handleEditClick}
              editingContent={editingContent}
              onContentUpdate={handleContentUpdate}
              onCancelEdit={handleCancelEdit}
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

      {/* Image Modal */}
      <div 
        className={`image-modal ${selectedImage ? 'show' : ''}`} 
        onClick={handleModalBackgroundClick}
      >
        {selectedImage && (
          <>
            <span className="image-modal-close" onClick={handleModalClose}>&times;</span>
            <img 
              src={selectedImage} 
              alt="Enlarged view" 
              className="image-modal-content"
            />
          </>
        )}
      </div>
    </div>
  );
}

export default QuestionDetail;
