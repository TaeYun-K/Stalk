import React from 'react';
import { TabItem } from '@/types';

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (_tabId: string) => void;
  className?: string;
  variant?: 'sidebar' | 'horizontal';
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  variant = 'sidebar'
}) => {
  if (variant === 'horizontal') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <nav className={`space-y-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
            activeTab === tab.id
              ? 'bg-blue-50 text-blue-600 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default TabNavigation; 