import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import CommunityService from '@/services/communityService';
import AuthService from '@/services/authService';
import { PostCategory, CommunityPostDetailDto, CommunityCommentDto } from '@/types';

const KnowledgeBoardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postId } = useParams<{ postId: string }>();
  const [selectedTab, setSelectedTab] = useState('knowledge');
  const [commentInput, setCommentInput] = useState('');
  const [postDetail, setPostDetail] = useState<CommunityPostDetailDto | null>(null);
  const [comments, setComments] = useState<CommunityCommentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');

  useEffect(() => {
    // 뉴스 탭 제거로 인해 항상 knowledge로 고정
    setSelectedTab('knowledge');
  }, [searchParams]);

  // 게시글 상세 정보 로드
  useEffect(() => {
    if (postId) {
      loadPostDetail();
      loadComments();
    }
  }, [postId]);

  // 현재 사용자 정보 로드
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        if (AuthService.isLoggedIn()) {
          const userProfile = await AuthService.getUserProfile();
          setCurrentUser(userProfile);
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        setCurrentUser(null);
        console.error('사용자 정보 로드 실패:', e);
      }
    };
    loadCurrentUser();
  }, []);

  const loadPostDetail = async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await CommunityService.getPostDetail(parseInt(postId));
      setPostDetail(data);
    } catch (error) {
      console.error('Error fetching post detail:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };


  const handleDeletePost = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await CommunityService.deletePost(postId);
      alert('게시글이 삭제되었습니다.');
      navigate('/community?tab=knowledge');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditPost = (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/write-post?edit=${postId}`);
  };

  const loadComments = async () => {
    if (!postId) return;

    try {
      const data = await CommunityService.getComments(parseInt(postId));
      setComments(data.content || []); // items -> content로 수정
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (commentInput.trim() === '' || !postId) return;
    // 비전문가/비로그인 사용자 가드
    if (!currentUser) {
      alert('로그인이 필요합니다. 로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'ADVISOR') {
      alert('댓글 작성은 전문가만 가능합니다. 전문가 승인 후 이용해주세요.');
      return;
    }
    try {
      await CommunityService.createComment(parseInt(postId), { content: commentInput });
      setCommentInput('');
      loadComments(); // 댓글 목록 새로고침
    } catch (error: any) {
      console.error('Error creating comment:', error);
      const message = error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.';
      alert(message);
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await CommunityService.deleteComment(commentId);
      loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 댓글 수정 시작
  const handleCommentEditStart = (commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingContent(currentContent);
  };

  // 댓글 수정 취소
  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  // 댓글 수정 저장
  const handleCommentEditSave = async (commentId: number) => {
    if (!editingContent.trim()) {
      alert('수정할 내용을 입력해주세요.');
      return;
    }
    try {
      await CommunityService.updateComment(commentId, { content: editingContent.trim() });
      setEditingCommentId(null);
      setEditingContent('');
      await loadComments();
    } catch (e: any) {
      const message = e instanceof Error ? e.message : '댓글 수정 중 오류가 발생했습니다.';
      alert(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommentSubmit();
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

  if (!postDetail) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">게시글을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar: 뉴스 탭 제거, 투자지식iN만 노출 */}
          <div className="pt-16 w-64">
            <h2 className="mb-6 ml-4 text-left text-xl font-semibold text-gray-900">커뮤니티</h2>
            <nav className="space-y-2">
              <button
                onClick={() => navigate('/community?tab=knowledge')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                  selectedTab === 'knowledge'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>투자지식iN</span>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>

          {/* Right Content */}
          <div className="pt-16 flex-1">
            <div className="mb-6 flex flex-col justify-start gap-3">
              <span className="text-left w-fit text-sm text-blue-500 rounded-full px-4 py-1 bg-blue-50">
                #{getCategoryLabel(postDetail.category)}
              </span>
              <h2 className="text-left text-2xl font-semibold text-gray-900">{postDetail.title}</h2>
              {/* 작성자 프로필 및 조회수 */}
              <div className='flex items-end justify-between border-b border-gray-200 pb-4'>
                {/* 작성자 프로필 */}
                <div className='flex items-center gap-2'>
                  {/* 작성자 프로필 이미지 */}
                  <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center'>
                    <span className='text-sm font-semibold text-gray-600'>
                      {postDetail.authorName.charAt(0)}
                    </span>
                  </div>
                  {/* 작성자 닉네임 및 작성일자 */}
                  <div className='flex flex-col items-start ml-2'>
                    <span className='text-sm font-semibold'>{postDetail.authorName}</span>
                    <span className='text-sm text-gray-500'>{formatDate(postDetail.createdAt)}</span>
                  </div>
                </div>
                <div className='flex flex-row gap-4'>
                <span className='text-sm text-gray-500'>조회수 {postDetail.viewCount}</span>
                <div className="flex space-x-2">
                  {/* 게시글 수정/삭제 버튼은 필요 시 소유자/관리자에만 노출 */}
                  {currentUser && (currentUser.role === 'ADMIN' || postDetail.authorName === (currentUser.name ?? currentUser.userId)) && (
                    <>
                      <button
                        onClick={(e) => handleEditPost(postDetail.postId, e)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => handleDeletePost(postDetail.postId, e)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
                </div>
              </div>
              <span className='pt-5 pb-7 text-sm text-gray-500 leading-loose text-justify border-b border-gray-200'>
                {postDetail.content}
              </span>
            </div>

            {/* 댓글 */}
            <div className='flex flex-col gap-4'>
              {/* 댓글 Title */}
              <div className='flex flex-row gap-3 items-end'>
                <h2 className='flex items-center justify-between text-xl font-semibold text-gray-900'>댓글</h2>
                <h3 className='text-sm text-gray-500'>Comment</h3>
              </div>

              {/* 댓글 작성 */}
              <div className='flex flex-col gap-2'>
                <div className='flex flex-row gap-3 items-center justify-between'>
                  <input
                    type="text"
                    placeholder='댓글을 입력해주세요.'
                    className={`pl-5 py-2 w-full border rounded-full focus:outline-none focus:ring-1 ${currentUser?.role === 'ADVISOR' ? 'border-blue-500 focus:ring-blue-500' : 'border-gray-300'}`}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!currentUser || currentUser.role !== 'ADVISOR'}
                  />
                  <button
                    className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-sm rounded-full ${(!currentUser || currentUser.role !== 'ADVISOR') ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
                    onClick={handleCommentSubmit}
                    disabled={!currentUser || currentUser.role !== 'ADVISOR'}
                  >
                    작성
                  </button>
                </div>
                {/* 안내 문구 */}
                {!currentUser && (
                  <p className='text-xs text-gray-500 pl-3'>로그인이 필요합니다. 로그인 후 이용해주세요.</p>
                )}
                {currentUser && currentUser.role !== 'ADVISOR' && (
                  <p className='text-xs text-gray-500 pl-3'>댓글 작성은 전문가만 가능합니다. 전문가 승인 후 이용해주세요.</p>
                )}
              </div>

              {/* 댓글 목록 */}
              <div className='flex flex-col gap-5'>
                {comments.map((comment) => (
                  <div key={comment.commentId} className='pt-2 flex flex-col gap-3 items-start justify-between'>
                    {/* 댓글 작성자 이미지 & 프로필 + 수정 & 삭제 버튼 */}
                    <div className='flex flex-row items-center justify-between w-full'>
                  {/* 댓글 작성자 이미지 & 프로필 */}
                      <div className='flex flex-row gap-3 items-center'>
                        <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center'>
                          <span className='text-sm font-semibold text-gray-600'>
                            {comment.authorName.charAt(0)}
                          </span>
                        </div>
                        <div className='flex flex-col items-start ml-2'>
                          <span className='text-sm font-semibold'>{comment.authorName}</span>
                          <span className='text-sm text-gray-500'>{formatDate(comment.createdAt)}</span>
                        </div>
                      </div>
                    {/* 수정 & 삭제 버튼: 본인(또는 관리자)만 표시 */}
                    {currentUser && (currentUser.role === 'ADMIN' || comment.authorName === (currentUser.name ?? currentUser.userId)) && (
                      <div className='flex flex-row gap-2'>
                        {editingCommentId === comment.commentId ? (
                          <>
                            <button
                              className='text-sm text-blue-600 hover:text-blue-800 font-semibold'
                              onClick={() => handleCommentEditSave(comment.commentId)}
                            >
                              저장
                            </button>
                            <p className='text-sm text-gray-500'>|</p>
                            <button
                              className='text-sm text-gray-500 hover:text-gray-700'
                              onClick={handleCommentEditCancel}
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className='text-sm text-gray-500 hover:text-blue-500 hover:font-semibold'
                              onClick={() => handleCommentEditStart(comment.commentId, comment.content)}
                            >
                              수정
                            </button>
                            <p className='text-sm text-gray-500'>|</p>
                            <button
                              className='text-sm text-gray-500 hover:text-red-500 hover:font-semibold'
                              onClick={() => handleCommentDelete(comment.commentId)}
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    </div>
                    {/* 댓글 내용 */}
                    {editingCommentId === comment.commentId ? (
                      <div className='pl-[60px] w-full'>
                        <textarea
                          className='w-full p-3 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                          rows={3}
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                        />
                      </div>
                    ) : (
                      <span className='pl-[60px] text-sm text-gray-500 leading-loose text-justify'>{comment.content}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBoardPage;
