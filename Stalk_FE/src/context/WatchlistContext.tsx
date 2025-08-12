import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { WatchlistItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import FavoriteStockService from "@/services/favoriteStockService";

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (code: string) => void;
  isInWatchlist: (code: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(
  undefined
);

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
};

interface WatchlistProviderProps {
  children: ReactNode;
}

export const WatchlistProvider: React.FC<WatchlistProviderProps> = ({
  children,
}) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const { isLoggedIn, userInfo } = useAuth();

  const parseNumber = (value?: string | number | null): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    const normalized = value.replace(/[,\s%]/g, "");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  };

  // Load or clear watchlist on auth changes
  useEffect(() => {
    const loadFavorites = async () => {
      if (!isLoggedIn) {
        setWatchlist([]);
        return;
      }
      try {
        const resp = await FavoriteStockService.getFavoriteStocks();
        // resp could be array or wrapped; handle both
        const list = Array.isArray(resp?.result ?? resp)
          ? resp.result ?? resp
          : [];

        const mapped: WatchlistItem[] = list.map((it: any) => ({
          code: it.ticker,
          name: it.name,
          price: parseNumber(it.price),
          changeAmount: parseNumber(it.change),
          changeRate: parseNumber(it.changeRate),
        }));

        setWatchlist(mapped);
      } catch (e) {
        console.error("관심종목 불러오기 실패:", e);
        setWatchlist([]);
      }
    };

    loadFavorites();
  }, [isLoggedIn, userInfo?.userId]);

  const addToWatchlist = (item: WatchlistItem) => {
    setWatchlist((prev) => {
      // 이미 존재하는지 확인
      const exists = prev.some((watchItem) => watchItem.code === item.code);
      if (exists) {
        return prev; // 이미 존재하면 추가하지 않음
      }
      return [...prev, item]; // 새로운 아이템을 배열 끝에 추가
    });
  };

  const removeFromWatchlist = (code: string) => {
    setWatchlist((prev) => prev.filter((item) => item.code !== code));
  };

  const isInWatchlist = (code: string) => {
    return watchlist.some((item) => item.code === code);
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};
