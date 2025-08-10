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
  const [pageNo, setPageNo] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  // URL 파라미터에서 탭 정보 읽기
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'news' || tabParam === 'knowledge') {
      setSelectedTab(tabParam);
    }
  }, [searchParams]);

  // 탭 변경 시 목록 초기화
  useEffect(() => {
    if (selectedTab === 'knowledge') {
      setKnowledgePosts([]);
      setPageNo(1);
      setHasNext(true);
      fetchKnowledgePosts(1);
    }
  }, [selectedTab]);

  const fetchKnowledgePosts = async (nextPageNo: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await CommunityService.getPostsPaged(PostCategory.ALL, nextPageNo, 10);
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

  const handleLoadMore = () => {
    if (loading || !hasNext) return;
    fetchKnowledgePosts(pageNo + 1);
  };

  const handlePostClick = (postId: number) => {
    navigate(`/knowledge-board/${postId}`);
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
    },
    {
      id: 4,
      title: '연준의 금리 동결, 시장에 미치는 영향은?',
      author: 'Courtney Henry',
      date: '2025.07.10',
      category: '시황',
      content: '연준이 기준금리를 동결하며 인플레이션 추이를 지켜보겠다는 의지를 보였습니다. 자산시장 반응을 정리합니다.',
      image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=200&fit=crop'
    },
    {
      id: 5,
      title: '원자재 가격 반등, 인플레 재점화 우려',
      author: 'Jenny Wilson',
      date: '2025.07.09',
      category: '시황',
      content: '유가와 구리 가격 등 주요 원자재가 반등세를 보이며 인플레이션 재점화 우려가 커지고 있습니다.',
      image: 'https://images.unsplash.com/photo-1549421263-5ec394a52d83?w=400&h=200&fit=crop'
    },
    {
      id: 6,
      title: '테슬라 실적 프리뷰: 마진 개선 가능성',
      author: 'Jacob Jones',
      date: '2025.07.08',
      category: '종목토론',
      content: '테슬라의 분기 실적을 앞두고 마진 개선 가능성과 신차 라인업의 영향력을 점검합니다.',
      image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=200&fit=crop'
    },
    {
      id: 7,
      title: '달러 강세 진정, 신흥국 증시에 훈풍',
      author: 'Wade Warren',
      date: '2025.07.07',
      category: '시황',
      content: '달러 강세가 진정되며 신흥국 증시로 자금 유입이 확대되고 있습니다. 지역별 수혜 섹터를 정리합니다.',
      image: 'https://images.unsplash.com/photo-1526304640581-1e39b9f1b6b7?w=400&h=200&fit=crop'
    },
    {
      id: 8,
      title: 'AI 반도체 수요 지속, 관련주 실적 모멘텀',
      author: 'Cody Fisher',
      date: '2025.07.06',
      category: '정보',
      content: '데이터센터와 엣지 컴퓨팅 수요가 AI 반도체 시장을 견인하고 있습니다. 주요 기업들의 실적 모멘텀을 분석합니다.',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=200&fit=crop'
    },
    {
      id: 9,
      title: '국내 배터리 3사, 북미 생산 본격화',
      author: 'Kathryn Murphy',
      date: '2025.07.05',
      category: '정보',
      content: 'IRA 정책에 맞춘 북미 생산이 본격화되며 배터리 3사의 수주 안정성이 강화되고 있습니다.',
      image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=400&h=200&fit=crop'
    },
    {
      id: 10,
      title: '반도체 업황 선행지표 개선 조짐',
      author: 'Guy Hawkins',
      date: '2025.07.04',
      category: '시황',
      content: '재고 조정 국면이 마무리되며 반도체 업황의 선행지표가 개선되는 모습입니다.',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=200&fit=crop'
    },
    {
      id: 11,
      title: '중국 소비 회복, 리오프닝 수혜 지속',
      author: 'Leslie Alexander',
      date: '2025.07.03',
      category: '시황',
      content: '중국의 소비 회복세가 뚜렷해지며 리오프닝 수혜 업종의 실적 개선이 이어지고 있습니다.',
      image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=200&fit=crop'
    },
    {
      id: 12,
      title: '국내 IT 대형주, 밸류에이션 재평가',
      author: 'Courtney Henry',
      date: '2025.07.02',
      category: '정보',
      content: '성장성 대비 저평가 논의가 부각되며 국내 IT 대형주의 밸류에이션이 재평가되고 있습니다.',
      image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=400&h=200&fit=crop'
    },
    {
      id: 13,
      title: '금 가격 급등, 안전자산 선호 확대',
      author: 'Eleanor Pena',
      date: '2025.07.01',
      category: '시황',
      content: '불확실성 확대에 따른 안전자산 선호로 금 가격이 급등했습니다. 자산배분 관점의 시사점을 정리합니다.',
      image: 'https://images.unsplash.com/photo-1553729784-e91953dec042?w=400&h=200&fit=crop'
    },
    {
      id: 14,
      title: '빅테크 클라우드 성장 둔화 우려 완화',
      author: 'Bessie Cooper',
      date: '2025.06.30',
      category: '정보',
      content: '클라우드 성장 둔화 우려가 완화되며 관련 빅테크 기업 주가가 반등했습니다.',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=200&fit=crop'
    },
    {
      id: 15,
      title: '국내 증시, 외국인 순매수 전환',
      author: 'Devon Lane',
      date: '2025.06.29',
      category: '시황',
      content: '외국인 수급이 순매수로 전환되며 지수 상승에 힘을 보탰습니다. 환율과 금리의 영향도 점검합니다.',
      image: 'https://images.unsplash.com/photo-1520975922325-24baf8eb3ef8?w=400&h=200&fit=crop'
    },
    {
      id: 16,
      title: '바이오 섹터, 신약 임상 소식에 강세',
      author: 'Darlene Robertson',
      date: '2025.06.28',
      category: '종목토론',
      content: '국내외 임상 소식이 이어지며 바이오 섹터 전반에 투자 심리가 개선되고 있습니다.',
      image: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=200&fit=crop'
    },
    {
      id: 17,
      title: '유럽 경기선행지수 개선, 경기 침체 우려 완화',
      author: 'Ralph Edwards',
      date: '2025.06.27',
      category: '시황',
      content: '유럽의 경기선행지수가 개선되며 경기 침체 우려가 다소 완화되었습니다.',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=200&fit=crop'
    },
    {
      id: 18,
      title: '국내 상용화 자율주행, 정책 지원 본격화',
      author: 'Theresa Webb',
      date: '2025.06.26',
      category: '정보',
      content: '자율주행 상용화를 위한 규제 샌드박스와 정책 지원이 본격화되고 있습니다.',
      image: 'https://images.unsplash.com/photo-1516570161787-2fd917215a3d?w=400&h=200&fit=crop'
    },
    {
      id: 19,
      title: '국채 금리 하락, 성장주 상대적 강세',
      author: 'Annette Black',
      date: '2025.06.25',
      category: '시황',
      content: '국채 금리 하락으로 성장주의 밸류에이션 부담이 완화되며 상대적 강세가 나타났습니다.',
      image: 'https://images.unsplash.com/photo-1554224155-1696413565d3?w=400&h=200&fit=crop'
    },
    {
      id: 20,
      title: '환율 안정, 수출주 실적 가시성 개선',
      author: 'Arlene McCoy',
      date: '2025.06.24',
      category: '시황',
      content: '환율이 안정세를 보이며 수출주의 실적 가시성이 개선되고 있습니다.',
      image: 'https://images.unsplash.com/photo-1529634899234-c03fda7f06a6?w=400&h=200&fit=crop'
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
                        <div className="flex-1 px-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {post.category}
                            </span>
                            <span className="text-sm text-gray-500">{post.date}</span>
                          </div>
                          <h3 className="text-left text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                          <p className="text-left text-gray-600 text-sm line-clamp-3">{post.content}</p>
                          <div className="mt-3 flex items-center justify-end">
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
                  <>
                    <div className="space-y-4">
                      {knowledgePosts.map((post) => (
                        <div
                          key={post.postId}
                          onClick={() => handlePostClick(post.postId)}
                          className="space-y-4 bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                {getCategoryLabel(post.category)}
                              </span>
                              <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                            </div>
                          </div>
                          <h3 className="text-left text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500">조회 {post.viewCount}</span>
                              <span className="text-sm text-gray-500">댓글 {post.commentCount}</span>
                            </div>
                            <span className="text-sm text-gray-500">작성자: {post.authorName}</span>
                          </div>
                        </div>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 