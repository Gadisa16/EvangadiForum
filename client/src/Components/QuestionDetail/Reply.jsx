import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import axios from "../axios";
import "./QuestionDetail.css";

const Reply = ({ answerId, replies, setReplies, user }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm();

  // Function to format time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  const handleReplySubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Create temporary reply object with optimistic data
    const tempReply = {
      replyid: Date.now(), // Temporary ID
      reply_text: data.reply,
      userid: user.userId,
      username: user.username,
      created_at: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      user_vote: null
    };

    // Optimistically update UI
    setReplies(prev => ({
      ...prev,
      [answerId]: [...(prev[answerId] || []), tempReply]
    }));
    reset();
    setShowReplyForm(false);
    
    try {
      const response = await axios.post(
        "/replies/postreply",
        {
          reply_text: data.reply,
          answerid: answerId,
          userid: user.userId,
        },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      // Update the temporary reply with the real data from server
      setReplies(prev => ({
        ...prev,
        [answerId]: (prev[answerId] || []).map(reply =>
          reply.replyid === tempReply.replyid
            ? {
                ...reply,
                replyid: response.data.replyId,
              }
            : reply
        )
      }));
    } catch (error) {
      console.log(error);
      // Remove the temporary reply if the server request fails
      setReplies(prev => ({
        ...prev,
        [answerId]: (prev[answerId] || []).filter(reply => reply.replyid !== tempReply.replyid)
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyVote = async (replyId, voteType, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistically update UI
    setReplies(prev => ({
      ...prev,
      [answerId]: (prev[answerId] || []).map(reply =>
        reply.replyid === replyId
          ? {
              ...reply,
              likes: voteType === 'like' ? (reply.likes + 1) : reply.likes,
              dislikes: voteType === 'dislike' ? (reply.dislikes + 1) : reply.dislikes,
              user_vote: voteType
            }
          : reply
      )
    }));
    
    try {
      const response = await axios.post(
        `/replies/${replyId}/vote`,
        { voteType },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update with server response
      setReplies(prev => ({
        ...prev,
        [answerId]: (prev[answerId] || []).map(reply =>
          reply.replyid === replyId
            ? {
                ...reply,
                likes: response.data.votes.likes,
                dislikes: response.data.votes.dislikes,
                user_vote: response.data.userVote,
              }
            : reply
        )
      }));
    } catch (error) {
      console.error("Error voting:", error);
      // Revert optimistic update on error
      setReplies(prev => ({
        ...prev,
        [answerId]: (prev[answerId] || []).map(reply =>
          reply.replyid === replyId
            ? {
                ...reply,
                likes: reply.likes - (voteType === 'like' ? 1 : 0),
                dislikes: reply.dislikes - (voteType === 'dislike' ? 1 : 0),
                user_vote: null
              }
            : reply
        )
      }));
    }
  };

  return (
    <div className="replies-section">
      <div className="reply-actions justify-content-start">
        <button
          type="button"
          className="btn-link reply-button"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          <i className="fas fa-reply"></i> Reply
        </button>
      </div>

      {showReplyForm && (
        <form onSubmit={handleSubmit(handleReplySubmit)} className="reply-form">
          <div className="reply-input-container">
            <textarea
              className={`form-control reply-textarea ${errors.reply ? "is-invalid" : ""}`}
              rows="2"
              placeholder="Write a reply..."
              {...register("reply", {
                required: "Reply is required",
                maxLength: {
                  value: 300,
                  message: "Maximum allowed length is 300",
                },
              })}
            />
            {errors.reply && (
              <div className="invalid-feedback">{errors.reply.message}</div>
            )}
            <div className="reply-form-actions">
              <button
                type="button"
                className="btn btn-link cancel-reply"
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary post-reply"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="replies-list">
        {(replies || []).map((reply) => (
          <div key={reply.replyid} className="reply-item">
            <div className="reply-content">
              <div className="reply-header">
                <i className="fas fa-user-circle fa-2x user" />
                <div className="reply-user-info">
                  <span className="username">{reply.username}</span>
                  <span className="reply-time">
                    {getTimeAgo(reply.created_at)}
                  </span>
                </div>
                <p className="reply-text">{reply.reply_text}</p>
              </div>
              <div className="reply-actions">
                <button
                  type="button"
                  className={`reply-vote-button ${reply.user_vote === 'like' ? 'voted' : ''}`}
                  onClick={(e) => handleReplyVote(reply.replyid, 'like', e)}
                  title="Like"
                >
                  <i className="fas fa-thumbs-up"></i>
                  {reply.likes > 0 && (
                    <span className="vote-count">{reply.likes}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`reply-vote-button ${reply.user_vote === 'dislike' ? 'voted' : ''}`}
                  onClick={(e) => handleReplyVote(reply.replyid, 'dislike', e)}
                  title="Dislike"
                >
                  <i className="fas fa-thumbs-down"></i>
                  {reply.dislikes > 0 && (
                    <span className="vote-count">{reply.dislikes}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reply; 