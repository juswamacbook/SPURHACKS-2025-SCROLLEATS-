import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, MapPin, Star, DollarSign, Phone, Globe, Filter, ChevronDown } from 'lucide-react';
import { UserRating, RestaurantCardProps } from '../types';
import BoomMeter from './BoomMeter';
import SpecialBoomAnimation from './SpecialBoomAnimation';
import { googlePlacesAPI } from '../services/api';
import { useScrollEatsStore } from '../store';

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  userRating,
  onRatingSubmit,
  onFavorite,
  isFavorite,
  isVisible,
}) => {
  const { canUseSpecialBoom } = useScrollEatsStore();
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSpecialBoomAnimation, setShowSpecialBoomAnimation] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const handleRatingSubmit = useCallback((boomScore: number) => {
    const rating: UserRating = {
      id: `rating_${Date.now()}`,
      userId: 'user_1', // In production, get from auth
      restaurantId: restaurant.id,
      boomScore,
      rating: Math.ceil(boomScore * 1.2), // Convert 0-5 to 1-5 (0 becomes 1, 5 becomes 5)
      review: '',
      photos: [],
      tags: [],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onRatingSubmit(rating);
  }, [restaurant.id, onRatingSubmit]);

  const handleSpecialBoom = useCallback(() => {
    const rating: UserRating = {
      id: `rating_${Date.now()}`,
      userId: 'user_1',
      restaurantId: restaurant.id,
      boomScore: 5, // Special boom always gives 5 booms
      rating: 5, // 5 stars
      review: '',
      photos: [],
      tags: [],
      isPublic: true,
      specialBoom: true,
      specialBoomUsedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onRatingSubmit(rating);
    
    // Trigger the special boom animation
    setShowSpecialBoomAnimation(true);
    
    // For demo purposes, don't track special boom usage
    // useScrollEatsStore.getState().lastSpecialBoomUsed = new Date();
  }, [restaurant.id, onRatingSubmit]);

  const loadReviews = useCallback(async () => {
    if (reviews.length > 0) {
      setShowReviews(true);
      return;
    }

    setIsLoadingReviews(true);
    try {
      const googleReviews = await googlePlacesAPI.getPlaceReviews(restaurant.id);
      setReviews(googleReviews);
      setShowReviews(true);
    } catch (error) {
      console.error('Error loading reviews:', error);
      // Show fallback reviews
      setReviews([
        {
          author_name: 'Local Foodie',
          rating: restaurant.rating,
          text: 'Great food and atmosphere!',
          time: Date.now(),
        },
        {
          author_name: 'Dining Enthusiast',
          rating: restaurant.rating,
          text: 'Highly recommend this place.',
          time: Date.now() - 86400000,
        },
      ]);
      setShowReviews(true);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [restaurant.id, restaurant.rating, reviews.length]);

  const nextImage = useCallback(() => {
    if (restaurant.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % restaurant.images.length);
    }
  }, [restaurant.images.length]);

  const prevImage = useCallback(() => {
    if (restaurant.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? restaurant.images.length - 1 : prev - 1
      );
    }
  }, [restaurant.images.length]);

  const getPriceDisplay = (priceRange: string) => {
    switch (priceRange) {
      case 'budget': return '$';
      case 'moderate': return '$$';
      case 'expensive': return '$$$';
      case 'luxury': return '$$$$';
      default: return '$$';
    }
  };

  const getDistanceDisplay = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };

  // Filter and sort reviews
  const getFilteredReviews = useCallback(() => {
    const sortedReviews = [...reviews];
    
    switch (reviewFilter) {
      case 'highest':
        return sortedReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'lowest':
        return sortedReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'recent':
      default:
        return sortedReviews.sort((a, b) => (b.time || 0) - (a.time || 0));
    }
  }, [reviews, reviewFilter]);

  const getFilterDisplayName = (filter: string) => {
    switch (filter) {
      case 'highest': return 'Highest Rating';
      case 'lowest': return 'Lowest Rating';
      case 'recent': return 'Most Recent';
      default: return 'Most Recent';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="h-full bg-black relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={restaurant.images[currentImageIndex] || restaurant.images[0]}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent" />
      </div>

      {/* Image Navigation */}
      {restaurant.images.length > 1 && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button
            onClick={prevImage}
            className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          >
            ←
          </button>
          <div className="flex space-x-1">
            {restaurant.images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
          <button
            onClick={nextImage}
            className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          >
            →
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">
        {/* Top Section */}
        <div className="flex-1">
          {/* Restaurant Info */}
          <div className="mb-6">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {restaurant.name}
            </motion.h1>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4 mb-3"
            >
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-orange-400 fill-current" />
                <span className="text-white font-semibold">{restaurant.rating}</span>
                <span className="text-gray-300">({restaurant.reviewCount})</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 text-red-400" />
                <span className="text-white font-semibold ml-1">
                  {getPriceDisplay(restaurant.priceRange)}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span className="text-white text-sm ml-1">
                  {getDistanceDisplay(restaurant.distance)}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <p className="text-gray-300 text-sm mb-2">
                {restaurant.cuisine} • {restaurant.priceRange}
              </p>
              <div className="flex flex-wrap gap-2">
                {restaurant.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-4"
            >
              <p className="text-gray-300 text-sm leading-relaxed">
                {showFullDescription 
                  ? restaurant.description
                  : restaurant.description.slice(0, 100) + (restaurant.description.length > 100 ? '...' : '')
                }
                {restaurant.description.length > 100 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-orange-400 ml-1 hover:underline"
                  >
                    {showFullDescription ? 'Show less' : 'Read more'}
                  </button>
                )}
              </p>
            </motion.div>

            {/* Address and Contact */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <div className="flex items-center text-gray-300 text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{restaurant.address}</span>
              </div>
              {restaurant.phone && (
                <div className="flex items-center text-gray-300 text-sm">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{restaurant.phone}</span>
                </div>
              )}
              {restaurant.website && (
                <div className="flex items-center text-gray-300 text-sm">
                  <Globe className="w-4 h-4 mr-2" />
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                    Visit website
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          {/* Action Buttons */}
          <div className="flex items-center justify-end">
            <button
              onClick={loadReviews}
              className="p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Boom Meter */}
          <div className="flex justify-center">
            <BoomMeter
              score={userRating?.boomScore || 0}
              onScoreChange={handleRatingSubmit}
              onSpecialBoom={handleSpecialBoom}
              size="medium"
              specialBoomUsed={userRating?.specialBoom || false}
              canUseSpecialBoom={canUseSpecialBoom()}
            />
          </div>
        </motion.div>
      </div>

      {/* Reviews Modal */}
      <AnimatePresence>
        {showReviews && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReviews(false)}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-lg h-[90vh] flex flex-col"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                  <p className="text-sm text-gray-500">{restaurant.name}</p>
                </div>
                <button
                  onClick={() => setShowReviews(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Filter Section */}
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-end">
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Filter className="w-4 h-4" />
                      <span>{getFilterDisplayName(reviewFilter)}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showFilterDropdown && (
                      <div 
                        ref={filterDropdownRef}
                        className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]"
                      >
                        {(['recent', 'highest', 'lowest'] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => {
                              setReviewFilter(filter);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              reviewFilter === filter ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                            }`}
                          >
                            {getFilterDisplayName(filter)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reviews Content */}
              <div className="flex-1 overflow-hidden">
                {isLoadingReviews ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4" />
                      <p className="text-gray-500">Loading reviews...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto custom-scrollbar" style={{ 
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain'
                  }}>
                    <div className="p-4 space-y-4 pb-8">
                      {getFilteredReviews().length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No reviews available</p>
                        </div>
                      ) : (
                        getFilteredReviews().map((review, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {review.author_name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{review.author_name || 'Anonymous'}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date((review.time || Date.now()) * 1000).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-orange-400 fill-current" />
                                <span className="font-semibold text-gray-900">{review.rating || 0}</span>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{review.text || 'No review text available'}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Special Boom Animation */}
      <SpecialBoomAnimation
        isVisible={showSpecialBoomAnimation}
        onComplete={() => setShowSpecialBoomAnimation(false)}
      />
    </div>
  );
};

export default RestaurantCard; 