import axios from 'axios';
import { Restaurant, GooglePlacesResponse, YelpResponse, AIRecommendationRequest, AIRecommendationResponse } from '../types';

// API Configuration
const API_CONFIG = {
  GOOGLE_PLACES_API_KEY: 'AIzaSyBTVjUUH3_41kpP83RczmHl2OdlVYNDyCA',
  YELP_API_KEY: process.env.REACT_APP_YELP_API_KEY,
  AI_API_ENDPOINT: process.env.REACT_APP_AI_API_ENDPOINT,
  FIREBASE_CONFIG: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  },
};

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data
const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Helper function to convert price level to price range
const convertPriceLevelToRange = (priceLevel?: number): Restaurant['priceRange'] => {
  if (!priceLevel) return 'moderate';
  switch (priceLevel) {
    case 1: return 'budget';
    case 2: return 'moderate';
    case 3: return 'expensive';
    case 4: return 'luxury';
    default: return 'moderate';
  }
};

// Helper function to convert Yelp price to price range
const convertYelpPriceToRange = (price?: string): Restaurant['priceRange'] => {
  if (!price) return 'moderate';
  switch (price) {
    case '$': return 'budget';
    case '$$': return 'moderate';
    case '$$$': return 'expensive';
    case '$$$$': return 'luxury';
    default: return 'moderate';
  }
};

