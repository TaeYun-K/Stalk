import { User, LoginRequest, LoginResponse } from '@/types';

// 메모리에 저장되는 토큰과 사용자 정보
let accessToken: string | null = null;
let userInfo: any = null;
let refreshPromise: Promise<string | null> | null = null;

// JWT 디코딩 함수
const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (error) {
    console.error('JWT 디코딩 실패:', error);
    return null;
  }
};

// 토큰 만료 시간 확인 함수
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  // 현재 시간과 만료 시간 비교 (exp는 초 단위)
  return decoded.exp * 1000 <= Date.now();
};

// 토큰 만료 임박 확인 함수 (3분 이내)
const isTokenExpiringSoon = (token: string): boolean => {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  // 현재 시간과 만료 시간 비교 (3분 = 180초)
  return (decoded.exp * 1000) - Date.now() <= 180000;
};

class AuthService {
  // Access Token 관리
  static getAccessToken(): string | null {
    return accessToken;
  }

  private static setAccessToken(token: string): void {
    accessToken = token;
  }

  private static removeAccessToken(): void {
    accessToken = null;
  }

  // 로그인
  static async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      if (!data.userId || !data.password) {
        throw new Error('아이디와 비밀번호를 모두 입력해주세요.');
      }
      
      const cleanData = {
        userId: data.userId.trim(),
        password: data.password.trim()
      };
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(cleanData),
        credentials: 'include', // 쿠키를 받기 위해 추가
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `로그인 실패: ${response.status}`);
      }

      const result = await response.json();
      
      // Access Token을 메모리에 저장
      this.setAccessToken(result.accessToken);
      
      // 사용자 정보 조회 (여기서는 직접 fetch 사용)
      const userResponse = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${result.accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userInfo = userData.result || userData;
      }
      
      return result;
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  }

  // 로그아웃
  static async logout(): Promise<void> {
    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      this.removeAccessToken();
      userInfo = null;
    }
  }

  // 토큰 갱신 (중복 요청 방지)
  static async refreshToken(): Promise<string | null> {
    // 이미 진행 중인 refresh 요청이 있다면 그 결과를 기다림
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // refresh token 쿠키 전송
        });

        if (!response.ok) {
          throw new Error('토큰 갱신 실패');
        }

        const data = await response.json();
        this.setAccessToken(data.accessToken);
        return data.accessToken;
      } catch (error) {
        console.error('토큰 갱신 실패:', error);
        this.removeAccessToken();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  // 인증된 API 요청 헬퍼
  static async authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!accessToken) {
      throw new Error('인증이 필요합니다.');
    }

    // 토큰이 만료되었거나 곧 만료될 예정인 경우에만 refresh
    if (isTokenExpired(accessToken) || isTokenExpiringSoon(accessToken)) {
      const newToken = await this.refreshToken();
      if (!newToken) {
        throw new Error('인증이 만료되었습니다.');
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함
    };

    const response = await fetch(url, config);

    // 401 에러 시 토큰 갱신 후 재시도
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (!newToken) {
        throw new Error('인증이 만료되었습니다.');
      }

      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${newToken}`,
      };

      return fetch(url, config);
    }

    return response;
  }

  // 앱 초기화 (새로고침/새 탭)
  static async initialize(): Promise<void> {
    try {
      // 페이지 진입 시 무조건 refresh 요청
      const token = await this.refreshToken();
      if (token) {
        await this.fetchUserProfile();
      }
    } catch (error) {
      console.error('초기화 실패:', error);
      this.removeAccessToken();
      userInfo = null;
    }
  }

  // 사용자 프로필 조회
  private static async fetchUserProfile(): Promise<void> {
    try {
      const response = await this.authenticatedRequest('/api/users/me');
      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const data = await response.json();
      userInfo = data.result || data;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 정보 조회
  static getUserInfo(): any {
    return userInfo;
  }

  // 사용자 프로필 조회 (외부 호출용)
  static async getUserProfile(): Promise<any> {
    try {
      const response = await this.authenticatedRequest('/api/users/me');
      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }
      const data = await response.json();
      return data.result || data;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      throw error;
    }
  }

  // 로그인 상태 확인
  static isLoggedIn(): boolean {
    return !!accessToken && !!userInfo;
  }
}

export default AuthService;