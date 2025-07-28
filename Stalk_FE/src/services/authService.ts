import { SignupFormData, User } from '@/types';

// 실제 API 엔드포인트는 추후 설정
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface LoginRequest {
  userId: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
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
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          token: 'mock-jwt-token',
          user: {
            userId: data.userId,
            name: '김싸피',
            contact: '010-0000-0000',
            email: 'ssafy@samsung.com',
            nickname: '김싸피',
            userType: 'general'
          }
        });
      }, 1000);
    });
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
    // TODO: 실제 로그아웃 처리
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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