import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '@/services/authService';
import { UserInfo } from '@/types';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  userInfo: UserInfo | null;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 자동 로그인 체크
  const checkAuth = async (): Promise<boolean> => {
    try {
      // localStorage와 쿠키에서 로그인 상태 확인
      if (AuthService.checkAutoLogin()) {
        const storedUserInfo = AuthService.getUserInfo();
        if (storedUserInfo) {
          setIsLoggedIn(true);
          setUserInfo(storedUserInfo);
          return true;
        }
      }
      
      // 토큰이 있지만 사용자 정보가 없는 경우는 로그아웃 상태로 처리
      const accessToken = AuthService.getAccessToken();
      if (accessToken) {
        console.log('토큰은 있지만 사용자 정보가 없음, 로그아웃 상태로 처리');
        // 토큰들을 제거
        const { removeCookie } = await import('@/utils/cookieUtils');
        removeCookie('accessToken');
        removeCookie('refreshToken');
        removeCookie('userInfo');
      }
      
      setIsLoggedIn(false);
      setUserInfo(null);
      return false;
    } catch (error) {
      console.error('인증 체크 실패:', error);
      setIsLoggedIn(false);
      setUserInfo(null);
      return false;
    }
  };

  // 로그인 처리
  const login = (userInfo: UserInfo) => {
    setIsLoggedIn(true);
    setUserInfo(userInfo);
  };

  // 로그아웃 처리
  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('로그아웃 중 에러 발생:', error);
    } finally {
      // 에러가 발생해도 상태는 확실히 초기화
      setIsLoggedIn(false);
      setUserInfo(null);
      setIsLoggingOut(false);
    }
  };

  // 컴포넌트 마운트 시 자동 로그인 체크
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const value: AuthContextType = {
    isLoggedIn,
    isLoading,
    isLoggingIn,
    isLoggingOut,
    userInfo,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 