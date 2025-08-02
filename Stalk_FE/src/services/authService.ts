import { SignupFormData, User, LoginRequest, LoginResponse } from '@/types';

// localStorage에서 토큰 관리
const ACCESS_TOKEN_KEY = 'accessToken';
const USER_INFO_KEY = 'userInfo';

// 사용자 정보는 메모리에 저장 (새로고침 시 localStorage에서 복원)
let userInfo: any = null;

interface EmailVerificationRequest {
  email: string;
}

interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

class AuthService {
  // Access Token 관리 메서드들
  static getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  static removeAccessToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

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

      // 백엔드에서 직접 LoginResponse를 반환 (BaseApiResponse 래퍼 없음)
      const result: LoginResponse = await response.json();

      // Access Token을 localStorage에 저장
      this.setAccessToken(result.accessToken);
      
      // 사용자 정보는 JWT 토큰에서 추출하거나 별도 API로 조회해야 함
      // 임시로 토큰에서 기본 정보만 설정
      userInfo = {
        userId: 0, // JWT에서 추출하거나 별도 API 호출 필요
        userName: '', // JWT에서 추출하거나 별도 API 호출 필요
        role: 'USER' // JWT에서 추출하거나 별도 API 호출 필요
      };
      
      // 로그인 성공 후 사용자 정보를 별도로 조회
      try {
        const userProfile = await this.getUserProfile();
        userInfo = {
          userId: 0, // UserProfileResponseDto에는 Long id가 없어서 0으로 설정
          userName: userProfile.name,
          role: userProfile.role as 'USER' | 'ADVISOR' | 'ADMIN'
        };
        
        // 사용자 정보를 localStorage에도 저장
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      } catch (error) {
        console.warn('사용자 정보 조회 실패, 기본값 사용:', error);
      }
      
      return result;
    } catch (error) {
      console.error('로그인 API 호출 실패:', error);
      
      // Mock 데이터는 더 이상 사용하지 않음 (실제 백엔드 API 사용)
      
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
    const token = this.getAccessToken();
    if (token) {
      try {
        await fetch(`/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },

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
    
    // localStorage와 메모리에서 모든 인증 정보 제거
    this.removeAccessToken();
    localStorage.removeItem(USER_INFO_KEY);
    userInfo = null;
  }



  // 토큰 갱신 (refresh token은 서버에서 관리하므로 제거)
  static async refreshToken(): Promise<string | null> {
    // refresh token은 서버에서 관리하므로 이 메서드는 더 이상 사용하지 않음
    console.warn('토큰 갱신은 서버에서 관리합니다.');
    return null;
  }

  // 인증된 API 요청 헬퍼
  static async authenticatedRequest(url: string, options: any = {}) {
    const token = this.getAccessToken();
    
    const config = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    };
    
    return fetch(url, config);
  }

  // 자동 로그인 체크
  static checkAutoLogin(): boolean {
    const token = this.getAccessToken();
    const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
    
    if (token && storedUserInfo && !userInfo) {
      // localStorage에서 사용자 정보 복원
      try {
        userInfo = JSON.parse(storedUserInfo);
      } catch (error) {
        console.error('사용자 정보 파싱 실패:', error);
        localStorage.removeItem(USER_INFO_KEY);
        return false;
      }
    }
    
    return !!(token && userInfo);
  }

  // 토큰 만료 확인 (간단한 버전)
  static async checkTokenExpiry(): Promise<boolean> {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      return false;
    }
    
    // 토큰이 있으면 유효한 것으로 간주 (서버에서 토큰 만료 관리)
    return true;
  }

  // 토큰 상태 초기화 (앱 시작 시 호출)
  static initialize(): void {
    // localStorage에서 사용자 정보 복원
    const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
    if (storedUserInfo) {
      try {
        userInfo = JSON.parse(storedUserInfo);
      } catch (error) {
        console.error('사용자 정보 파싱 실패:', error);
        localStorage.removeItem(USER_INFO_KEY);
      }
    }
  }

  // 사용자 정보 가져오기
  static getUserInfo(): any {
    if (!userInfo) {
      const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
      if (storedUserInfo) {
        try {
          userInfo = JSON.parse(storedUserInfo);
        } catch (error) {
          console.error('사용자 정보 파싱 실패:', error);
          localStorage.removeItem(USER_INFO_KEY);
        }
      }
    }
    return userInfo;
  }

  // 사용자 프로필 조회 (백엔드 API 호출)
  static async getUserProfile(): Promise<{ name: string; role: string; userId: string; contact: string; email: string; profileImage: string }> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`사용자 정보 조회 실패: ${response.status}`);
    }

    const result = await response.json();
    
    // BaseResponse 구조로 응답이 올 경우
    if (result.isSuccess) {
      return result.result;
    }
    
    // 직접 데이터가 올 경우
    return result;
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