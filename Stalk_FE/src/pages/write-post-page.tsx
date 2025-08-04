import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CommunityService from '@/services/communityService';
import { PostCategory, CommunityPostCreateRequestDto, CommunityPostUpdateRequestDto } from '@/types';

const WritePostPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState('knowledge');
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: PostCategory.QUESTION
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'knowledge' || tabParam === 'news') {
        setSelectedTab(tabParam);
    }

    // 수정 모드 확인
    const editParam = searchParams.get('edit');
    if (editParam) {
      setIsEditMode(true);
      setEditPostId(parseInt(editParam));
      fetchPostForEdit(parseInt(editParam));
    }
  }, [searchParams]);

  const fetchPostForEdit = async (postId: number) => {
    setLoading(true);
    try {
      const post = await CommunityService.getPostDetail(postId);
      setFormData({
        title: post.title,
        content: post.content,
        category: post.category as PostCategory
      });
    } catch (error) {
      console.error('Error fetching post for edit:', error);
      alert('게시글을 불러오는 중 오류가 발생했습니다.');
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromDisplayName = (displayName: string): PostCategory => {
    switch (displayName) {
      case '질문':
        return PostCategory.QUESTION;
      case '매매기록':
        return PostCategory.TRADE_RECORD;
      case '종목토론':
        return PostCategory.STOCK_DISCUSSION;
      case '시황분석':
        return PostCategory.MARKET_ANALYSIS;
      default:
        return PostCategory.QUESTION;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      if (isEditMode && editPostId) {
        // 수정 모드
        const updateData: CommunityPostUpdateRequestDto = {
          category: formData.category,
          title: formData.title.trim(),
          content: formData.content.trim()
        };
        
        await CommunityService.updatePost(editPostId, updateData);
        alert('게시글이 수정되었습니다.');
      } else {
        // 새 글 작성 모드
        const createData: CommunityPostCreateRequestDto = {
          category: formData.category,
          title: formData.title.trim(),
          content: formData.content.trim()
        };
        
        await CommunityService.createPost(createData);
        alert('게시글이 작성되었습니다.');
      }
      
      navigate('/community?tab=knowledge');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('게시글 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="from-gray-50 to-blue-50 rounded-lg p-8">
              {/* Page Header */}
              <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-900">투자지식iN 글쓰기</h1>
              </div>

              {/* 유의사항 */}
              <div className="flex flex-col items-start gap-4 mb-8 border-b border-gray-200 pb-8">
                <h2 className="text-lg font-semibold text-blue-700">작성 유의사항</h2>
                <ul className="list-inside space-y-2 w-full text-left text-sm text-gray-500 bg-blue-50 p-4 rounded-lg list-disc pl-7 py-6">
                  <li>본 게시판은 무료로 제공되는 서비스입니다. 무단 수집 및 활용을 금지합니다.</li>
                  <li>실명, 주민등록번호, 계좌번호 등 개인정보를 노출하지 마세요.</li>
                  <li>비방·욕성·스팸·상업적 광고 목적의 게시글은 사전 경고 없이 삭제될 수 있습니다.</li>
                  <li>전문가의 답변까지 다소 시간이 걸릴 수 있습니다. 급한 문의나 더욱 자세한 상담은 유료 상담을 이용해주세요.</li>
                  <li className='text-blue-500'>전문가의 답변은 참고용이며, 최종 투자 결정 및 손익에 대한 책임은 본인에게 있습니다.</li>
                </ul>
              </div>

              {/* Write Form */}
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Category Selection */}
                <div>
                  <label className="block text-left text-lg font-semibold text-gray-700 mb-3">
                    카테고리
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value="질문"
                        checked={formData.category === PostCategory.QUESTION}
                        onChange={(e) => setFormData({...formData, category: getCategoryFromDisplayName(e.target.value)})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-md">질문</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value="매매기록"
                        checked={formData.category === PostCategory.TRADE_RECORD}
                        onChange={(e) => setFormData({...formData, category: getCategoryFromDisplayName(e.target.value)})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-md">매매기록</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value="종목토론"
                        checked={formData.category === PostCategory.STOCK_DISCUSSION}
                        onChange={(e) => setFormData({...formData, category: getCategoryFromDisplayName(e.target.value)})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-md">종목토론</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value="시황분석"
                        checked={formData.category === PostCategory.MARKET_ANALYSIS}
                        onChange={(e) => setFormData({...formData, category: getCategoryFromDisplayName(e.target.value)})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-md">시황분석</span>
                    </label>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-lg text-left font-semibold text-gray-700 mb-3">
                    제목
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="제목을 입력하세요"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Content Input */}
                <div>
                  <label className="block text-left text-lg font-semibold text-gray-700 mb-3">
                    내용
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="내용을 입력하세요"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => navigate('/community?tab=knowledge')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? '처리 중...' : (isEditMode ? '수정' : '등록')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritePostPage; 