// --- Professional Feedback Widget ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, push, serverTimestamp } from 'firebase/database';
import { database } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { trackUserInteraction } from '../analytics/analytics';

const FeedbackWidget = ({ 
    context = 'general', 
    contextId = null,
    position = 'bottom-right',
    style = 'floating' // 'floating', 'inline', 'modal'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState('general');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [category, setCategory] = useState('general');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const { user } = useAuth();

    // Auto-populate email if user is logged in
    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user]);

    const feedbackTypes = {
        general: '💬 General Feedback',
        bug: '🐛 Report Bug',
        feature: '💡 Feature Request',
        content: '📚 Content Feedback',
        ui: '🎨 UI/UX Feedback',
        performance: '⚡ Performance Issue'
    };

    const categories = {
        general: 'General',
        courses: 'Courses',
        lessons: 'Lessons',
        ai: 'AI Assistant',
        navigation: 'Navigation',
        performance: 'Performance',
        account: 'Account',
        billing: 'Billing'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setIsSubmitting(true);
        
        try {
            const feedbackData = {
                type: feedbackType,
                rating: rating || null,
                comment: comment.trim(),
                category,
                context,
                contextId,
                userEmail: email || 'anonymous',
                userId: user?.uid || null,
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: serverTimestamp(),
                status: 'new'
            };

            // Save to Firebase
            const feedbackRef = ref(database, 'feedback');
            await push(feedbackRef, feedbackData);

            // Track analytics
            trackUserInteraction('feedback_submitted', 'feedback_widget', {
                type: feedbackType,
                rating,
                category,
                context
            });

            setIsSubmitted(true);
            
            // Reset form after delay
            setTimeout(() => {
                setIsOpen(false);
                setIsSubmitted(false);
                setComment('');
                setRating(0);
                setFeedbackType('general');
                setCategory('general');
            }, 2000);

        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Error submitting feedback. Please try again.');
        }
        
        setIsSubmitting(false);
    };

    const StarRating = ({ value, onChange, readonly = false }) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => !readonly && onChange(star)}
                        className={`star ${star <= value ? 'filled' : ''}`}
                        disabled={readonly}
                        aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                        ⭐
                    </button>
                ))}
            </div>
        );
    };

    const renderWidget = () => (
        <div className={`feedback-widget ${style} ${position} ${isOpen ? 'open' : ''}`}>
            {/* Floating Button */}
            {style === 'floating' && !isOpen && (
                <button
                    className="feedback-trigger"
                    onClick={() => setIsOpen(true)}
                    title="Send Feedback"
                >
                    💬
                </button>
            )}

            {/* Feedback Form */}
            {(isOpen || style === 'inline') && (
                <div className="feedback-form-container">
                    {style === 'floating' && (
                        <div className="feedback-header">
                            <h3>📝 Send Feedback</h3>
                            <button
                                className="close-button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close feedback"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {isSubmitted ? (
                        <div className="feedback-success">
                            <div className="success-icon">✅</div>
                            <h4>Thank you!</h4>
                            <p>Your feedback has been received.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="feedback-form">
                            {/* Feedback Type */}
                            <div className="form-group">
                                <label htmlFor="feedbackType">Type:</label>
                                <select
                                    id="feedbackType"
                                    value={feedbackType}
                                    onChange={(e) => setFeedbackType(e.target.value)}
                                >
                                    {Object.entries(feedbackTypes).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Rating (for general feedback) */}
                            {(feedbackType === 'general' || feedbackType === 'content') && (
                                <div className="form-group">
                                    <label>Rating:</label>
                                    <StarRating value={rating} onChange={setRating} />
                                </div>
                            )}

                            {/* Category */}
                            <div className="form-group">
                                <label htmlFor="category">Category:</label>
                                <select
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {Object.entries(categories).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Comment */}
                            <div className="form-group">
                                <label htmlFor="comment">
                                    {feedbackType === 'bug' ? 'Describe the issue:' : 
                                     feedbackType === 'feature' ? 'Describe your idea:' : 
                                     'Your feedback:'}
                                </label>
                                <textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={
                                        feedbackType === 'bug' ? 'What happened? What did you expect?' :
                                        feedbackType === 'feature' ? 'What feature would help you?' :
                                        'Tell us about your experience...'
                                    }
                                    rows="4"
                                    required
                                />
                            </div>

                            {/* Email (if not logged in) */}
                            {!user && (
                                <div className="form-group">
                                    <label htmlFor="email">Email (optional):</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="submit-button"
                                disabled={isSubmitting || !comment.trim()}
                            >
                                {isSubmitting ? '📤 Sending...' : '📨 Send Feedback'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            <style jsx>{`
                .feedback-widget {
                    font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
                    z-index: 1000;
                }
                
                .feedback-widget.floating {
                    position: fixed;
                    max-width: 350px;
                }
                
                .feedback-widget.bottom-right {
                    bottom: 20px;
                    right: 20px;
                }
                
                .feedback-widget.bottom-left {
                    bottom: 20px;
                    left: 20px;
                }
                
                .feedback-trigger {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: var(--color-primary, #00A9E0);
                    color: white;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transition: all 0.3s ease;
                }
                
                .feedback-trigger:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                }
                
                .feedback-form-container {
                    background: var(--color-surface, white);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    border: 1px solid var(--color-border, #e0e0e0);
                    overflow: hidden;
                    margin-top: 10px;
                }
                
                .feedback-widget.inline .feedback-form-container {
                    margin-top: 0;
                    width: 100%;
                }
                
                .feedback-header {
                    background: var(--color-primary, #00A9E0);
                    color: white;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .feedback-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .close-button {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                
                .close-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .feedback-form {
                    padding: 20px;
                }
                
                .form-group {
                    margin-bottom: 16px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    color: var(--color-text, #333);
                    font-size: 14px;
                }
                
                .form-group select,
                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid var(--color-border, #ddd);
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .form-group select:focus,
                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--color-primary, #00A9E0);
                    box-shadow: 0 0 0 2px rgba(0, 169, 224, 0.1);
                }
                
                .star-rating {
                    display: flex;
                    gap: 4px;
                    margin: 8px 0;
                }
                
                .star {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 2px;
                    border-radius: 4px;
                    transition: transform 0.1s;
                    filter: grayscale(100%);
                }
                
                .star.filled {
                    filter: none;
                }
                
                .star:hover {
                    transform: scale(1.1);
                }
                
                .submit-button {
                    width: 100%;
                    padding: 12px;
                    background: var(--color-primary, #00A9E0);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .submit-button:hover:not(:disabled) {
                    background: var(--color-primary-dark, #0088b3);
                }
                
                .submit-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .feedback-success {
                    padding: 40px 20px;
                    text-align: center;
                }
                
                .success-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .feedback-success h4 {
                    margin: 0 0 8px 0;
                    color: var(--color-text, #333);
                }
                
                .feedback-success p {
                    margin: 0;
                    color: var(--color-textSecondary, #666);
                    font-size: 14px;
                }
            `}</style>
        </div>
    );

    return renderWidget();
};

export default FeedbackWidget;
