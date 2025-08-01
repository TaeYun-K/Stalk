import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode, 
  useRef,
  useCallback
} from 'react';
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
  const [isLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const tokenCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 토큰 만료 체크 및 자동 갱신
  const startTokenExpiryCheck = useCallback(() => {
    // 기존 인터벌이 있으면 제거
    if (tokenCheckIntervalRef.current) {
      clearInterval(tokenCheckIntervalRef.current);
    }

    // 1분마다 토큰 만료 체크
    tokenCheckIntervalRef.current = setInterval(async () => {
      if (isLoggedIn) {
        const isTokenValid = await AuthService.checkTokenExpiry();
        if (!isTokenValid) {
          console.log('토큰 갱신 실패, 로그아웃 처리');
          logout();
        }
      }
    }, 60000); // 1분마다 체크
  }, [isLoggedIn]);

  // 토큰 만료 체크 중지
  const stopTokenExpiryCheck = useCallback(() => {
    if (tokenCheckIntervalRef.current) {
      clearInterval(tokenCheckIntervalRef.current);
      tokenCheckIntervalRef.current = null;
    }
  }, []);

  // 로그아웃 처리
  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    stopTokenExpiryCheck(); // 토큰 만료 체크 중지
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
  }, [stopTokenExpiryCheck]);

  // 자동 로그인 체크
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      // AuthService 초기화 (localStorage에서 토큰 복원)
      AuthService.initialize();
      
      // 토큰 만료 확인 및 자동 갱신
      const isTokenValid = await AuthService.checkTokenExpiry();
      if (!isTokenValid) {
        setIsLoggedIn(false);
        setUserInfo(null);
        return false;
      }

      // localStorage와 메모리에서 로그인 상태 확인
      if (AuthService.checkAutoLogin()) {
        const storedUserInfo = AuthService.getUserInfo();
        if (storedUserInfo) {
          setIsLoggedIn(true);
          setUserInfo(storedUserInfo);
          startTokenExpiryCheck(); // 토큰 만료 체크 시작
          return true;
        }
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
  }, [startTokenExpiryCheck]);

  // 로그인 처리
  const login = useCallback((userInfo: UserInfo) => {
    setIsLoggedIn(true);
    setUserInfo(userInfo);
    startTokenExpiryCheck(); // 로그인 시 토큰 만료 체크 시작
  }, [startTokenExpiryCheck]);

  // 컴포넌트 마운트 시 자동 로그인 체크
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
    
    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      stopTokenExpiryCheck();
    };
  }, [checkAuth, stopTokenExpiryCheck]);

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