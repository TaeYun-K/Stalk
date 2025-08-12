import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommunityService from '@/services/communityService';
import { PostCategory, CommunityPostSummaryDto } from '@/types';
import { useAuth } from '@/context/AuthContext';

const InvestmentKnowledgeListPage = () => {
  const navigate = useNavigate();
  const [knowledgePosts, setKnowledgePosts] = useState<CommunityPostSummaryDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>(PostCategory.ALL);
  const [sortOption, setSortOption] = useState<'latest' | 'views' | 'comments'>('latest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const { isLoggedIn } = useAuth();


  const fetchKnowledgePosts = async (nextPageNo: number, category: PostCategory = selectedCategory) => {
    setLoading(true);
    setError(null);
    try {
      const data = await CommunityService.getPostsPaged(category, nextPageNo, 10);
      const newContent = data.content || [];
      setKnowledgePosts(prev => nextPageNo === 1 ? newContent : [...prev, ...newContent]);
      setHasNext(data.hasNext);
      setPageNo(nextPageNo);
    } catch (error) {
      console.error('Error fetching knowledge posts:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 카테고리가 바뀔 때마다 1페이지부터 다시 로드
    setKnowledgePosts([]);
    setHasNext(true);
    fetchKnowledgePosts(1, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleLoadMore = () => {
    if (loading || !hasNext) return;
    fetchKnowledgePosts(pageNo + 1, selectedCategory);
  };

  const handlePostClick = (postId: number) => {
    navigate(`/knowledge-board/${postId}`);
  };

  const getSortedPosts = (posts: CommunityPostSummaryDto[]) => {
    const sorted = [...posts];
    switch (sortOption) {
      case 'views':
        return sorted.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
      case 'comments':
        return sorted.sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
      case 'latest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const sortedPosts = getSortedPosts(knowledgePosts);

  const categoryOptions: { label: string; value: PostCategory }[] = [
    { label: '모든 분야', value: PostCategory.ALL },
    { label: '질문', value: PostCategory.QUESTION },
    { label: '종목토론', value: PostCategory.STOCK_DISCUSSION },
    { label: '매매기록', value: PostCategory.TRADE_RECORD },
    { label: '시황분석', value: PostCategory.MARKET_ANALYSIS },
  ];

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case PostCategory.QUESTION:
        return 'text-red-500 bg-red-50'; // 질문: 연한 빨강 배경, 빨강 글씨
      case PostCategory.STOCK_DISCUSSION:
        return 'text-orange-500 bg-orange-50'; // 종목토론: 연한 주황 배경, 주황 글씨
      case PostCategory.TRADE_RECORD:
        return 'text-green-600 bg-green-50'; // 매매기록: 연두색 배경, 녹색 글씨
      case PostCategory.MARKET_ANALYSIS:
        return 'text-blue-600 bg-blue-50'; // 시황분석: 하늘색 배경, 파란 글씨
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

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
      <div className="h-20"></div>
      {/* 상단 웰컴 이미지 */}
      <div className="relative w-full h-60 overflow-hidden flex justify-center">
        <img
          src="/public/investment-knowledge-list-image.jpeg"
          alt=""
          className="w-full h-full object-cover" />
        <div className="absolute gap-3 flex flex-col justify-center items-center bg-black/50 w-full h-full text-4xl font-bold text-white">
          <p className='text-center text-3xl'>함께 나누고, 함께 성장하는 투자 지식 iN</p>
          <p className='text-center text-lg font-light'>컨설턴트님들의 자문을 통해 도움을 얻어보세요.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-40">
        <div className="flex flex-col gap-8">
          <div className="pt-16 flex-1">
              <div className="space-y-6">
              <div className="flex items-center justify-between">
                {/* 왼쪽: 카테고리 드롭다운 */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as PostCategory)}
                    className="border rounded-xl px-4 py-3 text-gray-700 shadow-sm"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {/* 오른쪽: 정렬 버튼 + 글쓰기 */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-5 text-sm">
                    <button
                      onClick={() => setSortOption('latest')}
                      className={`${sortOption === 'latest' ? 'text-gray-800 border-b-2 border-gray-800 pb-0.5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      최신순
                    </button>
                    <button
                      onClick={() => setSortOption('views')}
                      className={`${sortOption === 'views' ? 'text-gray-800 border-b-2 border-gray-800 pb-0.5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      조회순
                    </button>
                    <button
                      onClick={() => setSortOption('comments')}
                      className={`${sortOption === 'comments' ? 'text-gray-800 border-b-2 border-gray-800 pb-0.5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      댓글순
                    </button>
                  </div>
                  {isLoggedIn ? (
                    <button
                      onClick={() => navigate('/write-post')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      글쓰기
                    </button>
                  ) : null}
                </div>
              </div>
              
              {knowledgePosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">아직 게시글이 없습니다.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {sortedPosts.map((post, idx) => (
                      <React.Fragment key={post.postId}>
                        <div
                          onClick={() => handlePostClick(post.postId)}
                          className="space-y-4 bg-white p-6 cursor-pointer rounded-lg hover:shadow-md"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm px-2 py-1 rounded-full ${getCategoryBadgeClass(post.category)}`}>
                                {getCategoryLabel(post.category)}
                              </span>
                              <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                            </div>
                          </div>
                          <h3 className="text-left text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500">조회 {post.viewCount}</span>
                              <span className="text-sm text-gray-500">답글 {post.commentCount}</span>
                            </div>
                            <span className="text-sm text-gray-500">작성자: {post.authorName}</span>
                          </div>
                        </div>
                        {idx < sortedPosts.length - 1 && (
                          <hr className='border-gray-200' />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  {/* Load More */}
                  <div className="pt-6 flex justify-center">
                    {hasNext ? (
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${loading ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {loading ? '불러오는 중...' : '더보기'}
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">마지막 페이지입니다</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentKnowledgeListPage; 