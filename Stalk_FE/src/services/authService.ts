import { SignupFormData, User, LoginRequest, LoginResponse, BaseApiResponse } from '@/types';
import { setCookie, getCookie, removeCookie } from '@/utils/cookieUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

interface EmailVerificationRequest {
  email: string;
}

interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

class AuthService {
  // 로그인
  static async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // CORS 쿠키 포함
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: BaseApiResponse<LoginResponse> = await response.json();
      
      if (!result.isSuccess) {
        throw new Error(result.message);
      }

      // Access Token과 Refresh Token을 쿠키에 저장
      setCookie('accessToken', result.result.accessToken, 1); // 1일
      setCookie('refreshToken', result.result.refreshToken, 7); // 7일
      
      // 사용자 정보를 쿠키에 저장 (자동 로그인용)
      setCookie('userInfo', JSON.stringify({
        userId: result.result.userId,
        userName: result.result.userName,
        role: result.result.role
      }), 7);
      
      return result.result;
    } catch (error) {
      console.error('로그인 API 호출 실패:', error);
      
      // 개발 환경에서만 Mock 데이터로 대체
      if (import.meta.env.DEV && (error instanceof TypeError || (error instanceof Error && error.message.includes('Failed to fetch')))) {
        console.warn('개발 환경: 백엔드 서버 연결 실패, Mock 데이터로 대체합니다.');
        
        // 백엔드에 등록된 사용자만 Mock 로그인 허용
        const validUsers: Record<string, { userId: number; userName: string; role: 'USER' | 'ADVISOR' | 'ADMIN'; password: string }> = {
          'user001': { userId: 1001, userName: '김철수', role: 'USER', password: 'password123' },
          'user002': { userId: 1002, userName: '이영희', role: 'USER', password: 'password123' },
          'advisor001': { userId: 2001, userName: '한승우', role: 'ADVISOR', password: 'password123' },
          'advisor002': { userId: 2002, userName: '이수진', role: 'ADVISOR', password: 'password123' },
          'advisor003': { userId: 2003, userName: '박미승', role: 'ADVISOR', password: 'password123' },
          'admin001': { userId: 3001, userName: '관리자', role: 'ADMIN', password: 'password123' }
        };
        
        const userData = validUsers[data.userId as keyof typeof validUsers];
        
        if (!userData) {
          throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        
        // 비밀번호 검증
        if (userData.password !== data.password) {
          throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        
        // Mock 응답 생성
        const mockResponse: LoginResponse = {
          accessToken: `MOCK_TOKEN_${Date.now()}_ACCESS_${data.userId}`,
          refreshToken: `MOCK_TOKEN_${Date.now()}_REFRESH_${data.userId}`,
          userId: userData.userId,
          userName: userData.userName,
          role: userData.role,
          message: 'Mock 로그인 성공'
        };
        
        // Mock 토큰 저장
        setCookie('accessToken', mockResponse.accessToken, 1);
        setCookie('refreshToken', mockResponse.refreshToken, 7);
        
        // 사용자 정보를 쿠키에 저장
        setCookie('userInfo', JSON.stringify({
          userId: mockResponse.userId,
          userName: mockResponse.userName,
          role: mockResponse.role
        }), 7);
        
        return mockResponse;
      }
      
      throw error;
    }
  }

  // 회원가입
  static async signup(_data: SignupFormData): Promise<{ success: boolean; message: string }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '회원가입이 완료되었습니다.'
        });
      }, 1000);
    });
  }

  // 이메일 인증 코드 발송
  static async sendEmailVerification(_data: EmailVerificationRequest): Promise<EmailVerificationResponse> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '인증 코드가 발송되었습니다.'
        });
      }, 1000);
    });
  }

  // 이메일 인증 코드 확인
  static async verifyEmailCode(_email: string, code: string): Promise<{ success: boolean; message: string }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: code === '123456', // 임시 검증 로직
          message: code === '123456' ? '인증이 완료되었습니다.' : '인증 코드가 올바르지 않습니다.'
        });
      }, 1000);
    });
  }

  // 로그아웃
  static async logout(): Promise<void> {
    const token = getCookie('accessToken');
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
      } catch (error) {
        console.error('로그아웃 API 호출 실패:', error);
        // 개발 환경에서 CORS 에러나 네트워크 에러인 경우 Mock 처리
        if (import.meta.env.DEV && (error instanceof TypeError || (error instanceof Error && error.message.includes('Failed to fetch')))) {
          console.warn('개발 환경: 백엔드 서버 연결 실패, 로컬 로그아웃만 진행합니다.');
        }
        // CORS 에러나 네트워크 에러가 발생해도 로컬 정리는 계속 진행
      }
    }
    
    // 쿠키에서 모든 인증 정보 제거
    removeCookie('accessToken');
    removeCookie('refreshToken');
    removeCookie('userInfo');
  }

  // 토큰 가져오기
  static getAccessToken(): string | null {
    return getCookie('accessToken');
  }

  // 토큰 갱신
  static async refreshToken(): Promise<string | null> {
    const refreshToken = getCookie('refreshToken');
    
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('토큰 갱신 실패');
      }

      const result = await response.json();
      
      if (result.isSuccess && result.result?.accessToken) {
        // 새로운 Access Token 저장
        setCookie('accessToken', result.result.accessToken, 1);
        return result.result.accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      // CORS 에러나 네트워크 에러인 경우 로그아웃 처리하지 않고 null 반환
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('Failed to fetch'))) {
        console.warn('네트워크 에러로 인한 토큰 갱신 실패, 로그아웃 처리하지 않음');
        return null;
      }
      // 토큰 갱신 실패 시 로그아웃 처리
      this.logout();
      return null;
    }
  }

  // 인증된 API 요청 헬퍼 (토큰 갱신 포함)
  static async authenticatedRequest(url: string, options: any = {}) {
    let token = getCookie('accessToken');
    
    // 토큰이 없으면 갱신 시도
    if (!token) {
      token = await this.refreshToken();
    }
    
    const config = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    };
    
    const response = await fetch(url, config);
    
    // 401 에러 시 토큰 갱신 재시도
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return fetch(url, config);
      }
    }
    
    return response;
  }

  // 자동 로그인 체크
  static checkAutoLogin(): boolean {
    const accessToken = getCookie('accessToken');
    const refreshToken = getCookie('refreshToken');
    const userInfo = getCookie('userInfo');
    
    return !!(accessToken || refreshToken) && !!userInfo;
  }

  // 사용자 정보 가져오기
  static getUserInfo(): any {
    const userInfo = getCookie('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  // 토큰 검증
  static async validateToken(_token: string): Promise<{ valid: boolean; user?: User }> {
    // TODO: 실제 토큰 검증 로직
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          valid: true,
          user: {
            userId: 'ssafy_kim',
            name: '김싸피',
            contact: '010-0000-0000',
            email: 'ssafy@samsung.com',
            nickname: '김싸피',
            userType: 'general'
          }
        });
      }, 500);
    });
  }
}

export default AuthService; 