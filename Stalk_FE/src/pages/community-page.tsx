import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CommunityService, { CommunityPostSummaryDto, PostCategory } from '@/services/communityService';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState('news');
  const [knowledgePosts, setKnowledgePosts] = useState<CommunityPostSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL 파라미터에서 탭 정보 읽기
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'news' || tabParam === 'knowledge') {
      setSelectedTab(tabParam);
    }
  }, [searchParams]);

  // Fetch knowledge posts when tab is selected
  useEffect(() => {
    if (selectedTab === 'knowledge') {
      fetchKnowledgePosts();
    }
  }, [selectedTab]);

  const fetchKnowledgePosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await CommunityService.getPosts(PostCategory.INVESTMENT_KNOWLEDGE);
      setKnowledgePosts(data.items || []);
    } catch (error) {
      console.error('Error fetching knowledge posts:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId: number) => {
    navigate(`/community/post/${postId}`);
  };

  const handleDeletePost = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await CommunityService.deletePost(postId);
      alert('게시글이 삭제되었습니다.');
      fetchKnowledgePosts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditPost = (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/write-post?edit=${postId}`);
  };

  const newsPosts = [
    {
      id: 1,
      title: '[강력한 실적 + 노동시장 견고-> 지수 신고점] 18 Jul 2025, from smartkarma',
      author: 'Floyd Miles',
      date: '2025.07.18',
      category: '정보',
      content: '미국 주식시장이 새로운 고점을 기록하며 상승세를 이어가고 있습니다. 강력한 기업 실적과 견고한 노동시장이 지수를 끌어올리고 있는 상황입니다.',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop'
    },
    {
      id: 2,
      title: '"버핏은 틀렸다"는 말은 몇 번이나 틀렸는가.',
      author: 'Marvin McKinney',
      date: '2025.07.14',
      category: '정보',
      content: '워렌 버핏의 투자 철학과 예측에 대한 재평가가 이루어지고 있습니다. 그의 투자 원칙들이 현대 시장에서도 여전히 유효한지 살펴보겠습니다.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop'
    },
    {
      id: 3,
      title: '엔비디아의 삼성 HBM 생산 허가? 적정 주가 추론해봤습니다.',
      author: 'Jerome Bell',
      date: '2025.05.24',
      category: '종목토론',
      content: '엔비디아와 삼성전자의 HBM 생산 협력 소식이 시장에 긍정적인 영향을 미칠 것으로 예상됩니다. 적정 주가를 분석해보겠습니다.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop'
    }
  ];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case PostCategory.INVESTMENT_KNOWLEDGE:
        return '투자지식in';
      case PostCategory.MARKET_ANALYSIS:
        return '시장분석';
      case PostCategory.PORTFOLIO:
        return '포트폴리오';
      case PostCategory.NEWS:
        return '뉴스';
      default:
        return category;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="pt-16 w-64">
            <div className="mb-6">
              <h2 className="ml-4 text-left text-xl font-semibold text-gray-900">커뮤니티</h2>
            </div>
            <nav className="space-y-2">
              <button
                onClick={() => setSelectedTab('news')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                  selectedTab === 'news'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>뉴스</span>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedTab('knowledge')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                  selectedTab === 'knowledge'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>투자 지식iN</span>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 pt-16">
            {selectedTab === 'news' && (
              <div className="space-y-6">
                {/* Search and Sort */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="뉴스 검색"
                        className="w-full pl-6 pr-10 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <select className="px-4 py-3 focus:outline-none">
                      <option>최신순</option>
                      <option>인기순</option>
                      <option>조회순</option>
                    </select>
                  </div>
                </div>

                {/* News Feed */}
                <div className="space-y-6">
                  {newsPosts.map((post) => (
                    <div key={post.id} className="bg-white border-b border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex gap-6">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">{post.category}</span>
                            <span className="text-sm text-gray-500"></span>
                          </div>
                          <h3 className="text-left text-lg font-semibold text-gray-900 my-3">{post.title}</h3>
                          <p className="text-left text-gray-600 mb-3 leading-loose">{post.content}</p>
                          <div className="flex items-center justify-end">
                            <span className="text-sm text-gray-500">{post.date} / {post.author}</span>
                          </div>
                        </div>
                        <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden">
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'knowledge' && (
              <div className="space-y-6">
                {/* Search and Sort */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="투자 질문 검색"
                        className="w-full pl-6 pr-10 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <select className="px-4 py-3 focus:outline-none">
                      <option>최신순</option>
                      <option>인기순</option>
                      <option>조회순</option>
                    </select>
                    <button
                      onClick={() => navigate('/write-post')}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>글쓰기</span>
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Posts Table */}
                <div className="bg-white rounded-lg overflow-hidden">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="text-gray-500">로딩 중...</div>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">카테고리</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">제목</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">작성자</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">작성일</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {knowledgePosts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              게시글이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          knowledgePosts.map((post) => (
                            <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handlePostClick(post.id)}>
                              <td className="px-4 py-3 text-sm text-gray-900">{getCategoryLabel(post.category)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-left">{post.title}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{post.authorName}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(post.createdAt)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={(e) => handleEditPost(post.id, e)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={(e) => handleDeletePost(post.id, e)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-end">         
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 text-gray-500 hover:text-gray-700">{"<<"}</button>
                    <button className="px-3 py-1 text-gray-500 hover:text-gray-700">{"<"}</button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
                    <button className="px-3 py-1 text-gray-500 hover:text-gray-700">2</button>
                    <button className="px-3 py-1 text-gray-500 hover:text-gray-700">3</button>
                    <button className="px-3 py-1 text-gray-500 hover:text-gray-700">4</button>
                    <span className="px-2 text-gray-500">...</span>
                    <button className="px-3 py-1 text-gray-500 hover:text-gray-700">40</button>
                    <button className="px-3 py-1 text-gray-500 hover:text-gray-700">{">"}</button>
                    <button className="px-3 py-1 text-gray-500 hover:text-gray-700">{">>"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 