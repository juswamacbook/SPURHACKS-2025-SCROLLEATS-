const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Google Places API proxy
app.get('/api/places/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, type = 'restaurant', pagetoken } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Missing latitude or longitude' });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    
    const params = {
      location: `${latitude},${longitude}`,
      radius: Math.min(radius, 50000),
      type,
      key: apiKey,
      opennow: true,
    };

    // Add pagination token if provided
    if (pagetoken) {
      params.pagetoken = pagetoken;
    }

    console.log('Proxying request to Google Places API:', { latitude, longitude, radius, pagetoken: !!pagetoken });
    
    const response = await axios.get(url, { params, timeout: 15000 });
    
    console.log('Google API response status:', response.data.status);
    console.log('Results count:', response.data.results?.length || 0);
    console.log('Has next page token:', !!response.data.next_page_token);
    
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch places',
      details: error.message 
    });
  }
});

// Google Places Reviews proxy
app.get('/api/places/reviews/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    const params = {
      place_id: placeId,
      fields: 'reviews',
      key: apiKey,
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error('Reviews proxy error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch reviews',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Geocoding endpoint to convert address or place_id to coordinates
app.get('/api/geocode', async (req, res) => {
  const { address, placeId } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!address && !placeId) {
    return res.status(400).json({ error: 'Address or placeId parameter is required' });
  }

  const params = { key: apiKey };
  if (placeId) {
    params.place_id = placeId;
    console.log(`Geocoding request for placeId: "${placeId}"`);
  } else {
    params.address = address;
    console.log(`Geocoding request for address: "${address}"`);
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', { params });

    console.log(`Geocoding response status: ${response.data.status}`);
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`Geocoding successful:`, location);
      res.json(location); // { lat, lng }
    } else {
      console.log(`Geocoding failed for "${address || placeId}": ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`Error message: ${response.data.error_message}`);
      }
      res.status(404).json({ 
        error: 'Location not found. Please try a different search term.', 
        details: response.data.status,
        error_message: response.data.error_message 
      });
    }
  } catch (error) {
    console.error('Geocoding API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch geocoding data' });
  }
});

// Places Autocomplete endpoint
app.get('/api/places/autocomplete', async (req, res) => {
  const { input } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!input) {
    return res.status(400).json({ error: 'Input parameter is required' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input,
        key: apiKey,
        types: '(cities)', // Restrict to cities
      },
    });
    res.json(response.data.predictions);
  } catch (error) {
    console.error('Autocomplete API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch autocomplete suggestions' });
  }
});

// Text Search endpoint for restaurants
app.get('/api/places/search', async (req, res) => {
  try {
    const { query, location, radius = 50000, type = 'restaurant' } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    const params = {
      query: `${query} ${type}`,
      key: apiKey,
      type,
    };

    // Add location bias if provided
    if (location) {
      params.location = location;
      params.radius = Math.min(radius, 50000);
    }

    console.log('Text search request:', { query, location, radius, type });
    
    const response = await axios.get(url, { params, timeout: 15000 });
    
    console.log('Text search response status:', response.data.status);
    console.log('Results count:', response.data.results?.length || 0);
    
    res.json(response.data);
  } catch (error) {
    console.error('Text search error:', error.message);
    res.status(500).json({ 
      error: 'Failed to search places',
      details: error.message 
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET /api/places/nearby?latitude=X&longitude=Y&radius=Z`);
  console.log(`   GET /api/places/reviews/:placeId`);
  console.log(`   GET /api/health`);
  console.log(`   GET /api/geocode?address=X`);
  console.log(`   GET /api/places/autocomplete?input=X`);
  console.log(`   GET /api/places/search?query=X&location=Y&radius=Z&type=restaurant`);
}); 
