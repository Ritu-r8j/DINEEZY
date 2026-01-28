'use client';

import { useState } from 'react';
import { Star, ThumbsUp, MessageCircle, Filter, Search } from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: Date;
  orderItems: string[];
  helpful: number;
  replied: boolean;
}

const mockReviews: Review[] = [
  {
    id: '1',
    customerName: 'Sarah Thompson',
    rating: 5,
    comment: 'Amazing food and excellent service! The Spaghetti Bolognese was perfectly cooked and the Caesar Salad was fresh and crispy. Will definitely order again!',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    orderItems: ['Spaghetti Bolognese', 'Caesar Salad'],
    helpful: 12,
    replied: true
  },
  {
    id: '2',
    customerName: 'David Lee',
    rating: 4,
    comment: 'Good pizza, arrived hot and on time. The crust was crispy and toppings were fresh. Only minor complaint is that it could use a bit more cheese.',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    orderItems: ['Margherita Pizza'],
    helpful: 8,
    replied: false
  },
  {
    id: '3',
    customerName: 'Michael Brown',
    rating: 5,
    comment: 'Best burger in town! The Classic Burger was juicy and flavorful. The fries were perfectly seasoned. Fast delivery too!',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000),
    orderItems: ['Classic Burger', 'French Fries'],
    helpful: 15,
    replied: true
  },
  {
    id: '4',
    customerName: 'Jessica Garcia',
    rating: 3,
    comment: 'The sushi was okay, but not exceptional. The rice was a bit dry and the fish could have been fresher. Service was good though.',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    orderItems: ['Sushi Platter'],
    helpful: 3,
    replied: false
  }
];

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    return matchesSearch && matchesRating;
  });

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: parseFloat(((reviews.filter(r => r.rating === rating).length / reviews.length) * 100).toFixed(2))
  }));

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-black fill-current dark:text-white' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleReply = (reviewId: string) => {
    if (replyText.trim()) {
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, replied: true } : review
      ));
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const getTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (60 * 60 * 1000));
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Reviews</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor and respond to customer feedback.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
              <div className="flex items-center mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white mr-2">
                  {averageRating.toFixed(2)}
                </span>
                {renderStars(Math.round(averageRating), 'md')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{reviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round((reviews.filter(r => r.replied).length / reviews.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center">
              <div className="flex items-center w-20">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">{rating}</span>
                <Star className="h-4 w-4 text-black fill-current dark:text-white" />
              </div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 w-12">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search reviews..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {review.customerName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{review.customerName}</h4>
                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(review.date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {review.replied && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full dark:bg-green-900 dark:text-green-200">
                    Replied
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-4">{review.comment}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center space-x-4">
                <span>Order: {review.orderItems.join(', ')}</span>
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{review.helpful} helpful</span>
                </div>
              </div>
            </div>

            {!review.replied && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                {replyingTo === review.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your response..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(review.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Send Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Reply to Review
                  </button>
                )}
              </div>
            )}

            {review.replied && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-blue-900 dark:text-blue-200">Restaurant Response</span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-300">
                    Thank you for your feedback! We're glad you enjoyed your meal and appreciate you taking the time to leave a review.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">No reviews found matching your criteria.</div>
        </div>
      )}
    </div>
  );
}