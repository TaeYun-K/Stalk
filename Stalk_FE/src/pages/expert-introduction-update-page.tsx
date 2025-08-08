import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/sidebar';
// import Footer from '@/components/footer';
// import ExpertProfileImage from '@/assets/expert_profile_image.png';
// import certificationExample from '@/assets/images/dummy/certification_example.svg';
import AuthService from '@/services/authService';

// API 인터페이스 정의
interface BlockedTimesRequest {
  blockedTimes: string[];
}

interface CareerEntry {
  id: string;
  startDate: string;
  endDate: string;
  company: string;
  position: string;
}

interface QualificationEntry {
  id: string;
  name: string;
  issuer: string;
  acquisitionDate: string;
  serialNumber: string;
}

const ExpertIntroductionUpdatePage: React.FC = () => {
  const { advisorId } = useParams<{ advisorId: string }>();
  const navigate = useNavigate();
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  // const [expertName, setExpertName] = useState<string>(''); // 현재 사용하지 않음
  const [expertContact, setExpertContact] = useState<string>('');

  // 기존 데이터 로딩 상태
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 11자리 이하로 제한
    const limitedNumbers = numbers.slice(0, 11);
    
    // 전화번호 형식으로 변환
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  // 전화번호 입력 핸들러
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setExpertContact(formattedValue);
  };
  const [expertTitle, setExpertTitle] = useState<string>('');
  const [expertIntroduction, setExpertIntroduction] = useState<string>('');
  // const [preferredTradeStyle, setPreferredTradeStyle] = useState<string>(''); // 현재 사용하지 않음
  
  // 경력사항 상태
  const [careerEntries, setCareerEntries] = useState<CareerEntry[]>([]);
  const [newCareerEntry, setNewCareerEntry] = useState<Omit<CareerEntry, 'id'>>({
    startDate: '',
    endDate: '',
    company: '',
    position: ''
  });

  // 자격사항 상태
  const [qualificationEntries, setQualificationEntries] = useState<QualificationEntry[]>([]);
  
  // 캘린더 상태
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  
  // 날짜별 운영 상태 관리 (운영: 'operating', 휴무: 'closed', 미운영: 'inactive')
  const [dateStatus, setDateStatus] = useState<Record<string, 'operating' | 'closed' | 'inactive'>>({});
  
  // 각 날짜별 시간 슬롯 설정 저장
  const [dateTimeSlots, setDateTimeSlots] = useState<Record<string, string[]>>({});
  
  // 평일 시간 슬롯 (모두 활성화된 상태로 시작)
  const [weekdayTimeSlots, setWeekdayTimeSlots] = useState<string[]>([
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]);
  const [currentDateStatus, setCurrentDateStatus] = useState<'operating' | 'closed' | 'inactive'>('inactive');
  
  // 기존 자격사항 항목들의 초기 상태 설정
  React.useEffect(() => {
    const initialStates: Record<string, 'saved' | 'editing' | 'deleting'> = {};
    qualificationEntries.forEach(entry => {
      if (!qualificationItemStates[entry.id]) {
        initialStates[entry.id] = 'saved';
      }
    });
    if (Object.keys(initialStates).length > 0) {
      setQualificationItemStates(prev => ({ ...prev, ...initialStates }));
    }
  }, [qualificationEntries]);

  // 초기 시간 슬롯 설정 및 기본 운영 날짜 설정
  React.useEffect(() => {
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
  
  // 새로운 자격사항 입력을 위한 상태 (인증번호 입력용)
  const [newQualificationEntry, setNewQualificationEntry] = useState<Omit<QualificationEntry, 'id'>>({
    name: '',
    issuer: '',
    acquisitionDate: '',
    serialNumber: ''
  });
  
  // 새로운 자격사항의 인증번호 입력을 위한 개별 상태
  const [newCertificationNumber1, setNewCertificationNumber1] = useState<string>('');
  const [newCertificationNumber2, setNewCertificationNumber2] = useState<string>('');
  const [newCertificationNumber3, setNewCertificationNumber3] = useState<string>('');
  const [editingQualificationId, setEditingQualificationId] = useState<string | null>(null);
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [editingQualificationData, setEditingQualificationData] = useState<QualificationEntry | null>(null);
  const [editingCareerData, setEditingCareerData] = useState<CareerEntry | null>(null);
  const [qualificationItemStates, setQualificationItemStates] = useState<Record<string, 'saved' | 'editing' | 'deleting'>>({});

  // 자격증 목록
  const qualificationOptions = [
    '전문 자격을 선택하세요',
    '금융투자상담사',
    '증권분석사',
    'CFA',
    'CPA'
  ];

  // 날짜 관련 상태
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [currentDatePicker, setCurrentDatePicker] = useState<Date>(new Date());

  // 기존 전문가 데이터 로드
  useEffect(() => {
    const loadExpertData = async () => {
      if (!advisorId) {
        setLoadError('전문가 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        const response = await AuthService.authenticatedRequest(`/api/advisors/${advisorId}`);
        
        if (!response.ok) {
          throw new Error('전문가 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        if (data.isSuccess) {
          const expert = data.result;
          
          // 기존 데이터로 폼 채우기
          // setExpertName(expert.name || ''); // 현재 사용하지 않음
          setExpertContact(expert.contact || '');
          setExpertTitle(expert.short_intro || '');      // ✅ 올바른 필드 매핑
          setExpertIntroduction(expert.long_intro || ''); // ✅ 올바른 필드 매핑
          
          // 선호 투자 스타일 설정
          // if (expert.preferred_trade_style) {
          //   setPreferredTradeStyle(expert.preferred_trade_style);
          // }
          
          // 프로필 이미지 URL이 있다면 표시
          if (expert.profile_image_url) {
            setFileName(expert.profile_image_url.split('/').pop() || '');
          }
          
          // 경력 정보 로드
          if (expert.careers && expert.careers.length > 0) {
            const loadedCareers = expert.careers.map((career: any, index: number) => ({
              id: career.id || index,
              startDate: career.started_at ? career.started_at.substring(0, 10).replace(/-/g, '.') : '',
              endDate: career.ended_at ? career.ended_at.substring(0, 10).replace(/-/g, '.') : '',
              company: career.title || '',        // title → company
              position: career.description || ''  // description → position
            }));
            setCareerEntries(loadedCareers);
          }

          
        } else {
          throw new Error(data.message || '전문가 정보를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('Error loading expert data:', error);
        setLoadError(error instanceof Error ? error.message : '데이터 로드 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadExpertData();
  }, [advisorId]);

  // 영업시간 관리 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (date: Date) => {
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
    
    // 저장된 시간 슬롯 불러오기 (기본값: 빈 배열 = 차단할 시간 없음)
    if (savedTimeSlots !== undefined) {
      setSelectedTimeSlots(savedTimeSlots);
    } else {
      // 기본값: 차단할 시간 없음 (모든 시간 예약 가능)
      setSelectedTimeSlots([]);
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

  const handleDateStatusChange = (status: 'operating' | 'closed' | 'inactive') => {
    if (selectedDate) {
      const dateKey = getDateKey(selectedDate);
      if (currentDateStatus === status) {
        // 같은 상태를 다시 선택하면 미운영으로 변경
        setDateStatus(prev => ({ ...prev, [dateKey]: 'inactive' }));
        setCurrentDateStatus('inactive');
      } else {
        // 다른 상태로 변경
        setDateStatus(prev => ({ ...prev, [dateKey]: status }));
        setCurrentDateStatus(status);
      }
    }
  };

  const getStatusColor = (status: 'operating' | 'closed' | 'inactive') => {
    switch (status) {
      case 'operating':
        return 'bg-blue-100';
      case 'closed':
        return 'bg-red-200';
      case 'inactive':
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusText = (status: 'operating' | 'closed' | 'inactive') => {
    switch (status) {
      case 'operating':
        return '운영';
      case 'closed':
        return '휴무';
      case 'inactive':
      default:
        return '미운영';
    }
  };

  const isTimeSlotPast = (time: string, date: Date) => {
    const [hour, minute] = time.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hour, minute, 0, 0);
    return slotDate < new Date();
  };
  
  // 시간 슬롯 토글
  const toggleTimeSlot = (time: string) => {
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
      if (selectedTimeSlots.includes(time)) {
        // 이미 선택된 시간을 클릭하면 선택 해제 (차단 해제)
        setSelectedTimeSlots(selectedTimeSlots.filter(t => t !== time));
      } else {
        // 선택되지 않은 시간을 클릭하면 선택 (차단)
        setSelectedTimeSlots([...selectedTimeSlots, time]);
      }
    }
  };

  // 캘린더 렌더링 함수
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      const isSelectedDate = isSelected(date);
      const isToday = date.toDateString() === today.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isEditable = isDateEditableOrToday(date);
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
          } ${!isEditable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}
          ${isToday ? 'ring-2 ring-blue-300' : ''}`}
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

  // 날짜 포맷팅 함수
  const formatDate = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 8자리 이하로 제한
    const limitedNumbers = numbers.slice(0, 8);
    
    // 날짜 형식으로 변환
    if (limitedNumbers.length <= 4) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 4)}.${limitedNumbers.slice(4)}`;
    } else {
      return `${limitedNumbers.slice(0, 4)}.${limitedNumbers.slice(4, 6)}.${limitedNumbers.slice(6)}`;
    }
  };

  // 날짜 유효성 검사 함수
  const isValidDate = (dateString: string) => {
    const regex = /^\d{4}\.\d{2}\.\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const parts = dateString.split('.');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  // 날짜 입력 핸들러
  const handleDateChange = (value: string, setter: (value: string) => void) => {
    const formattedValue = formatDate(value);
    setter(formattedValue);
  };

  // 달력에서 날짜 선택 핸들러
  const handleDateSelect = (date: Date, setter: (value: string) => void) => {
    const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    setter(formattedDate);
    setShowDatePicker(null);
  };

  // 달력 렌더링 함수
  const renderDatePicker = (currentValue: string, setter: (value: string) => void) => {
    const daysInMonth = new Date(currentDatePicker.getFullYear(), currentDatePicker.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDatePicker.getFullYear(), currentDatePicker.getMonth(), 1).getDay();
    const days = [];

    // 이전 달의 마지막 날들
    const prevMonth = new Date(currentDatePicker.getFullYear(), currentDatePicker.getMonth() - 1);
    const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i);
      days.push(
        <div key={`prev-${i}`} className="text-gray-300 text-center py-1 text-xs cursor-pointer">
          {date.getDate()}
        </div>
      );
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDatePicker.getFullYear(), currentDatePicker.getMonth(), day);
      days.push(
        <div
          key={day}
          onClick={() => handleDateSelect(date, setter)}
          className="text-center py-1 text-xs cursor-pointer hover:bg-blue-100 rounded"
        >
          {day}
        </div>
      );
    }

    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDatePicker.getFullYear(), currentDatePicker.getMonth() + 1, i);
      days.push(
        <div key={`next-${i}`} className="text-gray-300 text-center py-1 text-xs cursor-pointer">
          {date.getDate()}
        </div>
      );
    }

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] p-2">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => setCurrentDatePicker(new Date(currentDatePicker.getFullYear(), currentDatePicker.getMonth() - 1))}
            className="text-gray-600 hover:text-gray-800 text-xs"
          >
            &lt;
          </button>
          <span className="text-xs font-medium">
            {currentDatePicker.getFullYear()}년 {String(currentDatePicker.getMonth() + 1).padStart(2, '0')}월
          </span>
          <button 
            onClick={() => setCurrentDatePicker(new Date(currentDatePicker.getFullYear(), currentDatePicker.getMonth() + 1))}
            className="text-gray-600 hover:text-gray-800 text-xs"
          >
            &gt;
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setFileName(file.name);
    }
  };

  const handleFileDelete = () => {
    setProfileImage(null);
    setFileName('');
  };

  // 경력사항 추가/삭제
  const addCareerEntry = () => {
    if (newCareerEntry.startDate && newCareerEntry.endDate && newCareerEntry.company && newCareerEntry.position) {
      const newEntry: CareerEntry = {
        id: Date.now().toString(),
        ...newCareerEntry
      };
      setCareerEntries([...careerEntries, newEntry]);
      setNewCareerEntry({ startDate: '', endDate: '', company: '', position: '' });
    }
  };

  const deleteCareerEntry = (id: string) => {
    setCareerEntries(careerEntries.filter(entry => entry.id !== id));
  };

  // 자격사항 추가/삭제
  const addQualificationEntry = () => {
    // 인증번호 입력의 세 부분을 결합
    const combinedIssuer = `${newCertificationNumber1}-${newCertificationNumber2}-${newCertificationNumber3}`;
    
    if (newQualificationEntry.name && newCertificationNumber1 && newCertificationNumber2 && newCertificationNumber3) {
      const newEntry: QualificationEntry = {
        id: Date.now().toString(),
        name: newQualificationEntry.name,
        issuer: combinedIssuer,
        acquisitionDate: '',
        serialNumber: ''
      };
      setQualificationEntries([...qualificationEntries, newEntry]);
      setQualificationItemStates(prev => ({
        ...prev,
        [newEntry.id]: 'saved'
      }));
      setNewQualificationEntry({ name: '', issuer: '', acquisitionDate: '', serialNumber: '' });
      setNewCertificationNumber1('');
      setNewCertificationNumber2('');
      setNewCertificationNumber3('');
    }
  };

  const deleteQualificationEntry = (id: string) => {
    setQualificationEntries(qualificationEntries.filter(entry => entry.id !== id));
  };

  // 새로운 자격사항 입력 초기화
  const clearNewQualificationEntry = () => {
    setNewQualificationEntry({ name: '', issuer: '', acquisitionDate: '', serialNumber: '' });
    setNewCertificationNumber1('');
    setNewCertificationNumber2('');
    setNewCertificationNumber3('');
  };

  // 자격사항 편집 함수들
  const startEditingQualification = (entry: QualificationEntry) => {
    setEditingQualificationId(entry.id);
    setEditingQualificationData(entry);
    setQualificationItemStates(prev => ({
      ...prev,
      [entry.id]: 'editing'
    }));
  };

  const saveQualificationEdit = () => {
    if (editingQualificationData) {
      setQualificationEntries(qualificationEntries.map(entry => 
        entry.id === editingQualificationData.id ? editingQualificationData : entry
      ));
      setEditingQualificationId(null);
      setEditingQualificationData(null);
      setQualificationItemStates(prev => ({
        ...prev,
        [editingQualificationData.id]: 'saved'
      }));
    }
  };

  const cancelQualificationEdit = () => {
    setEditingQualificationId(null);
    setEditingQualificationData(null);
    if (editingQualificationData) {
      setQualificationItemStates(prev => ({
        ...prev,
        [editingQualificationData.id]: 'saved'
      }));
    }
  };

  // 자격사항 버튼 상태 관리 함수들
  const handleQualificationSave = (entry: QualificationEntry) => {
    setQualificationItemStates(prev => ({
      ...prev,
      [entry.id]: 'saved'
    }));
  };

  const handleQualificationEdit = (entry: QualificationEntry) => {
    setQualificationItemStates(prev => ({
      ...prev,
      [entry.id]: 'editing'
    }));
    startEditingQualification(entry);
  };

  const handleQualificationDelete = (entry: QualificationEntry) => {
    setQualificationItemStates(prev => ({
      ...prev,
      [entry.id]: 'deleting'
    }));
    deleteQualificationEntry(entry.id);
  };

  // 경력사항 편집 함수들
  const startEditingCareer = (entry: CareerEntry) => {
    setEditingCareerId(entry.id);
    setEditingCareerData(entry);
  };

  const saveCareerEdit = () => {
    if (editingCareerData) {
      setCareerEntries(careerEntries.map(entry => 
        entry.id === editingCareerData.id ? editingCareerData : entry
      ));
      setEditingCareerId(null);
      setEditingCareerData(null);
    }
  };

  const cancelCareerEdit = () => {
    setEditingCareerId(null);
    setEditingCareerData(null);
  };

  // 각 항목별 입력 완료 상태 확인 함수들
  const isProfileImageComplete = () => {
    return profileImage !== null || fileName !== '';
  };

  const isContactComplete = () => {
    return expertContact.trim() !== '';
  };

  const isQualificationComplete = () => {
    return qualificationEntries.length > 0;
  };

  const isCareerComplete = () => {
    return careerEntries.length > 0;
  };

  const isTitleComplete = () => {
    return expertTitle.trim() !== '';
  };

  const isIntroductionComplete = () => {
    return expertIntroduction.trim() !== '';
  };

  const isOperatingHoursComplete = () => {
    // 운영 시간이 하나라도 설정되어 있으면 완료
    return Object.values(dateStatus).some(status => status === 'operating');
  };

  // 전체 수정 처리 함수
  const handleSubmitAll = async () => {
    try {
      console.log('Starting update process...');
      
      // 현재 선택된 날짜의 시간 설정도 저장
      if (selectedDate) {
        const currentDateKey = getDateKey(selectedDate);
        setDateTimeSlots(prev => ({
          ...prev,
          [currentDateKey]: selectedTimeSlots
        }));
      }

      // 차단된 시간 설정 저장 (각 운영 날짜별로)
      console.log('Updating blocked times...');
      const operatingDates = Object.entries(dateStatus).filter(([_, status]) => status === 'operating');
      
      if (operatingDates.length === 0) {
        alert('운영 시간을 설정해주세요. 최소 하나의 날짜는 운영으로 설정되어야 합니다.');
        return;
      }

      // 모든 날짜에 대해 처리 (운영 + 비운영 날짜 모두)
      const allTimeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
      const processedDates = new Set<string>();

      // 1. 운영 날짜들 처리
      for (const [dateKey, _] of operatingDates) {
        const dateSpecificTimeSlots = dateTimeSlots[dateKey] || [];
        const date = new Date(dateKey);
        
        // 오늘 이후의 현재 달 평일인지 확인
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const dateYear = date.getFullYear();
        const dateMonth = date.getMonth();
        const dayOfWeek = date.getDay();
        const isCurrentMonthWeekdayAfterToday = dateYear === currentYear && dateMonth === currentMonth && dayOfWeek >= 1 && dayOfWeek <= 5 && targetDate >= today;
        
        let blockedTimes: string[];
        const dateStatus = getDateStatus(date);
        
        if (dateStatus === 'operating') {
          // 운영일: 선택된 시간들이 차단된 시간 (선택 = 차단, 미선택 = 예약 가능)
          blockedTimes = dateSpecificTimeSlots;
        } else {
          // 휴무일: 모든 시간이 차단됨
          blockedTimes = allTimeSlots;
        }
        
        console.log(`Processing operating date ${dateKey}: blockedTimes =`, blockedTimes);
        
        const success = await submitBlockedTimes(dateKey, blockedTimes);
        if (!success) {
          alert(`운영 시간 설정 저장에 실패했습니다: ${dateKey}`);
          return;
        }
        
        processedDates.add(dateKey);
      }

      // 2. 비활성화된 날짜들 처리 (모든 시간 차단)
      for (const [dateKey, status] of Object.entries(dateStatus)) {
        if (status === 'inactive' && !processedDates.has(dateKey)) {
          console.log(`Processing inactive date ${dateKey}: blocking all times`);
          
          const success = await submitBlockedTimes(dateKey, allTimeSlots);
          if (!success) {
            alert(`운영 시간 설정 저장에 실패했습니다: ${dateKey}`);
            return;
          }
        }
      }
      console.log('Blocked times updated successfully');

      alert('전문가 프로필이 성공적으로 수정되었습니다!');
      navigate(`/expert-detail/${advisorId}`);
      
    } catch (error) {
      console.error('Update error:', error);
      alert('프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // API 호출 함수들
  const submitBlockedTimes = async (date: string, blockedTimes: string[]) => {
    try {
      // 현재 사용자 정보 확인
      const userInfo = AuthService.getUserInfo();
      console.log(`Current user info before blocked times submission:`, userInfo);
      console.log(`Current user role:`, userInfo?.role);
      
      // 토큰도 확인
      const token = AuthService.getAccessToken();
      console.log(`Current access token exists:`, !!token);
      if (token) {
        console.log(`Token starts with:`, token.substring(0, 50) + '...');
      }

      const blockedTimesData: BlockedTimesRequest = {
        blockedTimes: blockedTimes
      };

      console.log(`Submitting blocked times for ${date}:`, blockedTimes);
      console.log(`Request body:`, blockedTimesData);

      const response = await AuthService.authenticatedRequest(`/api/advisors/${advisorId}/blocked-times?date=${date}`, {
        method: 'PUT', // PUT 메서드 사용 (백엔드 API에 맞춤)
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(blockedTimesData)
      });

      if (response.ok) {
        console.log(`Blocked times submitted successfully for ${date}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Failed to submit blocked times for ${date}:`, response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error(`Error submitting blocked times for ${date}:`, error);
      return false;
    }
  };

    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">전문가 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => navigate('/experts')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            전문가 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Sidebar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
        <div className="flex gap-8 relative">
          {/* 메인 콘텐츠 영역 */}
          <div className="flex-1 space-y-12">
            {/* 페이지 제목 */}
            <div className="text-3xl font-semibold text-black mb-8">
              Stalk 전문가 프로필 수정
            </div>
            <div className="w-full pl-10 text-left bg-gray-100 rounded-lg p-4 mb-6">
              <h3 className="text-left text-md font-semibold text-black py-1">자격(면허)에 대한 안내</h3>
              <ul className="text-left text-sm text-gray-700 space-y-3 py-2">
                <li>• 회원가입 시 입력한 자격증 정보가 연동되어 자동으로 등록됩니다.</li>
                <li>• 자격증 추가를 원하시는 경우 마이페이지에서 직접 추가할 수 있습니다.</li>
              </ul>
            </div>
            {/* 인적사항 섹션 */}
            <section className="space-y-8">
              <div className="text-left text-2xl font-semibold text-black border-b border-black pb-2">
                인적사항
              </div>

              {/* 프로필 사진 등록 */}
              <div className="space-y-4">
                <h3 className="text-left text-xl font-semibold text-black">프로필 사진 등록</h3>
                <div className="flex gap-6 items-start">
                  <div className="w-48 h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img 
                        src={URL.createObjectURL(profileImage)} 
                        alt="Profile" 
                        className="w-full h-full object-cover object-top rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full object-cover rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">사진 미리보기</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-row">
                      <label className="whitespace-nowrap text-sm font-medium text-black pt-3 pr-4">파일명</label>
                      <div className="w-full space-y-2">
                        <input
                            type="text"
                            value={fileName}
                            readOnly
                            placeholder="파일을 선택해주세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm"
                        />
                        <div className="flex gap-4 pb-2">
                            <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors text-sm">
                                파일등록
                                <input
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="hidden"
                                />
                            </label>
                            
                            <button
                                onClick={handleFileDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                                파일삭제
                            </button>
                        </div>
                      </div>
                    </div>
                    

                    <div className="pl-14 text-left text-sm text-gray-600 space-y-2">
                      <p>· 프로필 사진은 300x400px 사이즈를 권장합니다.</p>
                      <p>· 파일 형식은 JPG(.jpg, .jpeg) 또는 PNG(.png)만 지원합니다.</p>
                      <p>· 업로드 파일 용량은 2MB 이하만 가능합니다.</p>
                    </div>
                  </div>
                </div>
              </div>


              {/* 전문가 공개 연락처 */}
              <div className="space-y-2">
                <h3 className="text-left text-xl font-semibold text-black">전문가 공개 연락처</h3>
                <input
                  type="text"
                  value={expertContact}
                  onChange={handleContactChange}
                  placeholder="000-0000-0000"
                  maxLength={13}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* 경력사항 섹션 */}
              <div className="space-y-4">
                <h3 className="text-left text-xl font-semibold text-black">경력사항</h3>
                
                <div className="w-full pl-10 text-left border border-gray-200 rounded-lg p-4 mb-6">
                  <ul className="text-left text-sm text-gray-700 space-y-3 py-2">
                    <li>• 퇴사일자에 빈 값으로 두시면 "재직 중"으로 인식됩니다.</li>
                  </ul>
                </div>

                {/* 경력사항 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="p-2 text-center font-medium text-sm">입사일자</th>
                        <th className="p-2 text-center font-medium text-sm">퇴사일자</th>
                        <th className="p-2 text-center font-medium text-sm">회사명(부서명)</th>
                        <th className="p-2 text-center font-medium text-sm">직책</th>
                        <th className="p-2 text-center font-medium text-sm"></th>
                      </tr>
                    </thead>
                    <tbody>

                      {/* 기존 경력사항 항목들 */}
                      {careerEntries.map((entry) => {
                        const isEditing = editingCareerId === entry.id;

                        return (
                          <tr key={entry.id}>
                            {isEditing && editingCareerData ? (
                              <>
                                                                 <td className="p-2 relative">
                                   <div className="flex">
                                     <input
                                       type="text"
                                       value={editingCareerData.startDate}
                                       onChange={(e) => handleDateChange(e.target.value, (value) => setEditingCareerData({...editingCareerData, startDate: value}))}
                                       placeholder="0000.00.00"
                                       maxLength={10}
                                       className={`flex-1 px-3 py-2 border rounded-l-lg text-sm focus:outline-none focus:border-blue-500 ${
                                         editingCareerData.startDate && !isValidDate(editingCareerData.startDate) ? 'border-red-500' : 'border-gray-300'
                                       }`}
                                     />
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setShowDatePicker(showDatePicker === 'edit-start' ? null : 'edit-start');
                                         setCurrentDatePicker(new Date());
                                       }}
                                       className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100 text-sm"
                                     >
                                       📅
                                     </button>
                                   </div>
                                   {showDatePicker === 'edit-start' && renderDatePicker(editingCareerData.startDate, (value) => setEditingCareerData({...editingCareerData, startDate: value}))}
                                 </td>
                                                                 <td className="p-2 relative">
                                   <div className="flex">
                                     <input
                                       type="text"
                                       value={editingCareerData.endDate}
                                       onChange={(e) => handleDateChange(e.target.value, (value) => setEditingCareerData({...editingCareerData, endDate: value}))}
                                       placeholder="0000.00.00"
                                       maxLength={10}
                                       className={`flex-1 px-3 py-2 border rounded-l-lg text-sm focus:outline-none focus:border-blue-500 ${
                                         editingCareerData.endDate && !isValidDate(editingCareerData.endDate) ? 'border-red-500' : 'border-gray-300'
                                       }`}
                                     />
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setShowDatePicker(showDatePicker === 'edit-end' ? null : 'edit-end');
                                         setCurrentDatePicker(new Date());
                                       }}
                                       className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100 text-sm"
                                     >
                                       📅
                                     </button>
                                   </div>
                                   {showDatePicker === 'edit-end' && renderDatePicker(editingCareerData.endDate, (value) => setEditingCareerData({...editingCareerData, endDate: value}))}
                                 </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editingCareerData.company}
                                    onChange={(e) => setEditingCareerData({...editingCareerData, company: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editingCareerData.position}
                                    onChange={(e) => setEditingCareerData({...editingCareerData, position: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={saveCareerEdit}
                                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={cancelCareerEdit}
                                      className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 text-sm">{entry.startDate}</td>
                                <td className="p-3 text-sm">{entry.endDate}</td>
                                <td className="p-3 text-sm">{entry.company}</td>
                                <td className="p-3 text-sm">{entry.position}</td>
                                <td className="p-2">
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => startEditingCareer(entry)}
                                      className="px-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-2xs"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => deleteCareerEntry(entry.id)}
                                      className="px-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-2xs"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}

                      {/* 새로운 경력사항 입력 행 */}
                       <tr>
                         <td className="p-2 relative">
                           <div className="flex">
                             <input
                               type="text"
                               value={newCareerEntry.startDate}
                               onChange={(e) => handleDateChange(e.target.value, (value) => setNewCareerEntry({...newCareerEntry, startDate: value}))}
                               placeholder="0000.00.00"
                               maxLength={10}
                               className={`flex-1 px-3 py-2 border rounded-l-lg text-sm focus:outline-none focus:border-blue-500 ${
                                 newCareerEntry.startDate && !isValidDate(newCareerEntry.startDate) ? 'border-red-500' : 'border-gray-300'
                               }`}
                             />
                             <button
                               type="button"
                               onClick={() => {
                                 setShowDatePicker(showDatePicker === 'new-start' ? null : 'new-start');
                                 setCurrentDatePicker(new Date());
                               }}
                               className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100 text-sm"
                             >
                               📅
                             </button>
                           </div>
                           {showDatePicker === 'new-start' && renderDatePicker(newCareerEntry.startDate, (value) => setNewCareerEntry({...newCareerEntry, startDate: value}))}
                         </td>
                         <td className="p-2 relative">
                           <div className="flex">
                             <input
                               type="text"
                               value={newCareerEntry.endDate}
                               onChange={(e) => handleDateChange(e.target.value, (value) => setNewCareerEntry({...newCareerEntry, endDate: value}))}
                               placeholder="0000.00.00"
                               maxLength={10}
                               className={`flex-1 px-3 py-2 border rounded-l-lg text-sm focus:outline-none focus:border-blue-500 ${
                                 newCareerEntry.endDate && !isValidDate(newCareerEntry.endDate) ? 'border-red-500' : 'border-gray-300'
                               }`}
                             />
                             <button
                               type="button"
                               onClick={() => {
                                 setShowDatePicker(showDatePicker === 'new-end' ? null : 'new-end');
                                 setCurrentDatePicker(new Date());
                               }}
                               className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100 text-sm"
                             >
                               📅
                             </button>
                           </div>
                           {showDatePicker === 'new-end' && renderDatePicker(newCareerEntry.endDate, (value) => setNewCareerEntry({...newCareerEntry, endDate: value}))}
                         </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={newCareerEntry.company}
                            onChange={(e) => setNewCareerEntry({...newCareerEntry, company: e.target.value})}
                            placeholder="회사명(부서명)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={newCareerEntry.position}
                            onChange={(e) => setNewCareerEntry({...newCareerEntry, position: e.target.value})}
                            placeholder="직책"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={addCareerEntry}
                              className="px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-s"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </section>

            {/* 영업 관리 섹션 */}
            <section className="space-y-8">
              <div className="text-left text-2xl font-semibold text-black border-b border-black pb-2">
                영업 관리
              </div>

              {/* 전문가 소개 타이틀 */}
              <div className="space-y-2">
                <label className="block text-left text-lg font-semibold text-black">전문가 소개 타이틀</label>
                <textarea
                  value={expertTitle}
                  onChange={(e) => setExpertTitle(e.target.value)}
                  placeholder="전문가 소개 타이틀을 입력하세요"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 전문가 소개 */}
              <div className="space-y-2">
                <label className="block text-left text-lg font-semibold text-black">전문가 소개</label>
                <textarea
                  value={expertIntroduction}
                  onChange={(e) => setExpertIntroduction(e.target.value)}
                  placeholder="전문가 소개를 입력하세요"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 초기 상담 영업 시간 설정 */}
              <div className="space-y-6">
                <h3 className="text-left text-xl font-semibold text-black">상담 영업 시간 설정</h3>
                
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
                             
                                                           // 현재 달의 평일인지 확인
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const currentYear = today.getFullYear();
                              const currentMonth = today.getMonth();
                              const dateYear = selectedDate ? selectedDate.getFullYear() : 0;
                              const dateMonth = selectedDate ? selectedDate.getMonth() : 0;
                              const dayOfWeek = selectedDate ? selectedDate.getDay() : 0;
                              const targetDate = selectedDate ? new Date(selectedDate) : new Date();
                              targetDate.setHours(0, 0, 0, 0);
                              const isCurrentMonthWeekdayAfterToday = selectedDate && dateYear === currentYear && dateMonth === currentMonth && dayOfWeek >= 1 && dayOfWeek <= 5 && targetDate >= today;
                              const isOperatingCurrentMonthWeekdayAfterToday = currentDateStatus === 'operating' && isCurrentMonthWeekdayAfterToday;
                              
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
            </section>
          </div>

          {/* 사이드바 */}
          <div className="w-80 flex-shrink-0 ml-4">
            <div className="fixed top-32 right-30 w-80 z-10">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="space-y-6">
              <div>
                <h3 className="text-left font-semibold text-black border-b border-gray-300 pb-2 mb-4">
                  인적사항
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isProfileImageComplete() ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <span>프로필 사진 등록</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isContactComplete() ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <span>전문가 공개 연락처</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isCareerComplete() ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <span>경력사항</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-left font-semibold text-black border-b border-gray-300 pb-2 mb-4">
                  영업 관리
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isTitleComplete() ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <span>전문가 소개 타이틀</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isIntroductionComplete() ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <span>전문가 소개</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isOperatingHoursComplete() ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <span>상담 영업 시간 설정</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
                             <button 
                 onClick={handleSubmitAll}
                 className="w-full py-3 mt-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
               >
                 수정 완료
               </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertIntroductionUpdatePage;