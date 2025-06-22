import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Settings, Plus } from 'lucide-react';
import { useScrollEatsStore } from './store';
import { Restaurant, UserRating } from './types';
import RestaurantCard from './components/RestaurantCard';
import InfiniteScroll from './components/InfiniteScroll';
import BottomNavigation from './components/BottomNavigation';
import CreateReview from './components/CreateReview';
import SearchScreen from './components/SearchScreen';
import ProfileScreen from './components/ProfileScreen';
import LoadingSpinner from './components/LoadingSpinner';
import { apiService, testGooglePlacesAPI } from './services/api';
import { useDebounce } from './hooks/useDebounce';

function App() {
  const {
    currentLocation,
    restaurants,
    userRatings,
    favorites,
    isLoading,
    error,
    currentIndex,
    hasMore,
    setCurrentLocation,
    setRestaurants,
    addUserRating,
    toggleFavorite,
    setLoading,
    setError,
    setHasMore,
    setCurrentIndex,
  } = useScrollEatsStore();

  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const debouncedLocationQuery = useDebounce(locationQuery, 300);
  
  // Filter state
  const [filters, setFilters] = useState({
    maxDistance: 15, // Default 15km
    priceRanges: ['budget', 'moderate', 'expensive', 'luxury'] as string[], // All price ranges by default
  });
  
  // Track the last loaded location to prevent infinite calls
  const lastLoadedLocation = useRef<string | null>(null);
  const currentFiltersRef = useRef(filters);

  // Update the ref whenever filters change
  useEffect(() => {
    currentFiltersRef.current = filters;
  }, [filters]);

  const loadRestaurants = useCallback(async (location?: { latitude: number; longitude: number }) => {
    if (!location) return;
    
    const locationKey = `${location.latitude},${location.longitude}`;
    if (lastLoadedLocation.current === locationKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the current filters from ref
      const currentFilters = currentFiltersRef.current;
      const radius = currentFilters.maxDistance * 1000; // Convert km to meters
      const restaurants = await apiService.getNearbyRestaurants(location.latitude, location.longitude, radius);
      
      // Apply price range filter to the results
      const filteredRestaurants = restaurants.filter(restaurant => 
        currentFilters.priceRanges.includes(restaurant.priceRange)
      );
      
      setRestaurants(filteredRestaurants);
      setHasMore(filteredRestaurants.length >= 20);
      setCurrentIndex(0);
      lastLoadedLocation.current = locationKey;
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setError('Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setRestaurants, setHasMore, setCurrentIndex]);

  const refreshLocation = useCallback(() => {
    if (currentLocation) {
      // Reset the last loaded location to force a refresh
      lastLoadedLocation.current = null;
      loadRestaurants(currentLocation);
    }
  }, [currentLocation, loadRestaurants]);

  // Get user's location on app start
  useEffect(() => {
    // Test API first
    const testAPI = async () => {
      console.log('🔍 Testing Google Places API...');
      const isWorking = await testGooglePlacesAPI();
      if (!isWorking) {
        console.warn('⚠️ Google Places API test failed - will use fallback data');
      }
    };

    testAPI();

    if (navigator.geolocation) {
      console.log('Requesting user location...');

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('✅ Location obtained:', { latitude, longitude });
          setCurrentLocation({ latitude, longitude });
          setLocationStatus('success');
        },
        (error) => {
          console.error('❌ Error getting location:', error);

          // Provide specific error messages
          let errorMessage = 'Unable to get your location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services or enter location manually.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please enter location manually.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please enter location manually.';
              break;
          }

          console.log('⚠️ No location available - user must enter manually');
          setLocationStatus('error');

          // Show a temporary error message
          setError(errorMessage);
          setTimeout(() => setError(null), 5000);
        },
        options
      );
    } else {
      console.log('⚠️ Geolocation not supported, user must enter location manually');
      setLocationStatus('error');
      setError('Geolocation not supported. Please enter your location manually.');
    }
  }, [setCurrentLocation, setError]);

  // Load restaurants when location changes
  useEffect(() => {
    if (currentLocation) {
      // Reset the last loaded location when location changes
      lastLoadedLocation.current = null;
      loadRestaurants(currentLocation);
    }
  }, [currentLocation?.latitude, currentLocation?.longitude]); // Remove loadRestaurants from dependencies

  // Load restaurants when filters change
  useEffect(() => {
    if (currentLocation) {
      // Reset the last loaded location when filters change
      lastLoadedLocation.current = null;
      // Trigger a reload by calling the function directly
      const reloadWithCurrentFilters = async () => {
        const locationKey = `${currentLocation.latitude},${currentLocation.longitude}`;
        if (lastLoadedLocation.current === locationKey) return;
        
        setLoading(true);
        setError(null);
        
        try {
          const currentFilters = currentFiltersRef.current;
          const radius = currentFilters.maxDistance * 1000;
          const restaurants = await apiService.getNearbyRestaurants(currentLocation.latitude, currentLocation.longitude, radius);
          
          const filteredRestaurants = restaurants.filter(restaurant => 
            currentFilters.priceRanges.includes(restaurant.priceRange)
          );
          
          setRestaurants(filteredRestaurants);
          setHasMore(filteredRestaurants.length >= 20);
          setCurrentIndex(0);
          lastLoadedLocation.current = locationKey;
        } catch (error) {
          console.error('Error loading restaurants:', error);
          setError('Failed to load restaurants. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      reloadWithCurrentFilters();
    }
  }, [filters.maxDistance, filters.priceRanges, currentLocation]);

  const handleLoadMore = useCallback(() => {
    // This is now effectively disabled since hasMore is not being managed for pagination
    if (!isLoading && hasMore) {
      // In a real infinite scroll, you'd fetch the next page here
    }
  }, [isLoading, hasMore]);

  const handleRatingSubmit = useCallback((rating: UserRating) => {
    addUserRating(rating);
    // In production, this would also save to Firebase
    // firebaseAPI.saveUserRating(rating);
  }, [addUserRating]);

  const handleFavorite = useCallback((restaurantId: string) => {
    toggleFavorite(restaurantId);
  }, [toggleFavorite]);

  const handleRestaurantSelect = useCallback((restaurant: Restaurant) => {
    // Add the restaurant to the list if it's not already there
    if (!restaurants.find((r) => r.id === restaurant.id)) {
      setRestaurants([...restaurants, restaurant]);
    }
    // Switch to home tab to show the restaurant
    setActiveTab('home');
    // Set current index to the new restaurant
    const newIndex = restaurants.findIndex((r) => r.id === restaurant.id);
    if (newIndex !== -1) {
      setCurrentIndex(newIndex);
    }
  }, [restaurants, setRestaurants, setCurrentIndex]);

  const renderRestaurantCard = useCallback((restaurant: Restaurant, index: number) => {
    const userRating = userRatings.find(r => r.restaurantId === restaurant.id);
    const isFavorite = favorites.includes(restaurant.id);

    return (
      <RestaurantCard
        key={restaurant.id}
        restaurant={restaurant}
        userRating={userRating}
        onRatingSubmit={handleRatingSubmit}
        onFavorite={handleFavorite}
        isFavorite={isFavorite}
        isVisible={true}
      />
    );
  }, [userRatings, favorites, handleRatingSubmit, handleFavorite]);

  const renderContent = () => {
    console.log('Rendering content. Restaurants:', restaurants.length, 'Current index:', currentIndex, 'Has more:', hasMore);
    
    switch (activeTab) {
      case 'home':
        return (
          <div className="h-full pt-16 pb-20">
            {restaurants.length > 0 ? (
              <InfiniteScroll
                items={restaurants}
                hasMore={hasMore}
                isLoading={isLoading}
                onLoadMore={handleLoadMore}
                renderItem={renderRestaurantCard}
                currentIndex={currentIndex}
                onIndexChange={setCurrentIndex}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white">
                <img 
                  src="https://storage.googleapis.com/agentsea-storage/images/Screenshot_2024-06-21_at_3.02.04_PM.png" 
                  alt="ScrollEats Logo" 
                  className="w-32 h-auto mb-6" 
                />
                <LoadingSpinner size="large" text="Loading restaurants..." />
              </div>
            )}
          </div>
        );
      
      case 'create':
        return (
          <div className="h-full flex items-center justify-center bg-orange-100">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-orange-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Review</h2>
              <p className="text-gray-600 mb-6">Share your dining experience with the community</p>
              <button
                onClick={() => setShowCreateReview(true)}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Start Review
              </button>
            </div>
          </div>
        );
      
      case 'search':
        return (
          <div className="h-full pb-20">
            <SearchScreen onRestaurantSelect={handleRestaurantSelect} />
          </div>
        );
      
      case 'profile':
        return (
          <div className="h-full pb-20">
            <ProfileScreen />
          </div>
        );
      
      default:
        return null;
    }
  };

  useEffect(() => {
    if (debouncedLocationQuery) {
      const fetchSuggestions = async () => {
        const newSuggestions = await apiService.getPlaceAutocomplete(debouncedLocationQuery);
        setSuggestions(newSuggestions);
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedLocationQuery]);

  const handleLocationSearch = useCallback(async (params: { address?: string; placeId?: string }) => {
    if (!params.address && !params.placeId) {
      setError('Please enter a location.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setLoading(true);
    setSuggestions([]);
    try {
      const { latitude, longitude } = await apiService.getCoordinatesForAddress(params);
      // Clear existing restaurants and reset location tracking
      setRestaurants([]);
      lastLoadedLocation.current = null;
      setCurrentLocation({ latitude, longitude });
      setLocationStatus('manual');
      setShowLocationInput(false);
      setLocationQuery('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }, [setCurrentLocation, setError, setLoading, setRestaurants]);

  if (error) {
    return (
      <div className="h-screen-dynamic flex items-center justify-center bg-gray-100">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => currentLocation && loadRestaurants(currentLocation)}
              className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-100 text-red-800 px-4 py-3 rounded-lg font-semibold hover:bg-red-200 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen-dynamic bg-black overflow-hidden">
      {/* Header - Only show on home tab */}
      {activeTab === 'home' && (
        <motion.header
          className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-orange-300/80 via-orange-300/40 to-transparent backdrop-blur-sm shadow-xl"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 2}}
        >
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-white" />
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm font-medium">
                {locationStatus === 'loading' ? 'Getting location...' : 
                 locationStatus === 'success' ? 'Nearby' : 
                 locationStatus === 'manual' ? 'Custom location' :
                 'Set location'}
              </span>
              {locationStatus === 'success' && currentLocation && (
                <button
                  onClick={refreshLocation}
                  className="text-orange-200 hover:text-white text-xs underline"
                >
                  Refresh
                </button>
              )}
              <button
                onClick={() => setShowLocationInput(true)}
                className="text-orange-200 hover:text-white text-xs underline"
              >
                Change location
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors relative ${
                (filters.maxDistance !== 15 || filters.priceRanges.length !== 4) 
                  ? 'bg-orange-500/50 hover:bg-orange-500/70' 
                  : 'bg-orange-500/30 hover:bg-orange-500/50'
              }`}
            >
              <Settings className="w-5 h-5 text-white" />
              {/* Filter indicator dot */}
              {(filters.maxDistance !== 15 || filters.priceRanges.length !== 4) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </button>
          </div>
        </motion.header>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={(tab) => {
        if (tab === 'home' && restaurants.length === 0 && currentLocation) {
          loadRestaurants(currentLocation);
        }
        setActiveTab(tab);
      }} />

      {/* Create Review Modal */}
      <AnimatePresence>
        {showCreateReview && (
          <CreateReview onClose={() => setShowCreateReview(false)} />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Settings</h2>
              
              {/* Active filters summary */}
              {(filters.maxDistance !== 15 || filters.priceRanges.length !== 4) && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-orange-800 mb-2">Active Filters:</h3>
                  <div className="text-xs text-orange-700 space-y-1">
                    <div>• Search radius: {filters.maxDistance} km</div>
                    <div>• Price ranges: {filters.priceRanges.length === 4 ? 'All' : filters.priceRanges.join(', ')}</div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Radius
                  </label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={filters.maxDistance}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                  >
                    <option value={1}>1 km</option>
                    <option value={3}>3 km</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={15}>15 km</option>
                    <option value={20}>20 km</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'budget', label: 'Budget ($)', icon: '$' },
                      { value: 'moderate', label: 'Moderate ($$)', icon: '$$' },
                      { value: 'expensive', label: 'Expensive ($$$)', icon: '$$$' },
                      { value: 'luxury', label: 'Luxury ($$$$)', icon: '$$$$' }
                    ].map((range) => (
                      <label key={range.value} className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={filters.priceRanges.includes(range.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                priceRanges: [...prev.priceRanges, range.value]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                priceRanges: prev.priceRanges.filter(p => p !== range.value)
                              }));
                            }
                          }}
                        />
                        <span className="capitalize">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Location Input Modal */}
      <AnimatePresence>
        {showLocationInput && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLocationInput(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Enter Location</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., Waterloo, ON"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  autoComplete="off"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.place_id}
                        onClick={() => {
                          setLocationQuery(suggestion.description);
                          handleLocationSearch({ placeId: suggestion.place_id });
                        }}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                      >
                        {suggestion.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowLocationInput(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLocationSearch({ address: locationQuery })}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-semibold"
                >
                  Search
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App; 