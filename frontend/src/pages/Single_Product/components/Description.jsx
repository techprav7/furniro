import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Star } from 'lucide-react';
import api from '../../../utils/api';
import aImg from "../../../assets/a.png";
import bImg from "../../../assets/b.png";

const Description = ({ product }) => {
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(product.reviewCount || 0);
  const [avgRating, setAvgRating] = useState(product.rating || 0);

  // Review form state
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  // Fetch reviews when reviews tab is opened
  useEffect(() => {
    if (activeTab === 'reviews' && product._id) {
      fetchReviews();
    }
  }, [activeTab, product._id]);

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const data = await api(`/api/products/${product._id}/reviews`);
      setReviews(data.reviews || []);
      setAvgRating(data.rating || 0);
      setReviewCount(data.reviewCount || 0);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (newRating === 0) {
      setSubmitMessage("Please select a star rating");
      return;
    }
    if (!newComment.trim()) {
      setSubmitMessage("Please write a comment");
      return;
    }

    setSubmitting(true);
    setSubmitMessage('');

    try {
      const token = await getToken();
      const userName = user?.fullName || user?.firstName || "Customer";

      await api(`/api/products/${product._id}/reviews`, {
        method: "POST",
        body: { rating: newRating, comment: newComment.trim(), userName },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setSubmitMessage("Review submitted successfully!");
      setNewRating(0);
      setNewComment('');
      // Refresh reviews
      await fetchReviews();
    } catch (err) {
      setSubmitMessage(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full overflow-x-hidden flex flex-col items-center justify-center gap-6 px-4 max-w-7xl mx-auto">
      {/* Tabs Headers */}
      <div className='flex items-center justify-center border-b border-gray-250 w-full pb-4 gap-4 sm:gap-12 flex-wrap'>
        <button 
          onClick={() => setActiveTab('description')}
          className={`font-semibold text-lg py-2 px-4 transition-colors duration-200 ${
            activeTab === 'description' ? "text-[#B88E2F] border-b-2 border-[#B88E2F]" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Description
        </button>
        
        <button 
          onClick={() => setActiveTab('additional')}
          className={`font-semibold text-lg py-2 px-4 transition-colors duration-200 ${
            activeTab === 'additional' ? "text-[#B88E2F] border-b-2 border-[#B88E2F]" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Additional information
        </button>
        
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`font-semibold text-lg py-2 px-4 transition-colors duration-200 ${
            activeTab === 'reviews' ? "text-[#B88E2F] border-b-2 border-[#B88E2F]" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Reviews [{reviewCount}]
        </button>
      </div>

      {/* Tabs Content */}
      <div className="w-full max-w-4xl text-gray-600 leading-relaxed py-4">
        {activeTab === 'description' && (
          <div className="space-y-4">
            <p>
              Elevate your home environment with our signature {product.name}. Designed by experts, this piece blends
              form and function, making it an ideal choice for any modern setup. Crafted with durability in mind,
              it offers unparalleled comfort and elegance.
            </p>
            <p>
              {product.description} Every piece is built with certified premium materials, ensuring longevity and durability. We stand behind our quality with a 5-year comprehensive warranty coverage against manufacturing issues. Our custom support team is available to assist you with configurations and bespoke requests.
            </p>
          </div>
        )}

        {activeTab === 'additional' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <table className="w-full border-collapse text-left">
              <tbody>
                <tr className="border-b border-gray-250 bg-gray-50">
                  <td className="p-3 font-semibold text-gray-700 w-1/3">Weight Limit</td>
                  <td className="p-3 text-gray-600">250 KG - 300 KG</td>
                </tr>
                <tr className="border-b border-gray-250">
                  <td className="p-3 font-semibold text-gray-700">Material</td>
                  <td className="p-3 text-gray-600">Teak Wood & Velvet Linen Fabric</td>
                </tr>
                <tr className="border-b border-gray-250 bg-gray-50">
                  <td className="p-3 font-semibold text-gray-700">Frame Finish</td>
                  <td className="p-3 text-gray-600">Premium Walnut Matte Polish</td>
                </tr>
                <tr className="border-b border-gray-250">
                  <td className="p-3 font-semibold text-gray-700">SKU Code</td>
                  <td className="p-3 text-gray-600 font-mono">{product.sku || "N/A"}</td>
                </tr>
                {product.sizes && product.sizes.length > 0 && (
                  <tr className="border-b border-gray-250 bg-gray-50">
                    <td className="p-3 font-semibold text-gray-700">Available Sizes</td>
                    <td className="p-3 text-gray-600">
                      {product.sizes.filter(s => s.available).map(s => s.label).join(", ") || "N/A"}
                    </td>
                  </tr>
                )}
                {product.colors && product.colors.length > 0 && (
                  <tr className="border-b border-gray-250">
                    <td className="p-3 font-semibold text-gray-700">Available Colors</td>
                    <td className="p-3 text-gray-600">
                      <div className="flex gap-2 items-center flex-wrap">
                        {product.colors.filter(c => c.available).map(c => (
                          <span key={c.hex} className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full border border-gray-300" style={{backgroundColor: c.hex}}></span>
                            <span className="text-sm">{c.name}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-50">
                  <td className="p-3 font-semibold text-gray-700">Tags</td>
                  <td className="p-3 text-gray-600">{product.tags?.join(", ")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating summary */}
            <div className="flex items-center gap-4">
              <span className="text-4xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</span>
              <div>
                <div className="flex text-yellow-500 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.round(avgRating) ? "fill-yellow-500" : "text-gray-300"}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-500">Based on {reviewCount} verified review{reviewCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Write a Review Form */}
            {isSignedIn ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Write a Review</h4>
                <form onSubmit={handleSubmitReview}>
                  {/* Star rating picker */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600 mr-2">Your Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-0.5 transition-transform hover:scale-110"
                        >
                          <Star className={`w-6 h-6 transition-colors ${
                            star <= (hoverRating || newRating)
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-gray-300"
                          }`} />
                        </button>
                      ))}
                    </div>
                    {newRating > 0 && <span className="text-sm text-gray-500 ml-2">{newRating}/5</span>}
                  </div>

                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-[#B88E2F]/30 focus:border-[#B88E2F]"
                    maxLength={1000}
                  />

                  {submitMessage && (
                    <p className={`text-sm mt-2 ${submitMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                      {submitMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-3 px-6 py-2 bg-[#B88E2F] text-white rounded font-semibold hover:bg-[#a5761f] transition disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
                Please sign in to write a review.
              </div>
            )}
            
            {/* Reviews list */}
            {reviewsLoading ? (
              <p className="text-gray-500 text-center py-4">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-lg font-medium">No reviews yet</p>
                <p className="text-sm">Be the first to review this product!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 border-t border-gray-200 mt-4">
                {reviews.map((rev, index) => (
                  <div key={rev._id || index} className="py-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-800">{rev.userName}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric", month: "short", day: "numeric"
                        })}
                      </span>
                    </div>
                    <div className="flex text-yellow-500 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < rev.rating ? "fill-yellow-500" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center py-4 w-full">
        <img src={aImg} className='cursor-pointer rounded hover:opacity-90 transition duration-300 max-w-full sm:max-w-[45%] h-auto shadow-sm' alt="Room inspiration a" />
        <img src={bImg} className='cursor-pointer rounded hover:opacity-90 transition duration-300 max-w-full sm:max-w-[45%] h-auto shadow-sm' alt="Room inspiration b" />
      </div>

      <div className="h-[1px] bg-gray-200 my-6 w-full"></div>
    </div>
  );
};

export default Description;
