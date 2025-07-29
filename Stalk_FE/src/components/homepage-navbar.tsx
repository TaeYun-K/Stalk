import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import stalkLogoBlue from '@/assets/images/logos/Stalk_logo_blue.svg';
import profileDefault from '@/assets/images/profiles/Profile_default.svg';
import { useAuth } from '@/context/AuthContext';

const HomePageNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showCommunityMenu, setShowCommunityMenu] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [communityMenuTimeout, setCommunityMenuTimeout] = useState<number | null>(null);
  const [isInputActive, setIsInputActive] = useState<boolean>(false); // 마우스 이벤트 상태 관리
  const [isNavBarScrolled, setIsNavBarScrolled] = useState<boolean>(false); // 스크롤 상태 관리
  const [userProfileImage, setUserProfileImage] = useState<string>(''); // 사용자 프로필 이미지

  // 사용자 프로필 이미지 가져오기
  const fetchUserProfileImage = async () => {
    try {
      // 실제 API 호출 (임시로 localStorage에서 user_id를 가져온다고 가정)
      const userId = localStorage.getItem('userId') || '1'; // 임시 user_id
      
      // API 호출 예시 (실제 엔드포인트로 수정 필요)
      const response = await fetch(`/api/user_community_images?user_id=${userId}`);
      const data = await response.json();
      
      if (data.image_path) {
        setUserProfileImage(data.image_path);
      } else {
        setUserProfileImage(profileDefault);
      }
    } catch (error) {
      console.error('프로필 이미지 로드 실패:', error);
      setUserProfileImage(profileDefault);
    }
  };

  // 스크롤 상태 변경 함수
  const handleScroll = (): void => {
    if (window.scrollY > window.innerHeight) {
      setIsNavBarScrolled(true); // 스크롤이 비디오 영역을 지나가면 true로 설정
    } else {
      setIsNavBarScrolled(false); // 비디오 영역 안에 있을 때
    }
  };

  // 스크롤 이벤트를 감지하는 useEffect
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  // AuthContext에서 로그인 상태를 가져오므로 별도의 로그인 상태 관리 제거

  // 로그인 상태가 변경될 때 프로필 이미지 가져오기
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserProfileImage();
    } else {
      setUserProfileImage('');
    }
  }, [isLoggedIn]);

  return (
    <nav className={`fixed top-0 left-0 right-20 z-10 ${isNavBarScrolled ? 'text-gray-900 bg-white' : 'text-white'}`}>
      <div className="justify-between sm:px-10 lg:px-16">
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
          <div className="hidden md:flex items-center space-x-10">
            <button 
              onClick={() => navigate('/experts')}
              className="hover:font-semibold hover:text-blue-500 font-medium text-lg transition-all duration-300 relative group"
            >
              투자 전문가
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => navigate('/products')}
              className="hover:font-semibold hover:text-blue-500 font-medium text-lg transition-all duration-300 relative group"
            >
              상품 조회
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <div 
              className="relative group"
              onMouseEnter={() => {
                if (communityMenuTimeout) {
                  window.clearTimeout(communityMenuTimeout);
                  setCommunityMenuTimeout(null);
                }
                setShowCommunityMenu(true);
              }}
              onMouseLeave={() => {
                const timeout = window.setTimeout(() => {
                  setShowCommunityMenu(false);
                }, 200);
                setCommunityMenuTimeout(timeout);
              }}
            >
              <button 
                onClick={() => navigate('/community')}
                className="hover:font-semibold hover:text-blue-500 font-medium text-lg transition-all duration-300 relative flex items-center space-x-1"
              >
                <span>커뮤니티</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              {/* Community Dropdown Menu */}
              {showCommunityMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white backdrop-blur-xl rounded-2xl border border-white/20 py-2 z-50">
                  <button
                    onClick={() => {
                      navigate('/community?tab=news');
                      setShowCommunityMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors flex items-center space-x-3"
                  >
                    뉴스
                  </button>
                  <button
                    onClick={() => {
                      navigate('/community?tab=free');
                      setShowCommunityMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors flex items-center space-x-3"
                  >
                    자유게시판
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="bg-gray-50 hover:bg-white border border-gray-200 hover:border-blue-300 rounded-full px-4 py-2 flex items-center space-x-3 w-80 transition-all duration-300 shadow-soft group-hover:shadow-modern" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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
                  className="w-11 h-11 rounded-full overflow-hidden hover:shadow-modern transition-all duration-300 hover:scale-105"
                >
                  <img 
                    src={userProfileImage || profileDefault} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = profileDefault;
                    }}
                  />
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>마이페이지</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/consultations');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>상담 내역</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/favorites');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>찜한 전문가</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          setShowProfileMenu(false);
                          navigate('/');
                          window.scrollTo({ top: 0, behavior: 'smooth'});
                        } catch (error) {
                          console.error('로그아웃 실패:', error);
                        }
                      }}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>로그아웃</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-2.5 rounded-2xl text-sm transition-all duration-300 transform hover:scale-105">
                로그인
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for dropdown */}
      {showProfileMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
      )}
    </nav>
  );
};

export default HomePageNavbar; 