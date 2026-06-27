import React, { useState, useEffect, useCallback } from 'react';
import { reviewsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';
import ReviewForm from './ReviewForm'; // Assuming we create these components

const EventReviews = ({ eventId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [loading, setLoading] = useState(true);

  const fetchReviewsAndStats = useCallback(async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewsAPI.getByEvent(eventId),
        reviewsAPI.getStats(eventId)
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      toast.error('Failed to load reviews. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    if (eventId) {
      fetchReviewsAndStats();
    }
  }, [eventId, fetchReviewsAndStats]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;

    const originalReviews = [...reviews];
    // Optimistically remove the review from the UI
    setReviews(prev => prev.filter(r => r.id !== reviewId));

    try {
      await reviewsAPI.delete(eventId, reviewId);
      toast.success('Review deleted');
      // Silently refresh stats in the background
      reviewsAPI.getStats(eventId).then(setStats).catch(() => {});
    } catch (err) {
      // If the delete fails, revert the change and notify the user
      setReviews(originalReviews);
      toast.error(err.message || 'Failed to delete review');
    }
  };

  const getRatingEmoji = (num) => '⭐'.repeat(num) + '☆'.repeat(5 - num);

  if (loading) {
    return <div className="shimmer" style={{ height: '100px', borderRadius: '8px', margin: '20px 0' }} />;
  }

  return (
    <div className="mt-8" style={{ marginTop: 'var(--spacing-xl)' }}>
      <h3 style={{ 
        marginBottom: 'var(--spacing-lg)',
        color: 'var(--pure-white)',
        fontFamily: 'var(--font-display)'
      }}>
        REVIEWS & RATINGS
      </h3>

      {/* Stats Summary */}
      <div style={{
        background: 'var(--dark-gray)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-lg)',
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: 'var(--spacing-lg)',
        border: '1px solid rgba(0, 245, 255, 0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--medium-gray)' }}>
            {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
          </div>
        </div>
        <div>
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--light-gray)', fontSize: '0.85rem', minWidth: '30px' }}>{star}★</span>
              <div style={{
                flex: 1,
                height: '10px',
                background: 'var(--medium-gray)',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: stats.totalReviews > 0 ? `${(stats.distribution[star] / stats.totalReviews) * 100}%` : '0%',
                  background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-pink))',
                  borderRadius: '5px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ color: 'var(--medium-gray)', fontSize: '0.8rem', minWidth: '30px' }}>{stats.distribution[star]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Form */}
      <ReviewForm eventId={eventId} onReviewSubmitted={fetchReviewsAndStats} />

      {!user && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-lg)',
          background: 'var(--dark-gray)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-lg)',
          color: 'var(--light-gray)'
        }}>
          <a href="/login" style={{ color: 'var(--neon-cyan)' }}>Log in</a> to leave a review
        </div>
      )}

      {/* Review List */}
      <div>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--light-gray)', fontStyle: 'italic', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            No reviews yet. Be the first to review!
          </p>
        ) : (
          reviews.map(review => (
            <div key={review.id} style={{
              padding: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-sm)',
              background: 'var(--dark-gray)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: '600', color: 'var(--pure-white)' }}>{review.userName}</span>
                  <span style={{ color: 'var(--medium-gray)', fontSize: '0.85rem', marginLeft: '12px' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ color: '#ffbe0b', fontSize: '1.1rem' }}>
                  {getRatingEmoji(review.rating)}
                </div>
              </div>
              <p style={{ color: 'var(--light-gray)', lineHeight: '1.6' }}>{review.comment}</p>
              {user && (user.id === review.userId || user.role === 'admin') && (
                <button
                  onClick={() => handleDelete(review.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--neon-pink)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    marginTop: '8px',
                    padding: '4px 0'
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventReviews;