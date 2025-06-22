import React from 'react';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  priceRange: 'budget' | 'moderate' | 'expensive' | 'luxury';
  rating: number;
  reviewCount: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website?: string;
  hours: {
    [key: string]: string;
  };
  images: string[];
  tags: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance?: number; // in kilometers
  isOpen: boolean;
  deliveryAvailable: boolean;
  takeoutAvailable: boolean;
  dineInAvailable: boolean;
  features: string[]; // ['outdoor_seating', 'live_music', 'wheelchair_accessible', etc.]
  dietaryOptions: string[]; // ['vegetarian', 'vegan', 'gluten_free', etc.]
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRating {
  id: string;
  userId: string;
  restaurantId: string;
  boomScore: number; // 0-5 scale (changed from 1-10)
  rating: number; // 1-5 stars
  review?: string;
  photos?: string[];
  tags: string[];
  isPublic: boolean;
  specialBoom?: boolean; // New field for special boom button
  specialBoomUsedAt?: Date; // Track when special boom was used
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferences: {
    cuisines: string[];
    priceRanges: string[];
    dietaryRestrictions: string[];
    maxDistance: number; // in kilometers
    favoriteNeighborhoods: string[];
  };
  ratings: UserRating[];
  favorites: string[]; // restaurant IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface BoomMeterProps {
  score: number; // 0-5 scale
  onScoreChange: (score: number) => void;
  onSpecialBoom?: () => void; // New callback for special boom
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  specialBoomUsed?: boolean; // Whether special boom has been used
  canUseSpecialBoom?: boolean; // Whether special boom is available (24h cooldown)
}

export interface RestaurantCardProps {
  restaurant: Restaurant;
  userRating?: UserRating;
  onRatingSubmit: (rating: UserRating) => void;
  onFavorite: (restaurantId: string) => void;
  isFavorite: boolean;
  isVisible: boolean;
}

export interface InfiniteScrollProps {
  items: Restaurant[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  renderItem: (item: Restaurant, index: number) => React.ReactNode;
}

export interface TouchGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  threshold?: number;
  velocity?: number;
}

// API Response Types
export interface GooglePlacesResponse {
  status: string;
  results: {
    place_id: string;
    name: string;
    formatted_address: string;
    vicinity?: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    user_ratings_total?: number;
    photos?: {
      photo_reference: string;
      height: number;
      width: number;
    }[];
    types: string[];
    opening_hours?: {
      open_now: boolean;
      weekday_text?: string[];
    };
    price_level?: number;
  }[];
  error_message?: string;
  next_page_token?: string;
}

export interface YelpResponse {
  businesses: Array<{
    id: string;
    name: string;
    image_url: string;
    url: string;
    review_count: number;
    rating: number;
    price: string;
    location: {
      address1: string;
      city: string;
      state: string;
      zip_code: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
    categories: Array<{
      alias: string;
      title: string;
    }>;
    transactions: string[];
    phone: string;
    display_phone: string;
    distance: number;
  }>;
}

export interface AIRecommendationRequest {
  userId: string;
  userPreferences: User['preferences'];
  recentRatings: UserRating[];
  location: {
    latitude: number;
    longitude: number;
  };
  limit?: number;
}

export interface AIRecommendationResponse {
  recommendations: Array<{
    restaurantId: string;
    confidence: number;
    reasoning: string;
    matchFactors: string[];
  }>;
}

// App State Types
export interface AppState {
  user: User | null;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  restaurants: Restaurant[];
  userRatings: UserRating[];
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  currentIndex: number;
  hasMore: boolean;
}

export interface AppActions {
  setUser: (user: User | null) => void;
  setCurrentLocation: (location: { latitude: number; longitude: number }) => void;
  addRestaurants: (restaurants: Restaurant[]) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  clearRestaurants: () => void;
  addUserRating: (rating: UserRating) => void;
  toggleFavorite: (restaurantId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentIndex: (index: number) => void;
  setHasMore: (hasMore: boolean) => void;
  resetState: () => void;
} 