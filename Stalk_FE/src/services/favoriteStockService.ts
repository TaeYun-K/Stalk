import AuthService from './authService';

export interface FavoriteStockItem {
  ticker: string;
  name: string;
  price: string;
  change: string;
  changeRate: string;
}

export default class FavoriteStockService {
  static async list(): Promise<FavoriteStockItem[]> {
    const res = await AuthService.authenticatedRequest('/api/favorites', { method: 'GET' });
    if (!res.ok) {
      throw new Error('관심 종목 조회 실패');
    }
    return res.json();
  }

  static async add(ticker: string): Promise<void> {
    const res = await AuthService.authenticatedRequest('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    });
    if (!res.ok) {
      throw new Error('관심 종목 추가 실패');
    }
  }

  static async remove(ticker: string): Promise<void> {
    const res = await AuthService.authenticatedRequest(`/api/favorites/${ticker}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('관심 종목 삭제 실패');
    }
  }
}


