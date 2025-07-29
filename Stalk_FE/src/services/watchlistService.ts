import { WatchlistItem } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class WatchlistService {
  // 사용자의 관심종목 목록 조회
  static async getUserWatchlist(_userId: string): Promise<WatchlistItem[]> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData: WatchlistItem[] = [
          { code: '005930', name: '삼성전자', price: 71000, change: 1.5 },
          { code: '000660', name: 'SK하이닉스', price: 89000, change: -0.8 },
          { code: '035420', name: 'NAVER', price: 195000, change: 2.3 },
          { code: '005490', name: 'POSCO홀딩스', price: 415000, change: -1.2 }
        ];
        resolve(mockData);
      }, 1000);
    });
  }

  // 관심종목 추가
  static async addToWatchlist(_userId: string, item: WatchlistItem): Promise<{ success: boolean; message: string }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `${item.name}이(가) 관심종목에 추가되었습니다.`
        });
      }, 500);
    });
  }

  // 관심종목 제거
  static async removeFromWatchlist(_userId: string, _code: string): Promise<{ success: boolean; message: string }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '관심종목에서 제거되었습니다.'
        });
      }, 500);
    });
  }

  // 종목 검색
  static async searchStocks(query: string): Promise<WatchlistItem[]> {
    // TODO: 실제 종목 검색 API 호출
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResults: WatchlistItem[] = [
          { code: '005930', name: '삼성전자', price: 71000, change: 1.5 },
          { code: '000660', name: 'SK하이닉스', price: 89000, change: -0.8 },
          { code: '035420', name: 'NAVER', price: 195000, change: 2.3 }
        ].filter(item => 
          item.name.includes(query) || 
          item.code.includes(query)
        );
        resolve(mockResults);
      }, 800);
    });
  }

  // 종목 상세 정보 조회
  static async getStockDetail(code: string): Promise<{
    code: string;
    name: string;
    price: number;
    change: number;
    volume: number;
    marketCap: string;
    per: number;
    pbr: number;
    description: string;
  }> {
    // TODO: 실제 종목 상세 정보 API 호출
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code,
          name: '삼성전자',
          price: 71000,
          change: 1.5,
          volume: 12345678,
          marketCap: '423조원',
          per: 15.2,
          pbr: 1.1,
          description: '대한민국의 대표 기업으로 반도체, 스마트폰 등을 제조하는 글로벌 기술기업입니다.'
        });
      }, 1000);
    });
  }

  // 실시간 주가 정보 업데이트
  static async updateStockPrices(codes: string[]): Promise<{ [code: string]: { price: number; change: number } }> {
    // TODO: 실제 실시간 주가 API 호출
    return new Promise((resolve) => {
      setTimeout(() => {
        const updates: { [code: string]: { price: number; change: number } } = {};
        codes.forEach(code => {
          updates[code] = {
            price: Math.floor(Math.random() * 100000) + 50000,
            change: (Math.random() - 0.5) * 10
          };
        });
        resolve(updates);
      }, 500);
    });
  }
}

export default WatchlistService; 