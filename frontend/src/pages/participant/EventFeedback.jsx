import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function EventFeedback() {
  const { id } = useParams();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, [id]);

  const loadFeedback = async () => {
    try {
      const res = await api.get('/feedback/' + id);
      setFeedbackData(res.data);
    } catch (err) {
      console.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    try {
      await api.post('/feedback/' + id, { rating, comment });
      toast.success('Feedback submitted!');
      setSubmitted(true);
      loadFeedback();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={'/events/' + id} className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Event</Link>
      <h1 className="text-2xl font-bold mb-6">Event Feedback</h1>

      {/* Submit Feedback */}
      {!submitted && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-3">Rate this event</h2>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-3xl transition-transform hover:scale-110"
              >
                {star <= (hoverRating || rating) ? '★' : '☆'}
              </button>
            ))}
            <span className="text-sm text-gray-500 self-center ml-2">
              {rating > 0 ? rating + '/5' : 'Select rating'}
            </span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional, anonymous)..."
            rows={3}
            className="input-field mb-3"
          />
          <button onClick={handleSubmit} className="btn-primary">Submit Feedback</button>
        </div>
      )}

      {submitted && (
        <div className="card mb-6 bg-green-50 text-center">
          <p className="text-green-700 font-medium">Thank you for your feedback!</p>
        </div>
      )}

      {/* Aggregated Stats */}
      {feedbackData && feedbackData.stats.total > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Feedback Summary</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-indigo-600">{feedbackData.stats.avgRating}</p>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{feedbackData.stats.total}</p>
              <p className="text-sm text-gray-500">Total Reviews</p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2 mb-4">
            {[5, 4, 3, 2, 1].map(star => {
              const count = feedbackData.stats.distribution[star] || 0;
              const pct = feedbackData.stats.total > 0 ? (count / feedbackData.stats.total * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-6">{star}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-400 h-2 rounded-full" style={{ width: pct + '%' }}></div>
                  </div>
                  <span className="w-8 text-gray-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Comments */}
          <h3 className="font-semibold mb-2">Comments</h3>
          <div className="space-y-3">
            {feedbackData.feedbacks.filter(f => f.comment).map((f, i) => (
              <div key={i} className="border-b pb-2 last:border-0">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className="text-sm">{s <= f.rating ? '★' : '☆'}</span>
                  ))}
                  <span className="text-xs text-gray-400 ml-2">{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{f.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventFeedback;
