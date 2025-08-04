import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const KnowledgeBoardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState('knowledge');
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState([
    {
      id: 1,
      nickname: 'John Doe',
      createdAt: '2025-01-01',
      content: '주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',
    }
  ]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'knowledge' || tabParam === 'news') {
        setSelectedTab(tabParam);
    }
  }, [searchParams]);

  const handleCommentSubmit = () => {
    if (commentInput.trim() === '') return;
    
    const newComment = {
      id: comments.length + 1,
      nickname: '사용자',
      createdAt: new Date().toISOString().split('T')[0],
      content: commentInput,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',
    };
    
    setComments([...comments, newComment]);
    setCommentInput('');
  };

  const handleCommentDelete = (commentId: number) => {
    setComments(comments.filter(comment => comment.id !== commentId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommentSubmit();
    }
  };

  const knowledgePosts = [
    {
      id: 1,
      category: '주식',
      title: '주식 시장 분석',
      nickname: 'John Doe',
      createdAt: '2025-01-01',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',
      content: '주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용주식 시장 분석 내용',
      viewCount: 100,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="pt-16 w-64">
            <h2 className="mb-6 ml-4 text-left text-xl font-semibold text-gray-900">커뮤니티</h2>
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

          {/* Right Content */}
          <div className="pt-16 flex-1">
            <div className="mb-6 flex flex-col justify-start gap-3">
              <span className="text-left w-fit text-sm text-blue-500 rounded-full px-4 py-1 bg-blue-50">#{knowledgePosts[0].category}</span>
              <h2 className="text-left text-2xl font-semibold text-gray-900">{knowledgePosts[0].title}</h2>
              {/* 작성자 프로필 및 조회수 */}
              <div className='flex items-end justify-between border-b border-gray-200 pb-4'>
                {/* 작성자 프로필 */}
                <div className='flex items-center gap-2'>
                  {/* 작성자 프로필 이미지 */}
                  <img src={knowledgePosts[0].image} alt="작성자 프로필 이미지" className='w-10 h-10 rounded-full' />
                  {/* 작성자 닉네임 및 작성일자 */}
                  <div className='flex flex-col items-start ml-2'>
                    <span className='text-sm font-semibold'>{knowledgePosts[0].nickname}</span>
                    <span className='text-sm text-gray-500'>{knowledgePosts[0].createdAt}</span>
                  </div>
                </div>
                <span className='text-sm text-gray-500'>조회수 {knowledgePosts[0].viewCount}</span>
              </div>
              <span className='pt-5 pb-7 text-sm text-gray-500 leading-loose text-justify border-b border-gray-200'>{knowledgePosts[0].content}</span>

            </div>
            {/* 댓글 */}
            <div className='flex flex-col gap-4'>
              {/* 댓글 Title */}
              <div className='flex flex-row gap-3 items-end'>
                <h2 className='flex items-center justify-between text-xl font-semibold text-gray-900'>댓글</h2>
                <h3 className='text-sm text-gray-500'>Comment</h3>
              </div>
              {/* 댓글 작성 */}
              <div className='flex flex-row gap-3 items-center justify-between'>
                <input 
                  type="text" 
                  placeholder='댓글을 입력해주세요.' 
                  className='pl-5 py-2 w-full border border-blue-500 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500'
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  className='inline-flex items-center justify-center whitespace-nowrap px-3 py-2 bg-blue-500 text-white text-sm rounded-full'
                  onClick={handleCommentSubmit}
                >
                  작성
                </button>
              </div>
              {/* 댓글 목록 */}
              <div className='flex flex-col gap-5'>
                {comments.map((comment) => (
                  <div key={comment.id} className='pt-2 flex flex-col gap-3 items-start justify-between'>
                    {/* 댓글 작성자 이미지 & 프로필 + 수정 & 삭제 버튼 */}
                    <div className='flex flex-row items-center justify-between w-full'>
                      {/* 댓글 작성자 이미지 & 프로필 */}
                      <div className='flex flex-row gap-3 items-center'>
                        <img src={comment.image} alt="작성자 프로필 이미지" className='w-10 h-10 rounded-full' />
                        <div className='flex flex-col items-start ml-2'>
                          <span className='text-sm font-semibold'>{comment.nickname}</span>
                          <span className='text-sm text-gray-500'>{comment.createdAt}</span>
                        </div>
                      </div>
                      {/* 수정 & 삭제 버튼 */}
                      <div className='flex flex-row gap-2'>
                        <button className='text-sm text-gray-500 hover:text-blue-500 hover:font-semibold'>수정</button>
                        <p className='text-sm text-gray-500'>|</p>
                        <button 
                          className='text-sm text-gray-500 hover:text-red-500 hover:font-semibold'
                          onClick={() => handleCommentDelete(comment.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    {/* 댓글 내용 */}
                    <span className='pl-[60px] text-sm text-gray-500 leading-loose text-justify'>{comment.content}</span>
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
