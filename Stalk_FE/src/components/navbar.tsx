import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthService from '@/services/authService';
import stalkLogoBlue from '@/assets/images/logos/Stalk_logo_blue.svg';
<<<<<<<<< Temporary merge branch 1
=========
// import newsIcon from '@/assets/images/icons/news_icon.png';
// import mortarboardIcon from '@/assets/images/icons/mortarboard_icon.png';
import profileDefault from '@/assets/images/profiles/Profile_default.svg';

>>>>>>>>> Temporary merge branch 2


const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout, isLoggingOut, userRole } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
<<<<<<<<< Temporary merge branch 1
  // const [showCommunityMenu, setShowCommunityMenu] = useState<boolean>(false);
=========
>>>>>>>>> Temporary merge branch 2
  const [searchQuery, setSearchQuery] = useState<string>('');
  // const [communityMenuTimeout, setCommunityMenuTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [userProfileImage, setUserProfileImage] = useState<string>(''); // 사용자 프로필 이미지
  const [isInputActive, setIsInputActive] = useState<boolean>(false); // 마우스 이벤트 상태 관리
  
  // Check if we're on the products page for glassmorphism effects
  const isProductsPage = location.pathname === '/products';
  

  // 사용자 프로필 이미지 가져오기
  const fetchUserProfileImage = async () => {
    try {
      const response = await AuthService.authenticatedRequest('/api/users/me');
      const data = await response.json();
      
      
      
      if (data.result?.profileImage) {
        setUserProfileImage(data.result.profileImage);
      } else {
        setUserProfileImage(`${import.meta.env.VITE_API_URL}/uploads/profile_default.png`);
      }
    } catch (error) {
      console.error('프로필 이미지 로드 실패:', error);
      setUserProfileImage(`${import.meta.env.VITE_API_URL}/uploads/profile_default.png`);
    }
  };

  // 로그인 상태가 변경될 때 프로필 이미지 가져오기
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserProfileImage();
    } else {
      setUserProfileImage('');
    }
  }, [isLoggedIn]);

  // 검색 함수
  const handleSearch = (): void => {
    if (searchQuery.trim()) {
      // 검색어가 있을 때 검색 페이지로 이동
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // 검색 후 입력창 초기화
      setSearchQuery('');
    }
  };

  // 엔터키 이벤트 핸들러
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMouseEnter = (): void => {
    setIsInputActive(true); // 입력창에 마우스가 올라왔을 때 활성화
  };

  const handleMouseLeave = (): void => {
    setIsInputActive(false); // 입력창에서 마우스가 빠져나갔을 때 비활성화
  };

  // 로그인 상태는 AuthContext에서 관리

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[60] ${
        isProductsPage 
          ? 'bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border-b border-white/20 shadow-lg/50' 
          : 'bg-white border-b border-gray-200 shadow-md'
      }`}>
      <div className="justify-between mx-auto px-4 sm:px-10 lg:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Brand Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-300"
            >
              
              <img src={stalkLogoBlue} alt="Stalk Logo" className="w-30 h-10" />
            </button>
            
          </div>

          {/* Navigation Menu */}
          
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => navigate('/advisors-list')}
                className="text-gray-600 hover:font-semibold hover:text-blue-600 font-medium text-lg transition-all duration-300 relative group"
              >
                투자 전문가
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => navigate('/products')}
                className="text-gray-600 hover:font-semibold hover:text-blue-600 font-medium text-lg transition-all duration-300 relative group"
              >
                상품 조회
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => navigate('/investment-knowledge-list')}
                className="text-gray-600 hover:font-semibold hover:text-blue-600 font-medium text-lg transition-all duration-300 relative group"
                >
                <span>투자 지식 iN</span>
                
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </div>
          

          {/* Search Bar and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className={`${
                isProductsPage
                  ? 'bg-white/60 hover:bg-white/80 backdrop-blur-md border border-white/30 hover:border-blue-400/60'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-300 hover:border-blue-400'
              } rounded-full px-4 py-2 flex items-center space-x-3 w-80 transition-all duration-300 group`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <input
                type="text"
                placeholder="원하는 검색어를 입력하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`ml-2 bg-transparent outline-none text-gray-600 placeholder-gray-400 text-sm flex-1 border-none focus:outline-none focus:ring-0 ${isInputActive ? '' : 'pointer-events-none'}`}
                readOnly={!isInputActive}
              />
              <button 
                onClick={handleSearch} 
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-300 inline-flex item-center justify-center"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* User Actions */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 bg-white hover:bg-gray-50 duration-300"
                >
                  {userProfileImage ? (
                    <img
                      src={userProfileImage}
                      alt="프로필"
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `${import.meta.env.VITE_API_URL}/uploads/profile_default.png`;
                      }}
                    />
                  ) : (
                    <img
                      src={`${import.meta.env.VITE_API_URL}/uploads/profile_default.png`}
                      alt="프로필"
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(_e) => {
                      }}
                    />
                  )}
                  
                  
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-48 ${
                      isProductsPage
                        ? 'bg-white/80 backdrop-blur-xl shadow-xl/60 border border-white/30'
                        : 'bg-white shadow-lg border border-gray-200'
                    } rounded-lg py-2 z-50`}>
                    {/* ADMIN이 아닐 때만 표시되는 메뉴들 */}
                    {userRole !== 'ADMIN' && (
                      <button
                        onClick={() => {
                          navigate('/mypage?tab=내 정보');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                      >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                        <span>마이페이지</span>
                      </button>
                    )}
                    {userRole !== 'ADMIN' && (
                      <button
                        onClick={() => {
                          navigate('/mypage?tab=내 상담 내역');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>상담 내역</span>
                      </button>
                    )}
                    {userRole !== 'ADMIN' && (
                      <button
                        onClick={() => {
                          navigate('/my-reviews');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
                        </svg>
                        <span>내 리뷰</span>
                      </button>
                    )}
                    {userRole !== 'ADMIN' && userRole !== 'ADVISOR' && (
                    <button
                        onClick={() => {
                          navigate('/mypage?tab=찜한 전문가');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                      >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                        <span>
                          찜한 전문가
                        </span>
                      </button>
                    )}
                    
                    {/* ADMIN일 때만 표시되는 관리자 페이지 메뉴 */}
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => {
                          navigate('/admin');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-blue-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a1 1 0 001 1h16a1 1 0 001-1V7M3 7l9-4 9 4" />
                        </svg>
                        <span>관리자 페이지</span>
                      </button>
                    )}
                    
                    <div className="border-t border-gray-200 my-1"></div>
                    
                    {/* 로그아웃 버튼 - 모든 role에서 표시 */}
                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          navigate('/');
                        } catch (error) {
                          console.error('로그아웃 실패:', error);
                        }
                        setShowProfileMenu(false);
                      }}
                      disabled={isLoggingOut}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>로그아웃</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className={`${
                  isProductsPage
                    ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600 hover:to-blue-700 backdrop-blur-sm shadow-lg/60'
                    : 'bg-blue-500 hover:bg-blue-600 shadow-md'
                } text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-all duration-300 transform hover:scale-105`}
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for dropdown */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar; 