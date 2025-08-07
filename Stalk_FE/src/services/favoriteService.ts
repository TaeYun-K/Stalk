import AuthService from './authService';

export interface FavoriteAdvisorResponseDto {
  advisorId: number;
  name: string;
  profileImage: string;
  averageRating: number;
  reviewCount: number;
  preferredTradeStyle: 'SHORT' | 'MID_SHORT' | 'MID' | 'MID_LONG' | 'LONG';
  shortIntro: string;
}

export interface CursorPage<T> {
  content: T[];
  nextCursor: number | null;
  hasNext: boolean;
  pageSize: number;
  pageNo: number;
}

export interface BaseResponse<T> {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: T;
}

class FavoriteService {
  static async getFavoriteAdvisors(pageNo: number = 1, pageSize: number = 10): Promise<BaseResponse<CursorPage<FavoriteAdvisorResponseDto>>> {
    const token = AuthService.getAccessToken();
    if (!token) throw new Error('로그인이 필요합니다.');

    console.log('찜한 전문가 API 호출 시작:', { pageNo, pageSize, token: token.substring(0, 20) + '...' });

    const response = await fetch(`/api/favorites/advisors?pageNo=${pageNo}&pageSize=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('찜한 전문가 API 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error('찜한 전문가 목록을 불러오는데 실패했습니다.');
    }

    const data = await response.json();
    console.log('찜한 전문가 API 응답 데이터:', data);
    console.log('찜한 전문가 목록 개수:', data.content?.length || 0);

    return data;
  }

  static async removeFavoriteAdvisor(advisorId: number): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) throw new Error('로그인이 필요합니다.');

    const response = await fetch(`/api/favorites/advisors/${advisorId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('찜해제에 실패했습니다.');
    }
  }
}

export default FavoriteService;