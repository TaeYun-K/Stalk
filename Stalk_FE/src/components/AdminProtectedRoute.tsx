import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, isLoading, userInfo } = useAuth();
  
  console.log('AdminProtectedRoute 체크:', {
    isLoggedIn,
    isLoading,
    userInfo,
    role: userInfo?.role,
    isAdmin: userInfo?.role === 'ADMIN'
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!isLoggedIn) {
    console.log('로그인되지 않음, /login으로 리다이렉트');
    return <Navigate to="/login" replace />;
  }
  
  if (userInfo?.role !== 'ADMIN') {
    console.log('관리자가 아님, /로 리다이렉트. role:', userInfo?.role);
    return <Navigate to="/" replace />;
  }
  
  console.log('관리자 확인됨, AdminPage 렌더링');
  return <>{children}</>;
};

export default AdminProtectedRoute; 