import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const WritePostPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState('knowledge');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '질문'
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'knowledge' || tabParam === 'news') {
        setSelectedTab(tabParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // 글쓰기 로직 구현
    navigate('/community?tab=knowledge');
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
                        checked={formData.category === '질문'}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-md">질문</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value="매매기록"
                        checked={formData.category === '매매기록'}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-md">매매기록</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value="종목토론"
                        checked={formData.category === '종목토론'}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-md">종목토론</span>
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
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => navigate('/community?tab=knowledge')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl transition-colors"
                  >
                    등록
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