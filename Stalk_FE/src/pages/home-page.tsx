import React, { useEffect } from 'react';

const HomePage: React.FC = () => {
  
  const handleWheel = (event: WheelEvent) => {
    const viewportHeight = window.innerHeight; 
    
    if (event.deltaY > 0) {
      window.scrollBy({
        top: viewportHeight, 
        behavior: 'smooth',   
      });
    } else {
      window.scrollBy({
        top: -viewportHeight, 
        behavior: 'smooth',   
      });
    }
  };

  useEffect(() => {
    window.addEventListener('wheel', handleWheel);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    
    <div className="relative overflow-hidden">
      {/* Background Video */}
      <div className="relative w-full h-[100vh] overflow-hidden">
        <video 
          className="absolute top-0 left-0 w-full h-full object-cover" 
          autoPlay 
          loop 
          muted
          playsInline
        >
          <source src="/videos/stalk-background-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-6xl font-bold mb-6">Fuel Your Future</h1>
          <p className="text-2xl mb-8 opacity-90">투자 전문가를 통해 당신의 미래를 충전하세요</p>

        </div>
      </div>

      {/* Content overlay */}
      
      <div className="relative pr-20">
        <main className="px-4 sm:px-6 lg:px-8 py-8 pt-28">
          {/* 주목할만한 뉴스 */}
          <section className="max-w-7xl mx-auto mb-16">
            <div className="p-6 transition-all duration-300 bg-white rounded-lg border">
              <div className="flex items-center gap-10">
                <span className="text-blue-500 text-xl font-bold">Today's News</span>
                <p className="text-gray-700 text-xl font-light">
                  미국-일본 무역 협정 체결로 아시아 자동차 제조사 주가 급등; 도요타 16% 상승
                </p>
              </div>
            </div>
          </section>

          {/* 내 예약 내역 */}
          <section className="max-w-7xl mx-auto mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-5 h-5 bg-primary-200 rounded-full"></div>
              <h2 className="text-3xl font-bold text-secondary-900">내 예약 내역</h2>
            </div>
            <div className="p-6 transition-all duration-300 bg-blue-50 rounded-lg border border-blue-500 border-semibold">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="text-blue-500 flex flex-row gap-3">
                    <div className="text-xl font-bold">2025. 08. 17(월)</div>
                    <div className="text-xl font-bold text-gray-900">14:00</div>
                  </div>
                  <div className="text-gray-700 text-xl font-light">
                    김범주 투자운용컨설턴트
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        
      </div>
    </div>
  );
};

export default HomePage;
