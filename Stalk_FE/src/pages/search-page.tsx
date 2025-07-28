import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface SearchResult {
  type: string;
  title: string;
  description: string;
  link: string;
}

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      console.log('검색어:', query);
      // 실제로는 API 호출을 통해 검색 결과를 가져옵니다
      simulateSearch(query);
    }
  }, [query]);

  const simulateSearch = (searchTerm: string): void => {
    setIsLoading(true);
    
    // 검색어를 소문자로 변환하여 비교
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    setTimeout(() => {
      const results: SearchResult[] = [];
      
      console.log('검색어 분석:', lowerSearchTerm);
      
      // 검색어에 따라 다른 결과 제공 (더 유연한 매칭)
      if (lowerSearchTerm.includes('투자') || lowerSearchTerm.includes('전문가') || 
          lowerSearchTerm.includes('상담') || lowerSearchTerm.includes('도움') ||
          lowerSearchTerm.includes('조언') || lowerSearchTerm.includes('가이드') ||
          lowerSearchTerm.includes('전문')) {
        console.log('전문가 상담 결과 추가');
        results.push({
          type: 'expert',
          title: '투자 전문가 상담',
          description: '경험 많은 투자 전문가와 1:1 상담을 받아보세요',
          link: '/experts'
        });
      }
      
      if (lowerSearchTerm.includes('상품') || lowerSearchTerm.includes('펀드') || 
          lowerSearchTerm.includes('주식') || lowerSearchTerm.includes('채권') ||
          lowerSearchTerm.includes('투자상품') || lowerSearchTerm.includes('금융상품') ||
          lowerSearchTerm.includes('상품조회') || lowerSearchTerm.includes('상품비교') ||
          lowerSearchTerm.includes('조회')) {
        console.log('상품 조회 결과 추가');
        results.push({
          type: 'product',
          title: '투자 상품 조회',
          description: '다양한 투자 상품을 비교하고 선택하세요',
          link: '/products'
        });
      }
      
      if (lowerSearchTerm.includes('커뮤니티') || lowerSearchTerm.includes('게시판') || 
          lowerSearchTerm.includes('토론') || lowerSearchTerm.includes('소통') ||
          lowerSearchTerm.includes('정보공유') || lowerSearchTerm.includes('의견') ||
          lowerSearchTerm.includes('후기') || lowerSearchTerm.includes('리뷰') ||
          lowerSearchTerm.includes('글') || lowerSearchTerm.includes('포스트')) {
        console.log('커뮤니티 결과 추가');
        results.push({
          type: 'community',
          title: '투자 커뮤니티',
          description: '다른 투자자들과 정보를 공유하고 토론하세요',
          link: '/community'
        });
      }
      
      // 추가 메뉴들
      if (lowerSearchTerm.includes('마이페이지') || lowerSearchTerm.includes('마이') || 
          lowerSearchTerm.includes('내정보') || lowerSearchTerm.includes('프로필') ||
          lowerSearchTerm.includes('계정')) {
        console.log('마이페이지 결과 추가');
        results.push({
          type: 'mypage',
          title: '마이페이지',
          description: '내 정보와 활동 내역을 확인하세요',
          link: '/mypage'
        });
      }
      
      if (lowerSearchTerm.includes('설정') || lowerSearchTerm.includes('환경설정') || 
          lowerSearchTerm.includes('옵션') || lowerSearchTerm.includes('프로필설정')) {
        console.log('설정 결과 추가');
        results.push({
          type: 'settings',
          title: '설정',
          description: '계정 설정과 환경설정을 변경하세요',
          link: '/settings'
        });
      }
      
      if (lowerSearchTerm.includes('글쓰기') || lowerSearchTerm.includes('작성') || 
          lowerSearchTerm.includes('포스트') || lowerSearchTerm.includes('게시글')) {
        console.log('글쓰기 결과 추가');
        results.push({
          type: 'write',
          title: '글쓰기',
          description: '커뮤니티에 새로운 글을 작성하세요',
          link: '/write-post'
        });
      }
      
      if (lowerSearchTerm.includes('상담') || lowerSearchTerm.includes('예약') || 
          lowerSearchTerm.includes('문의') || lowerSearchTerm.includes('1:1')) {
        console.log('상담 예약 결과 추가');
        results.push({
          type: 'consultation',
          title: '상담 예약',
          description: '전문가와 1:1 상담을 예약하세요',
          link: '/consultations'
        });
      }
      
      if (lowerSearchTerm.includes('즐겨찾기') || lowerSearchTerm.includes('북마크') || 
          lowerSearchTerm.includes('저장') || lowerSearchTerm.includes('관심')) {
        console.log('즐겨찾기 결과 추가');
        results.push({
          type: 'favorites',
          title: '즐겨찾기',
          description: '저장한 상품과 전문가를 확인하세요',
          link: '/favorites'
        });
      }
      
      // 기본 결과 (검색어가 명확하지 않을 때)
      if (results.length === 0) {
        console.log('기본 결과 추가');
        results.push(
          {
            type: 'expert',
            title: '투자 전문가 상담',
            description: '경험 많은 투자 전문가와 1:1 상담을 받아보세요',
            link: '/experts'
          },
          {
            type: 'product',
            title: '투자 상품 조회',
            description: '다양한 투자 상품을 비교하고 선택하세요',
            link: '/products'
          },
          {
            type: 'community',
            title: '투자 커뮤니티',
            description: '다른 투자자들과 정보를 공유하고 토론하세요',
            link: '/community'
          },
          {
            type: 'mypage',
            title: '마이페이지',
            description: '내 정보와 활동 내역을 확인하세요',
            link: '/mypage'
          },
          {
            type: 'consultation',
            title: '상담 예약',
            description: '전문가와 1:1 상담을 예약하세요',
            link: '/consultations'
          }
        );
      }
      
      console.log('최종 결과:', results);
      setSearchResults(results);
      setIsLoading(false);
    }, 500);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expert':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'product':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'community':
        return (
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'mypage':
        return (
          <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'settings':
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'write':
        return (
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'consultation':
        return (
          <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'favorites':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 검색 결과 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            검색 결과
          </h1>
          <p className="text-gray-600">
            "{query}"에 대한 검색 결과입니다.
          </p>
        </div>

        {/* 검색 결과 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => navigate(result.link)}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-modern border border-white/20 hover:shadow-glow transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {result.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {result.description}
                    </p>
                    <div className="flex items-center text-blue-600 font-medium">
                      <span>자세히 보기</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 검색 결과가 없을 때 */}
        {!isLoading && searchResults.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              다른 키워드로 검색해보세요.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-full transition-colors duration-300"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage; 