
import { useNavigate } from 'react-router-dom';

const FavoritesPage = () => {
  const navigate = useNavigate();

  const favoriteExperts = [
    {
      id: 1,
      name: '박주현',
      title: '투자 입문 컨설턴트',
      rating: 4.8,
      reviews: 127,
      tags: ['#초급(1년 미만)', '#단기 투자'],
      image: '👨‍💼',
      price: '50,000원/30분'
    },
    {
      id: 2,
      name: '제임스',
      title: 'CFP 전문가',
      rating: 4.9,
      reviews: 89,
      tags: ['#CFP', '#중급자 대상', '#금융투자 분석사', '#CFA'],
      image: '👨‍💻',
      price: '80,000원/30분'
    },
    {
      id: 3,
      name: '김미영',
      title: '부동산 투자 전문가',
      rating: 4.7,
      reviews: 156,
      tags: ['#부동산', '#장기 투자'],
      image: '👩‍💼',
      price: '70,000원/30분'
    },
    {
      id: 4,
      name: '이준호',
      title: '암호화폐 전문가',
      rating: 4.6,
      reviews: 203,
      tags: ['#암호화폐', '#고위험 고수익'],
      image: '👨‍🔬',
      price: '100,000원/30분'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">찜한 전문가</h1>
            <div className="text-gray-600">
              총 <span className="font-semibold text-blue-600">{favoriteExperts.length}명</span>의 전문가
            </div>
          </div>

          {/* Favorites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {favoriteExperts.map((expert) => (
              <div
                key={expert.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                    {expert.image}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{expert.name}</h3>
                    <p className="text-gray-600">{expert.title}</p>
                  </div>
                  <button className="text-red-500 hover:text-red-600 text-2xl transition-colors">
                    ❤️
                  </button>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    <span className="text-yellow-400">⭐</span>
                    <span className="ml-1 font-semibold">{expert.rating}</span>
                  </div>
                  <span className="text-gray-500">({expert.reviews}리뷰)</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {expert.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mb-4">
                  <p className="text-lg font-semibold text-gray-900">{expert.price}</p>
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => navigate(`/expert/${expert.id}`)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
                  >
                    상세보기
                  </button>
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors">
                    예약하기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {favoriteExperts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❤️</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">찜한 전문가가 없습니다</h3>
              <p className="text-gray-600 mb-4">관심 있는 전문가를 찜해보세요</p>
              <button
                onClick={() => navigate('/experts')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                전문가 찾기
              </button>
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default FavoritesPage; 