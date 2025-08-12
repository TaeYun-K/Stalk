import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet';

// API 응답 인터페이스 정의
interface ApiReservation {
  reservationId: number;
  consultationDate: string;
  consultationTime: string;
  requestMessage: string;
  status: string;
  createdAt: string;
  clientName: string;
  clientUserId: number;
  advisorName: string;
  advisorUserId: number;
  profileImageUrl: string;
}

// 전문가 관련 인터페이스 추가
interface Certificate {
  advisorId: number;
  certificateName: string;
  issuedBy: string;
}

interface Expert {
  id: number;
  name: string;
  profileImageUrl: string;
  preferredStyle: "SHORT" | "MID_SHORT" | "MID" | "MID_LONG" | "LONG";
  shortIntro: string;
  averageRating: number;
  reviewCount: number;
  consultationFee: number;
  isApproved: boolean;
  createdAt: string;
  certificates: Certificate[];
}

interface ApiResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: {
    content: ApiReservation[];
    nextCursor: number;
    hasNext: boolean;
    pageSize: number;
    pageNo: number;
  };
}

interface ExpertApiResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: {
    content: Expert[];
    nextCursor: string | null;
    hasNext: boolean;
    pageSize: number;
    pageNo: number;
  };
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const pageSize = 4;
  
  // 전문가 관련 상태 추가
  const [experts, setExperts] = useState<Expert[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const [expertsError, setExpertsError] = useState<string | null>(null);
  const [selectedInvestmentStyle, setSelectedInvestmentStyle] = useState<string>("MID"); // 기본값: 중기
  
  // 예약 내역 가져오기
  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await AuthService.authenticatedRequest('/api/reservations', {
        method: 'GET'
      });
      
      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.isSuccess && data.result.content) {
          // 현재 날짜보다 미래의 예약만 필터링
          const now = new Date();
          const futureReservations = data.result.content.filter(reservation => {
            const reservationDateTime = new Date(`${reservation.consultationDate}T${reservation.consultationTime}`);
            return reservationDateTime > now;
          });
          
          // 날짜순으로 정렬 (가장 가까운 날짜가 먼저)
          futureReservations.sort((a, b) => {
            const dateA = new Date(`${a.consultationDate}T${a.consultationTime}`);
            const dateB = new Date(`${b.consultationDate}T${b.consultationTime}`);
            return dateA.getTime() - dateB.getTime();
          });
          
          setReservations(futureReservations);
        }
      } else {
        setError('로그인 후 이용할 수 있는 서비스입니다.');
      }
    } catch (err) {
      setError('로그인 후 이용할 수 있는 서비스입니다.');
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  // 전문가 목록 가져오기
  const fetchExperts = useCallback(async () => {
    try {
      setExpertsLoading(true);
      setExpertsError(null);

      const response = await AuthService.publicRequest("/api/advisors");

      if (response.status === 401) {
        // 401 에러 시 토큰 제거하고 로그인 페이지로 리다이렉트
        AuthService.removeAccessToken();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch experts");
      }

      const data: ExpertApiResponse = await response.json();
      if (data.isSuccess) {
        // 최신 등록순으로 정렬하고 상위 4명만 선택
        const sortedExperts = data.result.content
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 4);
        setExperts(sortedExperts);
      } else {
        throw new Error(data.message || "Failed to fetch experts");
      }
    } catch (err) {
      setExpertsError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching experts:", err);
    } finally {
      setExpertsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchReservations();
    fetchExperts();
  }, [fetchExperts]);

  // 예약 목록이 바뀔 때마다 첫 페이지로 초기화
  useEffect(() => {
    setCurrentIndex(0);
  }, [reservations]);

  // 투자 스타일 한국어 변환 함수
  const getPreferredStyleText = (style: string) => {
    switch (style) {
      case "SHORT":
        return "단기";
      case "MID_SHORT":
        return "중단기";
      case "MID":
        return "중기";
      case "MID_LONG":
        return "중장기";
      case "LONG":
        return "장기";
      default:
        return style;
    }
  };

  // 상담료 포맷팅 함수
  const formatConsultationFee = (fee: number) => {
    return `${fee.toLocaleString()}원`;
  };

  // 선택된 투자 스타일에 따른 필터링된 전문가 목록
  const filteredExperts = experts.filter(expert => 
    selectedInvestmentStyle === "ALL" || expert.preferredStyle === selectedInvestmentStyle
  );

  // 홈페이지에서 sidebar margin 완전히 무시
  useEffect(() => {
    // CSS 클래스와 data attribute를 통한 강제 마진 제거
    document.body.setAttribute('data-page', 'home');
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.setAttribute('data-page', 'home');
    }

    // JavaScript를 통한 강제 margin 제거
    const forceResetMargin = () => {
      document.body.style.marginRight = '0 !important';
      if (navbar) {
        (navbar as HTMLElement).style.marginRight = '0 !important';
      }
    };

    // 초기 설정
    forceResetMargin();

    // MutationObserver로 스타일 변경 감지 및 즉시 복원
    const observer = new MutationObserver(forceResetMargin);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });

    // 주기적으로 margin 강제 리셋 (추가 보장)
    const interval = setInterval(forceResetMargin, 50);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      // 정리 시 data attribute 제거 및 margin 리셋
      document.body.removeAttribute('data-page');
      document.body.style.marginRight = '0';
      if (navbar) {
        navbar.removeAttribute('data-page');
        (navbar as HTMLElement).style.marginRight = '0';
      }
    };
  }, []);

  return (
    <>
    <div className="relative overflow-hidden" style={{ marginRight: '0 !important', marginLeft: '0 !important' }}>
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center w-full">
            <h1 className="text-6xl font-bold mb-6">Fuel Your Future</h1>
            <p className="text-2xl mb-8 opacity-90">투자 전문가를 통해 당신의 미래를 충전하세요</p>
          </div>
        </div>
      </div>

      {/* 예정된 상담 내역 - 로그인한 사용자에게만 표시 */}
       {isLoggedIn && (
         <section className="w-full mb-16 bg-gray-100 pt-10 pb-10 px-36">
           <div className="relative flex items-center gap-3 mb-8">
             <h2 className="text-2xl hoverxl font-bold text-secondary-900 relative z-10">예정된 상담 내역</h2>
             <button 
               onClick={() => navigate('/mypage?tab=내 상담 내역')}
               className='text-xl font-bold ml-2 hover:text-blue-500 transition-colors cursor-pointer'
             > 
              &gt;
             </button>
           </div>
            {/* 내 예약 내역 카드 (최대 4개 표시, 좌우 이동) */}
             <div className='flex flex-row items-center gap-4 overflow-hidden'>
               {/* Prev arrow */}
               {reservations.length > pageSize && (
                 <button
                   aria-label="이전 예약들"
                   onClick={() => setCurrentIndex((prev) => Math.max(0, prev - pageSize))}
                   disabled={currentIndex === 0}
                   className={`px-3 py-6 text-xl font-bold rounded-lg transition-colors ${currentIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-blue-500'}`}
                 >
                   ◀
                 </button>
               )}

               {/* Cards */}
               <div className='flex flex-row gap-4 flex-1 overflow-hidden'>
               {loading ? (
                 <div className="text-gray-500">로딩 중...</div>
               ) : error ? (
                 <div className="text-red-500">{error}</div>
               ) : reservations.length === 0 ? (
                 <div className="text-gray-500">현재 예정된 상담 내역이 없습니다</div>
               ) : (
                 reservations
                   .slice(currentIndex, currentIndex + pageSize)
                   .map((reservation) => {
                   const reservationDate = new Date(`${reservation.consultationDate}T${reservation.consultationTime}`);
                   const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][reservationDate.getDay()];
                   const formattedDate = `${reservation.consultationDate.split('-').join('. ')}(${dayOfWeek})`;
                   const formattedTime = reservation.consultationTime.substring(0, 5);
                   
                   return (
                     <button 
                      key={reservation.reservationId} 
                      onClick={() => navigate(`/mypage?tab=내 상담 내역`)}
                      className="p-6 transition-all duration-300 bg-white rounded-lg border border-gray-300 border-semibold w-fit hover:shadow-lg hover:border-blue-500 hover:bg-gray-50"
                      >
                       <div className="flex items-center justify-start">
                         <div className="flex flex-col justify-start gap-4">
                           <div className="text-blue-500 flex justify-between items-center gap-3">
                             <div className="text-left text-md font-bold">{formattedDate}</div>
                             <div className="text-xl text-left font-bold text-gray-900">{formattedTime}</div>
                           </div>
                           <div className='flex flex-row justify-center items-end gap-2'>
                             <p className='text-gray-700 font-semibold text-md font-light'>{reservation.advisorName}</p>
                             <p className='text-blue-700 text-sm font-light'>컨설턴트</p>
                           </div>
                         </div>
                       </div>
                     </button>
                   );
                 })
               )}
               </div>

               {/* Next arrow */}
               {reservations.length > pageSize && (
                 <button
                   aria-label="다음 예약들"
                   onClick={() => setCurrentIndex((prev) => (prev + pageSize < reservations.length ? prev + pageSize : prev))}
                   disabled={currentIndex + pageSize >= reservations.length}
                   className={`px-3 py-6 text-xl font-bold rounded-lg transition-colors ${(currentIndex + pageSize >= reservations.length) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-blue-500'}`}
                 >
                   ▶
                 </button>
               )}
             </div>
         </section>
       )}

      {/* Content overlay */}
      
      <div className="relative pt-10 pr-20">
        <main className="px-20 sm:px-6 lg:px-36 py-8 pt-1">
          

          {/* 주목할만한 뉴스 */}
          <section className="max-w-7xl mx-auto mb-16">
            <div className="py-3 px-7 bg-green-50 transition-all duration-300 bg-white rounded-full border">
              <div className="flex items-center gap-10">
                <span className="text-green-600 text-md font-bold">Today's News</span>
                <p className="text-gray-700 text-sm font-light">
                  미국-일본 무역 협정 체결로 아시아 자동차 제조사 주가 급등; 도요타 16% 상승
                </p>
              </div>
            </div>
          </section>

          {/* 최근 상담글 */}
          <section className="max-w-7xl mx-auto mb-16">
            <div>
              <div className="relative flex items-center gap-3 mb-8">
                <p className='text-2xl hoverxl font-bold text-secondary-900 relative z-10'>최근 상담글</p>
                <button 
                onClick={() => navigate('/community?tab=투자 지식iN')}
                className='text-xl font-bold ml-2 hover:text-blue-500 transition-colors cursor-pointer'
              > 
              &gt;
              </button>
              </div>
              <div className='flex flex-row justify-between items-center gap-16'>
                <div className='w-1/2'>
                  <div className='flex flex-col justify-start gap-3 border-b border-gray-200 py-6'>
                    <span className='text-left text-blue-600 text-md font-semibold'>#질문</span>
                    <h3 className='text-left text-lg font-semibold'>투자 과연 어디서부터 시작해야할까요?</h3>
                    <p className='text-left text-sm font-light'>질문 내용</p>
                    <span className='text-left text-gray-700 text-xs font-light'>전문가 답변 N개</span>
                  </div>
                  <div className='flex flex-col justify-start gap-3 py-6'>
                    <span className='text-left text-blue-600 text-md font-semibold'>#질문</span>
                    <h3 className='text-left text-lg font-semibold'>투자 과연 어디서부터 시작해야할까요?</h3>
                    <p className='text-left text-sm font-light'>질문 내용</p>
                    <span className='text-left text-gray-700 text-xs font-light'>전문가 답변 N개</span>
                  </div>
                </div>
                <div className='w-1/2'>
                  <div className='flex flex-col justify-start gap-3 border-b border-gray-200 py-6'>
                    <span className='text-left text-blue-600 text-md font-semibold'>#질문</span>
                    <h3 className='text-left text-lg font-semibold'>투자 과연 어디서부터 시작해야할까요?</h3>
                    <p className='text-left text-sm font-light'>질문 내용</p>
                    <span className='text-left text-gray-700 text-xs font-light'>전문가 답변 N개</span>
                  </div>
                  <div className='flex flex-col justify-start gap-3 py-6'>
                    <span className='text-left text-blue-600 text-md font-semibold'>#질문</span>
                    <h3 className='text-left text-lg font-semibold'>투자 과연 어디서부터 시작해야할까요?</h3>
                    <p className='text-left text-sm font-light'>질문 내용</p>
                    <span className='text-left text-gray-700 text-xs font-light'>전문가 답변 N개</span>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex justify-center pt-5'>
              <button 
                onClick={() => navigate('/community?tab=투자 지식iN')}
                className='flex justify-center border border-gray-300 w-fit py-3 px-4 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer'
              >
                최근 상담글(투자 지식iN) 더보기
              </button>
            </div>
          </section>

          {/* 새로 함께하는 컨설턴트 */}
          <section className="max-w-7xl mx-auto mb-16">
            <div className="relative flex items-center gap-3 mb-8">
              <p className='text-2xl hoverxl font-bold text-secondary-900 relative z-10'>새로 함께하는 컨설턴트</p>
              <div className='text-white text-sm font-semibold bg-gradient-to-r from-orange-400 to-pink-500 px-2 rounded-md'>New</div>
              <button 
              onClick={() => navigate('/experts')}
              className='text-xl font-bold ml-2 hover:text-orange-500 transition-colors cursor-pointer'
              > 
              &gt;
              </button>
            </div>
            
            {/* 투자 스타일 필터 버튼 */}
            <div className='flex flex-row justify-start gap-2 mb-5'>
              <button 
                onClick={() => setSelectedInvestmentStyle("SHORT")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  selectedInvestmentStyle === "SHORT" 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                단기 투자
              </button>
              <button 
                onClick={() => setSelectedInvestmentStyle("MID_SHORT")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  selectedInvestmentStyle === "MID_SHORT" 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                중단기 투자
              </button>
              <button 
                onClick={() => setSelectedInvestmentStyle("MID")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  selectedInvestmentStyle === "MID" 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                중기 투자
              </button>
              <button 
                onClick={() => setSelectedInvestmentStyle("MID_LONG")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  selectedInvestmentStyle === "MID_LONG" 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                중장기 투자
              </button>
              <button 
                onClick={() => setSelectedInvestmentStyle("LONG")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  selectedInvestmentStyle === "LONG" 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                장기 투자
              </button>
            </div>
            
            {/* 전문가 카드 목록 */}
            <div className='flex flex-row justify-start items-start gap-4 overflow-hidden'>
              {expertsLoading ? (
                <div className="text-gray-500">컨설턴트 정보를 불러오는 중...</div>
              ) : expertsError ? (
                <div className="text-red-500">{expertsError}</div>
              ) : filteredExperts.length === 0 ? (
                <div className="text-gray-500">해당 투자 스타일의 컨설턴트가 없습니다</div>
              ) : (
                filteredExperts.slice(0, 4).map((expert) => (
                  <div 
                    key={expert.id}
                    className='border border-orange-200 rounded-lg w-1/4 cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden'
                    onClick={() => navigate(`/expert-detail/${expert.id}`)}
                  >
                    <div className='text-left text-sm font-semibold text-orange-600 bg-orange-100 w-full rounded-t-lg px-5 py-2'>
                      {getPreferredStyleText(expert.preferredStyle)} 투자
                    </div>
                    <div className='flex flex-col items-start justify-start'>
                      <div className='flex flex-col justify-start gap-2 flex-1 px-5 py-4'>
                        <div className='flex flex-row justify-start items-end gap-2'>
                          <p className='text-gray-700 font-semibold text-md'>{expert.name}</p>
                          <p className='text-sm font-medium text-blue-600'>컨설턴트</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-yellow-400 text-xs">⭐</div>
                            <span className="text-xs text-gray-600">{expert.averageRating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({expert.reviewCount})</span>
                          </div>
                        </div>
                        <p className='text-justify text-sm font-light overflow-hidden' style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{expert.shortIntro}</p>
                      </div>                  
                      <div className="flex justify-between items-center w-full bg-gray-100 text-xs text-orange-600 font-semibold px-5 py-2">
                        <p>상담료</p>
                        <p className='text-gray-700 font-medium'>{formatConsultationFee(expert.consultationFee)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className='flex justify-center pt-5'>
              <button 
                onClick={() => navigate('/experts')}
                className='flex justify-center border border-gray-300 w-fit py-3 px-4 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer'
              >
                Stalk 컨설턴트 더보기
              </button>
            </div>
          </section>
        </main>

        
      </div>
    </div>
    </>
  );
};

export default HomePage;