// Fallback restaurant data for when API fails
const fallbackRestaurants: Restaurant[] = [
  {
    id: 'fallback1',
    name: 'Local Bistro',
    description: 'A cozy local bistro serving fresh, seasonal dishes',
    cuisine: 'American',
    priceRange: 'moderate',
    rating: 4.2,
    reviewCount: 45,
    address: '123 Main St',
    city: 'Your City',
    state: 'CA',
    zipCode: '12345',
    phone: '(555) 123-4567',
    website: '',
    hours: {},
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
    tags: ['Local', 'American', 'Casual'],
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    distance: 0.5,
    isOpen: true,
    deliveryAvailable: true,
    takeoutAvailable: true,
    dineInAvailable: true,
    features: [],
    dietaryOptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'fallback2',
    name: 'Pizza Palace',
    description: 'Authentic Italian pizza and pasta made with fresh ingredients',
    cuisine: 'Italian',
    priceRange: 'moderate',
    rating: 4.5,
    reviewCount: 78,
    address: '456 Oak Ave',
    city: 'Your City',
    state: 'CA',
    zipCode: '12345',
    phone: '(555) 987-6543',
    website: '',
    hours: {},
    images: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'],
    tags: ['Italian', 'Pizza', 'Pasta'],
    coordinates: { latitude: 37.7849, longitude: -122.4094 },
    distance: 1.2,
    isOpen: true,
    deliveryAvailable: true,
    takeoutAvailable: true,
    dineInAvailable: true,
    features: [],
    dietaryOptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'fallback3',
    name: 'Sushi Master',
    description: 'Premium sushi and sashimi with the freshest fish',
    cuisine: 'Japanese',
    priceRange: 'expensive',
    rating: 4.7,
    reviewCount: 156,
    address: '789 Pine St',
    city: 'Your City',
    state: 'CA',
    zipCode: '12345',
    phone: '(555) 456-7890',
    website: '',
    hours: {},
    images: ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800'],
    tags: ['Japanese', 'Sushi', 'Fine Dining'],
    coordinates: { latitude: 37.7949, longitude: -122.3994 },
    distance: 1.8,
    isOpen: true,
    deliveryAvailable: false,
    takeoutAvailable: true,
    dineInAvailable: true,
    features: [],
    dietaryOptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'fallback4',
    name: 'Taco Truck',
    description: 'Authentic Mexican street food with bold flavors',
    cuisine: 'Mexican',
    priceRange: 'budget',
    rating: 4.3,
    reviewCount: 92,
    address: '321 Food Truck Lane',
    city: 'Your City',
    state: 'CA',
    zipCode: '12345',
    phone: '(555) 321-6540',
    website: '',
    hours: {},
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800'],
    tags: ['Mexican', 'Street Food', 'Tacos'],
    coordinates: { latitude: 37.8049, longitude: -122.3894 },
    distance: 2.3,
    isOpen: true,
    deliveryAvailable: true,
    takeoutAvailable: true,
    dineInAvailable: false,
    features: [],
    dietaryOptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'fallback5',
    name: 'Burger Joint',
    description: 'Classic American burgers with hand-cut fries',
    cuisine: 'American',
    priceRange: 'moderate',
    rating: 4.1,
    reviewCount: 67,
    address: '654 Burger Blvd',
    city: 'Your City',
    state: 'CA',
    zipCode: '12345',
    phone: '(555) 654-3210',
    website: '',
    hours: {},
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800'],
    tags: ['American', 'Burgers', 'Casual'],
    coordinates: { latitude: 37.8149, longitude: -122.3794 },
    distance: 2.8,
    isOpen: true,
    deliveryAvailable: true,
    takeoutAvailable: true,
    dineInAvailable: true,
    features: [],
    dietaryOptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Test function to verify API key
export const testGooglePlacesAPI = async () => {
  try {
    console.log('Testing Google Places API...');
    const testUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=37.7749,-122.4194&radius=1500&type=restaurant&key=${API_CONFIG.GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(testUrl, { timeout: 10000 });
    console.log('API Test Response:', response.data);
    
    if (response.data.status === 'OK') {
      console.log('✅ API key is working! Found', response.data.results.length, 'restaurants');
      return true;
    } else {
      console.error('❌ API Error:', response.data.status, response.data.error_message);
      return false;
    }
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return false;
  }
};

// Google Places API
export const googlePlacesAPI = {
  async getPlaceAutocomplete(input: string): Promise<any[]> {
    if (!input) return [];
    try {
      const response = await axios.get('http://localhost:3001/api/places/autocomplete', {
        params: { input },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch autocomplete suggestions:', error);
      return [];
    }
  },

  async getCoordinatesForAddress(params: { address?: string; placeId?: string }): Promise<{ latitude: number; longitude: number }> {
    try {
      console.log(`Geocoding with params:`, params);
      const response = await axios.get<{ lat: number; lng: number }>(
        'http://localhost:3001/api/geocode',
        { 
          params,
          timeout: 10000,
        }
      );
      return { latitude: response.data.lat, longitude: response.data.lng };
    } catch (error) {
      console.error(`Failed to geocode with params:`, params, error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Could not find location. Please try a different search term.');
    }
  },

  async searchNearby(
    latitude: number,
    longitude: number,
    radius: number = 5000,
    type: string = 'restaurant'
  ): Promise<Restaurant[]> {
    const cacheKey = `google_places_${latitude}_${longitude}_${radius}_${type}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('Fetching restaurants from Google Places API via proxy...');
      console.log('Location:', latitude, longitude);
      console.log('Radius:', radius);
      
      let allRestaurants: Restaurant[] = [];
      let nextPageToken: string | undefined;
      let pageCount = 0;
      const maxPages = 5; // Get up to 100 restaurants (20 per page)
      
      do {
        const params: any = {
          latitude,
          longitude,
          radius: Math.min(radius, 50000), // Max 50km
          type,
        };
        
        if (nextPageToken) {
          params.pagetoken = nextPageToken;
        }
        
        console.log(`Making API call for page ${pageCount + 1}...`);
        
        // Use backend proxy to avoid CORS
        const response = await axios.get<GooglePlacesResponse>(
          'http://localhost:3001/api/places/nearby',
          {
            params,
            timeout: 15000,
          }
        );

        console.log(`Page ${pageCount + 1} response status:`, response.data.status);
        console.log(`Page ${pageCount + 1} results count:`, response.data.results?.length || 0);

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
          console.error('API Error:', response.data.status, response.data.error_message);
          throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
        }

        if (response.data.status === 'ZERO_RESULTS') {
          console.log('No more restaurants found');
          break;
        }

        const restaurants: Restaurant[] = response.data.results.map((place) => ({
          id: place.place_id,
          name: place.name,
          description: place.types?.join(', ') || 'Restaurant',
          cuisine: place.types?.[0] || 'restaurant',
          priceRange: convertPriceLevelToRange(place.price_level),
          rating: place.rating || 0,
          reviewCount: place.user_ratings_total || 0,
          address: place.vicinity || place.formatted_address || '',
          city: place.vicinity?.split(',')[1]?.trim() || '',
          state: place.vicinity?.split(',')[2]?.trim() || '',
          zipCode: '',
          phone: '',
          website: '',
          hours: {},
          images: place.photos ? 
            place.photos.slice(0, 3).map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${API_CONFIG.GOOGLE_PLACES_API_KEY}`
            ) : [
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
              'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
              'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800'
            ],
          tags: place.types || [],
          coordinates: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          distance: 0, // Will be calculated later
          isOpen: place.opening_hours?.open_now || false,
          deliveryAvailable: false,
          takeoutAvailable: false,
          dineInAvailable: true,
          features: [],
          dietaryOptions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        allRestaurants.push(...restaurants);
        nextPageToken = response.data.next_page_token;
        pageCount++;
        
        // Wait 2 seconds before requesting next page (Google API requirement)
        if (nextPageToken && pageCount < maxPages) {
          console.log('Waiting 2 seconds before next page...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } while (nextPageToken && pageCount < maxPages);

      // Remove duplicates based on place_id
      const uniqueRestaurants = allRestaurants.filter((restaurant, index, self) => 
        index === self.findIndex(r => r.id === restaurant.id)
      );

      // Calculate distances
      uniqueRestaurants.forEach(restaurant => {
        const lat1 = latitude;
        const lon1 = longitude;
        const lat2 = restaurant.coordinates.latitude;
        const lon2 = restaurant.coordinates.longitude;
        
        // Haversine formula to calculate distance
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        restaurant.distance = R * c;
      });

      // Sort by distance
      uniqueRestaurants.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      console.log(`Found ${uniqueRestaurants.length} unique restaurants total`);
      
      if (uniqueRestaurants.length === 0) {
        console.log('No restaurants found, using fallback data');
        return fallbackRestaurants.map(restaurant => ({
          ...restaurant,
          coordinates: { latitude, longitude },
          distance: Math.random() * 2 + 0.1,
        }));
      }
      
      setCachedData(cacheKey, uniqueRestaurants);
      return uniqueRestaurants;
      
    } catch (error) {
      console.error('Google Places API error:', error);
      
      // Return fallback data if API fails
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
        
        if (error.code === 'ERR_NETWORK') {
          console.log('Network error - backend proxy not running, using fallback data');
        } else if (error.response?.data?.status === 'REQUEST_DENIED') {
          console.log('API key denied, using fallback data');
        } else {
          console.log('Other API error, using fallback data');
        }
        
        return fallbackRestaurants.map(restaurant => ({
          ...restaurant,
          coordinates: { latitude, longitude },
          distance: Math.random() * 2 + 0.1,
        }));
      }
      
      throw new Error(`Failed to fetch restaurants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getPlaceDetails(placeId: string): Promise<Restaurant> {
    const cacheKey = `google_place_details_${placeId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            fields: 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,photos,types,price_level,geometry',
            key: API_CONFIG.GOOGLE_PLACES_API_KEY,
          },
          timeout: 10000,
        }
      );

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places Details API error: ${response.data.status}`);
      }

      const place = response.data.result;
      const restaurant: Restaurant = {
        id: placeId,
        name: place.name,
        description: place.types?.join(', ') || '',
        cuisine: place.types?.[0] || 'restaurant',
        priceRange: convertPriceLevelToRange(place.price_level),
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0,
        address: place.formatted_address,
        city: place.formatted_address.split(',')[1]?.trim() || '',
        state: place.formatted_address.split(',')[2]?.trim() || '',
        zipCode: place.formatted_address.split(',')[3]?.trim() || '',
        phone: place.formatted_phone_number || '',
        website: place.website || '',
        hours: place.opening_hours?.weekday_text?.reduce((acc: any, day: string) => {
          const [dayName, hours] = day.split(': ');
          acc[dayName] = hours;
          return acc;
        }, {}) || {},
        images: place.photos ? 
          place.photos.slice(0, 5).map((photo: any) => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${photo.photo_reference}&key=${API_CONFIG.GOOGLE_PLACES_API_KEY}`
          ) : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'],
        tags: place.types || [],
        coordinates: place.geometry?.location ? {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        } : { latitude: 0, longitude: 0 },
        isOpen: place.opening_hours?.open_now || false,
        deliveryAvailable: false,
        takeoutAvailable: false,
        dineInAvailable: true,
        features: [],
        dietaryOptions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCachedData(cacheKey, restaurant);
      return restaurant;
    } catch (error) {
      console.error('Google Places Details API error:', error);
      throw error;
    }
  },

  async getPlaceReviews(placeId: string): Promise<any[]> {
    const cacheKey = `reviews_${placeId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`http://localhost:3001/api/places/reviews/${placeId}`);
      
      if (response.data.status === 'OK' && response.data.result?.reviews) {
        const reviews = response.data.result.reviews;
        setCachedData(cacheKey, reviews);
        return reviews;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },
};

// Yelp API
export const yelpAPI = {
  async searchBusinesses(
    latitude: number,
    longitude: number,
    radius: number = 5000,
    limit: number = 20
  ): Promise<Restaurant[]> {
    const cacheKey = `yelp_${latitude}_${longitude}_${radius}_${limit}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get<YelpResponse>(
        'https://api.yelp.com/v3/businesses/search',
        {
          headers: {
            Authorization: `Bearer ${API_CONFIG.YELP_API_KEY}`,
          },
          params: {
            latitude,
            longitude,
            radius,
            limit,
            categories: 'restaurants',
            sort_by: 'rating',
          },
        }
      );

      const restaurants: Restaurant[] = response.data.businesses.map((business) => ({
        id: business.id,
        name: business.name,
        description: business.categories.map(cat => cat.title).join(', '),
        cuisine: business.categories[0]?.title || 'restaurant',
        priceRange: convertYelpPriceToRange(business.price),
        rating: business.rating,
        reviewCount: business.review_count,
        address: business.location.address1,
        city: business.location.city,
        state: business.location.state,
        zipCode: business.location.zip_code,
        phone: business.phone,
        website: business.url,
        hours: {},
        images: [business.image_url],
        tags: business.categories.map(cat => cat.title),
        coordinates: {
          latitude: business.coordinates.latitude,
          longitude: business.coordinates.longitude,
        },
        distance: business.distance / 1000, // Convert meters to kilometers
        isOpen: true, // Yelp doesn't provide real-time open status
        deliveryAvailable: business.transactions.includes('delivery'),
        takeoutAvailable: business.transactions.includes('pickup'),
        dineInAvailable: business.transactions.includes('restaurant_reservation'),
        features: business.transactions,
        dietaryOptions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      setCachedData(cacheKey, restaurants);
      return restaurants;
    } catch (error) {
      console.error('Yelp API error:', error);
      throw error;
    }
  },
};

// AI Recommendations API
export const aiAPI = {
  async getRecommendations(request: AIRecommendationRequest): Promise<AIRecommendationResponse> {
    try {
      const response = await axios.post<AIRecommendationResponse>(
        `${API_CONFIG.AI_API_ENDPOINT}/recommendations`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Recommendations API error:', error);
      throw error;
    }
  },

  async analyzeUserPreferences(userId: string, ratings: any[]): Promise<any> {
    try {
      const response = await axios.post(
        `${API_CONFIG.AI_API_ENDPOINT}/analyze-preferences`,
        { userId, ratings },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Analysis API error:', error);
      throw error;
    }
  },
};

// Firebase integration for user data
export const firebaseAPI = {
  async saveUserRating(rating: any): Promise<void> {
    // This would integrate with Firebase Firestore
    console.log('Saving rating to Firebase:', rating);
  },

  async getUserRatings(userId: string): Promise<any[]> {
    // This would fetch from Firebase Firestore
    console.log('Fetching ratings from Firebase for user:', userId);
    return [];
  },

  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    // This would update Firebase Firestore
    console.log('Updating preferences in Firebase for user:', userId, preferences);
  },
};

// Combined API service
export const apiService = {
  getPlaceAutocomplete: (input: string) => googlePlacesAPI.getPlaceAutocomplete(input),
  getCoordinatesForAddress: (params: { address?: string; placeId?: string }) => googlePlacesAPI.getCoordinatesForAddress(params),
  getNearbyRestaurants: (latitude: number, longitude: number, radius?: number) => googlePlacesAPI.searchNearby(latitude, longitude, radius),
  getPlaceDetails: (placeId: string) => googlePlacesAPI.getPlaceDetails(placeId),

  async getAIRecommendations(
    userId: string,
    userPreferences: any,
    recentRatings: any[],
    location: { latitude: number; longitude: number }
  ): Promise<Restaurant[]> {
    try {
      const recommendations = await aiAPI.getRecommendations({
        userId,
        userPreferences,
        recentRatings,
        location,
        limit: 10,
      });

      // Fetch full restaurant details for recommended IDs
      const restaurants: Restaurant[] = await Promise.all(
        recommendations.recommendations.map(async (rec) => {
          try {
            return await googlePlacesAPI.getPlaceDetails(rec.restaurantId);
          } catch {
            // Fallback to basic restaurant data
            return {
              id: rec.restaurantId,
              name: 'Recommended Restaurant',
              description: rec.reasoning,
              cuisine: 'restaurant',
              priceRange: 'moderate' as const,
              rating: 0,
              reviewCount: 0,
              address: '',
              city: '',
              state: '',
              zipCode: '',
              phone: '',
              hours: {},
              images: [],
              tags: rec.matchFactors,
              coordinates: location,
              isOpen: false,
              deliveryAvailable: false,
              takeoutAvailable: false,
              dineInAvailable: true,
              features: [],
              dietaryOptions: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        })
      );

      return restaurants;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      throw error;
    }
  },

  async searchRestaurants(
    query: string,
    location?: { latitude: number; longitude: number },
    radius: number = 50000
  ): Promise<Restaurant[]> {
    try {
      console.log('Searching restaurants with:', { query, location, radius });
      
      const cacheKey = `search_${query}_${location ? `${location.latitude},${location.longitude}` : 'global'}_${radius}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('Returning cached results:', cached.length);
        return cached;
      }

      const params: any = {
        query,
        type: 'restaurant',
        radius,
      };

      if (location) {
        params.location = `${location.latitude},${location.longitude}`;
      }

      console.log('Making search API call with params:', params);
      const response = await axios.get('http://localhost:3001/api/places/search', { params });
      
      console.log('Search API response:', response.data);
      
      if (response.data.status === 'OK' && response.data.results) {
        console.log('Found', response.data.results.length, 'restaurants');
        
        // Get detailed information for each restaurant to get photos
        const restaurants = await Promise.all(
          response.data.results.map(async (place: any) => {
            try {
              console.log(`Getting details for: ${place.name} (${place.place_id})`);
              
              // Make a separate details call to get photos
              const detailsResponse = await axios.get(
                'https://maps.googleapis.com/maps/api/place/details/json',
                {
                  params: {
                    place_id: place.place_id,
                    fields: 'photos,formatted_phone_number,website,opening_hours',
                    key: API_CONFIG.GOOGLE_PLACES_API_KEY,
                  },
                  timeout: 15000,
                }
              );

              console.log(`Details response for ${place.name}:`, detailsResponse.data.status);
              
              if (detailsResponse.data.status !== 'OK') {
                console.error(`Details API error for ${place.name}:`, detailsResponse.data.status);
                throw new Error(`Details API error: ${detailsResponse.data.status}`);
              }

              const details = detailsResponse.data.result;
              console.log(`Details for ${place.name}:`, details?.photos ? `${details.photos.length} photos found` : 'No photos');
              
              // Check if we have photos and they're valid
              let images = [
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
                'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
                'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800'
              ];
              
              if (details?.photos && details.photos.length > 0) {
                console.log(`Processing ${details.photos.length} photos for ${place.name}`);
                images = details.photos.slice(0, 3).map((photo: any) => {
                  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${API_CONFIG.GOOGLE_PLACES_API_KEY}`;
                  console.log(`Generated photo URL for ${place.name}:`, photoUrl);
                  return photoUrl;
                });
              } else {
                console.log(`No photos found for ${place.name}, using fallback images`);
              }
              
              return {
                id: place.place_id,
                name: place.name,
                description: place.formatted_address,
                cuisine: this.extractCuisineFromTypes(place.types),
                priceRange: convertPriceLevelToRange(place.price_level),
                rating: place.rating || 0,
                reviewCount: place.user_ratings_total || 0,
                address: place.formatted_address,
                city: this.extractCityFromAddress(place.formatted_address),
                state: this.extractStateFromAddress(place.formatted_address),
                zipCode: this.extractZipFromAddress(place.formatted_address),
                phone: details?.formatted_phone_number || '',
                website: details?.website || '',
                hours: details?.opening_hours || {},
                images: images,
                tags: place.types?.slice(0, 5) || [],
                coordinates: {
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                },
                distance: 0, // Will be calculated if location is provided
                isOpen: details?.opening_hours?.open_now || false,
                deliveryAvailable: false,
                takeoutAvailable: false,
                dineInAvailable: true,
                features: [],
                dietaryOptions: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            } catch (error) {
              console.error('Error getting details for place:', place.place_id, error);
              // Return basic restaurant data if details call fails
              return {
                id: place.place_id,
                name: place.name,
                description: place.formatted_address,
                cuisine: this.extractCuisineFromTypes(place.types),
                priceRange: convertPriceLevelToRange(place.price_level),
                rating: place.rating || 0,
                reviewCount: place.user_ratings_total || 0,
                address: place.formatted_address,
                city: this.extractCityFromAddress(place.formatted_address),
                state: this.extractStateFromAddress(place.formatted_address),
                zipCode: this.extractZipFromAddress(place.formatted_address),
                phone: '',
                website: '',
                hours: {},
                images: [
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
                  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
                  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800'
                ],
                tags: place.types?.slice(0, 5) || [],
                coordinates: {
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                },
                distance: 0,
                isOpen: false,
                deliveryAvailable: false,
                takeoutAvailable: false,
                dineInAvailable: true,
                features: [],
                dietaryOptions: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }
          })
        );

        // Calculate distances if location is provided
        if (location) {
          restaurants.forEach((restaurant: Restaurant) => {
            restaurant.distance = this.calculateDistance(
              location.latitude,
              location.longitude,
              restaurant.coordinates.latitude,
              restaurant.coordinates.longitude
            );
          });
        }

        setCachedData(cacheKey, restaurants);
        console.log('Returning', restaurants.length, 'processed restaurants');
        return restaurants;
      }
      
      console.log('No results found or API error');
      return [];
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  },

  extractCuisineFromTypes(types: string[]): string {
    const cuisineTypes = [
      'restaurant', 'food', 'meal_takeaway', 'meal_delivery',
      'american_restaurant', 'italian_restaurant', 'chinese_restaurant',
      'japanese_restaurant', 'mexican_restaurant', 'indian_restaurant',
      'thai_restaurant', 'vietnamese_restaurant', 'korean_restaurant',
      'french_restaurant', 'greek_restaurant', 'mediterranean_restaurant',
      'pizza_restaurant', 'burger_restaurant', 'seafood_restaurant',
      'steakhouse', 'barbecue_restaurant', 'sushi_restaurant'
    ];

    for (const type of types) {
      if (cuisineTypes.includes(type)) {
        return type.replace('_restaurant', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    return 'Restaurant';
  },

  extractCityFromAddress(address: string): string {
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[1]?.trim() || '';
    }
    return '';
  },

  extractStateFromAddress(address: string): string {
    const parts = address.split(',');
    if (parts.length >= 3) {
      const statePart = parts[2]?.trim();
      return statePart?.split(' ')[0] || '';
    }
    return '';
  },

  extractZipFromAddress(address: string): string {
    const parts = address.split(',');
    if (parts.length >= 3) {
      const statePart = parts[2]?.trim();
      const zipMatch = statePart?.match(/\d{5}/);
      return zipMatch ? zipMatch[0] : '';
    }
    return '';
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Implement the Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },
}; 