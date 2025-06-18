import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from '../axios';
import './QuestionDetail.css';

function Reply({ answerId, replies, setReplies, user, onEditReply, editingContent, onContentUpdate, onCancelEdit }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleReplyVote = async (replyId, voteType) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    try {
      // Optimistically update UI
      const updatedReplies = replies.map(reply => {
        if (reply.replyid === replyId) {
          const currentVote = reply.user_vote || null;
          const voteChange = currentVote === voteType ? -1 : (currentVote === null ? 1 : 2);
          return {
            ...reply,
            likes: voteType === 'like' ? reply.likes + voteChange : reply.likes,
            dislikes: voteType === 'dislike' ? reply.dislikes + voteChange : reply.dislikes,
            user_vote: currentVote === voteType ? null : voteType
          };
        }
        return reply;
      });
      setReplies(prev => ({
        ...prev,
        [answerId]: updatedReplies
      }));

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
        const updatedReplies = replies.map(reply => {
          if (reply.replyid === replyId) {
            return {
              ...reply,
              likes: response.data.votes.likes,
              dislikes: response.data.votes.dislikes,
              user_vote: response.data.userVote
            };
          }
          return reply;
        });
        setReplies(prev => ({
          ...prev,
          [answerId]: updatedReplies
        }));
      }
    } catch (error) {
      console.error('Error voting on reply:', error);
      // Revert optimistic update
      const updatedReplies = replies.map(reply => {
        if (reply.replyid === replyId) {
          return {
            ...reply,
            likes: reply.likes,
            dislikes: reply.dislikes,
            user_vote: reply.user_vote
          };
        }
        return reply;
      });
      setReplies(prev => ({
        ...prev,
        [answerId]: updatedReplies
      }));
      alert('Failed to register vote. Please try again.');
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        '/replies/postreply',
        {
          reply: replyContent,
          answerid: answerId,
          userid: user.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        const updatedReplies = [...(replies || []), response.data.data];
        setReplies(prev => ({
          ...prev,
          [answerId]: updatedReplies
        }));
        setReplyContent('');
        setShowReplyForm(false);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
    }
  };

  return (
    <div className="replies-section">
      <div className="reply-actions">
        <button
          className="reply-button"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          <i className="fas fa-reply"></i>
          Reply
        </button>
      </div>

      {showReplyForm && (
        <div className="reply-form">
          <div className="reply-input-container">
            <ReactQuill
              theme="snow"
              value={replyContent}
              onChange={setReplyContent}
              placeholder="Write your reply..."
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link', 'image'],
                  ['clean']
                ]
              }}
            />
            <div className="reply-form-actions">
              <button
                className="cancel-reply"
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </button>
              <button
                className="post-reply"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim()}
              >
                Post Reply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="replies-list">
        {replies?.map((reply) => (
          <div key={reply.replyid} className="reply-item">
            {editingContent.type === 'reply' && editingContent.id === reply.replyid ? (
              <div className="rich-text-editor">
                <ReactQuill
                  theme="snow"
                  value={editingContent.content}
                  onChange={(content) => onEditReply('reply', reply.replyid, content)}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                />
                <div className="mt-3">
                  <button 
                    className="btn btn-success me-2"
                    onClick={() => onContentUpdate(editingContent.content)}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={onCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="reply-content">
                <div className="reply-header">
                  <i className="fas fa-user-circle user"></i>
                  <div className="reply-user-info">
                    <span className="username">{reply.username}</span>
                    <span className="reply-time">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                </div>
                <div className="reply-text">
                  {parse(DOMPurify.sanitize(reply.reply))}
                </div>
                <div className="reply-votes d-flex align-items-center justify-content-center">
                  <button
                    className={`vote-button ${reply.user_vote === 'like' ? 'voted' : ''}`}
                    onClick={() => handleReplyVote(reply.replyid, 'like')}
                    title={user ? "Like" : "Sign in to like"}
                  >
                    <i className="fas fa-thumbs-up"></i>
                    {reply.likes > 0 && (
                      <span className="vote-count">{reply.likes}</span>
                    )}
                  </button>
                  <button
                    className={`vote-button ${reply.user_vote === 'dislike' ? 'voted' : ''}`}
                    onClick={() => handleReplyVote(reply.replyid, 'dislike')}
                    title={user ? "Dislike" : "Sign in to dislike"}
                  >
                    <i className="fas fa-thumbs-down"></i>
                    {reply.dislikes > 0 && (
                      <span className="vote-count">{reply.dislikes}</span>
                    )}
                  </button>
                  {user.userId === reply.userid && (
                    <button
                      className="btn btn-link edit-button"
                      onClick={() => onEditReply('reply', reply.replyid, reply.reply)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reply; 