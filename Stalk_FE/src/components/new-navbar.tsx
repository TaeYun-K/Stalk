import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import stalkLogoBlue from '@/assets/images/logos/Stalk_logo_blue.svg';
import { useAuth } from '@/context/AuthContext';

interface NewNavbarProps {
  userType?: string;
  onUserTypeChange?: (userType: string) => void;
  showUserTypeToggle?: boolean;
}

const NewNavbar: React.FC<NewNavbarProps> = ({ userType = 'general', onUserTypeChange = () => {}, showUserTypeToggle = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();
  
  // userType is used in conditional rendering below

  return (
    <nav className="w-full h-20 flex items-center justify-between relative px-5 mb-10">
       {/* Brand Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-300"
            >
              
              <img src={stalkLogoBlue} alt="Stalk Logo" className="w-30 h-10" />
            </button>
            
          </div>
      
      <div className="flex items-center gap-4">
        {/* User Type Toggle - Only show when showUserTypeToggle is true */}
        {showUserTypeToggle && (
          <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/20">
            <button
              onClick={() => onUserTypeChange('general')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                userType === 'general'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              일반 사용자
            </button>
            <button
              onClick={() => onUserTypeChange('expert')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                userType === 'expert'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              전문가
            </button>
          </div>
        )}
        
        {/* 로그인 상태에 따른 버튼 표시 */}
        {!isLoggedIn && location.pathname !== '/login' ? (
          <button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-2.5 rounded-2xl text-sm transition-all duration-300 transform hover:scale-105"
          >
            로그인
          </button>
        ) : isLoggedIn && (
          <button 
            onClick={async () => {
              try {
                await logout();
                navigate('/');
              } catch (error) {
                console.error('로그아웃 실패:', error);
              }
            }}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-2.5 rounded-2xl text-sm transition-all duration-300 transform hover:scale-105"
          >
            로그아웃
          </button>
        )}
      </div>
    </nav>
  );
};

export default NewNavbar;
