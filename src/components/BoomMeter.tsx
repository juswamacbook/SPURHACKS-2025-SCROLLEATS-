import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Zap, Star, Flame, Clock } from 'lucide-react';

interface BoomMeterProps {
  score: number;
  onScoreChange: (score: number) => void;
  onSpecialBoom: () => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  specialBoomUsed?: boolean;
  canUseSpecialBoom?: boolean;
}

const BoomMeter: React.FC<BoomMeterProps> = ({
  score,
  onScoreChange,
  onSpecialBoom,
  size = 'medium',
  disabled = false,
  specialBoomUsed = false,
  canUseSpecialBoom = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localScore, setLocalScore] = useState(score);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isRatingSet, setIsRatingSet] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const getScoreColor = (score: number) => {
    if (score === 0) return 'text-gray-400';
    if (score <= 1) return 'text-boom-low';
    if (score <= 2) return 'text-boom-medium';
    if (score <= 3) return 'text-orange-500';
    if (score <= 4) return 'text-red-500';
    return 'text-boom-max';
  };

  const getScoreIcon = (score: number) => {
    if (score === 0) return <Star className="w-6 h-6" />;
    if (score <= 1) return <Flame className="w-6 h-6" />;
    if (score <= 2) return <Star className="w-6 h-6" />;
    if (score <= 3) return <Flame className="w-6 h-6" />;
    if (score <= 4) return <Zap className="w-6 h-6" />;
    return <Bomb className="w-6 h-6" />;
  };

  const getScoreText = (score: number) => {
    if (score === 0) return 'No Rating';
    if (score === 1) return 'Meh';
    if (score === 2) return 'OK';
    if (score === 3) return 'Good';
    if (score === 4) return 'Great';
    return 'BOOM!';
  };

  const getScoreEmoji = (score: number) => {
    if (score === 0) return '🤷';
    if (score === 1) return '😐';
    if (score === 2) return '🙂';
    if (score === 3) return '😊';
    if (score === 4) return '🤩';
    return '💣';
  };

  const handleScoreChange = useCallback((newScore: number) => {
    const clampedScore = Math.max(0, Math.min(5, newScore));
    setLocalScore(clampedScore);
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }, []);

  const handleScoreCommit = useCallback((finalScore: number) => {
    const clampedScore = Math.max(0, Math.min(5, finalScore));
    onScoreChange(clampedScore);
    setIsRatingSet(true);
    
    // Enhanced haptic feedback for rating commit
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  }, [onScoreChange]);

  const calculateScoreFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return 0;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    const newScore = Math.round(percentage * 5);
    
    return newScore;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    setShowTooltip(true);
    setIsRatingSet(false);
    
    const newScore = calculateScoreFromPosition(e.clientX);
    handleScoreChange(newScore);
  }, [disabled, calculateScoreFromPosition, handleScoreChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const newScore = calculateScoreFromPosition(e.clientX);
    handleScoreChange(newScore);
  }, [calculateScoreFromPosition, handleScoreChange]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      handleScoreCommit(localScore);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    setShowTooltip(false);
  }, [localScore, handleScoreCommit]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    setShowTooltip(true);
    setIsRatingSet(false);
    
    const touch = e.touches[0];
    const newScore = calculateScoreFromPosition(touch.clientX);
    handleScoreChange(newScore);
  }, [disabled, calculateScoreFromPosition, handleScoreChange]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const newScore = calculateScoreFromPosition(touch.clientX);
    handleScoreChange(newScore);
  }, [calculateScoreFromPosition, handleScoreChange]);

  const handleTouchEnd = useCallback(() => {
    if (isDraggingRef.current) {
      handleScoreCommit(localScore);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    setShowTooltip(false);
  }, [localScore, handleScoreCommit]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled || isDragging) return;
    
    const newScore = calculateScoreFromPosition(e.clientX);
    handleScoreCommit(newScore);
  }, [disabled, isDragging, calculateScoreFromPosition, handleScoreCommit]);

  const handleSpecialBoom = useCallback(() => {
    if (!canUseSpecialBoom || specialBoomUsed || !onSpecialBoom) return;
    
    onSpecialBoom();
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [canUseSpecialBoom, specialBoomUsed, onSpecialBoom]);

  // Update local score when prop changes
  useEffect(() => {
    setLocalScore(score);
    setIsRatingSet(true);
  }, [score]);

  // Add global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Calculate the position percentage with bounds checking
  const getCirclePosition = () => {
    const percentage = localScore / 5;
    // Ensure the circle stays within bounds (accounting for circle width)
    const minPosition = 0.04; // 4% from left edge
    const maxPosition = 0.96; // 96% from right edge
    return Math.max(minPosition, Math.min(maxPosition, percentage));
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Score Display */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={localScore}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`text-4xl font-bold ${getScoreColor(localScore)}`}
          >
            {getScoreEmoji(localScore)}
          </motion.div>
        </AnimatePresence>
        <motion.div
          key={`text-${localScore}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-lg font-semibold ${getScoreColor(localScore)}`}
        >
          {getScoreText(localScore)}
        </motion.div>
        <div className="text-sm text-gray-600 font-mono">
          {localScore}/5 booms
        </div>
        {isRatingSet && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xs text-green-600 font-semibold mt-1"
          >
            ✓ Rating set!
          </motion.div>
        )}
      </div>

      {/* Enhanced Draggable Bar - No Circle */}
      <div className="relative w-full max-w-xs">
        <motion.div
          ref={sliderRef}
          className={`relative h-10 bg-gradient-to-r from-gray-200 via-orange-200 to-red-500 rounded-full cursor-pointer select-none border-2 border-gray-300 shadow-lg ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={!disabled ? { scale: 1.02, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          animate={isDragging ? { 
            scale: 1.05, 
            boxShadow: '0 15px 35px rgba(0,0,0,0.2)' 
          } : {}}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleClick}
        >
          {/* Enhanced Boom markers - Adjusted spacing */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            {[0, 1, 2, 3, 4, 5].map((mark) => (
              <motion.div
                key={mark}
                className={`w-1.5 h-4 rounded-full transition-all duration-200 ${
                  mark <= localScore 
                    ? 'bg-white shadow-sm' 
                    : 'bg-gray-300'
                }`}
                animate={mark <= localScore ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.9]
                } : {}}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Progress fill effect - Bounded, hidden for 0 booms */}
          {localScore > 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-red-500/30 rounded-full"
              style={{
                width: `${getCirclePosition() * 100}%`,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          )}

          {/* Glow effect when dragging */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/20 to-red-500/20 blur-sm"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap z-10 shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <span>Drag to rate • Release to set</span>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Special Boom Button */}
      <div className="flex flex-col items-center space-y-2">
        <motion.button
          onClick={handleSpecialBoom}
          disabled={!canUseSpecialBoom || specialBoomUsed}
          className={`relative p-4 rounded-full text-white font-bold text-lg transition-all ${
            canUseSpecialBoom && !specialBoomUsed
              ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          whileHover={canUseSpecialBoom && !specialBoomUsed ? { scale: 1.05 } : {}}
          whileTap={canUseSpecialBoom && !specialBoomUsed ? { scale: 0.95 } : {}}
          animate={specialBoomUsed ? { scale: 0.9 } : {}}
        >
          <div className="flex items-center space-x-2">
            <Bomb className="w-6 h-6" />
            <span>SPECIAL BOOM!</span>
          </div>
          
          {/* Used indicator */}
          {specialBoomUsed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs">✓</span>
            </motion.div>
          )}
        </motion.button>
        
        <div className="text-center">
          <p className="text-xs text-gray-600">
            {specialBoomUsed 
              ? 'Special boom used! 🎉' 
              : canUseSpecialBoom 
                ? 'Demo mode - unlimited use!' 
                : 'Available in 24 hours'
            }
          </p>
          {!canUseSpecialBoom && !specialBoomUsed && (
            <div className="flex items-center justify-center space-x-1 mt-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">Cooldown active</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-gray-500">
        <p>Drag the bar to rate from 0-5 booms</p>
        <p>0 = No rating, 5 = BOOM!</p>
      </div>
    </div>
  );
};

export default BoomMeter; 