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
      const response = await AuthService.login(formData);
      console.log('로그인 성공:', response);
      
      // AuthContext에 로그인 상태 업데이트
      login({
        userId: response.userId,
        userName: response.userName,
        role: response.role
      });
      
      // 로그인 성공 시 역할에 따라 다른 페이지로 이동
      if (response.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
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
        <div className="w-full max-w-4xl">
          

          {/* Login Form */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-modern border border-white/20">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
              <p className="text-gray-600">login</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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

              {/* Right Column - Social Login */}
              <div className="space-y-6">
                {/* Social Login Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 text-gray-500 font-medium">소셜 로그인</span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                  {/* Kakao Login */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center space-x-3 bg-yellow-400 text-gray-800 font-medium py-3 px-4 rounded-2xl hover:bg-yellow-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <img src={kakaoIcon} alt="Kakao" className="w-5 h-5" />
                    <span>카카오 로그인</span>
                  </button>

                  {/* Naver Login */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center space-x-3 bg-green-500 text-white font-medium py-3 px-4 rounded-2xl hover:bg-green-600 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <img src={naverIcon} alt="Naver" className="w-5 h-5" />
                    <span>네이버 로그인</span>
                  </button>

                  {/* Google Login */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <img src={googleIcon} alt="Google" className="w-5 h-5" />
                    <span>Google 로그인</span>
                  </button>
                </div>
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