import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NewNavbar from '@/components/new-navbar';
import ExpertProfileImage from '@/assets/expert_profile_image.png';
import AuthService from '@/services/authService';

// API Response Interfaces
interface ApiCareer {
  id: number;
  title: string;
  description: string;
  started_at: string;
  ended_at: string;
  created_at: string;
}

interface ApiCertificate {
  id: number;
  certificate_file_sn: string;
  birth: string;
  certificate_file_number: string;
  certificate_name: string;
  issued_by: string;
  issued_at: string;
  expires_at: string;
  certificate_url: string;
  created_at: string;
}

interface ApiReview {
  review_id: number;
  nickname: string;
  rating: number;
  content: string;
  profile_image: string;
  created_at: string;
}

interface ApiAdvisorDetail {
  user_id: number;
  name: string;
  profile_image_url: string;
  short_intro: string;
  long_intro: string;
  preferred_trade_style: string;
  contact: string;
  avg_rating: number;
  review_count: number;
  careers: ApiCareer[];
  certificates: ApiCertificate[];
  reviews: ApiReview[];
  has_more_reviews: boolean;
}

interface ApiResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: ApiAdvisorDetail;
}

interface Review {
  id: number;
  avatar: string;
  username: string;
  date: string;
  content: string;
}



const ExpertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showReservationModal, setShowReservationModal] = useState<boolean>(false);
  
  // API 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expertData, setExpertData] = useState<ApiAdvisorDetail | null>(null);
  
  // 사용자 정보 (실제로는 API에서 가져올 데이터)
  const userInfo = {
    name: '김싸피',
    contact: '010-0000-0000'
  };

  // API 호출
  useEffect(() => {
    const fetchExpertDetails = async () => {
      if (!id) {
        setError('전문가 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 토큰 확인
        const token = AuthService.getAccessToken();
        if (!token) {
          throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
        }
        
        const response = await AuthService.authenticatedRequest(`/api/advisors/${id}`);
        
        if (response.status === 401) {
          // 401 에러 시 토큰 제거하고 로그인 페이지로 리다이렉트
          AuthService.removeAccessToken();
          navigate('/login');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch expert details');
        }
        
        const data: ApiResponse = await response.json();
        if (data.isSuccess) {
          setExpertData(data.result);
        } else {
          throw new Error(data.message || 'Failed to fetch expert details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching expert details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpertDetails();
  }, [id, navigate]);

  const [reservationForm, setReservationForm] = useState({
    name: userInfo.name,
    phone: userInfo.contact,
    requestDetails: ''
  });
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);



  // 연도만 추출하는 함수
  const formatPeriod = (period: string): string => {
    // "현재"가 포함된 경우
    if (period.includes('현재')) {
      const yearMatch = period.match(/(\d{4})년/);
      if (yearMatch) {
        return `${yearMatch[1]} - 현재`;
      }
      return '현재';
    }
    
    // 연도 범위 추출 (예: "2018년 - 2020년" -> "2018 - 2020")
    const yearRangeMatch = period.match(/(\d{4})년\s*-\s*(\d{4})년/);
    if (yearRangeMatch) {
      return `${yearRangeMatch[1]} - ${yearRangeMatch[2]}`;
    }
    
    // 단일 연도 추출 (예: "2012년 6월" -> "2012")
    const singleYearMatch = period.match(/(\d{4})년/);
    if (singleYearMatch) {
      return singleYearMatch[1];
    }
    
    // 기타 경우 원본 반환
    return period;
  };

  // API 데이터를 기반으로 전문가 정보 생성
  const expert = expertData ? {
    id: expertData.user_id.toString(),
    name: expertData.name,
    title: '컨설턴트',
    tagline: expertData.short_intro,
    image: expertData.profile_image_url || ExpertProfileImage,
    introduction: expertData.long_intro,
    qualifications: expertData.certificates.map(cert => cert.certificate_name),
    experience: expertData.careers.map(career => ({
      period: `${new Date(career.started_at).getFullYear()} - ${career.ended_at ? new Date(career.ended_at).getFullYear() : '현재'}`,
      position: career.title
    })),
    rating: expertData.avg_rating,
    reviewCount: expertData.review_count,
    consultationFee: '상담료 정보 없음' // API에 consultationFee가 없으므로 기본값 사용
  } : null;

  // API 리뷰 데이터를 기반으로 리뷰 생성
  const reviews: Review[] = expertData ? expertData.reviews.map((review) => ({
    id: review.review_id,
    avatar: review.profile_image || '👤',
    username: review.nickname,
    date: new Date(review.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '.'),
    content: review.content
  })) : [];

  const timeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // 달력 관련 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isSelected = (date: Date) => {
    return selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
  };

  const handleDateClick = (date: Date) => {
    setSelectedCalendarDate(date);
    setSelectedDate(formatDate(date));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedCalendarDate(today);
    setSelectedDate(formatDate(today));
  };

  const handleReservation = () => {
    if (selectedDate && selectedTime && reservationForm.name && reservationForm.phone) {
      // 예약 로직 구현
      alert('예약이 완료되었습니다!');
      setShowReservationModal(false);
      navigate('/mypage?tab=내 상담 내역');
    } else {
      alert('이름과 휴대폰 번호를 입력해주세요.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReservationForm({
      ...reservationForm,
      [e.target.name]: e.target.value
    });
  };

  // 달력 렌더링
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // 이전 달의 마지막 날들
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i);
      days.push(
        <div key={`prev-${i}`} className="text-gray-300 text-center py-2">
          {date.getDate()}
        </div>
      );
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isSelectedDate = isSelected(date);
      
      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`text-center py-2 cursor-pointer ${
            isSelectedDate
              ? 'bg-blue-500 text-white rounded-full'
              : isWeekend
              ? date.getDay() === 0 ? 'text-red-500' : 'text-blue-500'
              : 'text-gray-900'
          } hover:bg-blue-100 hover:rounded-full transition-colors`}
        >
          {day}
        </div>
      );
    }

    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length; // 6주 표시를 위해
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i);
      days.push(
        <div key={`next-${i}`} className="text-gray-300 text-center py-2">
          {date.getDate()}
        </div>
      );
    }

    return days;
  };

  // Loading 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <NewNavbar userType="general" onUserTypeChange={() => {}} />
        <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">전문가 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error 상태
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <NewNavbar userType="general" onUserTypeChange={() => {}} />
        <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!expert) {
    return (
      <div className="min-h-screen bg-white">
        <NewNavbar userType="general" onUserTypeChange={() => {}} />
        <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">전문가 정보를 찾을 수 없습니다</h3>
              <p className="text-gray-600 mb-4">요청하신 전문가 정보가 존재하지 않습니다.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NewNavbar userType="general" onUserTypeChange={() => {}} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8 min-h-screen">
          {/* Left Content */}
          <div className="flex-1">
            {/* Expert Header */}
            <div className="flex items-end justify-between mb-8 border-b border-gray-300 pb-5">
              <div className="flex-1">
                <div className="flex flex-row items-end gap-2">
                  <h1 className="text-left text-3xl font-bold text-gray-900 mb-2">
                    {expert.name}
                  </h1>
                  <h3 className='text-left text-l font-semibold text-blue-500 mb-2'>{expert.title}</h3>
                  <h3 className='text-left text-l font-medium text-gray-400 mb-2'>/  {expertData?.contact || '010-0000-0000'}</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center mb-2 ml-4">
                      <div className="flex text-yellow-400">
                        ⭐
                      </div>
                      <span className="ml-2 font-semibold text-gray-900">{expert.rating}</span>
                      <span className="text-gray-600 ml-4">리뷰 {expert.reviewCount}개</span>
                    </div>
                </div>
                </div>
                <p className="text-left text-lg text-gray-600 italic mb-4">
                  "{expert.tagline}"
                </p>
              </div>
              <div className="w-48 h-60 rounded-2xl overflow-hidden">
                <img 
                  src={expert.image} 
                  alt={expert.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
        
            {/* Expert Introduction */}
            <section className=" border-b border-gray-300 pb-8">
              <header className='flex flex-row items-end space-x-3'>
                <h2 className="text-left text-2xl font-bold text-gray-900 mb-4">전문가 소개</h2>
                <h3 className="text-left text-gray-500 text-sm mb-4">Expert Introduction</h3>
              </header>
              <p className="text-left text-gray-700 leading-loose">{expert.introduction}</p>
            </section>
            <div className='flex flex-row mt-8 border-b border-gray-300 pb-8'>
              {/* Qualifications */}
              <section className="mb-8  w-1/2">
                <div className='flex flex-row items-end space-x-3 mb-4'>
                  <h2 className="text-left text-2xl font-bold text-gray-900">자격 증명</h2>
                  <p className="text-left text-gray-500 text-sm">Certifications</p>
                </div>
                <ul className="space-y-4">
                  {expert.qualifications.map((qualification, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span className="text-gray-700">{qualification}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Experience */}
              <section className="w-1/2">
                <div className="flex flex-row items-end space-x-3 mb-4">
                  <h2 className="text-left text-2xl font-bold text-gray-900">학력 및 경력사항</h2>
                  <p className="text-left text-gray-500 text-sm">Education & Professional Experience</p>
                </div>
                <div className="space-y-4">
                  {expert.experience.map((exp, index) => (
                    <div key={index} className="flex">
                      <div className="w-32 text-sm text-left text-gray-500 font-medium">
                        {formatPeriod(exp.period)}
                      </div>
                      <div className="text-left flex-1 text-gray-700">
                        {exp.position}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            {/* Reviews */}
            <section className="mt-8">
              <div className="flex flex-row items-end space-x-3 mb-4">
                <h2 className="text-left text-2xl font-bold text-gray-900">리뷰</h2>
                <h3 className="text-left text-gray-500 text-sm">Reviews</h3>
              </div>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="py-6">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">{review.avatar}</span>
                      <div>
                        <div className="font-medium text-gray-90 font-semibold">{review.username}</div>
                        <div className="text-left text-sm text-gray-500">{review.date}</div>
                      </div>
                    </div>
                    <p className="text-left text-gray-700 leading-relaxed">{review.content}</p>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-gray-600 bg-gray-200 py-3 px-6 rounded-full hover:text-blue-700 hover:bg-blue-200 hover:font-semibold font-medium">
                더보기
              </button>
            </section>
          </div>

          {/* Right Sidebar - Reservation */}
          <div className="text-left w-80 flex-shrink-0 ml-4">
            <div className="fixed top-32 right-30 w-80 z-10">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">예약 유의사항</h3>
                <ul className="space-y-3 mb-6 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span>예약은 1시간 단위로 가능합니다.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span>예약 후 24시간 내에 확정 및 줌 미팅 정보를 보내드립니다.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span>방해 행위(녹화 등) 시 전문가가 상담을 중단할 수 있습니다.</span>
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => {
                  setReservationForm({
                    name: userInfo.name,
                    phone: userInfo.contact,
                    requestDetails: ''
                  });
                  setShowReservationModal(true);
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
              >
                예약하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border-2 border border-blue-300 max-w-md w-full shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-8 pb-4">
              <h3 className="text-2xl font-bold text-gray-900">예약하기</h3>
              <button
                onClick={() => setShowReservationModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 pr-6 scrollbar-hide">
              <form className="space-y-6 pb-4">
                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">이름</label>
                                      <input
                      type="text"
                      name="name"
                      value={reservationForm.name}
                      onChange={handleInputChange}
                      placeholder="김싸피"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline focus:outline-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">휴대폰 번호</label>
                                      <input
                      type="tel"
                      name="phone"
                      value={reservationForm.phone}
                      onChange={handleInputChange}
                      placeholder="010-0000-0000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline focus:outline-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">상담 일자</label>
                  
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      &lt;
                    </button>
                    <span className="font-bold text-gray-900">
                      {currentMonth.getFullYear()}년 {String(currentMonth.getMonth() + 1).padStart(2, '0')}월
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        &gt;
                      </button>
                      <button
                        type="button"
                        onClick={handleToday}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-full hover:bg-blue-100"
                      >
                        Today
                      </button>
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                        <div
                          key={day}
                          className={`text-center text-sm font-medium py-2 ${
                            index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-900'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">상담 시간</label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          selectedTime === time
                            ? 'bg-blue-500 text-white border-blue-500'
                            : time === '09:00' || time === '12:00' || time === '18:00'
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}
                        disabled={time === '09:00' || time === '12:00' || time === '18:00'}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">상담 요청 사항</label>
                                      <textarea
                      name="requestDetails"
                      value={reservationForm.requestDetails}
                      onChange={handleInputChange}
                      placeholder="상담 요청 사항을 입력하세요."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:ring-2 focus:outline focus:outline-blue-500 resize-none"
                    />
                </div>
              </form>
            </div>

            <div className="flex justify-end p-8 pt-4 border-t border-gray-200 bg-white">
              <button
                type="button"
                onClick={handleReservation}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                예약 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertDetailPage; 