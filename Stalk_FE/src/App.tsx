import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import '@/App.css';

// Context
import { WatchlistProvider } from '@/context/WatchlistContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Components
import Navbar from '@/components/navbar';
import HomePageNavbar from '@/components/homepage-navbar';
import Sidebar from '@/components/sidebar';
import Footer from '@/components/footer';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

// Pages
import HomePage from '@/pages/home-page';

import AdminPage from '@/pages/admin-page';

import LoginPage from '@/pages/login-page';
import SignupPage from '@/pages/signup-page';
import SignupComplete from '@/pages/signup-complete';

import ExpertsPage from '@/pages/experts-page';
import ProductsPage from '@/pages/products-page';
import CommunityPage from '@/pages/community-page';
import MyPage from '@/pages/my-page';

import WritePostPage from '@/pages/write-post-page';

import ExpertDetailPage from '@/pages/expert-detail-page';
import FavoritesPage from '@/pages/favorites-page';
import SignupChoicePage from '@/pages/signup-choice-page';
import SearchPage from '@/pages/search-page';
import ExpertsIntroductionRegistrationPage from '@/pages/experts-introduction-registration-page';
import VideoConsultationPage from '@/pages/video-consultation-page';

// Navbar를 숨길 페이지 목록
const hideNavbarRoutes: string[] = ['/', '/login', '/signup', '/SignupChoicePage', '/signup-complete'];


// Sidebar를 보여줄 페이지 목록 (모든 페이지에 적용)
const showSidebarRoutes: string[] = [
  '/', 
  '/experts', 
  '/admin',
  '/community', 
  '/products', 
  '/mypage', 
  '/settings', 
  '/write-post', 
  '/consultations', 
  '/favorites',
  '/search',
  '/notifications',
  '/watchlist',
  '/holdings',
  '/reservations',
  '/expert-detail',
  '/expert-registration'
];

// Footer를 숨길 페이지 목록
const hideFooterRoutes: string[] = ['/SignupChoicePage', '/login'];

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isLoggedIn, isLoading, userInfo } = useAuth();
  const showNavbar: boolean = !hideNavbarRoutes.includes(location.pathname);
  const showSidebar: boolean = showSidebarRoutes.includes(location.pathname) || location.pathname.startsWith('/expert-detail/');
  const showFooter: boolean = !hideFooterRoutes.includes(location.pathname);
  const isVideoPage = location.pathname.startsWith('/video-consultation');
  


  return (
    <div className="App min-h-screen bg-white flex flex-col">
      {location.pathname === '/' ? <HomePageNavbar /> : (!isVideoPage && showNavbar) && <Navbar />}
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 ${showSidebar ? 'mr-0' : ''} flex flex-col`}>
          <main className="flex-1 overflow-auto">
            <Routes>
              {/* Public Routes */}
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/signup-complete" element={<SignupComplete />} />

              <Route path="/SignupChoicePage" element={<SignupChoicePage />} />
              <Route path="/search" element={<SearchPage />} />
              
              {/* Protected Routes */}
              <Route path="/experts" element={<ExpertsPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/products" element={<div className="p-4"><h1>상품 조회</h1></div>} />
              <Route path="/mypage" element={<MyPage />} />
              
              <Route path="/write-post" element={<WritePostPage />} />
              <Route path="/consultations" element={<div className="p-4"><h1>상담 내역</h1></div>} />
              <Route path="/expert-detail/:id" element={<ExpertDetailPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/expert-registration" element={<ExpertsIntroductionRegistrationPage />} />
              
              {/* Sidebar Routes */}
              <Route path="/notifications" element={<div className="p-4"><h1>알림</h1></div>} />
              <Route path="/watchlist" element={<div className="p-4"><h1>관심종목</h1></div>} />
              <Route path="/holdings" element={<div className="p-4"><h1>보유종목</h1></div>} />
              <Route path="/reservations" element={<div className="p-4"><h1>예약내역</h1></div>} />

              {/* Video Consultation Route */}
              <Route path="/video-consultation/:consultationId" element={<VideoConsultationPage />} />

              {/* Protected Routes */}
              
              {/* Redirect to home if route not found */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        {showSidebar && <Sidebar />}
      </div>
      {showFooter && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <WatchlistProvider>
          <AppContent />
        </WatchlistProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
