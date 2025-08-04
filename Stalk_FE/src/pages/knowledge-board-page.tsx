import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const KnowledgeBoardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState('knowledge');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'knowledge' || tabParam === 'news') {
        setSelectedTab(tabParam);
    }
  }, [searchParams]);

  const knowledgePosts = [
    {
      id: 1,
      category: '주식',
      title: '주식 시장 분석',
      nickname: 'John Doe',
      createdAt: '2025-01-01',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',
      content: '주식 시장 분석 내용',
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
            <div className="mb-6">
              <h2 className="ml-4 text-left text-xl font-semibold text-gray-900">커뮤니티</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBoardPage;
