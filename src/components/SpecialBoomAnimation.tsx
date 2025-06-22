import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Zap, Star } from 'lucide-react';

interface SpecialBoomAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const SpecialBoomAnimation: React.FC<SpecialBoomAnimationProps> = ({
  isVisible,
  onComplete,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
        >
          {/* Main Animation Container */}
          <motion.div
            className="relative text-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: [0, 1.2, 1, 1.1, 1],
              rotate: [-180, 0, 10, -10, 0]
            }}
            transition={{ 
              duration: 1.5,
              ease: "easeOut"
            }}
            onAnimationComplete={() => {
              setTimeout(onComplete, 2000);
            }}
          >
            {/* Background Glow */}
            <motion.div
              className="absolute inset-0 -m-20 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 rounded-full blur-3xl opacity-50"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Main Content */}
            <div className="relative bg-gradient-to-br from-orange-500 via-red-600 to-yellow-500 rounded-3xl p-8 shadow-2xl border-4 border-white/20">
              {/* Icons Animation */}
              <div className="flex justify-center space-x-4 mb-6">
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Bomb className="w-16 h-16 text-white" />
                </motion.div>
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, -360]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2
                  }}
                >
                  <Zap className="w-16 h-16 text-white" />
                </motion.div>
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4
                  }}
                >
                  <Star className="w-16 h-16 text-white fill-current" />
                </motion.div>
              </div>

              {/* Text Animation */}
              <motion.h1
                className="text-6xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                SPECIAL BOOM!
              </motion.h1>

              <motion.div
                className="text-2xl font-semibold text-white/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>💣</span>
                  <span>BOOM!</span>
                  <span>💥</span>
                </div>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                className="text-lg text-white/80 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                Maximum rating achieved! 🎉
              </motion.p>
            </div>

            {/* Floating Particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 bg-yellow-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, -200],
                  x: [0, Math.random() * 100 - 50],
                  opacity: [1, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>

          {/* Click to dismiss hint */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            Click anywhere to dismiss
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpecialBoomAnimation; 