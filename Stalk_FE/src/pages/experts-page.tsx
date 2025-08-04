import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

interface Certificate {
  advisorId: number;
  certificateName: string;
  issuedBy: string;
}

interface Expert {
  id: number;
  name: string;
  profileImageUrl: string;
  preferredStyle: 'SHORT' | 'LONG';
  shortIntro: string;
  averageRating: number;
  reviewCount: number;
  consultationFee: number;
  isApproved: boolean;
  createdAt: string;
  certificates: Certificate[];
}

interface ApiResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: {
    content: Expert[];
    nextCursor: string | null;
    hasNext: boolean;
    pageSize: number;
    pageNo: number;
  };
}

const ExpertsPage = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API 호출
  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setLoading(true);
        const response = await AuthService.authenticatedRequest('/api/advisors');
        if (!response.ok) {
          throw new Error('Failed to fetch experts');
        }
        const data: ApiResponse = await response.json();
        if (data.isSuccess) {
          setExperts(data.result.content);
        } else {
          throw new Error(data.message || 'Failed to fetch experts');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching experts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, []);

  const filteredExperts = experts.filter(expert => {
    const matchesCategory = selectedCategory === 'all' || expert.preferredStyle.toLowerCase() === selectedCategory;
    const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.shortIntro.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 정렬 적용
  const sortedExperts = [...filteredExperts].sort((a, b) => {
    if (sortBy === 'recent') {
      // 최근 등록순 (createdAt 기준)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'many reviews') {
      // 리뷰 많은순
      return b.reviewCount - a.reviewCount;
    }
    return 0;
  });

  const handleKeywordClick = (keyword: string) => {
    if (keyword === '전체') {
      // 전체 클릭 시 모든 선택 해제
      setSelectedKeywords([]);
    } else {
      // 전체가 아닌 키워드 클릭 시 다중 선택
      setSelectedKeywords(prev => {
        if (prev.includes(keyword)) {
          // 이미 선택된 키워드면 제거
          return prev.filter(k => k !== keyword);
        } else {
          // 선택되지 않은 키워드면 추가
          return [...prev, keyword];
        }
      });
    }
  };

  const handleExpertClick = (expertId: number) => {
    navigate(`/expert-detail/${expertId}`);
  };

  const getPreferredStyleText = (style: string) => {
    return style === 'SHORT' ? '단기' : '장기';
  };

  const formatConsultationFee = (fee: number) => {
    return `${fee.toLocaleString()}원`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">전문가 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    // 추천 키워드 및 정렬 ---------------------------------------------------------------------
    <div className="min-h-screen bg-white relative">
      {/* 전문가 등록 버튼 - ADVISOR 역할인 경우에만 표시 */}
      {userInfo?.role === 'ADVISOR' && (
        <button
          onClick={() => navigate('/expert-registration')}
          className="fixed bottom-8 right-28 bg-blue-500 px-3 py-2hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-600 group z-50"
          style={{ width: 'fit-content' }}
        >
          <div className="flex items-center pb-1">
            <span className="text-2xl font-bold">+</span>
            <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-xs">
              전문가 등록
            </span>
          </div>
        </button>
      )}
      
      {/* 카테고리 */}
      <div className="max-w-7xl mt-16 mx-auto px-6 py-8">
        {/* Filter/Keywords Section */}
        <div className="flex items-center justify-between mb-8">
          {/* Keywords Section */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <span className="text-gray-700 font-medium whitespace-nowrap">추천 키워드</span>
                          <div 
                className="flex space-x-2 overflow-x-auto hide-scrollbar"
                onWheel={(e) => {
                  e.preventDefault();
                  const container = e.currentTarget;
                  container.scrollLeft += e.deltaY;
                }}
              >
                <button 
                  onClick={() => handleKeywordClick('전체')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedKeywords.length === 0 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  전체
                </button>
                <button 
                  onClick={() => handleKeywordClick('입문자 대상')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedKeywords.includes('입문자 대상')
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  입문자 대상
                </button>
                <button 
                  onClick={() => handleKeywordClick('중급자 대상')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedKeywords.includes('중급자 대상')
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  중급자 대상
                </button>
                <button 
                  onClick={() => handleKeywordClick('상급자 대상')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedKeywords.includes('상급자 대상')
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  상급자 대상
                </button>
                <button 
                  onClick={() => handleKeywordClick('단기')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedKeywords.includes('단기')
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  단기
                </button>
                <button 
                  onClick={() => handleKeywordClick('중단기')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedKeywords.includes('중단기')
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  중단기
                </button>
                <button 
                  onClick={() => handleKeywordClick('중기')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedKeywords.includes('중기')
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  중기
                </button>
                <button 
                  onClick={() => handleKeywordClick('중장기')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedKeywords.includes('중장기')
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  중장기
                </button>
                <button 
                  onClick={() => handleKeywordClick('장기')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedKeywords.includes('장기')
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  장기
                </button>
              </div>
          </div>
          <div className='flex flex-row items-center gap-2 flex-shrink-0'>
            <label className='text-gray-700 font-medium whitespace-nowrap' htmlFor="sorting">정렬: </label>
            <select
              id="sorting"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm text-gray-500 px-4 py-3"
            >
              <option value="recent">최근 등록순</option>
              <option value="many reviews">리뷰 많은순</option>
            </select>
          </div>
        </div>

        {/* 전문가 프로필 목록 --------------------------------------------------------------------- */}
        {/* Expert Profiles */}
        <div className="space-y-6">
          {sortedExperts.map((expert) => (
            <div 
              key={expert.id} 
              className="bg-white rounded-lg px-12 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleExpertClick(expert.id)}
            >
              <div className="flex h-50 items-start items-end justify-between">
                <div className="flex-1 py-10">
                  {/* Preferred Style */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-blue-500 py-1 text-xs font-semibold">
                      #{getPreferredStyleText(expert.preferredStyle)}
                    </span>
                    {expert.certificates.map((cert, index) => (
                      <span
                        key={index}
                        className="text-blue-500 py-1 text-xs font-semibold"
                      >
                        #{cert.certificateName}
                      </span>
                    ))}
                  </div>

                  {/* Name and Title & Rating and Reviews */}
                  <div className="mb-3 flex flex-row items-end gap-2">
                    <h3 className="text-left text-2xl font-extrabold text-gray-900">{expert.name} </h3>
                    <p className="text-left text-blue-600">컨설턴트</p>
                    <div className="flex items-center ml-4">
                      <div className="flex text-yellow-400">
                        ⭐
                      </div>
                      <span className="ml-2 font-semibold text-gray-900">{expert.averageRating.toFixed(1)}</span>
                      <span className="ml-4 text-gray-600">리뷰 {expert.reviewCount}개</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-lg font- text-left text-gray-700 mb-4">{expert.shortIntro}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-4 py-2 rounded-2xl text-xs font-medium bg-blue-100 text-blue-700">
                      {formatConsultationFee(expert.consultationFee)}
                    </span>
                    <span className="px-4 py-2 rounded-2xl text-xs font-medium bg-green-100 text-green-700">
                      번개 답변
                    </span>
                  </div>

                  
                </div>

                {/* Profile Image */}
                <div className="w-48 h-60
                 ml-6 flex items-end">
                  <img
                    src={expert.profileImageUrl}
                    alt={expert.name}
                    className="w-full h-full rounded-lg object-cover object-top"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {sortedExperts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600 mb-4">다른 검색어나 카테고리를 시도해보세요</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              전체 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertsPage; 