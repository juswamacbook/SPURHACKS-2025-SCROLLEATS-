import React from 'react';
import { motion } from 'framer-motion';
import { Home, Plus, Search, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-orange-300/90 backdrop-blur-lg border-t border-orange-400 mobile-safe-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-white' : 'text-orange-200'
                  }`}
                />
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-orange-200'
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNavigation; 