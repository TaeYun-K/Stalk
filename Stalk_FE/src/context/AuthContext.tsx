import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode, 
  useCallback
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '@/services/authService';
import { UserInfo } from '@/types';

// 로그인이 필요하지 않은 public 라우트들
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/SignupChoicePage', '/signup-complete', '/products', '/community', '/experts', '/search'];

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  userInfo: UserInfo | null;
  accessToken: string | null;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  removeAccessToken: () => void;
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const getAccessToken = useCallback(() => {
    // AuthService에서 토큰을 가져옴
    const token = AuthService.getAccessToken();
    if (token && token !== accessToken) {
      setAccessToken(token); // AuthContext 상태 동기화
    }
    return token;
  }, [accessToken]);
  
  const setToken = useCallback((token: string) => {
    AuthService.setAccessToken(token);
    setAccessToken(token);
  }, []);
  
  const removeAccessToken = useCallback(() => {
    AuthService.removeAccessToken();
    setAccessToken(null);
  }, []);

  // 현재 경로가 public 라우트인지 확인
  const isPublicRoute = useCallback((path: string) => {
    return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));
  }, []);

  // 로그아웃 처리
  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await AuthService.logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 중 에러 발생:', error);
    } finally {
      AuthService.removeAccessToken(); // AuthService에서도 토큰 제거
      setIsLoggedIn(false);
      setUserInfo(null);
      setAccessToken(null); // 토큰 제거
      setIsLoggingOut(false);
    }
  }, [navigate]);

  // 인증 상태 확인
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      // 앱 초기화 (토큰 갱신 시도)
      await AuthService.initialize();
      
      // 로그인 상태 확인
      if (AuthService.isLoggedIn()) {
        const currentUserInfo = AuthService.getUserInfo();
        const token = AuthService.getAccessToken();
        
        setIsLoggedIn(true);
        setUserInfo(currentUserInfo);
        if (token) {
          setAccessToken(token); // 토큰 동기화
        }
        return true;
      }
      
      AuthService.removeAccessToken(); // AuthService에서도 토큰 제거
      setIsLoggedIn(false);
      setUserInfo(null);
      setAccessToken(null); // 토큰 제거
      return false;
    } catch (error) {
      console.error('인증 체크 실패:', error);
      AuthService.removeAccessToken(); // AuthService에서도 토큰 제거
      setIsLoggedIn(false);
      setUserInfo(null);
      setAccessToken(null); // 토큰 제거
      return false;
    }
  }, []);

  // 로그인 처리
  const login = useCallback((newUserInfo: UserInfo) => {
    setIsLoggingIn(true);
    try {
      setIsLoggedIn(true);
      setUserInfo(newUserInfo);
    } catch (error) {
      console.error('로그인 상태 업데이트 실패:', error);
      setIsLoggedIn(false);
      setUserInfo(null);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  // 컴포넌트 마운트 시 인증 초기화
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const isAuthenticated = await checkAuth();
        const currentPath = location.pathname;

        // public 라우트가 아니고 인증되지 않은 경우에만 로그인 페이지로 이동
        if (!isAuthenticated && !isPublicRoute(currentPath)) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [checkAuth, navigate, location.pathname, isPublicRoute]);

  // 주기적으로 인증 상태 확인 (5분마다)
  useEffect(() => {
    // public 라우트에서는 체크하지 않음
    if (!isLoggedIn || isPublicRoute(location.pathname)) return;

    const interval = setInterval(async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        navigate('/login');
      }
    }, 300000); // 5분

    return () => clearInterval(interval);
  }, [isLoggedIn, checkAuth, navigate, location.pathname, isPublicRoute]);

  const value: AuthContextType = {
    isLoggedIn,
    isLoading,
    isLoggingIn,
    isLoggingOut,
    userInfo,
    accessToken,
    login,
    logout,
    checkAuth,
    getAccessToken,
    setAccessToken: setToken,
    removeAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};