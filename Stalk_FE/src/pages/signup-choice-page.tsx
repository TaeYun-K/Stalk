
import { Link } from 'react-router-dom';
import NewNavbar from '@/components/new-navbar';
import Footer from '@/components/footer';
import normalUserIcon from '@/assets/images/icons/normal_user_icon.svg';
import specialistIcon from '@/assets/images/icons/specialist_icon.svg';

const SignupChoicePage = () => {

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <NewNavbar />
      <main className="flex items-center justify-center px-4 pb-8">
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
      <Footer />
    </div>
  );
};

export default SignupChoicePage;