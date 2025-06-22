import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Filter, ChevronDown, X, Phone, Globe, Clock } from 'lucide-react';
import { Restaurant } from '../types';
import { apiService } from '../services/api';

interface SearchScreenProps {
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

interface FilterOptions {
  priceRange: string[];
  cuisine: string[];
  minRating: number;
  maxDistance: number;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ onRestaurantSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [],
    cuisine: [],
    minRating: 0,
    maxDistance: 50,
  });
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Available filter options
  const priceRanges = [
    { value: 'budget', label: 'Budget ($)', icon: '$' },
    { value: 'moderate', label: 'Moderate ($$)', icon: '$$' },
    { value: 'expensive', label: 'Expensive ($$$)', icon: '$$$' },
    { value: 'luxury', label: 'Luxury ($$$$)', icon: '$$$$' },
  ];

  const cuisines = [
    'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian',
    'Thai', 'Vietnamese', 'Korean', 'French', 'Greek', 'Mediterranean',
    'Pizza', 'Burgers', 'Seafood', 'Steakhouse', 'Barbecue', 'Sushi',
    'Mediterranean', 'Middle Eastern', 'African', 'Caribbean', 'Latin American'
  ];

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location not available:', error);
        }
      );
    }
  }, []);

  // Search for location suggestions
  useEffect(() => {
    if (locationQuery.length > 2) {
      const fetchSuggestions = async () => {
        try {
          const suggestions = await apiService.getPlaceAutocomplete(locationQuery);
          setLocationSuggestions(suggestions);
          setShowLocationSuggestions(true);
        } catch (error) {
          console.error('Error fetching location suggestions:', error);
        }
      };
      fetchSuggestions();
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  }, [locationQuery]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    // Make location mandatory
    if (!locationQuery.trim() && !location) {
      alert('Please enter a location to search for restaurants.');
      return;
    }
    
    setIsSearching(true);
    try {
      let searchLocation = location;
      
      // If location query is provided, get coordinates for it
      if (locationQuery.trim()) {
        try {
          const coords = await apiService.getCoordinatesForAddress({ address: locationQuery });
          searchLocation = coords;
        } catch (error) {
          console.error('Error getting location coordinates:', error);
          alert('Could not find the location you entered. Please try a different location.');
          setIsSearching(false);
          return;
        }
      }

      // Ensure we have a location before searching
      if (!searchLocation) {
        alert('Please enter a valid location to search for restaurants.');
        setIsSearching(false);
        return;
      }

      const results = await apiService.searchRestaurants(
        searchQuery,
        searchLocation,
        filters.maxDistance * 1000 // Convert kilometers to meters
      );

      console.log('Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      alert('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, locationQuery, location, filters.maxDistance]);

  const handleLocationSelect = async (suggestion: any) => {
    setLocationQuery(suggestion.description);
    setShowLocationSuggestions(false);
    
    try {
      const coords = await apiService.getCoordinatesForAddress({ placeId: suggestion.place_id });
      setLocation(coords);
    } catch (error) {
      console.error('Error getting location coordinates:', error);
    }
  };

  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const togglePriceRange = (priceRange: string) => {
    setFilters(prev => ({
      ...prev,
      priceRange: prev.priceRange.includes(priceRange)
        ? prev.priceRange.filter(p => p !== priceRange)
        : [...prev.priceRange, priceRange],
    }));
  };

  const toggleCuisine = (cuisine: string) => {
    setFilters(prev => ({
      ...prev,
      cuisine: prev.cuisine.includes(cuisine)
        ? prev.cuisine.filter(c => c !== cuisine)
        : [...prev.cuisine, cuisine],
    }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [],
      cuisine: [],
      minRating: 0,
      maxDistance: 50,
    });
  };

  const getFilteredResults = () => {
    return searchResults.filter(restaurant => {
      // Price range filter
      if (filters.priceRange.length > 0 && !filters.priceRange.includes(restaurant.priceRange)) {
        return false;
      }

      // Cuisine filter
      if (filters.cuisine.length > 0 && !filters.cuisine.some(cuisine => 
        restaurant.cuisine.toLowerCase().includes(cuisine.toLowerCase())
      )) {
        return false;
      }

      // Rating filter
      if (filters.minRating > 0 && restaurant.rating < filters.minRating) {
        return false;
      }

      // Distance filter
      if (filters.maxDistance < 50 && restaurant.distance && restaurant.distance > filters.maxDistance) {
        return false;
      }

      return true;
    });
  };

  const filteredResults = getFilteredResults();

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const closeRestaurantModal = () => {
    setSelectedRestaurant(null);
  };

  const getPriceDisplay = (priceRange: string) => {
    switch (priceRange) {
      case 'budget': return '$';
      case 'moderate': return '$$';
      case 'expensive': return '$$$';
      case 'luxury': return '$$$$';
      default: return '$$';
    }
  };

  return (
    <div className="h-full bg-orange-100 flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-orange-300 flex-shrink-0 bg-orange-100">
        <div className="space-y-3">
          {/* Restaurant Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search restaurants, cuisines, or dishes..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Location Search */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Enter city or location (required)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            />
            
            {/* Location Suggestions */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                {locationSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    onClick={() => handleLocationSelect(suggestion)}
                    className="w-full text-left p-3 hover:bg-orange-100 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{suggestion.structured_formatting?.main_text}</div>
                    <div className="text-sm text-gray-500">{suggestion.structured_formatting?.secondary_text}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-orange-300 flex-shrink-0 bg-orange-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-orange-200 text-orange-900 px-4 py-2 rounded-lg font-semibold hover:bg-orange-300 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {(filters.priceRange.length > 0 || filters.cuisine.length > 0 || filters.minRating > 0 || filters.maxDistance < 50) && (
            <button
              onClick={clearFilters}
              className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 space-y-4 overflow-hidden"
            >
              {/* Price Range */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Price Range</h4>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((priceRange) => (
                    <button
                      key={priceRange.value}
                      onClick={() => togglePriceRange(priceRange.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.priceRange.includes(priceRange.value)
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {priceRange.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisine */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cuisine</h4>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {cuisines.map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() => toggleCuisine(cuisine)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.cuisine.includes(cuisine)
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Minimum Rating</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Min Rating:</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleFilterChange('minRating', rating)}
                        className={`p-1 rounded transition-colors ${
                          filters.minRating === rating
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Distance */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Max Distance</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={filters.maxDistance}
                    onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                    className="flex-1 accent-orange-600"
                  />
                  <span className="text-sm text-gray-600 min-w-[4rem]">
                    {filters.maxDistance} km
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {isSearching ? (
            <motion.div
              key="loading"
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3" />
                <p className="text-gray-500">Searching restaurants...</p>
              </div>
            </motion.div>
          ) : searchQuery && !isSearching ? (
            <motion.div
              key="results"
              className="p-4 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {filteredResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No restaurants found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-500 mb-4">
                    Found {filteredResults.length} restaurant{filteredResults.length !== 1 ? 's' : ''}
                  </div>
                  {filteredResults.map((restaurant, index) => (
                    <motion.div
                      key={restaurant.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleRestaurantClick(restaurant)}
                    >
                      <div className="flex">
                        <div className="w-24 h-24 flex-shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"
                            alt="Restaurant"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-3">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {restaurant.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {restaurant.cuisine} • {getPriceDisplay(restaurant.priceRange)}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-orange-400 fill-current" />
                                <span className="font-semibold">{restaurant.rating}</span>
                              </div>
                              <span className="text-sm text-gray-500">
                                ({restaurant.reviewCount} reviews)
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {restaurant.distance ? `${restaurant.distance.toFixed(1)} km` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Search for restaurants
                </h3>
                <p className="text-gray-500">
                  Enter a search term and location to find restaurants
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Restaurant Details Modal */}
      <AnimatePresence>
        {selectedRestaurant && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRestaurantModal}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative">
                <img
                  src={selectedRestaurant.images[0]}
                  alt={selectedRestaurant.name}
                  className="w-full h-48 object-cover rounded-t-2xl"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
                  }}
                />
                <button
                  onClick={closeRestaurantModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {selectedRestaurant.name}
                    </h2>
                    <p className="text-gray-600">{selectedRestaurant.cuisine}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {getPriceDisplay(selectedRestaurant.priceRange)}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-orange-400 fill-current" />
                    <span className="text-lg font-semibold text-gray-900 ml-1">
                      {selectedRestaurant.rating}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({selectedRestaurant.reviewCount} reviews)
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{selectedRestaurant.address}</span>
                  </div>
                  
                  {selectedRestaurant.distance && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">
                        {selectedRestaurant.distance.toFixed(1)} kilometers away
                      </span>
                    </div>
                  )}

                  {selectedRestaurant.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <a
                        href={`tel:${selectedRestaurant.phone}`}
                        className="text-orange-600 hover:text-orange-800 hover:underline"
                      >
                        {selectedRestaurant.phone}
                      </a>
                    </div>
                  )}

                  {selectedRestaurant.website && (
                    <div className="flex items-center text-gray-600">
                      <Globe className="w-4 h-4 mr-2" />
                      <a
                        href={selectedRestaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800 hover:underline"
                      >
                        Visit website
                      </a>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      {selectedRestaurant.isOpen ? 'Open now' : 'Closed'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${selectedRestaurant.name}, ${selectedRestaurant.address}`
                      )}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Open in Google Maps</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchScreen; 