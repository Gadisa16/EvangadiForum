import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from '../axios';
import './QuestionDetail.css';

function Reply({ answerId, replies, setReplies, user, onEditReply, editingContent, onContentUpdate, onCancelEdit }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        '/replies/post-reply',
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
                      {new Date(reply.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {user.userId === reply.userid && (
                    <button
                      className="btn btn-link edit-button"
                      onClick={() => onEditReply('reply', reply.replyid, reply.reply)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                  )}
                </div>
                <p className="reply-text">{reply.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reply; 