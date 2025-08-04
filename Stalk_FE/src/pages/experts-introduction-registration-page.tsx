import React, { useState } from 'react';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/sidebar';
import Footer from '@/components/footer';
import ExpertProfileImage from '@/assets/expert_profile_image.png';

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

const ExpertsIntroductionRegistrationPage: React.FC = () => {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [expertName, setExpertName] = useState<string>('');
  const [expertContact, setExpertContact] = useState<string>('');

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
  const [newQualificationEntry, setNewQualificationEntry] = useState<Omit<QualificationEntry, 'id'>>({
    name: '',
    issuer: '',
    acquisitionDate: '',
    serialNumber: ''
  });

  // 캘린더 상태
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  
  // 날짜별 운영 상태 관리 (운영: 'operating', 휴무: 'closed', 미운영: 'inactive')
  const [dateStatus, setDateStatus] = useState<Record<string, 'operating' | 'closed' | 'inactive'>>({});
  const [currentDateStatus, setCurrentDateStatus] = useState<'operating' | 'closed' | 'inactive'>('inactive');
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
    if (newQualificationEntry.name && newQualificationEntry.issuer && newQualificationEntry.acquisitionDate && newQualificationEntry.serialNumber) {
      const newEntry: QualificationEntry = {
        id: Date.now().toString(),
        ...newQualificationEntry
      };
      setQualificationEntries([...qualificationEntries, newEntry]);
      setQualificationItemStates(prev => ({
        ...prev,
        [newEntry.id]: 'saved'
      }));
      setNewQualificationEntry({ name: '', issuer: '', acquisitionDate: '', serialNumber: '' });
    }
  };

  const deleteQualificationEntry = (id: string) => {
    setQualificationEntries(qualificationEntries.filter(entry => entry.id !== id));
  };

  // 새로운 자격사항 입력 초기화
  const clearNewQualificationEntry = () => {
    setNewQualificationEntry({ name: '', issuer: '', acquisitionDate: '', serialNumber: '' });
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

  // 캘린더 관련 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // 선택된 날짜의 현재 상태를 currentDateStatus에 설정
    const dateKey = getDateKey(date);
    setCurrentDateStatus(dateStatus[dateKey] || 'inactive');
    // 날짜가 변경되면 시간 슬롯 초기화
    setSelectedTimeSlots([]);
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
    setSelectedDate(today);
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // 날짜 상태 관리 함수들
  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDateStatus = (date: Date) => {
    const dateKey = getDateKey(date);
    return dateStatus[dateKey] || 'inactive';
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

  // 시간 슬롯 토글
  const toggleTimeSlot = (time: string) => {
    // 운영 상태일 때만 시간 슬롯 선택 가능
    if (currentDateStatus !== 'operating') {
      return;
    }
    
    if (selectedTimeSlots.includes(time)) {
      setSelectedTimeSlots(selectedTimeSlots.filter(t => t !== time));
    } else {
      setSelectedTimeSlots([...selectedTimeSlots, time]);
    }
  };

  // 각 항목별 입력 완료 상태 확인 함수들
  const isProfileImageComplete = () => {
    return profileImage !== null;
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
          } hover:bg-blue-100 hover:rounded-full transition-colors`}
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
    <div className="min-h-screen bg-white">
      <Navbar />
      <Sidebar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
        <div className="flex gap-8 relative">
          {/* 메인 콘텐츠 영역 */}
          <div className="flex-1 space-y-12">
            {/* 페이지 제목 */}
            <div className="text-3xl font-semibold text-black mb-8">
              Stalk 전문가 등록
            </div>

            {/* 인적사항 섹션 */}
            <section className="space-y-8">
              <div className="text-left text-2xl font-semibold text-black border-b border-black pb-2">
                인적사항
              </div>

              {/* 프로필 사진 등록 */}
              <div className="space-y-4">
                <h3 className="text-left text-xl font-semibold text-black">프로필 사진 등록</h3>
                <div className="flex gap-6 items-end">
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
                    

                    <div className="text-left text-sm text-gray-600 space-y-2">
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

              {/* 자격사항 섹션 */}
              <div className="space-y-4">
                <h3 className="text-left text-xl font-semibold text-black">자격(면허)사항</h3>
                
                {/* 자격사항 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="p-2 text-center font-medium text-sm">자격(증명)명</th>
                        <th className="p-2 text-center font-medium text-sm">발급처</th>
                        <th className="p-2 text-center font-medium text-sm">취득일자</th>
                        <th className="p-2 text-center font-medium text-sm">일련번호</th>
                        <th className="p-2 text-center font-medium text-sm bg-white">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 기존 자격사항 항목들 */}
                      {qualificationEntries.map((entry) => {
                        const isEditing = editingQualificationId === entry.id;
                        const itemState = qualificationItemStates[entry.id] || 'saved';

                        return (
                          <tr key={entry.id}>
                            {isEditing && editingQualificationData ? (
                              <>
                                                                 <td className="p-2">
                                   <select
                                     value={editingQualificationData.name}
                                     onChange={(e) => setEditingQualificationData({...editingQualificationData, name: e.target.value})}
                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                   >
                                     {qualificationOptions.map((option, index) => (
                                       <option key={index} value={option === '전문 자격을 선택하세요' ? '' : option}>
                                         {option}
                                       </option>
                                     ))}
                                   </select>
                                 </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editingQualificationData.issuer}
                                    onChange={(e) => setEditingQualificationData({...editingQualificationData, issuer: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                </td>
                                                                 <td className="p-2 relative">
                                   <div className="flex">
                                     <input
                                       type="text"
                                       value={editingQualificationData.acquisitionDate}
                                       onChange={(e) => handleDateChange(e.target.value, (value) => setEditingQualificationData({...editingQualificationData, acquisitionDate: value}))}
                                       placeholder="0000.00.00"
                                       maxLength={10}
                                       className={`flex-1 px-3 py-2 border rounded-l-lg text-sm focus:outline-none focus:border-blue-500 ${
                                         editingQualificationData.acquisitionDate && !isValidDate(editingQualificationData.acquisitionDate) ? 'border-red-500' : 'border-gray-300'
                                       }`}
                                     />
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setShowDatePicker(showDatePicker === 'edit-acquisition' ? null : 'edit-acquisition');
                                         setCurrentDatePicker(new Date());
                                       }}
                                       className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm"
                                     >
                                       📅
                                     </button>
                                   </div>
                                   {showDatePicker === 'edit-acquisition' && renderDatePicker(editingQualificationData.acquisitionDate, (value) => setEditingQualificationData({...editingQualificationData, acquisitionDate: value}))}
                                 </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editingQualificationData.serialNumber}
                                    onChange={(e) => setEditingQualificationData({...editingQualificationData, serialNumber: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={saveQualificationEdit}
                                      className="px-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-2xs"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={cancelQualificationEdit}
                                      className="px-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-2xs"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 text-sm">{entry.name}</td>
                                <td className="p-3 text-sm">{entry.issuer}</td>
                                <td className="p-3 text-sm">{entry.acquisitionDate}</td>
                                <td className="p-3 text-sm">{entry.serialNumber}</td>
                                <td className="p-2">
                                  {itemState === 'saved' && (
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => handleQualificationEdit(entry)}
                                        className="px-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-2xs"
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={() => handleQualificationDelete(entry)}
                                        className="px-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-2xs"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}

                                             {/* 새로운 자격사항 입력 행 */}
                       <tr>
                         <td className="p-2">
                           <select
                             value={newQualificationEntry.name}
                             onChange={(e) => setNewQualificationEntry({...newQualificationEntry, name: e.target.value})}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                           >
                             {qualificationOptions.map((option, index) => (
                               <option key={index} value={option === '전문 자격을 선택하세요' ? '' : option}>
                                 {option}
                               </option>
                             ))}
                           </select>
                         </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={newQualificationEntry.issuer}
                            onChange={(e) => setNewQualificationEntry({...newQualificationEntry, issuer: e.target.value})}
                            placeholder="발급처"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </td>
                                                 <td className="p-2 relative">
                           <div className="flex">
                             <input
                               type="text"
                               value={newQualificationEntry.acquisitionDate}
                               onChange={(e) => handleDateChange(e.target.value, (value) => setNewQualificationEntry({...newQualificationEntry, acquisitionDate: value}))}
                               placeholder="0000.00.00"
                               maxLength={10}
                               className={`flex-1 px-3 py-2 border rounded-l-lg text-sm focus:outline-none focus:border-blue-500 ${
                                 newQualificationEntry.acquisitionDate && !isValidDate(newQualificationEntry.acquisitionDate) ? 'border-red-500' : 'border-gray-300'
                               }`}
                             />
                             <button
                               type="button"
                               onClick={() => {
                                 setShowDatePicker(showDatePicker === 'new-acquisition' ? null : 'new-acquisition');
                                 setCurrentDatePicker(new Date());
                               }}
                               className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100 text-sm"
                             >
                               📅
                             </button>
                           </div>
                           {showDatePicker === 'new-acquisition' && renderDatePicker(newQualificationEntry.acquisitionDate, (value) => setNewQualificationEntry({...newQualificationEntry, acquisitionDate: value}))}
                         </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={newQualificationEntry.serialNumber}
                            onChange={(e) => setNewQualificationEntry({...newQualificationEntry, serialNumber: e.target.value})}
                            placeholder="일련번호"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={addQualificationEntry}
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

              {/* 경력사항 섹션 */}
              <div className="space-y-4">
                <h3 className="text-left text-xl font-semibold text-black">경력사항</h3>
                
                {/* 경력사항 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="p-2 text-center font-medium text-sm">입사일자</th>
                        <th className="p-2 text-center font-medium text-sm">퇴사일자</th>
                        <th className="p-2 text-center font-medium text-sm">회사명(부서명)</th>
                        <th className="p-2 text-center font-medium text-sm">직책</th>
                        <th className="p-2 text-center font-medium text-sm bg-white">관리</th>
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
                <h3 className="text-left text-xl font-semibold text-black">초기 상담 영업 시간 설정</h3>
                
                <div className="bg-gray-50 p-6 rounded-lg text-left">
                  <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5">
                    <li>Stalk은 기본적으로 오전 9시부터 오후 8시까지 운영시간을 제공하고 있습니다.</li>
                    <li>제공하는 운영시간 內 전문가님께서 운영하고자 하는 상담 시작 시간과 종료 시간 및 휴무일을 설정해주시기 바랍니다.</li>
                  </ul>
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
                           <span>미운영</span>
                         </div>
                       </div>
                    </div>
                  </div>

                    {/* 시간 설정 */}
                   <div className="w-80 space-y-4">
                     <div className="">
                       <h4 className="text-left text-m font-semibold text-black mb-3">운영/휴무 설정</h4>
                       <div>
                        <div className="bg-white border border-gray-300 rounded-full space-x-2 p-1 flex mb-2">
                            <button
                            onClick={() => handleDateStatusChange('operating')}
                            className={`flex-1 py-2 rounded-full transition-colors text-sm ${
                                currentDateStatus === 'operating' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-white'
                            }`}
                            >
                            운영
                            </button>
                            <button
                            onClick={() => handleDateStatusChange('closed')}
                            className={`flex-1 py-2 rounded-full transition-colors text-sm ${
                                currentDateStatus === 'closed' ? 'bg-red-500 text-white' : 'bg-gray-300 text-white'
                            }`}
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
                           : 'border-white'
                       }`}>
                                                 <div className="grid grid-cols-4 gap-2">
                           {timeSlots.map((time) => {
                             const isDisabled = currentDateStatus !== 'operating';
                             const isSelected = selectedTimeSlots.includes(time);
                             
                             return (
                               <button
                                 key={time}
                                 onClick={() => toggleTimeSlot(time)}
                                 disabled={isDisabled}
                                 className={`py-2 px-3 rounded-lg border text-sm transition-colors ${
                                   isDisabled
                                     ? 'border-gray-200 text-gray-200 bg-gray-50 cursor-not-allowed'
                                     : isSelected
                                     ? 'border-blue-500 text-blue-500 bg-blue-50'
                                     : 'border-gray-300 text-gray-300 hover:border-blue-500 hover:text-blue-500'
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
                    <div className={`w-2 h-2 rounded-full ${isQualificationComplete() ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <span>자격(면허)사항</span>
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
                    <span>초기 상담 영업업 시간 설정</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
              <button className="w-full py-3 mt-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold">
                등록하기
              </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertsIntroductionRegistrationPage; 