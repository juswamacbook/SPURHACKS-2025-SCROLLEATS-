import React, { useRef, useCallback, useEffect } from 'react';
import { TouchGestureProps } from '../types';

const TouchGesture: React.FC<TouchGestureProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  onLongPress,
  children,
  threshold = 50,
  velocity = 0.3,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, 500);
    }
  }, [onLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Cancel long press if user moves finger
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocityX = Math.abs(deltaX) / deltaTime;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Check if it's a swipe
    if (Math.abs(deltaX) > threshold && velocityX > velocity) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && !isLongPressRef.current && onTap) {
      // It's a tap
      onTap();
    }

    // Reset state
    touchStartRef.current = null;
    isLongPressRef.current = false;
  }, [threshold, velocity, onSwipeLeft, onSwipeRight, onTap]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };

    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, 500);
    }
  }, [onLongPress]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocityX = Math.abs(deltaX) / deltaTime;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (Math.abs(deltaX) > threshold && velocityX > velocity) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && !isLongPressRef.current && onTap) {
      onTap();
    }

    touchStartRef.current = null;
    isLongPressRef.current = false;
  }, [threshold, velocity, onSwipeLeft, onSwipeRight, onTap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className="touch-manipulation select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        touchStartRef.current = null;
        isLongPressRef.current = false;
      }}
    >
      {children}
    </div>
  );
};

export default TouchGesture; 