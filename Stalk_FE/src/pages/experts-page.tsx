import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import stalkLogoBlue from '@/assets/Stalk_logo_blue.svg';

const ExpertsPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: '전체', icon: '👥' },
    { id: 'stock', name: '주식', icon: '📈' },
    { id: 'fund', name: '펀드', icon: '💰' },
    { id: 'crypto', name: '암호화폐', icon: '₿' },
    { id: 'realestate', name: '부동산', icon: '🏠' },
    { id: 'insurance', name: '보험', icon: '🛡️' }
  ];

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

  const handleExpertClick = (expertId: number) => {
    navigate(`/expert-detail/${expertId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src={stalkLogoBlue} alt="Stalk" className="h-8" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">투자 전문가</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">상품 조회</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">커뮤니티</a>
          </nav>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="원하는 투자 전문가를 검색해보세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* User Profile Icon */}
          <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">👤</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter/Keyword Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">추천 키워드</span>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
                입문자 대상
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                중급자 대상
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                상급자 대상
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                기술적 분석
              </button>
            </div>
          </div>
          <div className="flex space-x-4">
            <button className="text-blue-600 hover:text-blue-700 font-medium">전체보기</button>
            <button className="text-blue-600 hover:text-blue-700 font-medium">리뷰 많은 순</button>
          </div>
        </div>

        {/* Expert Profiles */}
        <div className="space-y-6">
          {filteredExperts.map((expert) => (
            <div 
              key={expert.id} 
              className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleExpertClick(expert.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {expert.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Name and Title */}
                  <div className="mb-3 flex flex-row gap-2">
                    <h3 className="text-left text-xl font-extrabold text-gray-900">{expert.name} </h3>
                    <p className="text-left text-gray-600">{expert.title}</p>
                  </div>

                  {/* Rating and Reviews */}
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(parseFloat(expert.rating)) ? 'text-yellow-400' : 'text-gray-300'}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="ml-2 font-semibold text-gray-900">{expert.rating}</span>
                    <span className="ml-2 text-gray-600">리뷰 {expert.reviews}개</span>
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
        {filteredExperts.length === 0 && (
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