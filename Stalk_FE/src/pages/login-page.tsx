import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewNavbar from '@/components/new-navbar';
import Footer from '@/components/footer';
import AuthService from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import googleIcon from '@/assets/images/icons/google_icon.svg';
import naverIcon from '@/assets/images/icons/naver_icon.svg';
import kakaoIcon from '@/assets/images/icons/kakao_icon.svg';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoggedIn, isLoading, isLoggingIn } = useAuth();
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  // isSubmitting 대신 AuthContext의 isLoggingIn 사용
  const [error, setError] = useState('');

  // 이미 로그인된 경우 홈으로 리다이렉트 (로딩 완료 후)
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // 프론트엔드 입력 검증
    if (!formData.userId.trim() || !formData.password.trim()) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      await AuthService.login(formData);
      
      // 사용자 프로필 정보 가져오기
      const userProfile = await AuthService.getUserProfile();
      
      
      // AuthContext에 로그인 상태 업데이트
      const userInfoToSet = {
        userId: 0,
        userName: userProfile.name,
        role: userProfile.role as 'USER' | 'ADVISOR' | 'ADMIN'
      };
      
      
      // AuthContext 상태 설정
      login(userInfoToSet);
      
      // 상태 설정 후 잠시 대기 (AuthContext 업데이트 완료 대기)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 로그인 성공 시 역할에 따라 다른 페이지로 이동
      
      if (userProfile.role === 'ADMIN') {
      
        navigate('/admin', { replace: true });
      } else {
      
        navigate('/', { replace: true });
      }
    } catch (error) {
      // 보안을 위해 구체적인 에러 메시지 대신 일반적인 메시지 표시
      const errorMessage = error instanceof Error && error.message.includes('아이디 또는 비밀번호') 
        ? error.message 
        : '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.';
      setError(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <NewNavbar />
      <div className="flex items-center justify-center px-4 ">
        <div className="w-1/2">
          {/* Login Form */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-modern border border-white/20">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
              <p className="text-gray-600">login</p>
            </div>
            <div className="gap-12">
              {/* Left Column - Fin Talk Login */}
              <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ID Input */}
                  <div>
                    <label htmlFor="userId" className="text-left block text-sm font-medium text-gray-700 mb-2">
                      ID
                    </label>
                    <input
                      type="text"
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      className="focus:outline-none block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      placeholder="아이디를 입력해주세요."
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label htmlFor="password" className="text-left block text-sm font-medium text-gray-700 mb-2">
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="focus:outline-none block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      placeholder="비밀번호를 입력해주세요."
                      required
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}

                  {/* Stalk Login Button */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-modern hover:shadow-glow transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingIn ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>로그인 중...</span>
                      </div>
                    ) : (
                      <span>로그인</span>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                아직 Stalk 회원이 아니신가요?{' '}
                <button
                  onClick={() => navigate('/SignupChoicePage')}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  가입하기
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage; 