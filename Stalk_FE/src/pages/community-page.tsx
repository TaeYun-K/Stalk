import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CommunityService from '@/services/communityService';
import { PostCategory, CommunityPostSummaryDto } from '@/types';

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
      console.log('Fetching posts with category:', PostCategory.ALL);
      const data = await CommunityService.getPosts(PostCategory.ALL);
      console.log('API Response:', data);
      setKnowledgePosts(data.content || []); // items -> content로 수정
      console.log('Set knowledge posts:', data.content || []); // items -> content로 수정
    } catch (error) {
      console.error('Error fetching knowledge posts:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId: number) => {
    navigate(`/knowledge-board/${postId}`);
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
      case PostCategory.QUESTION:
        return '질문';
      case PostCategory.TRADE_RECORD:
        return '매매기록';
      case PostCategory.STOCK_DISCUSSION:
        return '종목토론';
      case PostCategory.MARKET_ANALYSIS:
        return '시황분석';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="pt-16 w-64">
            <h2 className="mb-6 ml-4 text-left text-xl font-semibold text-gray-900">커뮤니티</h2>
            <nav className="space-y-2">
              <button
                onClick={() => navigate('/community?tab=news')}
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
                onClick={() => navigate('/community?tab=knowledge')}
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

          {/* Right Content */}
          <div className="pt-16 flex-1">
            {selectedTab === 'news' ? (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">뉴스</h1>
                <div className="grid gap-6">
                  {newsPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start space-x-4">
                        <img src={post.image} alt={post.title} className="w-24 h-24 object-cover rounded-lg" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {post.category}
                            </span>
                            <span className="text-sm text-gray-500">{post.date}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-3">{post.content}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm text-gray-500">작성자: {post.author}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">투자 지식iN</h1>
                  <button
                    onClick={() => navigate('/write-post')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    글쓰기
                  </button>
                </div>
                
                {knowledgePosts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">아직 게시글이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {knowledgePosts.map((post) => (
                      <div
                        key={post.postId}
                        onClick={() => handlePostClick(post.postId)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {getCategoryLabel(post.category)}
                            </span>
                            <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">조회 {post.viewCount}</span>
                            <span className="text-sm text-gray-500">댓글 {post.commentCount}</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">작성자: {post.authorName}</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => handleEditPost(post.postId, e)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              수정
                            </button>
                            <button
                              onClick={(e) => handleDeletePost(post.postId, e)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 