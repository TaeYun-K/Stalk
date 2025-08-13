import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "@/App.css";

// Context
import { WatchlistProvider } from "@/context/WatchlistContext";
import { AuthProvider } from "@/context/AuthContext";

// Components
import Navbar from "@/components/navbar";
import HomePageNavbar from "@/components/homepage-navbar";
import Sidebar from "@/components/sidebar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/ScrollToTop";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

// Pages =================================================================================================
import HomePage from "@/pages/home-page";

// Login & Signup =================================================================================================
import LoginPage from "@/pages/login-page";
import SignupChoicePage from "@/pages/signup-choice-page";
import SignupPage from "@/pages/signup-page";
import SignupComplete from "@/pages/signup-complete";

// Experts =================================================================================================
import AdvisorsListPage from "@/pages/advisors-list-page";
import AdvisorsIntroductionCreatePage from "@/pages/advisors-introduction-create-page";
import AdvisorsIntroductionUpdatePage from "@/pages/advisors-introduction-update-page";
import AdvisorstDetailPage from "@/pages/advisors-detail-page";

// Products =================================================================================================
import ProductsPage from "@/pages/products-page";

// investment knowledge =================================================================================================
import InvestmentKnowledgeListPage from "@/pages/investment-knowledge-list-page";
import WritePostPage from "@/pages/write-post-page";
import InvestmentKnowledgeDetailPage from "@/pages/investment-knowledge-detail-page";
import MyPage from "@/pages/my-page";
import MyReviewsPage from "@/pages/my-reviews-page";
import AdvisorReviewsPage from "@/pages/advisor-reviews-page";

import SearchPage from "@/pages/search-page";
import VideoConsultationPage from "@/pages/video-consultation-page";
import AdminPage from "@/pages/admin-page";

// Payment Result ============================================================================================
import PaymentSuccess from "./pages/payment-success";
import PaymentFail from "./pages/payment-fail";

// Navbar를 숨길 페이지 목록
const hideNavbarRoutes: string[] = [
  "/",
  "/login",
  "/signup",
  "/SignupChoicePage",
  "/signup-complete",
];

// Sidebar를 보여줄 경로 Prefix 목록
const sidebarPrefixes: string[] = [
  // 전문가 관련 페이지
  "/advisors-list",
  "/advisors-detail/", // 동적 파라미터 대응
  "/advisors-introduction-create",
  "/advisors-introduction-update",
  // 투자 지식 관련 페이지
  "/investment-knowledge-list",
  "/investment-knowledge-detail/", // 동적 파라미터 대응
  // 기타
  "/products",
  "/mypage",
  "/settings",
  "/write-post",
  "/consultations",
  "/search",
  "/notifications",
  "/watchlist",
  "/holdings",
  "/reservations",
  "/admin",
];

// Footer를 숨길 페이지 목록
const hideFooterRoutes: string[] = [
  "/SignupChoicePage",
  "/login",
  "/video-consultation",
];

const AppContent: React.FC = () => {
  const location = useLocation();
  const showNavbar: boolean = !hideNavbarRoutes.includes(location.pathname);
  const showSidebar: boolean =
    location.pathname === "/" ||
    sidebarPrefixes.some((prefix) => location.pathname.startsWith(prefix));
  const showFooter: boolean = !hideFooterRoutes.some((route) =>
    location.pathname.startsWith(route)
  );
  const isVideoPage = location.pathname.startsWith("/video-consultation");

  return (
    <div className="App min-h-screen bg-white flex flex-col">
      {location.pathname === "/" ? (
        <HomePageNavbar />
      ) : (
        !isVideoPage && showNavbar && <Navbar />
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 ${showSidebar ? "mr-0" : ""} flex flex-col`}>
          <main className="flex-1 overflow-auto">
            <Routes>
              {/* 홈페이지 관련 path */}
              <Route path="/" element={<HomePage />} />

              {/* 로그인 & 회원가입 관련 path */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/SignupChoicePage" element={<SignupChoicePage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/signup-complete" element={<SignupComplete />} />

              {/* 마이페이지 관련 path */}
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/my-reviews" element={<MyReviewsPage />} />

              {/* 전문가 관련 path */}
              <Route path="/advisors-list" element={<AdvisorsListPage />} />
              <Route
                path="/advisors-detail/:id"
                element={<AdvisorstDetailPage />}
              />
              <Route path="/advisors/:advisorId/reviews" element={<AdvisorReviewsPage />} />
              <Route
                path="/advisors-introduction-create/:advisorId"
                element={<AdvisorsIntroductionCreatePage />}
              />
              <Route
                path="/advisors-introduction-update/:advisorId"
                element={<AdvisorsIntroductionUpdatePage />}
              />
              {/* Alias route for expert-introduction-update to point to the same page */}
              <Route
                path="/expert-introduction-update/:advisorId"
                element={<AdvisorsIntroductionUpdatePage />}
              />

              {/* 투자 지식 in 관련 path */}
              <Route
                path="/investment-knowledge-list"
                element={<InvestmentKnowledgeListPage />}
              />
              <Route
                path="/investment-knowledge-detail/:postId"
                element={<InvestmentKnowledgeDetailPage />}
              />
              <Route path="/write-post" element={<WritePostPage />} />

              {/* 상품 관련 path */}
              <Route path="/products" element={<ProductsPage />} />

              {/* 관리자 관련 path */}
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminPage />
                  </AdminProtectedRoute>
                }
              />

              {/* 검색 관련 path */}
              <Route path="/search" element={<SearchPage />} />

              {/* 비디오 상담 관련 path */}
              <Route
                path="/video-consultation/:consultationId"
                element={<VideoConsultationPage />}
              />

              {/* 결제 결과 관련 path */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/fail" element={<PaymentFail />} />

              <Route
                path="/products"
                element={
                  <div className="p-4">
                    <h1>상품 조회</h1>
                  </div>
                }
              />

              <Route
                path="/consultations"
                element={
                  <div className="p-4">
                    <h1>상담 내역</h1>
                  </div>
                }
              />

              {/* Sidebar Routes */}
              <Route
                path="/notifications"
                element={
                  <div className="p-4">
                    <h1>알림</h1>
                  </div>
                }
              />
              <Route
                path="/watchlist"
                element={
                  <div className="p-4">
                    <h1>관심종목</h1>
                  </div>
                }
              />
              <Route
                path="/holdings"
                element={
                  <div className="p-4">
                    <h1>보유종목</h1>
                  </div>
                }
              />
              <Route
                path="/reservations"
                element={
                  <div className="p-4">
                    <h1>예약내역</h1>
                  </div>
                }
              />

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
