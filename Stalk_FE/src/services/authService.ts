import { SignupFormData, User, LoginRequest, LoginResponse, BaseApiResponse } from '@/types';

// localStorage 키 상수들
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_INFO_KEY = 'userInfo';

// JWT 토큰 디코딩 함수
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT 디코딩 실패:', error);
    return null;
  }
}

// 토큰 만료 시간 확인 함수
function getTokenExpiryTime(token: string): number | null {
  const decoded = decodeJWT(token);
  if (decoded && decoded.exp) {
    return decoded.exp * 1000; // 밀리초로 변환
  }
  return null;
}

// 토큰 만료까지 남은 시간 확인 (밀리초)
function getTimeUntilExpiry(token: string): number | null {
  const expiryTime = getTokenExpiryTime(token);
  if (expiryTime) {
    return expiryTime - Date.now();
  }
  return null;
}

// localStorage에서 토큰 검증 및 정리
function validateAndCleanupTokens(): boolean {
  try {
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    if (storedAccessToken) {
      // 토큰 만료 확인
      const timeUntilExpiry = getTimeUntilExpiry(storedAccessToken);
      if (timeUntilExpiry && timeUntilExpiry > 0) {
        console.log('localStorage 토큰 유효함');
        return true;
      } else {
        console.log('저장된 토큰이 만료됨, localStorage 정리');
        clearStoredTokens();
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    clearStoredTokens();
    return false;
  }
}

// localStorage에 토큰 저장
function saveTokensToStorage(accessTokenValue: string, refreshTokenValue: string, userInfoValue: any): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessTokenValue);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfoValue));
    console.log('토큰이 localStorage에 저장됨');
  } catch (error) {
    console.error('토큰 저장 실패:', error);
  }
}

// localStorage에서 토큰 제거
function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
}

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
      // 입력 데이터 검증
      if (!data.userId || !data.password) {
        throw new Error('아이디와 비밀번호를 모두 입력해주세요.');
      }
      
      // 공백 제거
      const cleanData = {
        userId: data.userId.trim(),
        password: data.password.trim()
      };
      
      console.log('로그인 요청 데이터:', cleanData);
      console.log('로그인 요청 URL:', `/api/auth/login`);
      console.log('요청 본문:', JSON.stringify(cleanData));
      
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        console.error('API 응답 오류:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        const errorData = await response.json().catch(() => ({}));
        console.error('에러 응답 데이터:', errorData);
        
        // Spring Boot 기본 에러 응답 처리
        if (errorData.error === 'Bad Request' && errorData.status === 400) {
          console.error('Spring Boot 검증 실패 - 요청 데이터:', cleanData);
          throw new Error('입력 데이터가 올바르지 않습니다. 아이디와 비밀번호를 확인해주세요.');
        }
        
        // 백엔드 커스텀 에러 메시지가 있는 경우
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: BaseApiResponse<LoginResponse> = await response.json();
      
      if (!result.isSuccess) {
        throw new Error(result.message);
      }

      // 사용자 정보 객체 생성
      const userInfoData = {
        userId: result.result.userId,
        userName: result.result.userName,
        role: result.result.role
      };

      // localStorage에 토큰과 사용자 정보 저장
      saveTokensToStorage(result.result.accessToken, result.result.refreshToken, userInfoData);
      
      return result.result;
    } catch (error) {
      console.error('로그인 API 호출 실패:', error);
      
      // 개발 환경에서 Mock 데이터로 대체 (네트워크 에러, 400, 500 에러 모두 포함)
      if (import.meta.env.DEV) {
        console.warn('개발 환경: 백엔드 서버 오류, Mock 데이터로 대체합니다.');
        
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
        
        // 사용자 정보 객체 생성
        const mockUserInfo = {
          userId: mockResponse.userId,
          userName: mockResponse.userName,
          role: mockResponse.role
        };

        // localStorage에 Mock 토큰과 사용자 정보 저장
        saveTokensToStorage(mockResponse.accessToken, mockResponse.refreshToken, mockUserInfo);
        
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
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (currentRefreshToken) {
      try {
        await fetch(`/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
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
    
    // localStorage에서 토큰 제거
    clearStoredTokens();
  }

  // 토큰 가져오기
  static getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  // 토큰 갱신
  static async refreshToken(): Promise<string | null> {
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!currentRefreshToken) {
      return null;
    }

    try {
      const response = await fetch(`/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!response.ok) {
        throw new Error('토큰 갱신 실패');
      }

      // 백엔드에서 문자열로 토큰만 반환
      const newAccessToken = await response.text();
      
      if (newAccessToken) {
        // localStorage에 새로운 토큰 저장 (기존 refreshToken과 userInfo 유지)
        const currentUserInfo = localStorage.getItem(USER_INFO_KEY);
        if (currentRefreshToken && currentUserInfo) {
          const userInfoData = JSON.parse(currentUserInfo);
          saveTokensToStorage(newAccessToken, currentRefreshToken, userInfoData);
        }
        
        return newAccessToken;
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
    let token = localStorage.getItem(ACCESS_TOKEN_KEY);
    
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
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const userInfo = localStorage.getItem(USER_INFO_KEY);
    return !!(accessToken && userInfo);
  }

  // 토큰 만료 확인 및 자동 갱신
  static async checkTokenExpiry(): Promise<boolean> {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      return false;
    }

    const timeUntilExpiry = getTimeUntilExpiry(accessToken);
    if (!timeUntilExpiry) {
      console.error('토큰 만료 시간을 확인할 수 없음');
      return false;
    }

    // 토큰이 이미 만료된 경우
    if (timeUntilExpiry <= 0) {
      console.log('토큰이 만료됨, 갱신 시도');
      const newToken = await this.refreshToken();
      return !!newToken;
    }

    // 5분(300,000ms) 이내에 만료되는 경우 자동 갱신
    if (timeUntilExpiry <= 5 * 60 * 1000) {
      console.log('토큰이 5분 이내에 만료됨, 자동 갱신 시도');
      const newToken = await this.refreshToken();
      return !!newToken;
    }

    return true; // 토큰이 유효함
  }

  // 토큰 상태 초기화 (앱 시작 시 호출)
  static initialize(): void {
    validateAndCleanupTokens();
  }

  // 사용자 정보 가져오기
  static getUserInfo(): any {
    const userInfo = localStorage.getItem(USER_INFO_KEY);
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
            id: 1,
            userId: 'ssafy_kim',
            name: '김싸피',
            contact: '010-0000-0000',
            email: 'ssafy@samsung.com',
            nickname: '김싸피',
            role: 'USER'
          }
        });
      }, 500);
    });
  }
}

export default AuthService; 