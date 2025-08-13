import React, { useState, useEffect } from 'react';
import AuthService from '@/services/authService';

// API 인터페이스 정의
interface BlockedTimesRequest {
  blockedTimes: string[];
}

interface BlockedTimesResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: {
    date: string;
    blockedTimeSlots: string[];
  };
}

interface AdvisorTimeTableProps {
  onOperatingHoursChange: (hasOperatingHours: boolean) => void;
}

const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const AdvisorTimeTable: React.FC<AdvisorTimeTableProps> = ({ onOperatingHoursChange }) => {
  // 캘린더 상태
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  
  // 날짜별 운영 상태 관리 (운영: 'operating', 휴무: 'closed', 미운영: 'inactive')
  const [dateStatus, setDateStatus] = useState<Record<string, 'operating' | 'closed' | 'inactive'>>({});
  
  // 각 날짜별 시간 슬롯 설정 저장
  const [dateTimeSlots, setDateTimeSlots] = useState<Record<string, string[]>>({});
  

  const [currentDateStatus, setCurrentDateStatus] = useState<'operating' | 'closed' | 'inactive'>('inactive');

  // 초기 시간 슬롯 설정 및 기본 운영 날짜 설정
  useEffect(() => {
    // 기본값: 모든 날짜에서 차단할 시간 없음 (빈 배열 = 모든 시간 예약 가능)
    setDateTimeSlots({});
    
    // 현재 달의 평일을 기본 운영 날짜로 설정
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const defaultOperatingDates: Record<string, 'operating' | 'closed' | 'inactive'> = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const todayDate = new Date(today);
      todayDate.setHours(0, 0, 0, 0);
      
      // 오늘 이후의 평일만 기본 운영으로 설정
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && targetDate >= todayDate) {
        const dateKey = date.toISOString().split('T')[0];
        defaultOperatingDates[dateKey] = 'operating';
      }
    }
    
    setDateStatus(defaultOperatingDates);
    console.log('기본 운영 날짜 설정:', defaultOperatingDates);
  }, []);

  // 운영 시간 완료 상태 체크 및 부모 컴포넌트에 알림
  useEffect(() => {
    const hasOperatingHours = Object.values(dateStatus).some(status => status === 'operating');
    onOperatingHoursChange(hasOperatingHours);
  }, [dateStatus, onOperatingHoursChange]);

  // 캘린더 관련 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = async (date: Date) => {
    // 이전 날짜의 시간 설정 저장
    if (selectedDate) {
      const prevDateKey = getDateKey(selectedDate);
      setDateTimeSlots(prev => ({
        ...prev,
        [prevDateKey]: selectedTimeSlots
      }));
    }
    
    setSelectedDate(date);
    // 선택된 날짜의 현재 상태를 currentDateStatus에 설정
    const status = getDateStatus(date);
    setCurrentDateStatus(status);
    
    // 해당 날짜의 저장된 시간 슬롯 불러오기
    const dateKey = getDateKey(date);
    const savedTimeSlots = dateTimeSlots[dateKey];
    
    if (savedTimeSlots !== undefined) {
      // 로컬 캐시에 있는 경우
      setSelectedTimeSlots(savedTimeSlots);
    } else {
      // 로컬 캐시에 없는 경우 API에서 불러오기
      try {
        const blockedTimes = await fetchBlockedTimes(dateKey);
        setSelectedTimeSlots(blockedTimes);
        
        // 로컬 캐시에도 저장
        setDateTimeSlots(prev => ({
          ...prev,
          [dateKey]: blockedTimes
        }));
      } catch (error) {
        console.error('Failed to fetch blocked times:', error);
        // 에러 발생 시 기본값 설정
        setSelectedTimeSlots([]);
      }
    }
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    
    // 새로운 달로 이동 시 해당 달의 평일을 기본 운영 날짜로 추가
    updateDefaultOperatingDatesForMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    
    // 새로운 달로 이동 시 해당 달의 평일을 기본 운영 날짜로 추가
    updateDefaultOperatingDatesForMonth(newMonth);
  };

  const updateDefaultOperatingDatesForMonth = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newOperatingDates: Record<string, 'operating' | 'closed' | 'inactive'> = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // 오늘 이후의 평일만 기본 운영으로 설정
      const dayOfWeek = date.getDay();
      const dateKey = date.toISOString().split('T')[0];
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && targetDate >= today && !dateStatus[dateKey]) {
        newOperatingDates[dateKey] = 'operating';
      }
    }
    
    setDateStatus(prev => ({ ...prev, ...newOperatingDates }));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // 날짜 상태 관리 함수들
  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 오늘 이후 날짜인지 확인하는 함수
  const isDateEditableOrToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate >= today;
  };

  const getDateStatus = (date: Date) => {
    const dateKey = getDateKey(date);
    const savedStatus = dateStatus[dateKey];
    
    if (savedStatus) {
      return savedStatus;
    }
    
    // 기본값 설정: 현재 달의 평일만 운영, 나머지는 모두 비활성화
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정하여 날짜만 비교
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // 오늘을 포함한 이전 날짜는 모두 비활성화
    if (targetDate <= today) {
      return 'inactive';
    }
    
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();
    const dayOfWeek = date.getDay();
    
    // 현재 달이고 오늘 이후의 평일인 경우만 운영
    if (dateYear === currentYear && dateMonth === currentMonth && dayOfWeek >= 1 && dayOfWeek <= 5 && targetDate >= today) {
      return 'operating';
    } else {
      return 'inactive';
    }
  };

  const handleDateStatusChange = async (status: 'operating' | 'closed' | 'inactive') => {
    if (selectedDate) {
      const dateKey = getDateKey(selectedDate);
      let newStatus = status;
      
      if (currentDateStatus === status) {
        // 같은 상태를 다시 선택하면 미운영으로 변경
        newStatus = 'inactive';
        setDateStatus(prev => ({ ...prev, [dateKey]: 'inactive' }));
        setCurrentDateStatus('inactive');
      } else {
        // 다른 상태로 변경
        setDateStatus(prev => ({ ...prev, [dateKey]: status }));
        setCurrentDateStatus(status);
      }
      
      // 휴무일로 설정하는 경우 모든 시간을 차단
      if (newStatus === 'closed') {
        const allTimeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
        setSelectedTimeSlots(allTimeSlots);
        setDateTimeSlots(prev => ({
          ...prev,
          [dateKey]: allTimeSlots
        }));
        
        // API에 모든 시간 차단 저장
        try {
          await submitBlockedTimes(dateKey, allTimeSlots);
          console.log(`Successfully set all times as blocked for ${dateKey} (closed day)`);
        } catch (error) {
          console.error(`Failed to set blocked times for closed day ${dateKey}:`, error);
        }
      } else if (newStatus === 'inactive') {
        // 미운영으로 설정하는 경우 차단 시간 초기화
        setSelectedTimeSlots([]);
        setDateTimeSlots(prev => ({
          ...prev,
          [dateKey]: []
        }));
        
        // API에 빈 배열 저장
        try {
          await submitBlockedTimes(dateKey, []);
          console.log(`Successfully cleared blocked times for ${dateKey} (inactive day)`);
        } catch (error) {
          console.error(`Failed to clear blocked times for inactive day ${dateKey}:`, error);
        }
      }
      // 운영일로 설정하는 경우는 기존 차단 시간 유지 (별도 API 호출 없음)
    }
  };



  const isTimeSlotPast = (time: string, date: Date) => {
    const [hour, minute] = time.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hour, minute, 0, 0);
    return slotDate < new Date();
  };

  // 시간 슬롯 토글
  const toggleTimeSlot = async (time: string) => {
    // 운영 상태일 때만 시간 슬롯 선택 가능
    if (currentDateStatus !== 'operating') {
      return;
    }
    
    // 과거 시간은 클릭할 수 없음
    if (selectedDate && isTimeSlotPast(time, selectedDate)) {
      return;
    }
    
    // 단순한 토글 방식: 선택된 시간 = 차단할 시간
    if (selectedDate) {
      let newSelectedTimeSlots: string[];
      
      if (selectedTimeSlots.includes(time)) {
        // 이미 선택된 시간을 클릭하면 선택 해제 (차단 해제)
        newSelectedTimeSlots = selectedTimeSlots.filter(t => t !== time);
      } else {
        // 선택되지 않은 시간을 클릭하면 선택 (차단)
        newSelectedTimeSlots = [...selectedTimeSlots, time];
      }
      
      // UI 즉시 업데이트
      setSelectedTimeSlots(newSelectedTimeSlots);
      
      // 로컬 캐시 업데이트
      const dateKey = getDateKey(selectedDate);
      setDateTimeSlots(prev => ({
        ...prev,
        [dateKey]: newSelectedTimeSlots
      }));
      
      // API에 변경사항 저장 (비동기)
      try {
        await submitBlockedTimes(dateKey, newSelectedTimeSlots);
        console.log(`Successfully updated blocked times for ${dateKey}`);
      } catch (error) {
        console.error(`Failed to update blocked times for ${dateKey}:`, error);
        // 필요시 사용자에게 에러 알림 표시
        // alert('차단 시간 저장에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 차단 시간 조회 함수
  const fetchBlockedTimes = async (date: string): Promise<string[]> => {
    try {
      // 현재 사용자 정보 확인
      const userInfo = AuthService.getUserInfo();
      
      // 역할 검증
      if (userInfo?.role !== 'ADVISOR') {
        console.error(`Invalid user role for blocked times fetch: ${userInfo?.role}`);
        return [];
      }
      
      const token = AuthService.getAccessToken();
      if (!token) {
        console.error('No access token available');
        return [];
      }

      console.log(`Fetching blocked times for ${date}`);

      const response = await AuthService.authenticatedRequest(`/api/advisors/blocked-times?date=${date}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
         },
        credentials: 'include'
      });

      console.log(`Fetch response status for ${date}:`, response.status);

      if (response.ok) {
        const data: BlockedTimesResponse = await response.json();
        console.log(`Blocked times fetched successfully for ${date}:`, data);
        
        if (data.isSuccess && data.result) {
          return data.result.blockedTimeSlots || [];
        } else {
          console.warn(`API returned success=false for ${date}:`, data.message);
          return [];
        }
      } else {
        const errorText = await response.text();
        console.error(`Failed to fetch blocked times for ${date}:`, response.status, errorText);
        
        // 404는 해당 날짜에 설정된 차단 시간이 없음을 의미할 수 있음
        if (response.status === 404) {
          console.log(`No blocked times found for ${date} (404 - this is normal)`);
          return [];
        }
        
        return [];
      }
    } catch (error) {
      console.error(`Error fetching blocked times for ${date}:`, error);
      return [];
    }
  };

  const submitBlockedTimes = async (date: string, blockedTimes: string[]) => {
    try {
      // 현재 사용자 정보 확인
      const userInfo = AuthService.getUserInfo();
      console.log(`Current user info before blocked times submission:`, userInfo);
      console.log(`Current user role:`, userInfo?.role);
      
      // 역할 검증
      if (userInfo?.role !== 'ADVISOR') {
        console.error(`Invalid user role for blocked times submission: ${userInfo?.role}`);
        return false;
      }
      
      // 날짜 정보 로깅
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = parseLocalDate(date);
      const isPastDate = targetDate < today;
      
      console.log(`Date info - Today: ${today.toISOString()}, Target: ${targetDate.toISOString()}, isPast: ${isPastDate}`);
      
      // 토큰 상태 확인
      const token = AuthService.getAccessToken();
      console.log(`🔑 토큰 존재:`, !!token);
      
      if (token) {
        // 토큰이 실제 JWT인지 확인
        const isJWT = token.includes('.') && token.split('.').length === 3;
        console.log(`🔍 JWT 형식:`, isJWT);
        
        if (isJWT) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log(`👤 사용자:`, payload.sub, '역할:', payload.role);
            const expired = payload.exp * 1000 < Date.now();
            console.log(`⏰ 토큰 만료:`, expired ? '만료됨' : '유효함');
          } catch (e) {
            console.error('❌ JWT 파싱 실패:', e);
          }
        } else {
          console.warn(`⚠️ Mock 토큰 감지: ${token.substring(0, 30)}...`);
          console.warn(`📝 해결방법: 로그아웃 후 다시 로그인하여 JWT 토큰을 받으세요.`);
          
          // Mock 토큰인 경우 자동으로 로그아웃 처리
          console.log(`🔄 자동 로그아웃 처리 중...`);
          AuthService.logout();
          alert('Mock 토큰이 감지되어 자동으로 로그아웃됩니다. 다시 로그인해주세요.');
          window.location.href = '/login';
          return false;
        }
      }

      const blockedTimesData: BlockedTimesRequest = {
        blockedTimes: blockedTimes
      };

      console.log(`Submitting blocked times for ${date}:`, blockedTimes);
      console.log(`Request body:`, blockedTimesData);

      console.log(`Making API call to: /api/advisors/blocked-times?date=${date}`);
      console.log(`Request method: PUT`);
      console.log(`Request body:`, JSON.stringify(blockedTimesData, null, 2));

      const response = await AuthService.authenticatedRequest(`/api/advisors/blocked-times?date=${date}`, {
        method: 'PUT', // PUT 메서드 사용 (백엔드 API에 맞춤)
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
         },
        credentials: 'include',
        body: JSON.stringify(blockedTimesData)
      });

      console.log(`Response status for ${date}:`, response.status);
      console.log(`Response ok for ${date}:`, response.ok);

      if (response.ok) {
        const responseData = await response.text();
        console.log(`Blocked times submitted successfully for ${date}:`, responseData);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Failed to submit blocked times for ${date}:`, response.status, errorText);
        console.error(`Response headers:`, [...response.headers.entries()]);
        
        // 구체적인 에러 메시지 제공
        let errorMessage = '';
        switch (response.status) {
          case 400:
            if (errorText.includes('과거 날짜')) {
              errorMessage = `과거 날짜(${date})는 차단할 수 없습니다.`;
            } else if (errorText.includes('날짜 형식')) {
              errorMessage = `날짜 형식이 올바르지 않습니다: ${date}`;
            } else if (errorText.includes('예약된 시간')) {
              errorMessage = `${date}에 이미 예약된 시간이 있어 차단할 수 없습니다.`;
            } else {
              errorMessage = `잘못된 요청입니다: ${errorText}`;
            }
            break;
          case 401:
            errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
            break;
          case 403:
            errorMessage = '전문가만 접근 가능합니다.';
            break;
          case 404:
            errorMessage = '존재하지 않거나 승인되지 않은 전문가입니다.';
            break;
          default:
            errorMessage = `서버 오류가 발생했습니다 (${response.status}): ${errorText}`;
        }
        
        console.error(`Detailed error for ${date}:`, errorMessage);
        return false;
      }
    } catch (error) {
      console.error(`Error submitting blocked times for ${date}:`, error);
      return false;
    }
  };

  // 캘린더 렌더링
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
      const dateStatus = getDateStatus(date);
      
      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`text-center py-2 cursor-pointer ${
            isSelectedDate
              ? 'bg-blue-500 text-white rounded-full'
              : dateStatus === 'operating'
              ? 'bg-blue-100 text-blue-600 rounded-full'
              : dateStatus === 'closed'
              ? 'bg-red-200 text-red-600 rounded-full'
              : isWeekend
              ? 'bg-gray-100 text-red-500 rounded-full'
              : 'bg-gray-100 text-gray-900 rounded-full'
          } ${!isSelectedDate ? 'hover:bg-blue-500 hover:text-white hover:rounded-full' : ''} transition-colors`}
        >
          {day}
        </div>
      );
    }

    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length;
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

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  return (
    <div className="space-y-6">    
      <div className="bg-gray-50 p-6 rounded-lg text-left">
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 font-bold">📋</span>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">설정 방법</h4>
              <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-4 space-y-1">
                <li>기본 상담 시간: 오전 9시 ~ 오후 8시 (12개 시간대)</li>
                <li>달력에서 날짜를 선택하고 <strong>운영/휴무</strong>를 설정하세요</li>
                <li><strong>운영일</strong>: 상담 불가능한 시간만 선택 (나머지는 예약 가능)</li>
                <li><strong>휴무일</strong>: 모든 시간이 자동으로 차단됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* 캘린더 */}
        <div className="flex-1">
          <div className="bg-white p-4">
            {/* 캘린더 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrevMonth} className="text-gray-600 hover:text-gray-800">
                &lt;
              </button>
              <span className="text-lg font-semibold text-black">
                {currentMonth.getFullYear()}년 {String(currentMonth.getMonth() + 1).padStart(2, '0')}월
              </span>
              <div className="flex items-center space-x-2">
                <button onClick={handleNextMonth} className="text-gray-600 hover:text-gray-800">
                  &gt;
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-full hover:bg-blue-100"
                >
                  Today
                </button>
              </div>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div
                  key={day}
                  className={`text-center text-sm font-medium py-2 ${
                    index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-500' : 'text-black'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* 범례 */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs justify-center">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>선택된 날짜</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                <span>운영</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-200 rounded-full"></div>
                <span>휴무</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span>미설정</span>
              </div>
            </div>
          </div>
        </div>

        {/* 시간 설정 */}
        <div className="w-80 space-y-4">
          <div className="">
            <h4 className="text-left text-m font-semibold text-black mb-3">운영/휴무 설정</h4>
            <div className="mb-3">
              <div className="bg-white border border-gray-300 rounded-full space-x-2 p-1 flex">
                <button
                  onClick={() => selectedDate && isDateEditableOrToday(selectedDate) && handleDateStatusChange('operating')}
                  className={`flex-1 py-2 rounded-full transition-colors text-sm ${
                      currentDateStatus === 'operating' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-white'
                  } ${selectedDate && !isDateEditableOrToday(selectedDate) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  운영
                </button>
                <button
                  onClick={() => selectedDate && isDateEditableOrToday(selectedDate) && handleDateStatusChange('closed')}
                  className={`flex-1 py-2 rounded-full transition-colors text-sm ${
                      currentDateStatus === 'closed' ? 'bg-red-500 text-white' : 'bg-gray-300 text-white'
                  } ${selectedDate && !isDateEditableOrToday(selectedDate) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  휴무
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="text-left mb-2 py-2">
              <p className="text-sm text-gray-600">
                {selectedDate ? ['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()] : ''}
              </p>
              <h3 className="text-xl font-semibold text-black">
                {selectedDate ? selectedDate.getDate() : '일자를 선택하세요'}
              </h3>
            </div>
            <div className={`bg-white border rounded-lg p-4 ${
              currentDateStatus === 'operating' 
                ? 'border-blue-500' 
                : currentDateStatus === 'closed' 
                ? 'border-red-500' 
                : 'border-gray-300'
            }`}>
              {currentDateStatus === 'operating' && (
                <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  ⏰ <strong>차단할 시간을 선택하세요</strong><br/>
                  선택하지 않은 시간은 예약 가능합니다
                </div>
              )}
              {currentDateStatus === 'closed' && (
                <div className="mb-3 p-2 bg-red-50 rounded text-xs text-red-700">
                  🚫 <strong>휴무일</strong> - 모든 시간이 자동으로 차단됩니다
                </div>
              )}
              {/* 지난 날짜 안내 문구 */}
              {selectedDate && !isDateEditableOrToday(selectedDate) && (
                <div className="mb-3 p-2 bg-gray-100 rounded text-xs text-gray-700">
                🚫 <strong>지난 날짜</strong> - 모든 시간이 자동으로 차단됩니다
              </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => {
                  const isDisabled = currentDateStatus !== 'operating';
                  const isSelected = selectedTimeSlots.includes(time);
                  

                  
                  // 과거 시간인지 확인
                  const isPastTime = selectedDate && isTimeSlotPast(time, selectedDate);
                 
                  const isLocked = selectedDate && !isDateEditableOrToday(selectedDate);
                  
                  return (
                    <button
                      key={time}
                      onClick={() => !isLocked && !isPastTime && toggleTimeSlot(time)}
                      disabled={isDisabled}
                      className={`py-2 px-3 rounded-lg border text-sm transition-colors ${
                        isDisabled
                          ? 'border-gray-200 text-gray-200 bg-gray-50 cursor-not-allowed'
                          : isPastTime
                          ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed opacity-50'
                          : isLocked && isSelected
                          ? 'border-red-300 text-red-300 bg-red-25 cursor-not-allowed opacity-60'
                          : isLocked && !isSelected
                          ? 'border-blue-300 text-blue-300 bg-blue-25 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'border-gray-300 text-gray-300' // 선택됨 = 차단할 시간 (빨간색)
                          : 'border-blue-500 text-blue-500 bg-blue-50 hover:border-blue-600 hover:text-blue-600' // 미선택 = 예약 가능 시간 (초록색)
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorTimeTable;
