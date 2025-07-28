import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ExpertsPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);



  const experts = [
    {
      id: 1,
      name: '제임스',
      title: '컨설턴트',
      category: 'stock',
      rating: '4.8',
      reviews: 127,
      tags: ['#중급자 대상', '#CFA', '#단기매매'],
      features: ['30분 영상 상담', '번개 답변'],
      description: '<무수한 상담 후기 수>로 검증된 변호사/합리적 수임료',
      image: ''
    },
    {
      id: 2,
      name: '박주현',
      title: '컨설턴트',
      category: 'fund',
      rating: '4.6',
      reviews: 89,
      tags: ['#입문자 대상', '#금융', '#장기'],
      features: ['15분 영상 상담', '번개 답변'],
      description: '꼼꼼하고 정확하게 상담하여 명쾌한 해결책을 제시합니다',
      image: ''
    }
  ];

  const filteredExperts = experts.filter(expert => {
    const matchesCategory = selectedCategory === 'all' || expert.category === selectedCategory;
    const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 정렬 적용
  const sortedExperts = [...filteredExperts].sort((a, b) => {
    if (sortBy === 'recent') {
      // 최근 등록순 (ID 기준, 높은 ID가 최근)
      return b.id - a.id;
    } else if (sortBy === 'many reviews') {
      // 리뷰 많은순
      return b.reviews - a.reviews;
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

  return (
    // 추천 키워드 및 정렬 ---------------------------------------------------------------------
    <div className="min-h-screen bg-white">
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
              className="bg-white rounded-lg py-10 px-12 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleExpertClick(expert.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {expert.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="text-blue-500 py-1 text-xs font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Name and Title & Rating and Reviews */}
                  <div className="mb-3 flex flex-row items-end gap-2">
                    <h3 className="text-left text-2xl font-extrabold text-gray-900">{expert.name} </h3>
                    <p className="text-left text-blue-600">{expert.title}</p>
                    <div className="flex items-center ml-4">
                      <div className="flex text-yellow-400">
                        ⭐
                      </div>
                      <span className="ml-2 font-semibold text-gray-900">{expert.rating}</span>
                      <span className="ml-4 text-gray-600">리뷰 {expert.reviews}개</span>
                    </div>
                  </div>



                  {/* Description */}
                  <p className="text-lg font- text-left text-gray-700 mb-4">{expert.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {expert.features.map((feature, featureIndex) => {
                      let baseClass = "px-4 py-2 rounded-2xl text-xs font-medium";
                      let colorClass =
                        featureIndex === 0
                          ? "bg-blue-100 text-blue-700"
                          : featureIndex === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"; // 기본색

                      return (
                        <span key={featureIndex} className={`${baseClass} ${colorClass}`}>
                          {feature}
                        </span>
                      );
                    })}
                  </div>

                  
                </div>

                {/* Profile Image */}
                <div className="ml-6">
                  <img
                    src={expert.image}
                    alt={expert.name}
                    className="w-24 h-24 rounded-lg object-cover"
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