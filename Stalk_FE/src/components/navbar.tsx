import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import stalkLogoBlue from '@/assets/Stalk_logo_blue.svg';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showCommunityMenu, setShowCommunityMenu] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [communityMenuTimeout, setCommunityMenuTimeout] = useState<number | null>(null);

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

  // 로그인 상태 확인 (실제로는 context나 state management 사용)
  const isLoggedIn: boolean = location.pathname.includes('logged-in') || 
                    location.pathname === '/mypage' || 
                    location.pathname === '/consultations' ||
                    location.pathname === '/favorites';

  return (
    <nav className="bg-white fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              onClick={() => navigate('/experts')}
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
            <div 
              className="relative group"
              onMouseEnter={() => {
                if (communityMenuTimeout) {
                  clearTimeout(communityMenuTimeout);
                  setCommunityMenuTimeout(null);
                }
                setShowCommunityMenu(true);
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => {
                  setShowCommunityMenu(false);
                }, 200);
                setCommunityMenuTimeout(timeout);
              }}
            >
              <button 
                onClick={() => navigate('/community')}
                className="text-gray-600 hover:font-semibold hover:text-blue-600 font-medium text-lg transition-all duration-300 relative flex items-center space-x-1"
              >
                <span>커뮤니티</span>
               
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              
              {/* Community Dropdown Menu */}
              {showCommunityMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white backdrop-blur-xl rounded-2xl border border-white/20 py-2 z-50">
                  {/* Invisible bridge to prevent gap */}
                  <div className="h-4 -mt-4"></div>
                  <button
                    onClick={() => {
                      navigate('/community?tab=news');
                      setShowCommunityMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <span>뉴스</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/community?tab=knowledge');
                      setShowCommunityMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>투자 지식in</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="bg-gray-50 hover:bg-white border border-gray-200 hover:border-blue-300 rounded-full px-4 py-2 flex items-center space-x-3 w-80 transition-all duration-300 shadow-soft group-hover:shadow-modern">
                
                <input
                  type="text"
                  placeholder="핀톡을 검색해보세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-transparent outline-none text-gray-600 placeholder-gray-400 text-sm flex-1"
                />
                
                <button
                  onClick={handleSearch}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-300"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* User Actions */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm  duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    김
                  </div>
                  
                  
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 py-2 z-50">
                    
                    <button
                      onClick={() => {
                        navigate('/mypage');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>마이 페이지</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        navigate('/');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
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
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-2.5 rounded-2xl text-sm transition-all duration-300 transform hover:scale-105"
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