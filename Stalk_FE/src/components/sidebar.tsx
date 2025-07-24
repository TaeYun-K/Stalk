import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Toss_symbol from '@/assets/Toss_Symbol_Primary.svg';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: string;
}

interface Notification {
  id: string;
  timestamp: string;
  type: 'cancel' | 'complete';
  message: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [selectedMenu, setSelectedMenu] = useState<string>('notifications');

  const menuItems: MenuItem[] = [
    {
      id: 'notifications',
      label: '알림',
      path: '/notifications',
      icon: '🔔'
    },
    {
      id: 'watchlist',
      label: '관심종목',
      path: '/watchlist',
      icon: '❤️'
    },
    {
      id: 'holdings',
      label: '보유종목',
      path: '/holdings',
      icon: '🛒'
    },
    {
      id: 'reservations',
      label: '예약내역',
      path: '/reservations',
      icon: '📅'
    }
  ];

  const notifications: Notification[] = [
    {
      id: '1',
      timestamp: '2025.08.01 11:00',
      type: 'cancel',
      message: '김범주 전문가님의 요청으로 2025년 08월 14일 14시에 예약된 상담이 취소되었습니다.'
    },
    {
      id: '2',
      timestamp: '2025.08.01 10:05',
      type: 'complete',
      message: '김범주 전문가님에게 2025년 08월 14일 14시에 상담 예약이 완료되었습니다.'
    }
  ];

  const handleMenuClick = (menuId: string) => {
    setSelectedMenu(menuId);
    setIsCollapsed(false);
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 'notifications':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">알림</h2>
              <button className="text-sm text-gray-500 hover:text-gray-700">
                모두 비우기
              </button>
            </div>
            <div className="space-y-6">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.type === 'cancel' ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      <span className="text-white text-sm font-bold">
                        {notification.type === 'cancel' ? '!' : '✓'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500 mb-2">
                        {notification.timestamp}
                      </div>
                      <div className="text-gray-900 leading-relaxed">
                        {notification.message}
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && (
                    <div className="border-t border-gray-200 mt-6 pt-6"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'watchlist':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">관심종목</h2>
              <button className="text-sm text-blue-500 hover:text-blue-700">
                + 추가
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">삼성전자</div>
                    <div className="text-sm text-gray-500">005930</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">70,500원</div>
                    <div className="text-sm text-red-500">-500 (-0.7%)</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">카카오</div>
                    <div className="text-sm text-gray-500">035720</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">42,150원</div>
                    <div className="text-sm text-blue-500">+1,200 (+2.9%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'holdings':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">보유종목</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-900">네이버</div>
                  <div className="text-sm text-gray-500">10주</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">평균매수가: 195,000원</div>
                  <div className="text-sm text-blue-500">+5.2%</div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-900">LG화학</div>
                  <div className="text-sm text-gray-500">5주</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">평균매수가: 420,000원</div>
                  <div className="text-sm text-red-500">-2.1%</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reservations':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">예약내역</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900">김범주 전문가</div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">예정</span>
                </div>
                <div className="text-sm text-gray-600 mb-1">2025.08.15 14:00</div>
                <div className="text-sm text-gray-500">투자 포트폴리오 상담</div>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900">이수진 전문가</div>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">완료</span>
                </div>
                <div className="text-sm text-gray-600 mb-1">2025.08.01 10:00</div>
                <div className="text-sm text-gray-500">주식 투자 기초 상담</div>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900">박민수 전문가</div>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">취소</span>
                </div>
                <div className="text-sm text-gray-600 mb-1">2025.07.28 16:00</div>
                <div className="text-sm text-gray-500">부동산 투자 상담</div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getCurrentMenuLabel = () => {
    return menuItems.find(item => item.id === selectedMenu)?.label || '알림';
  };

  // Push content style for body and navbar
  React.useEffect(() => {
    const navbar = document.querySelector('nav');
    
    if (!isCollapsed) {
      document.body.style.marginRight = '396px'; // 16px (sidebar) + 320px (panel) + 60px (extra space)
      document.body.style.transition = 'margin-right 0.3s ease';
      if (navbar) {
        navbar.style.marginRight = '396px';
        navbar.style.transition = 'margin-right 0.3s ease';
      }
    } else {
      document.body.style.marginRight = '64px'; // 16px (sidebar) + 48px (extra space)
      document.body.style.transition = 'margin-right 0.3s ease';
      if (navbar) {
        navbar.style.marginRight = '64px';
        navbar.style.transition = 'margin-right 0.3s ease';
      }
    }

    return () => {
      document.body.style.marginRight = '0';
      document.body.style.transition = '';
      if (navbar) {
        navbar.style.marginRight = '0';
        navbar.style.transition = '';
      }
    };
  }, [isCollapsed]);

  return (
    <>
      {/* Collapsed Sidebar */}
      <div className="fixed right-0 top-0 h-full bg-white shadow-lg border-l border-gray-200 w-16 z-50 flex flex-col">
        {/* Menu Items */}
        <div className="flex-1 flex flex-col items-center py-4 space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                selectedMenu === item.id && !isCollapsed
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
            </button>
          ))}
        </div>

        {/* Bottom Icons */}
        <div className="pb-4 flex flex-col items-center space-y-2">
          <button 
            onClick={() => window.open('https://www.tossinvest.com/', '_blank')}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
          >
            <img src={Toss_symbol} alt="" className='w-6 h-6' />
          </button>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <span className="text-xs">↑</span>
          </button>
        </div>
      </div>

      {/* Expanded Content Panel */}
      {!isCollapsed && (
        <div className="fixed right-16 top-0 h-full bg-white shadow-xl border-l border-gray-200 w-80 z-40">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{getCurrentMenuLabel()}</h3>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto h-full">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
