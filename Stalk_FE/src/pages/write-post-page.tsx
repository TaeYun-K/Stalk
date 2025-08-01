import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WritePostPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'free'
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // 글쓰기 로직 구현
    navigate('/community');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">글쓰기</h1>
            <button
              onClick={() => navigate('/community')}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Write Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                카테고리
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value="free"
                    checked={formData.category === 'free'}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-lg">자유게시판</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value="news"
                    checked={formData.category === 'news'}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-lg">뉴스</span>
                </label>
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                내용
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
                placeholder="내용을 입력하세요..."
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                첨부파일
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <div className="text-4xl mb-4">📎</div>
                <p className="text-gray-600 mb-2">파일을 드래그하여 업로드하거나 클릭하여 선택하세요</p>
                <p className="text-sm text-gray-500">최대 10MB, 이미지, PDF, 문서 파일 지원</p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/community')}
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
      </main>
    </div>
  );
};

export default WritePostPage; 