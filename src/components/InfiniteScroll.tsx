import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfiniteScrollProps<T> {
  items: T[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

function InfiniteScroll<T>({
  items,
  hasMore,
  isLoading,
  onLoadMore,
  renderItem,
  currentIndex: externalCurrentIndex,
  onIndexChange,
}: InfiniteScrollProps<T>) {
  const [internalCurrentIndex, setInternalCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollTime = useRef<number>(0);

  // Use external currentIndex if provided, otherwise use internal state
  const currentIndex = externalCurrentIndex !== undefined ? externalCurrentIndex : internalCurrentIndex;

  // Auto-load more when approaching the end - DISABLED since we load all at once
  // useEffect(() => {
  //   if (currentIndex >= items.length - 3 && hasMore && !isLoading && items.length > 0) {
  //     console.log(`Auto-loading more restaurants. Current: ${currentIndex}, Total: ${items.length}`);
  //     onLoadMore();
  //   }
  // }, [currentIndex, items.length, hasMore, isLoading, onLoadMore]);

  const scrollToIndex = useCallback((index: number) => {
    if (index < 0 || index >= items.length) return;
    
    const now = Date.now();
    if (now - lastScrollTime.current < 150) return; // Reduced from 300ms to 150ms for faster response
    lastScrollTime.current = now;
    
    setIsScrolling(true);
    
    // Update the appropriate index state
    if (onIndexChange) {
      onIndexChange(index);
    } else {
      setInternalCurrentIndex(index);
    }
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 200); // Reduced from 400ms to 200ms for faster transitions
  }, [items.length, onIndexChange]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (isScrolling) return;
    
    const threshold = 30; // Reduced threshold for more responsive scrolling
    if (Math.abs(e.deltaY) < threshold) return;
    
    if (e.deltaY > 0) {
      // Scroll down - next restaurant
      scrollToIndex(currentIndex + 1);
    } else {
      // Scroll up - previous restaurant
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex, isScrolling]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    const startTime = Date.now();
    
    const handleTouchMove = (e: Event) => {
      e.preventDefault();
    };
    
    const handleTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;
      const touch = touchEvent.changedTouches[0];
      const endY = touch.clientY;
      const endTime = Date.now();
      const deltaY = startY - endY;
      const deltaTime = endTime - startTime;
      const threshold = 30; // Reduced threshold for more responsive swiping
      const timeThreshold = 800; // Increased time threshold for better user experience
      
      if (Math.abs(deltaY) > threshold && deltaTime < timeThreshold && !isScrolling) {
        if (deltaY > 0) {
          // Swipe up - next restaurant
          scrollToIndex(currentIndex + 1);
        } else {
          // Swipe down - previous restaurant
          scrollToIndex(currentIndex - 1);
        }
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [currentIndex, scrollToIndex, isScrolling]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isScrolling) return;
    
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      scrollToIndex(currentIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex, isScrolling]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleTouchStart, handleKeyDown]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-white text-lg">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full relative overflow-hidden"
      style={{ touchAction: 'none' }}
      tabIndex={0}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="h-full w-full absolute inset-0"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {renderItem(items[currentIndex], currentIndex)}
        </motion.div>
      </AnimatePresence>

      {/* Navigation indicators */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="flex flex-col space-y-2 max-h-64 overflow-y-auto">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span className="text-white text-sm">Loading more...</span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll hints */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="text-white/50 text-xs">
          <div className="mb-2">↑ Swipe up</div>
          <div>↓ Swipe down</div>
        </div>
      </div>
    </div>
  );
}

export default InfiniteScroll; 