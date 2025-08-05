import { User, LoginRequest, LoginResponse, SignupRequest, AdvisorSignupRequest } from '@/types';
import AdvisorService from './advisorService';

// 메모리에 저장되는 토큰과 사용자 정보
let accessToken: string | null = null;
let userInfo: any = null;
let refreshPromise: Promise<string | null> | null = null;

// localStorage 키 상수
const ACCESS_TOKEN_KEY = 'accessToken';
const USER_INFO_KEY = 'userInfo';

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
    // 메모리에 없으면 localStorage에서 가져오기
    if (!accessToken) {
      const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (savedToken) {
        accessToken = savedToken;
      }
    }
    return accessToken;
  }

  static setAccessToken(token: string): void {
    accessToken = token;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  static removeAccessToken(): void {
    accessToken = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
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
        credentials: 'include',
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
        },
        credentials: 'include',
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
          credentials: 'include',
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
          credentials: 'include',
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
    let token = this.getAccessToken();
    console.log('authenticatedRequest - token:', token ? 'exists' : 'null');
    console.log('authenticatedRequest - token value:', token ? token.substring(0, 20) + '...' : 'null');
    if (!token) {
      throw new Error('인증이 필요합니다.');
    }

    // 토큰이 만료되었거나 곧 만료될 예정인 경우에만 refresh
    console.log('Token expired check:', isTokenExpired(token));
    console.log('Token expiring soon check:', isTokenExpiringSoon(token));
    if (isTokenExpired(token) || isTokenExpiringSoon(token)) {
      console.log('Token is expired or expiring soon, attempting refresh...');
      const newToken = await this.refreshToken();
      if (!newToken) {
        throw new Error('인증이 만료되었습니다.');
      }
      token = newToken;
      console.log('Token refreshed successfully');
    }

    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        // FormData인 경우 Content-Type을 설정하지 않음 (브라우저가 자동 설정)
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      },

      credentials: 'include',
    };

    console.log('Request URL:', url);
    console.log('Request headers:', config.headers);
    console.log('Full Authorization header:', (config.headers as any).Authorization);

    const response = await fetch(url, config);

    // 401 에러 시 토큰 갱신 후 재시도
    if (response.status === 401) {
      console.log('Received 401 error, attempting token refresh...');
      const newToken = await this.refreshToken();
      if (!newToken) {
        console.log('Token refresh failed, removing token and throwing error');
        this.removeAccessToken();
        throw new Error('인증이 만료되었습니다.');
      }

      console.log('Token refreshed after 401, retrying request...');
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${newToken}`,
        // FormData인 경우 Content-Type을 설정하지 않음
        ...(!(config.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      };

      return fetch(url, config);
    }

    return response;
  }

  // 앱 초기화 (새로고침/새 탭)
  static async initialize(): Promise<void> {
    try {
      // localStorage에서 토큰 복원
      const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (savedToken) {
        accessToken = savedToken;
        
        // 토큰이 만료되지 않았는지 확인
        if (!isTokenExpired(savedToken)) {
          // 사용자 정보 조회
          await this.fetchUserProfile();
        } else {
          // 토큰이 만료되었으면 refresh 시도
          const newToken = await this.refreshToken();
          if (newToken) {
            await this.fetchUserProfile();
          } else {
            // refresh 실패 시 토큰 제거
            this.removeAccessToken();
            userInfo = null;
          }
        }
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

  // 일반 회원가입
  static async signup(data: SignupRequest): Promise<{ success: boolean; message: string }> {
    try {
      // 입력값 검증
      if (!data.userId || !data.password || !data.passwordConfirm || !data.email || 
          !data.name || !data.nickname || !data.contact) {
        throw new Error('모든 필수 항목을 입력해주세요.');
      }

      if (data.password !== data.passwordConfirm) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      if (!data.agreedTerms || !data.agreedPrivacy) {
        throw new Error('필수 약관에 동의해주세요.');
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `회원가입 실패: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('회원가입 API 호출 실패:', error);
      throw error;
    }
  }

  // 전문가 회원가입
  static async advisorSignup(data: AdvisorSignupRequest): Promise<{ success: boolean; message: string }> {
    try {
      // 입력값 검증
      if (!data.userId || !data.password || !data.passwordConfirm || !data.email || 
          !data.name || !data.nickname || !data.contact || !data.certificateName || 
          !data.certificateFileSn || !data.birth || !data.certificateFileNumber || 
          !data.profileImage) {
        throw new Error('모든 필수 항목을 입력해주세요.');
      }

      if (data.password !== data.passwordConfirm) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      if (!data.agreedTerms || !data.agreedPrivacy) {
        throw new Error('필수 약관에 동의해주세요.');
      }

      const formData = new FormData();
      
      // 기본 정보
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'profileImage') {
          formData.append('profileImage', value);
        } else if (key === 'agreedTerms' || key === 'agreedPrivacy') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value as string);
        }
      });

      const response = await fetch('/api/auth/signup/advisor', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `전문가 회원가입 실패: ${response.status}`);
      }

      const result = await response.json();
      
      // 회원가입 성공 시 자동으로 승인 요청
      if (result.success) {
        try {
          await AdvisorService.requestCertificateApproval({
            certificateName: data.certificateName,
            certificateFileSn: data.certificateFileSn,
            birth: data.birth,
            certificateFileNumber: data.certificateFileNumber
          });
          result.message += " 자격증 승인 요청이 접수되었습니다.";
        } catch (error) {
          console.error('자격증 승인 요청 실패:', error);
          // 회원가입은 성공했지만 승인 요청은 실패한 경우
        }
      }
      
      return result;
    } catch (error) {
      console.error('전문가 회원가입 API 호출 실패:', error);
      throw error;
    }
  }

  // 이메일 인증 코드 발송
  static async sendEmailVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/auth/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '이메일 인증 코드 발송 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('이메일 인증 코드 발송 실패:', error);
      throw error;
    }
  }

  // 이메일 인증 코드 확인
  static async verifyEmailCode(email: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/auth/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '이메일 인증 코드 확인 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('이메일 인증 코드 확인 실패:', error);
      throw error;
    }
  }
}

export default AuthService;