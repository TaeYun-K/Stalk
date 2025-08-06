import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tossLogoBlue from '@/assets/images/logos/Toss_logo_blue.svg';
import checkIcon from '@/assets/images/icons/check_icon.svg';
import sidebarSlideupIcon from '@/assets/images/icons/sidebar_slideup_icon.svg';
import likeClickIcon from '@/assets/images/icons/like_click_icon.svg';
import sidebarOpenCloseIcon from '@/assets/images/icons/sidebar_openclose_icon.svg';
import { useWatchlist } from '@/context/WatchlistContext';
import NotificationService from '@/services/notificationService';
import ReservationService from '@/services/reservationService';
import CommunityService from '@/services/communityService';
import AuthService from '@/services/authService';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: string;
}

interface Notification {
  notificationId: number;
  type: string;
  title: string;
  message: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

interface Reservation {
  reservationId: number;
  consultationDate: string;
  consultationTime: string;
  requestMessage?: string;
  advisorName: string;
  advisorUserId: number;
  profileImageUrl?: string;
  status: string;
  createdAt: string;
}

interface KnowledgePost {
  postId: number;
  title: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [selectedMenu, setSelectedMenu] = useState<string>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [knowledgePosts, setKnowledgePosts] = useState<KnowledgePost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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
    },
    {
      id: 'knowledge-board',
      label: '투자 지식iN',
      path: '/knowledge-board',
      icon: '📚'
    }
  ];

  // 알림 데이터 로드
  const loadNotifications = async () => {
    if (!AuthService.isLoggedIn()) return;
    
    try {
      setLoading(true);
      const response = await NotificationService.getNotifications(1, 10);
      setNotifications(response.content);
    } catch (error) {
      console.error('알림 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 예약 내역 데이터 로드
  const loadReservations = async () => {
    if (!AuthService.isLoggedIn()) return;
    
    try {
      setLoading(true);
      const response = await ReservationService.getReservations(1, 20);
      const sortedReservations = ReservationService.sortReservations(response.content);
      setReservations(sortedReservations);
    } catch (error) {
      console.error('예약 내역 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 투자 지식iN 데이터 로드
  const loadKnowledgePosts = async () => {
    if (!AuthService.isLoggedIn()) return;
    
    try {
      setLoading(true);
      const response = await CommunityService.getMyPosts('ALL', 1, 10);
      setKnowledgePosts(response.content);
    } catch (error) {
      console.error('투자 지식iN 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.notificationId === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('읽음 처리 실패:', error);
    }
  };

  // 메뉴 클릭 시 데이터 로드
  const handleMenuClick = (menuId: string) => {
    if (selectedMenu === menuId && !isCollapsed) {
      setIsCollapsed(true);
    } else {
      setSelectedMenu(menuId);
      setIsCollapsed(false);
      
      // 메뉴별 데이터 로드
      switch (menuId) {
        case 'notifications':
          loadNotifications();
          break;
        case 'reservations':
          loadReservations();
          break;
        case 'knowledge-board':
          loadKnowledgePosts();
          break;
      }
    }
  };

  const handleToggleSidebar = () => {
    if (isCollapsed) {
      // 사이드바가 닫혀있으면 알림으로 열기
      setSelectedMenu('notifications');
      setIsCollapsed(false);
      loadNotifications(); // 알림 데이터 로드
    } else {
      // 사이드바가 열려있으면 닫기
      setIsCollapsed(true);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleLike = (stockCode: string) => {
    removeFromWatchlist(stockCode);
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 'notifications':
        return (
          <div className="p-6">
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-4 text-gray-500">로딩 중...</div>
              ) : notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div key={notification.notificationId}>
                    <div className="flex items-start space-x-4">
                      <img src={checkIcon} alt="check" className="w-6 h-6" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center text-left text-sm text-gray-500 mb-2">
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <button
                                className="text-xs text-blue-500 hover:text-blue-700"
                                onClick={() => handleMarkAsRead(notification.notificationId)}
                              >
                                읽음
                              </button>
                            )}
                            <button
                              className="w-6 h-6 flex items-center justify-center bg-transparent hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-700 transition-colors ml-2"
                              onClick={() => setNotifications(notifications.filter(n => n.notificationId !== notification.notificationId))}
                              aria-label="알림 삭제"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div className="text-left text-gray-900 leading-relaxed">
                          {notification.message}
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && (
                      <div className="border-t border-gray-200 mt-6 pt-6"></div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg mb-2">알림이 없습니다</div>
                  <div className="text-sm">새로운 알림이 오면 여기에 표시됩니다</div>
                </div>
              )}
            </div>
          </div>
        );
      case 'watchlist':
        return (
          <div className="p-6">
            <div className="space-y-4">
              {watchlist.map((item) => (
                <div key={item.code} className="py-2 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => toggleLike(item.code)}
                      className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <img 
                        src={likeClickIcon} 
                        alt="like" 
                        className="w-5 h-5" 
                      />
                    </button>
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.code}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{item.price.toLocaleString()}원</div>
                        <div className={`text-sm ${item.change > 0 ? 'text-red-500' : item.change < 0 ? 'text-blue-500' : 'text-gray-500'}`}>
                          {item.change > 0 ? '+' : ''}{item.change}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {watchlist.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg mb-2">관심종목이 없습니다</div>
                  <div className="text-sm">관심있는 종목을 추가해보세요</div>
                </div>
              )}
            </div>
          </div>
        );
      case 'holdings':
        return (
          <div className="p-6">
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
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg mb-2">보유종목 기능 준비 중</div>
                <div className="text-sm">상품조회 페이지에서 추가할 수 있습니다</div>
              </div>
            </div>
          </div>
        );
      case 'reservations':
        return (
          <div className="p-6">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-gray-500">로딩 중...</div>
              ) : reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <div key={reservation.reservationId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-900">{reservation.advisorName}</div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        reservation.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                        reservation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {reservation.status === 'PENDING' ? '대기중' :
                         reservation.status === 'CONFIRMED' ? '확정' :
                         reservation.status === 'COMPLETED' ? '완료' : '취소'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {reservation.consultationDate} {reservation.consultationTime}
                    </div>
                    {reservation.requestMessage && (
                      <div className="text-sm text-gray-500">
                        {reservation.requestMessage}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg mb-2">예약 내역이 없습니다</div>
                  <div className="text-sm">전문가와 상담을 예약해보세요</div>
                </div>
              )}
            </div>
          </div>
        );
      case 'knowledge-board':
        return (
          <div className="p-6">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-gray-500">로딩 중...</div>
              ) : knowledgePosts.length > 0 ? (
                knowledgePosts.map((post) => (
                  <div key={post.postId} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>👁️ {post.viewCount}</span>
                        <span>💬 {post.commentCount}</span>
                      </div>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg mb-2">작성한 투자 지식이 없습니다</div>
                  <div className="text-sm">투자 지식을 공유해보세요</div>
                </div>
              )}
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
  useEffect(() => {
    const navbar = document.querySelector('nav');
    
    // 초기 렌더링 시에도 collapsed 상태에 맞는 margin 설정
    if (!isCollapsed) {
      document.body.style.marginRight = '384px'; // 64px (collapsed sidebar) + 320px (panel width: w-80)
      document.body.style.transition = 'margin-right 0.3s ease';
      if (navbar) {
        navbar.style.marginRight = '384px';
        navbar.style.transition = 'margin-right 0.3s ease';
      }
    } else {
      document.body.style.marginRight = '64px'; // 64px (collapsed sidebar width)
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

  // 컴포넌트 마운트 시 초기 margin 설정
  useEffect(() => {
    const navbar = document.querySelector('nav');
    
    // 사이드바가 collapsed 상태일 때의 초기 margin 설정
    document.body.style.marginRight = '64px';
    document.body.style.transition = 'margin-right 0.3s ease';
    if (navbar) {
      navbar.style.marginRight = '64px';
      navbar.style.transition = 'margin-right 0.3s ease';
    }

    // 컴포넌트 언마운트 시 cleanup
    return () => {
      document.body.style.marginRight = '0';
      document.body.style.transition = '';
      if (navbar) {
        navbar.style.marginRight = '0';
        navbar.style.transition = '';
      }
    };
  }, []); // 빈 의존성 배열로 마운트 시에만 실행

  // 페이지 이동 시 navbar margin 재설정
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) {
      // 현재 collapsed 상태에 맞는 margin 설정
      if (!isCollapsed) {
        navbar.style.marginRight = '384px';
        navbar.style.transition = 'margin-right 0.3s ease';
      } else {
        navbar.style.marginRight = '64px';
        navbar.style.transition = 'margin-right 0.3s ease';
      }
    }
  }); // 의존성 배열 없이 모든 렌더링에서 실행

  // 외부 클릭 감지하여 사이드바 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // 사이드바 영역 내부 클릭인지 확인
      const isSidebarClick = target.closest('.sidebar-container');
      
      if (!isCollapsed && !isSidebarClick) {
        setIsCollapsed(true);
      }
    };

    if (!isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed]);

  return (
    <>
      {/* Collapsed Sidebar */}
      <div className="sidebar-container fixed right-0 top-0 h-full bg-white border-l border-gray-200 w-20 z-50 flex flex-col">
        {/* Toggle Button */}
        <div className="py-4 flex justify-center">
          <button
            onClick={handleToggleSidebar}
            className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 text-gray-600 hover:bg-gray-100"
          >
            <img 
              src={sidebarOpenCloseIcon} 
              alt="toggle sidebar" 
              className={`w-6 h-6 transition-transform duration-300 ${
                !isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
        
        {/* Menu Items */}
        <div className="flex-1 flex flex-col items-center py-4 space-y-4">
          {menuItems.map((item) => (
            <div key={item.id} className="flex flex-col items-center space-y-1">
              <button
                onClick={() => handleMenuClick(item.id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  selectedMenu === item.id && !isCollapsed
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
              </button>
              <span className="text-xs text-gray-500 font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom Icons */}
        <div className="pb-4 flex flex-col items-center space-y-2">
          <button 
            onClick={() => window.open('https://www.tossinvest.com/', '_blank')}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors border border-gray-200"
          >
            <img src={tossLogoBlue} alt="Toss" className="w-6 h-6" />
          </button>
          <button 
            onClick={scrollToTop}
            className="w-10 h-10 border border-gray-300 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <img src={sidebarSlideupIcon} alt="scroll to top" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expanded Content Panel */}
      {!isCollapsed && (
        <div className="sidebar-container fixed right-20 top-0 h-full bg-white shadow-xl border-l border-gray-200 w-80 z-40">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{getCurrentMenuLabel()}</h2>
            {selectedMenu === 'notifications' && (
              <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setNotifications([])}>
                모두 비우기
              </button>
            )}
            {selectedMenu === 'watchlist' && (
              <button 
                className="text-sm text-blue-500 hover:text-blue-700"
                onClick={() => navigate('/products')}
              >
                + 추가
              </button>
            )}
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