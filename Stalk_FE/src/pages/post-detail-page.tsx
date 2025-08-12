import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CommunityService from '@/services/communityService';
import { CommunityPostDetailDto, PostCategory } from '@/types';
import AuthService from '@/services/authService';

const PostDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<CommunityPostDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 현재 사용자 정보 로드
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        if (AuthService.isLoggedIn()) {
          const userProfile = await AuthService.getUserProfile();
          setCurrentUser(userProfile);
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };
    
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (postId) {
      fetchPostDetail();
    }
  }, [postId]);

  const fetchPostDetail = async () => {
    if (!postId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await CommunityService.getPostDetail(parseInt(postId));
      setPost(data);
    } catch (error) {
      console.error('Error fetching post detail:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postId) return;
    
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await CommunityService.deletePost(parseInt(postId));
      alert('게시글이 삭제되었습니다.');
      navigate('/community');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditPost = () => {
    if (!postId) return;
    navigate(`/write-post?edit=${postId}`);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case PostCategory.QUESTION:
        return '질문';
      case PostCategory.TRADE_RECORD:
        return '거래기록';
      case PostCategory.STOCK_DISCUSSION:
        return '주식토론';
      case PostCategory.MARKET_ANALYSIS:
        return '시장분석';
      default:
        return category;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <main className="px-4 sm:px-6 lg:px-8 py-8 pt-28">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <main className="px-4 sm:px-6 lg:px-8 py-8 pt-28">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error || '게시글을 찾을 수 없습니다.'}
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/community')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">게시글</h1>
            <button
              onClick={() => navigate('/community')}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Post Content */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Post Header */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                    {getCategoryLabel(post.category)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {/* 게시글 작성자이거나 관리자인 경우에만 수정/삭제 버튼 표시 */}
                  {(currentUser && (currentUser.userId === post.authorName || currentUser.role === 'ADMIN')) && (
                    <>
                      <button
                        onClick={handleEditPost}
                        className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm border border-blue-600 rounded hover:bg-blue-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={handleDeletePost}
                        className="px-3 py-1 text-red-600 hover:text-red-800 text-sm border border-red-600 rounded hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h2>
              <div className="flex items-center text-sm text-gray-500">
                <span>작성자: {post.authorName}</span>
                {post.updatedAt !== post.createdAt && (
                  <span className="ml-4">수정됨: {formatDate(post.updatedAt)}</span>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="prose max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => navigate('/community')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              목록으로
            </button>
            <button
              onClick={() => navigate('/write-post')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              새 글쓰기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetailPage; 