# ScrollEats 🍕

A TikTok-style mobile-first React web app for food lovers, featuring full-screen restaurant discovery with a custom "Boom Meter" rating system.

## ✨ Latest Updates

### 🚀 New Features
- **Real Google Places API Integration**: Now fetches actual restaurant data from Google Places API
- **Improved Scrolling**: Fixed skipping issues with smooth, responsive snap scrolling
- **Enhanced Boom Meter**: New hold-and-slide interface for intuitive rating
- **More Restaurants**: Pagination support to load up to 100 restaurants in your area
- **Better UI/UX**: Improved design with better touch interactions and visual feedback

### 🎯 Key Improvements
- **API Reliability**: Uses CORS proxy to bypass browser restrictions
- **Smooth Navigation**: One restaurant per screen with proper snap scrolling
- **Intuitive Rating**: Hold and slide the Boom Meter for precise 1-10 ratings
- **Rich Restaurant Info**: Full details including photos, reviews, contact info
- **Mobile Optimized**: Touch-friendly interface with haptic feedback

## 🎮 How to Use

1. **Location Access**: Allow location access when prompted
2. **Scroll Through Restaurants**: Swipe up/down or use arrow keys to navigate
3. **Rate with Boom Meter**: Hold and slide the circular meter to rate 1-10
4. **View Reviews**: Tap the message icon to see Google reviews
5. **Favorite Places**: Heart icon to save restaurants
6. **Navigation**: Use bottom tabs for different features

## 🛠️ Technical Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Framer Motion
- **APIs**: Google Places API (restaurants & reviews)
- **Mobile**: Capacitor (for future iOS/Android deployment)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd scrollEats
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   REACT_APP_GOOGLE_PLACES_API_KEY=your_google_places_api_key
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3000`
   - Allow location access
   - Start exploring restaurants!

## 📱 Features

### 🏪 Restaurant Discovery
- Real-time restaurant data from Google Places API
- Full-screen restaurant cards with beautiful imagery
- Detailed information: ratings, prices, distance, contact info
- Multiple photos per restaurant with navigation

### ⭐ Boom Meter Rating System
- Unique 1-10 rating scale with visual feedback
- Hold-and-slide interface for precise ratings
- Color-coded feedback (red to purple)
- Haptic feedback on mobile devices

### 🔍 Smart Navigation
- Snap scrolling (one restaurant per screen)
- Smooth animations and transitions
- Keyboard navigation support
- Touch-friendly interface

### 💬 Reviews & Social
- Google Places reviews integration
- User rating history
- Favorite restaurants
- Social sharing capabilities

### 🎨 Modern UI/UX
- Mobile-first design
- Glass morphism effects
- Smooth animations
- Accessibility features
- Dark theme optimized

## 🔧 Configuration

### API Keys
- **Google Places API**: Required for restaurant data and reviews
- **Yelp API**: Optional fallback (configure in `.env`)
- **Firebase**: Optional for user data (configure in `.env`)

### Customization
- Search radius (default: 10km)
- Price range filters
- Cuisine preferences
- Dietary restrictions

## 📱 Mobile Deployment

The app is designed for mobile deployment using Capacitor:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init

# Add platforms
npx cap add ios
npx cap add android

# Build and sync
npm run build
npx cap sync
```

## 🎯 Future Features

- [ ] AI-powered restaurant recommendations
- [ ] Social features (follow friends, share ratings)
- [ ] Advanced filtering and search
- [ ] Restaurant reservations integration
- [ ] Push notifications for new restaurants
- [ ] Offline mode support
- [ ] AR restaurant previews

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Places API for restaurant data
- Unsplash for fallback images
- Framer Motion for animations
- Tailwind CSS for styling

---

**Happy eating! 🍽️** 