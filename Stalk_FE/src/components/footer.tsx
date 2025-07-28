import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Links */}
        <div className="flex justify-center space-x-12 text-base text-gray-600 mb-8">
          <a href="#" className="hover:text-blue-600 transition-colors">개인정보 처리방침</a>
          <span className="text-gray-300">|</span>
          <a href="#" className="hover:text-blue-600 transition-colors">고객센터 0000-0000</a>
          <span className="text-gray-300">|</span>
          <a href="#" className="hover:text-blue-600 transition-colors">공지사항</a>
        </div>

        {/* Company Info */}
        <div className="text-center text-sm text-gray-500 space-y-3">
          <p>사업자 등록번호 : 000-00-0000 | 대표 : 스토커 | 주소 : 46733 부산광역시 강서구 녹산산업중로 333</p>
          <p>스톡에서 제공하는 투자 상담 및 정보는 투자 판단을 위한 단순 참고용일 뿐, 투자 제안 및 권유, 종목 추천을 위해 작성된 것이 아닙니다.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 