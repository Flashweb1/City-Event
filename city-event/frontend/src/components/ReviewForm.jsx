import React, { useState } from 'react';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';
import { reviewsAPI } from '../utils/api';

const ReviewForm = ({ eventId, onReviewSubmitted }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  const getRatingEmoji = (num) => '⭐'.repeat(num) + '☆'.repeat(5 - num);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create(eventId, { rating, comment });
      toast.success('Review submitted successfully!');
      setComment('');
      setRating(5);
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form glass-card">
      <h4 className="review-form-title">Leave a Review</h4>
      
      <div className="form-group">
        <label>Rating</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="form-select"
        >
          {[5, 4, 3, 2, 1].map(num => (
            <option key={num} value={num}>
              {num} Star{num !== 1 ? 's' : ''} {getRatingEmoji(num)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="form-textarea"
          placeholder="What did you think of the event?"
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary"
        style={{
          opacity: submitting ? 0.5 : 1,
          cursor: submitting ? 'wait' : 'pointer'
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;
