import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WatchlistItem } from '@/types';

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (code: string) => void;
  isInWatchlist: (code: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

interface WatchlistProviderProps {
  children: ReactNode;
}

export const WatchlistProvider: React.FC<WatchlistProviderProps> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  const addToWatchlist = (item: WatchlistItem) => {
    setWatchlist(prev => {
      // 이미 존재하는지 확인
      const exists = prev.some(watchItem => watchItem.code === item.code);
      if (exists) {
        return prev; // 이미 존재하면 추가하지 않음
      }
      return [...prev, item]; // 새로운 아이템을 배열 끝에 추가
    });
  };

  const removeFromWatchlist = (code: string) => {
    setWatchlist(prev => prev.filter(item => item.code !== code));
  };

  const isInWatchlist = (code: string) => {
    return watchlist.some(item => item.code === code);
  };

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist
    }}>
      {children}
    </WatchlistContext.Provider>
  );
}; 