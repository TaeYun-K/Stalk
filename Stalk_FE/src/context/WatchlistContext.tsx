import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WatchlistItem } from '@/types';
import FavoriteStockService from '@/services/favoriteStockService';
import AuthService from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (code: string) => void;
  isInWatchlist: (code: string) => boolean;
  reloadWatchlist: () => Promise<void>;
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
  const { isLoggedIn } = useAuth();

  // 서버에서 관심 종목 로드 함수 (초기/수동 새로고침 공용)
  const reloadWatchlist = async (): Promise<void> => {
    if (!AuthService.isLoggedIn()) return;
    try {
      const favorites = await FavoriteStockService.list();
      const mapped: WatchlistItem[] = favorites.map((f) => ({
        code: f.ticker,
        name: f.name,
        price: Number((f.price as any)?.toString().replace(/[^0-9.-]/g, '')) || 0,
        change: Number((f.changeRate as any)?.toString().replace('%', '')) || 0,
      }));
      setWatchlist(mapped);
    } catch (e) {
      console.error('관심 종목 로드 실패:', e);
    }
  };

  // 초기 로드: 로그인 완료 후에만 실행
  useEffect(() => {
    if (isLoggedIn) {
      void reloadWatchlist();
    } else {
      setWatchlist([]);
    }
  }, [isLoggedIn]);

  const addToWatchlist = (item: WatchlistItem) => {
    setWatchlist(prev => {
      const exists = prev.some(watchItem => watchItem.code === item.code);
      if (exists) return prev;
      return [...prev, item];
    });
    // 서버 반영 (비동기, 실패 시 롤백은 생략)
    void FavoriteStockService.add(item.code).catch((e) => {
      console.error('관심 종목 추가 실패:', e);
    });
  };

  const removeFromWatchlist = (code: string) => {
    setWatchlist(prev => prev.filter(item => item.code !== code));
    // 서버 반영 (비동기)
    void FavoriteStockService.remove(code).catch((e) => {
      console.error('관심 종목 삭제 실패:', e);
    });
  };

  const isInWatchlist = (code: string) => {
    return watchlist.some(item => item.code === code);
  };

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      reloadWatchlist,
    }}>
      {children}
    </WatchlistContext.Provider>
  );
}; 