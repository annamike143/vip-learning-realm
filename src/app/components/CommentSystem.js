// --- src/app/components/CommentSystem.js ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, serverTimestamp } from 'firebase/database';
import { database } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from './ThemeProvider';
import './CommentSystem.css';

const CommentSystem = ({ courseId, lessonId }) => {
    const { user } = useAuth();
    const { customBranding } = useTheme();
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState({});

    useEffect(() => {
        if (!courseId || !lessonId) return;

        const commentsRef = ref(database, `comments/${courseId}/${lessonId}`);
        
        const unsubscribe = onValue(commentsRef, (snapshot) => {
            const commentsData = snapshot.val() || {};
            setComments(commentsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [courseId, lessonId]);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;
        
        setSubmitting(true);
        try {
            const commentsRef = ref(database, `comments/${courseId}/${lessonId}`);
            const newCommentRef = push(commentsRef);
            
            await set(newCommentRef, {
                id: newCommentRef.key,
                text: newComment.trim(),
                authorId: user.uid,
                authorName: user.email.split('@')[0], // Simple name extraction
                timestamp: serverTimestamp(),
                replies: {},
                likes: 0
            });
            
            setNewComment('');
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Error posting comment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!user || !replyText.trim() || !replyTo) return;
        
        setSubmitting(true);
        try {
            const replyRef = ref(database, `comments/${courseId}/${lessonId}/${replyTo}/replies`);
            const newReplyRef = push(replyRef);
            
            await set(newReplyRef, {
                id: newReplyRef.key,
                text: replyText.trim(),
                authorId: user.uid,
                authorName: user.email.split('@')[0],
                timestamp: serverTimestamp()
            });
            
            setReplyText('');
            setReplyTo(null);
        } catch (error) {
            console.error('Error posting reply:', error);
            alert('Error posting reply. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const sortedComments = Object.values(comments).sort((a, b) => 
        (b.timestamp || 0) - (a.timestamp || 0)
    );

    if (loading) {
        return (
            <div className="comment-system">
                <div className="comments-header">
                    <h3>Discussion</h3>
                    <div className="comment-skeleton">
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line short"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="comment-system">
            <div className="comments-header">
                <h3>💬 Discussion ({sortedComments.length})</h3>
                <p>Share your thoughts and connect with fellow learners!</p>
            </div>

            {/* New Comment Form */}
            {user && (
                <form className="comment-form" onSubmit={handleSubmitComment}>
                    <div className="comment-input-group">
                        <div className="user-avatar">
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share your thoughts about this lesson..."
                            rows="3"
                            disabled={submitting}
                        />
                    </div>
                    <div className="comment-actions">
                        <span className="char-count">
                            {newComment.length}/500
                        </span>
                        <button 
                            type="submit" 
                            disabled={!newComment.trim() || submitting || newComment.length > 500}
                            className="submit-comment-btn"
                        >
                            {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </form>
            )}

            {!user && (
                <div className="login-prompt">
                    <p>Please log in to join the discussion!</p>
                </div>
            )}

            {/* Comments List */}
            <div className="comments-list">
                {sortedComments.length === 0 ? (
                    <div className="empty-comments">
                        <p>🎯 Be the first to start the discussion!</p>
                    </div>
                ) : (
                    sortedComments.map(comment => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-header">
                                <div className="comment-avatar">
                                    {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="comment-meta">
                                    <span className="comment-author">{comment.authorName || 'Anonymous'}</span>
                                    <span className="comment-time">{formatTimestamp(comment.timestamp)}</span>
                                </div>
                            </div>
                            
                            <div className="comment-content">
                                <p>{comment.text}</p>
                            </div>
                            
                            <div className="comment-actions">
                                <button 
                                    className="reply-btn"
                                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                >
                                    💬 Reply
                                </button>
                                
                                {comment.replies && Object.keys(comment.replies).length > 0 && (
                                    <button 
                                        className="show-replies-btn"
                                        onClick={() => toggleReplies(comment.id)}
                                    >
                                        {expandedReplies[comment.id] ? '▼' : '▶'} 
                                        {Object.keys(comment.replies).length} replies
                                    </button>
                                )}
                            </div>

                            {/* Reply Form */}
                            {replyTo === comment.id && user && (
                                <form className="reply-form" onSubmit={handleSubmitReply}>
                                    <div className="reply-input-group">
                                        <div className="user-avatar small">
                                            {user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={`Reply to ${comment.authorName}...`}
                                            rows="2"
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="reply-actions">
                                        <button 
                                            type="button" 
                                            onClick={() => setReplyTo(null)}
                                            className="cancel-reply-btn"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={!replyText.trim() || submitting}
                                            className="submit-reply-btn"
                                        >
                                            {submitting ? 'Posting...' : 'Reply'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Replies */}
                            {expandedReplies[comment.id] && comment.replies && (
                                <div className="replies-list">
                                    {Object.values(comment.replies)
                                        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
                                        .map(reply => (
                                            <div key={reply.id} className="reply-item">
                                                <div className="reply-header">
                                                    <div className="comment-avatar small">
                                                        {reply.authorName?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="comment-meta">
                                                        <span className="comment-author">{reply.authorName || 'Anonymous'}</span>
                                                        <span className="comment-time">{formatTimestamp(reply.timestamp)}</span>
                                                    </div>
                                                </div>
                                                <div className="reply-content">
                                                    <p>{reply.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSystem;
