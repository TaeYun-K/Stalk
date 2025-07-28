import { useState } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';

const ProductsPage = () => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const products = [
    {
      id: 1,
      name: '삼성전자',
      code: '005930',
      category: 'stock',
      price: 75000,
      change: 2.5,
      volume: '12.5M',
      marketCap: '447.8조'
    },
    {
      id: 2,
      name: 'SK하이닉스',
      code: '000660',
      category: 'stock',
      price: 145000,
      change: -1.2,
      volume: '8.2M',
      marketCap: '105.3조'
    },
    {
      id: 3,
      name: '네이버',
      code: '035420',
      category: 'stock',
      price: 215000,
      change: 0.8,
      volume: '3.1M',
      marketCap: '35.2조'
    },
    {
      id: 4,
      name: '카카오',
      code: '035720',
      category: 'stock',
      price: 48500,
      change: -3.1,
      volume: '15.7M',
      marketCap: '21.8조'
    },
    {
      id: 5,
      name: 'LG에너지솔루션',
      code: '373220',
      category: 'stock',
      price: 425000,
      change: 1.7,
      volume: '2.3M',
      marketCap: '95.6조'
    },
    {
      id: 6,
      name: '현대차',
      code: '005380',
      category: 'stock',
      price: 185000,
      change: 0.5,
      volume: '4.8M',
      marketCap: '39.2조'
    }
  ];

  const categories = [
    { id: 'all', name: '전체', icon: '📊' },
    { id: 'stock', name: '주식', icon: '📈' },
    { id: 'bond', name: '채권', icon: '📋' },
    { id: 'fund', name: '펀드', icon: '💰' },
    { id: 'etf', name: 'ETF', icon: '🎯' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.code.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">상품 조회</h1>
            <p className="text-lg text-gray-600">다양한 투자 상품을 검색하고 비교해보세요</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative group">
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 hover:border-blue-300 rounded-2xl px-6 py-4 flex items-center space-x-4 transition-all duration-300 shadow-modern group-hover:shadow-glow">
                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="종목명 또는 종목코드를 입력하세요"
                  className="bg-transparent outline-none text-gray-700 placeholder-gray-400 text-lg flex-1"
                />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-2 shadow-modern border border-white/20">
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-blue-500 text-white shadow-modern'
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-modern border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-900">종목명</th>
                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-900">종목코드</th>
                    <th className="px-6 py-4 text-right text-lg font-semibold text-gray-900">현재가</th>
                    <th className="px-6 py-4 text-right text-lg font-semibold text-gray-900">등락률</th>
                    <th className="px-6 py-4 text-right text-lg font-semibold text-gray-900">거래량</th>
                    <th className="px-6 py-4 text-right text-lg font-semibold text-gray-900">시가총액</th>
                    <th className="px-6 py-4 text-center text-lg font-semibold text-gray-900">관심</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product, index) => (
                    <tr 
                      key={product.id} 
                      className="hover:bg-blue-50/50 transition-all duration-300 cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mr-4 shadow-modern">
                            <span className="text-white font-bold text-lg">
                              {product.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          {product.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {product.price.toLocaleString()}원
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          product.change > 0 
                            ? 'bg-red-100 text-red-800' 
                            : product.change < 0 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.change > 0 ? '↗' : product.change < 0 ? '↘' : '→'}
                          <span className="ml-1">
                            {product.change > 0 ? '+' : ''}{product.change}%
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 font-medium">{product.volume}</td>
                      <td className="px-6 py-4 text-right text-gray-600 font-medium">{product.marketCap}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          className={`group transition-all duration-300 transform hover:scale-110 ${
                            isInWatchlist(product.code) 
                              ? 'text-red-500' 
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                          onClick={() => {
                            if (isInWatchlist(product.code)) {
                              removeFromWatchlist(product.code);
                            } else {
                              addToWatchlist({
                                code: product.code,
                                name: product.name,
                                price: product.price,
                                change: product.change
                              });
                            }
                          }}
                        >
                          <svg className={`w-6 h-6 ${isInWatchlist(product.code) ? 'fill-current' : 'group-hover:fill-current'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* No Results */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600">다른 검색어를 입력해보세요</p>
            </div>
          )}

          {/* Market Summary */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-modern border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">KOSPI</h3>
                <span className="text-green-600 font-bold">+1.2%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">2,450.12</div>
              <div className="text-sm text-gray-600">전일 대비 +29.15</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-modern border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">KOSDAQ</h3>
                <span className="text-red-600 font-bold">-0.8%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">825.67</div>
              <div className="text-sm text-gray-600">전일 대비 -6.78</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-modern border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">거래량</h3>
                                        <span className="text-blue-500 font-bold">+15.3%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">1.2조원</div>
              <div className="text-sm text-gray-600">전일 대비 +158억원</div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default ProductsPage; 