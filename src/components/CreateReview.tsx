import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, MapPin, X } from 'lucide-react';
import BoomMeter from './BoomMeter';
import { useScrollEatsStore } from '../store';

interface CreateReviewProps {
  onClose: () => void;
}

const CreateReview: React.FC<CreateReviewProps> = ({ onClose }) => {
  const { canUseSpecialBoom } = useScrollEatsStore();
  const [boomScore, setBoomScore] = useState(0);
  const [review, setReview] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLocation, setRestaurantLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [specialBoomUsed, setSpecialBoomUsed] = useState(false);

  const handlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  }, []);

  const handleSpecialBoom = useCallback(() => {
    setBoomScore(5);
    setSpecialBoomUsed(true);
    
    // Update the store to track special boom usage
    useScrollEatsStore.getState().lastSpecialBoomUsed = new Date();
  }, []);

  const handleSubmit = useCallback(() => {
    // Here you would submit the review to your backend
    console.log('Submitting review:', {
      restaurantName,
      restaurantLocation,
      boomScore,
      review,
      photos: photos.length,
      specialBoom: specialBoomUsed,
    });
    
    // Close the modal
    onClose();
  }, [restaurantName, restaurantLocation, boomScore, review, photos, specialBoomUsed, onClose]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Review</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Restaurant Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Enter restaurant name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={restaurantLocation}
                  onChange={(e) => setRestaurantLocation(e.target.value)}
                  placeholder="Enter location"
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Boom Meter */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rate Your Experience
            </label>
            <BoomMeter
              score={boomScore}
              onScoreChange={setBoomScore}
              onSpecialBoom={handleSpecialBoom}
              size="large"
              specialBoomUsed={specialBoomUsed}
              canUseSpecialBoom={canUseSpecialBoom()}
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Photos
            </label>
            
            {/* Photo Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Buttons */}
            <div className="flex space-x-2">
              <label className="flex-1 flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors cursor-pointer">
                <Camera className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              
              <label className="flex-1 flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors cursor-pointer">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            onClick={handleSubmit}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!restaurantName.trim()}
          >
            Post Review
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateReview; 