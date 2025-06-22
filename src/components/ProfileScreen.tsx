import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Settings, Camera, Edit } from 'lucide-react';
import { useScrollEatsStore } from '../store';

const ProfileScreen: React.FC = () => {
  const { userRatings, favorites, restaurants } = useScrollEatsStore();
  const [activeTab, setActiveTab] = useState('stats');

  // Mock user data
  const user = {
    name: 'Food Explorer',
    email: 'foodie@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    joinDate: 'March 2024',
  };

  const stats = [
    { label: 'Restaurants Rated', value: userRatings.length, icon: Star },
    { label: 'Favorites', value: favorites.length, icon: Heart },
    { label: 'Reviews Written', value: userRatings.filter(r => r.review).length, icon: Edit },
  ];

  const tabs = [
    { id: 'stats', label: 'Stats' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'reviews', label: 'Reviews' },
  ];

  const getFavoriteRestaurants = () => {
    return restaurants.filter(restaurant => favorites.includes(restaurant.id));
  };

  const getRatedRestaurants = () => {
    return userRatings.map(rating => {
      const restaurant = restaurants.find(r => r.id === rating.restaurantId);
      return { ...rating, restaurant };
    }).filter(item => item.restaurant);
  };

  return (
    <div className="h-full bg-orange-100">
      {/* Profile Header */}
      <div className="bg-white p-6 border-b border-orange-200">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-400">Member since {user.joinDate}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="bg-white rounded-xl p-4 text-center shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Icon className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex bg-white rounded-lg p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">This Week</span>
                    <span className="font-medium">{userRatings.filter(r => 
                      new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                    ).length} ratings</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-medium">{userRatings.filter(r => 
                      new Date(r.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
                    ).length} ratings</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {getFavoriteRestaurants().map((restaurant) => (
                <div key={restaurant.id} className="bg-white rounded-xl p-4 flex items-center space-x-3">
                  <img
                    src={restaurant.images[0]}
                    alt={restaurant.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{restaurant.name}</h4>
                    <p className="text-sm text-gray-500">{restaurant.cuisine}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{restaurant.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
              {getFavoriteRestaurants().length === 0 && (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No favorites yet</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {getRatedRestaurants().map((rating) => (
                <div key={rating.id} className="bg-white rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={rating.restaurant?.images[0]}
                      alt={rating.restaurant?.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{rating.restaurant?.name}</h4>
                      <p className="text-sm text-gray-500">{rating.restaurant?.cuisine}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">{rating.boomScore}/5 booms</div>
                      <div className="text-xs text-gray-500">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </div>
                      {rating.specialBoom && (
                        <div className="text-xs text-orange-500 font-semibold">🔥 Special Boom!</div>
                      )}
                    </div>
                  </div>
                  {rating.review && (
                    <p className="text-gray-600 text-sm">{rating.review}</p>
                  )}
                </div>
              ))}
              {getRatedRestaurants().length === 0 && (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Button */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen; 