
import { useNavigate } from 'react-router-dom';
import NewNavbar from '@/components/new-navbar';


const SignupComplete = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <NewNavbar />
      
      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Signup Form */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 px-12 py-20">
                               
          {/* Main Content */}
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Welcome Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              환영합니다. 김싸피 전문가님!
            </h1>

            {/* Instructions */}
            <div className="space-y-3 mb-8">
              <p className="text-gray-600">
                투자자에게 신뢰와 가치를 전하는 여정이 지금 시작됩니다.
              </p>
              <p className="text-gray-600">
                전문가 승인 여부는 "마이페이지 - 내 정보 - 전문가 승인 여부"를 통해 확인하시기 바랍니다.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
              >
                Stalk 이용하기(홈페이지)
              </button>
              <button
                onClick={() => navigate('/mypage')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
              >
                전문가 승인 여부 확인하러 가기
              </button>
            </div>

            {/* Additional Info */}
            <p className="text-sm text-gray-500">
              일반 사용자님이 전문가로 잘못 가입한 경우,{' '}
              <button 
                onClick={() => navigate('/mypage')}
                className="text-red-600 hover:text-red-700 underline"
              >
                회원탈퇴
              </button>
              를 눌러 회원정보를 삭제하시기 바랍니다.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center items-center space-x-6 text-sm text-gray-600 mb-4">
            <span>개인정보 처리방침</span>
            <span className="text-gray-300">|</span>
            <span>고객센터 0000-0000</span>
            <span className="text-gray-300">|</span>
            <span>공지사항</span>
          </div>
          
          {/* Business Info */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>사업자 등록번호: 000-00-0000</p>
            <p>대표: 스토커</p>
            <p>주소 : 46733 부산광역시 강서구 녹산산업중로 333</p>
            <p className="mt-4">
              스톡에서 제공하는 투자 상담 및 정보는 투자 판단을 위한 단순 참고용일 뿐, 투자 제안 및 권유, 종목 추천을 위해 작성된 것이 아닙니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupComplete; 