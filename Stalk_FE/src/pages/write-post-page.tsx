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
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/community?tab=knowledge')}
                    className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    등록하기
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