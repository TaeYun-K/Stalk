import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewNavbar from '@/components/new-navbar';
import normalUserIcon from '@/assets/normal_user.svg';
import specialistIcon from '@/assets/specialist.svg';

const SignupChoicePage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <NewNavbar />
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-lg flex flex-col p-20">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">회원가입</h1>
            <p className="text-lg md:text-xl text-gray-500 mt-2">Sign up</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 w-full">
            <Link to="/signup?type=general" className="w-full md:w-2/5">
              <div className="bg-white rounded-3xl shadow-md border border-neutral-200 p-10 text-center hover:shadow-xl transition-shadow duration-300 h-full flex flex-col justify-center items-center">
                <img className="w-32 h-32 mx-auto mb-6" src={normalUserIcon} alt="Normal User" />
                <h2 className="text-2xl font-semibold text-gray-800">일반 사용자</h2>
              </div>
            </Link>
            <Link to="/signup?type=expert" className="w-full md:w-2/5">
              <div className="bg-white rounded-3xl shadow-md border border-neutral-200 p-10 text-center hover:shadow-xl transition-shadow duration-300 h-full flex flex-col justify-center items-center">
                <img className="w-32 h-32 mx-auto mb-6" src={specialistIcon} alt="Specialist" />
                <h2 className="text-2xl font-semibold text-gray-800">전문가</h2>
              </div>
            </Link>
          </div>
        </div>
      </main>
      <footer className="w-full py-4 text-center text-zinc-500 text-xs">
        <p>사업자 등록번호 : 000-00-0000 | 대표 : 스토커 | 주소 : 46733 부산광역시 강서구 녹산산업중로 333</p>
        <p className="mt-1">스톡에서 제공하는 투자 상담 및 정보는 투자 판단을 위한 단순 참고용일 뿐, 투자 제안 및 권유, 종목 추천을 위해 작성된 것이 아닙니다.</p>
      </footer>
    </div>
  );
};

export default SignupChoicePage;