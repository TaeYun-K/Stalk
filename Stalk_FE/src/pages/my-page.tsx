import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import NewNavbar from '@/components/new-navbar';
import profileDefault from '@/assets/images/profiles/Profile_default.svg';
import profileCat from '@/assets/images/profiles/Profile_cat.svg';
import profileCheek from '@/assets/images/profiles/Profile_cheek.svg';
import profileFox from '@/assets/images/profiles/Profile_fox.svg';
import profilePanda from '@/assets/images/profiles/Profile_panda.svg';
import profilePuppy from '@/assets/images/profiles/Profile_puppy.svg';
import profileRabbit from '@/assets/images/profiles/Profile_rabbit.svg';

interface ConsultationItem {
  date: string;
  time: string;
  content: string;
  expert: string;
  videoConsultation: string;
  action: string;
}


const MyPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('내 정보');
  const [consultationTab, setConsultationTab] = useState('상담 전');

  // URL 파라미터에서 탭 설정
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['내 정보', '내 상담 내역', '찜한 전문가', '전문가 페이지 수정', '상담 영업 스케줄 관리'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // 스케줄 관리 상태들
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | null>(null);
  const [scheduleData, setScheduleData] = useState<{[key: string]: {operating: string[], isRestDay: boolean}}>({});
  
  // 상담일지 관련 상태
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationItem | null>(null);
  
  // 전문가 여부 확인 (DB 연결 전 임시 변수)
  const isExpert = true; // true: 전문가, false: 일반 사용자
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  
  const userInfo = {
    userId: 'ssafy_kim',
    name: '김싸피',
    contact: '010-0000-0000',
    email: 'ssafy@samsung.com',
    nickname: '김싸피',
    qualification: '투자자산운용사',
    isApproved: true
  };

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [editInfoForm, setEditInfoForm] = useState({
    name: userInfo.name,
    contact: userInfo.contact,
    email: userInfo.email
  });
  
  const [profileForm, setProfileForm] = useState({
    nickname: userInfo.nickname,
    selectedAvatar: 'fox' // 기본값을 fox로 설정 (현재 표시되는 이미지)
  });
  
  const [imageUploadForm, setImageUploadForm] = useState<{
    fileName: string;
    selectedFile: File | null;
  }>({
    fileName: '',
    selectedFile: null
  });

  const generalTabs = [
    { id: '내 정보', label: '내 정보' },
    { id: '내 상담 내역', label: '내 상담 내역' },
    { id: '찜한 전문가', label: '찜한 전문가' }
  ];

  const expertTabs = [
    { id: '내 정보', label: '내 정보' },
    { id: '내 상담 내역', label: '내 상담 내역' },
    { id: '전문가 페이지 수정', label: '전문가 페이지 수정' },
    { id: '상담 영업 스케줄 관리', label: '상담 영업 스케줄 관리' }
  ];

  const tabs = isExpert ? expertTabs : generalTabs;

  const consultationData = {
    '상담 전': [
      {
        date: '2025. 07. 18.',
        time: '17:00',
        content: '입문 투자 상담',
        expert: '김범주',
        videoConsultation: '상담 입장',
        action: '취소 요청'
      }
    ],
    '상담 완료': [
      {
        date: '2025. 07. 19.',
        time: '20:00',
        content: '입문 투자 상담',
        expert: '김범주',
        videoConsultation: '상담 완료',
        action: '상세보기'
      }
    ]
  };

  const favoriteExperts = [
    {
      id: 1,
      name: '박주현',
      role: '컨설턴트',
      reviews: 50,
      tags: ['#입문자 대상', '#금융'],
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face'
    }
  ];

  // 8개의 동일한 카드를 생성
  const expertCards = Array(8).fill(null).map(() => favoriteExperts[0]);

  // Avatar options
  const avatarOptions = [
    { id: 'default', image: profileDefault },
    { id: 'cat', image: profileCat },
    { id: 'cheek', image: profileCheek },
    { id: 'fox', image: profileFox },
    { id: 'panda', image: profilePanda },
    { id: 'puppy', image: profilePuppy },
    { id: 'rabbit', image: profileRabbit }
  ];

  // Form handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleEditInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditInfoForm({ ...editInfoForm, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setImageUploadForm({
        fileName: files[0].name,
        selectedFile: files[0]
      });
    }
  };

  const handleFileDelete = () => {
    setImageUploadForm({
      fileName: '',
      selectedFile: null
    });
  };

  // 선택된 프로필 이미지 가져오기
  const getSelectedProfileImage = () => {
    const selectedAvatar = avatarOptions.find(avatar => avatar.id === profileForm.selectedAvatar);
    return selectedAvatar ? selectedAvatar.image : profileDefault;
  };

  // 스케줄 관리 관련 함수들
  const operatingHours = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isOperatingHourSelected = (date: Date, hour: string) => {
    const dateKey = formatDateKey(date);
    return scheduleData[dateKey]?.operating?.includes(hour) || false;
  };

  const isRestDay = (date: Date) => {
    const dateKey = formatDateKey(date);
    return scheduleData[dateKey]?.isRestDay || false;
  };

  const toggleOperatingHour = (hour: string) => {
    if (!selectedScheduleDate) return;
    
    const dateKey = formatDateKey(selectedScheduleDate);
    const currentData = scheduleData[dateKey] || { operating: [], isRestDay: false };
    
    const newOperating = currentData.operating.includes(hour)
      ? currentData.operating.filter(h => h !== hour)
      : [...currentData.operating, hour];
    
    setScheduleData({
      ...scheduleData,
      [dateKey]: {
        ...currentData,
        operating: newOperating
      }
    });
  };

  const toggleRestDay = (date: Date) => {
    const dateKey = formatDateKey(date);
    const currentData = scheduleData[dateKey] || { operating: [], isRestDay: false };
    
    setScheduleData({
      ...scheduleData,
      [dateKey]: {
        ...currentData,
        isRestDay: !currentData.isRestDay,
        operating: !currentData.isRestDay ? [] : currentData.operating // 휴무일로 설정하면 운영시간 초기화
      }
    });
  };

  const saveSchedule = () => {
    // 여기서 실제 API 호출하여 스케줄 저장
    alert('스케줄이 저장되었습니다.');
  };

  // 상담일지 관련 함수들
  const handleConsultationDiaryClick = (consultation: ConsultationItem) => {
    setSelectedConsultation(consultation);
    setActiveTab('상담일지');
  };

  const handleCloseDiary = () => {
    setSelectedConsultation(null);
    setActiveTab('내 상담 내역');
  };

  const renderScheduleCalendar = () => {
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
      const dateKey = formatDateKey(date);
      const isSelected = selectedScheduleDate && formatDateKey(selectedScheduleDate) === dateKey;
      const hasSchedule = scheduleData[dateKey];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      days.push(
        <div
          key={day}
          onClick={() => setSelectedScheduleDate(date)}
          className={`text-center py-2 cursor-pointer relative ${
            isSelected
              ? 'bg-blue-500 text-white rounded-lg'
              : isWeekend
              ? date.getDay() === 0 ? 'text-red-500' : 'text-blue-500'
              : 'text-gray-900'
          } hover:bg-blue-100 hover:rounded-lg transition-colors`}
        >
          {day}
          {hasSchedule && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <div className={`w-1 h-1 rounded-full ${
                hasSchedule.isRestDay ? 'bg-red-400' : 'bg-green-400'
              }`}></div>
            </div>
          )}
        </div>
      );
    }

    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <div key={`next-${i}`} className="text-gray-300 text-center py-2">
          {i}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-white">
      <NewNavbar 
        userType={isExpert ? 'expert' : 'general'} 
        onUserTypeChange={() => {}} 
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === '내 정보' && (
              <div className="space-y-8">
                {/* 내 정보 Section */}
                <div className="bg-white rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">내 정보</h2>
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        비밀번호 변경
                      </button>
                      <button 
                        onClick={() => setShowEditInfoModal(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        정보 수정
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">아이디</span>
                      <span className="text-gray-900 font-medium">{userInfo.userId}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">이름</span>
                      <span className="text-gray-900 font-medium">{userInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">휴대폰 번호</span>
                      <span className="text-gray-900 font-medium">{userInfo.contact}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">이메일 주소</span>
                      <span className="text-gray-900 font-medium">{userInfo.email}</span>
                    </div>
                    {isExpert && (
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-600">전문 자격 증명</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 font-medium">{userInfo.qualification}</span>
                          {userInfo.isApproved && (
                            <>
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-blue-600 text-sm font-medium">승인</span>
                              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 커뮤니티 프로필 Section */}
                <div className="bg-white p-6">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">커뮤니티 프로필</h2>
                    <button 
                      onClick={() => setShowProfileEditModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      프로필 편집
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      <img 
                        src={getSelectedProfileImage()} 
                        alt="profile" 
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                    <span className="text-gray-900 font-medium">{profileForm.nickname}</span>
                  </div>
                </div>

                {/* 회원탈퇴 Section */}
                <div className="bg-white p-6">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">회원탈퇴</h2>
                    <button 
                      onClick={() => setShowWithdrawalModal(true)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      회원탈퇴
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === '내 상담 내역' && (
              <div className="bg-white 
              rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">내 상담 내역</h2>
                
                {/* Sub-tabs */}
                <div className="flex space-x-2 mb-6">
                  <button
                    onClick={() => setConsultationTab('상담 전')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      consultationTab === '상담 전'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300'
                    }`}
                  >
                    상담 전
                  </button>
                  <button
                    onClick={() => setConsultationTab('상담 완료')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      consultationTab === '상담 완료'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300'
                    }`}
                  >
                    상담 완료
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상담일자</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상담시간</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상담 요청 내용</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">전문가</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          {consultationTab === '상담 전' ? '화상상담' : '화상상담'}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          {consultationTab === '상담 전' ? '상담취소' : '차트조회'}
                        </th>
                        {consultationTab === '상담 완료' && (
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상담일지</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {consultationData[consultationTab as keyof typeof consultationData].map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="px-4 py-3 text-left text-sm text-gray-900">{item.date}</td>
                          <td className="px-4 py-3 text-left text-sm text-gray-900">{item.time}</td>
                          <td className="px-4 py-3 text-left text-sm text-gray-900">{item.content}</td>
                          <td className="px-4 py-3 text-left text-sm text-gray-900">{item.expert}</td>
                          <td className="px-4 py-3 text-left">
                            <button className="bg-gray-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600 transition-colors">
                              {item.videoConsultation}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button className="bg-gray-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600 transition-colors">
                              {item.action}
                            </button>
                          </td>
                          {consultationTab === '상담 완료' && (
                            <td className="px-4 py-3">
                              <button 
                                onClick={() => handleConsultationDiaryClick(item)}
                                className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                              >
                                상담일지
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === '찜한 전문가' && !isExpert && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">찜한 전문가</h2>
                
                {/* Expert Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {expertCards.map((expert, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                      {/* Review Count */}
                      <div className="flex items-center mb-3">
                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-600">리뷰({expert.reviews})</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {expert.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Profile Image */}
                      <div className="text-center mb-3">
                        <img
                          src={expert.image}
                          alt={expert.name}
                          className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-gray-200"
                        />
                      </div>

                      {/* Role */}
                      <div className="text-center mb-1">
                        <span className="text-xs text-gray-500">{expert.role}</span>
                      </div>

                      {/* Name */}
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900">{expert.name}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 전문가 전용 탭들 */}
            {activeTab === '전문가 페이지 수정' && isExpert && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">전문가 페이지 수정</h2>
                <p className="text-gray-600">전문가 페이지 수정 기능이 여기에 표시됩니다.</p>
              </div>
            )}

            {activeTab === '상담 영업 스케줄 관리' && isExpert && (
              <div className="bg-white rounded-lg p-6">
                <h1 className="font-bold text-left text-xl font-semibold text-gray-900 mb-6">상담 영업 스케줄 관리</h1>
                
                {/* 안내 문구 */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <ul className="text-left text-sm text-gray-700 space-y-1">
                    <li>• Stalk의 일정관리로 온/오프라인의 모든 일정을 한 곳에서 관리하고 일정을 연동하세요.</li>
                    <li>• 체크하는 요일과 시간 즉시 상담가능한 시간 사업자 설정 시간 및 일정 관리를 설정해주시기 바랍니다.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 달력 영역 */}
                  <div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      {/* 월 네비게이션 */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        <h3 className="text-lg font-semibold">
                          {currentMonth.getFullYear()}년 {String(currentMonth.getMonth() + 1).padStart(2, '0')}월
                        </h3>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              const today = new Date();
                              setCurrentMonth(today);
                              setSelectedScheduleDate(today);
                            }}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
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
                              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-900'
                            }`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* 달력 그리드 */}
                      <div className="grid grid-cols-7 gap-1">
                        {renderScheduleCalendar()}
                      </div>
                    </div>
                  </div>

                  {/* 시간대 선택 영역 */}
                  <div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold">
                          운영/휴무 설정
                        </h4>
                        <div className="text-sm text-gray-600">
                          {selectedScheduleDate ? `${selectedScheduleDate.getMonth() + 1}월 ${selectedScheduleDate.getDate()}일` : '날짜를 선택하세요'}
                        </div>
                      </div>

                      {selectedScheduleDate && (
                        <div className="space-y-4">
                          {/* 운영 시간대 */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">운영 시간</h5>
                            <div className="grid grid-cols-4 gap-2">
                              {operatingHours.map((hour) => (
                                <button
                                  key={hour}
                                  onClick={() => toggleOperatingHour(hour)}
                                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                    isOperatingHourSelected(selectedScheduleDate, hour)
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                                  }`}
                                >
                                  {hour}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 휴무 설정 */}
                          <div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isRestDay(selectedScheduleDate)}
                                onChange={() => toggleRestDay(selectedScheduleDate)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-700">이 날은 휴무일로 설정</span>
                            </label>
                          </div>

                          {/* 저장 버튼 */}
                          <div className="pt-4">
                            <button
                              onClick={saveSchedule}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                              저장하기
                            </button>
                          </div>
                        </div>
                      )}

                      {!selectedScheduleDate && (
                        <div className="text-center py-8 text-gray-500">
                          달력에서 날짜를 선택해주세요
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === '상담일지' && selectedConsultation && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">상담일지</h2>
                  <button
                    onClick={handleCloseDiary}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m0 7h18" />
                    </svg>
                    <span>뒤로가기</span>
                  </button>
                </div>

                {/* 비디오 플레이어 */}
                <div className="mb-6">
                  <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center mb-4">
                    <div className="flex items-center justify-center w-full h-full">
                      <button className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center transition-colors">
                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                    
                    {/* 비디오 컨트롤 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <div className="flex items-center space-x-4">
                        <button className="text-white">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                        <div className="flex-1 bg-gray-600 rounded-full h-1">
                          <div className="bg-white rounded-full h-1 w-0"></div>
                        </div>
                        <span className="text-white text-sm">0:00:00 / 1:00:00</span>
                        <button className="text-white">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 상담 정보 */}
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <span className="font-medium">📅 상담일시:</span>
                      <span className="ml-2">2025년 08월 21일(월) 오후 3시</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">👨‍💼 참여자:</span>
                      <span className="ml-2">김윤수 투자운용전문가</span>
                    </div>
                  </div>

                  {/* AI 안내 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <div className="text-blue-600 text-xl mr-3">🤖</div>
                      <div>
                        <h3 className="font-semibold text-blue-800 mb-2">Stalk AI가 상담 영상을 자동으로 요약해드립니다</h3>
                        <p className="text-blue-700 text-sm">
                          상담내용을 전문가가 직접 분석 작성한 상담일지에 대한 신뢰도와 정확성을 책임집니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 상담 내용 분석 */}
                  <div className="space-y-6">
                    {/* 1. 현재 포트폴리오 상태 */}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">1. 현재 포트폴리오 상태</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li>• 주식 투자: 삼성전자 (30%), 투자 (25%), LG전자 (25%)</li>
                        <li>• 주식 투자: 현금성 자산 주요 투자 성향, 투자한동향 입찰하다 중심으로 대정부산 회회사를 중의로 후보들 계속해는 표</li>
                        <li>• 채권 투자: 국고채 위주의 저금리 표평가 중이며, 새로 투자 피상을 고려한 잠시 중다 중동부정리 에이시 후 여러</li>
                        <li>• 향후 새로 투자전자 절약해서 후 에 신지미에 투자 있키 원에의 활용 위안 되물지 특황 공행중로 작동리에 잘된 것로 투처</li>
                      </ul>
                    </div>

                    {/* 2. 리스크 관리 방안 */}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">2. 리스크 관리 방안</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li>• 분산 투자와 분배로 분배된 월간하는 영역을 투자하는 국세 부사무 대리, 영역 수첨현 어능 토형태는 최활하는 반면 형태</li>
                        <li>• 총알 투자법: 과체와 수익한다며 다반짧은 있에 얘기토나타다건 위한 교에 수년간 상기 간여에 대다, 영역 개별 팰건 등인 종기에 준개약</li>
                        <li>• 정기적 실적: 분명현개, 조기에 동한, 상황 선뢰관심한 중 활청 위 신증요여등 투리제거안전리어서 향한다 진회, 상종정화 적들</li>
                        <li>• 의외 조심한 이두: 천공 한 정역 대경을 세상적인 밀청 통적며 토함든 사요되는 해현 전위 위중 위으로한 자국의 요과</li>
                      </ul>
                    </div>

                    {/* 3. 기타 조언 */}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">3. 기타 조언</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li>• 장기 투자 대상 단장장이 서 인상한정 선구를 하 창제혀 장료해 정 깡의 부대료 구입 개경활뭍 좋중외 신다</li>
                        <li>• 업력 기하로: 예상한다는 소책 사업 태양으려면서 되에마을 양이기능 위한 등 여화장 달런 요 신정의 무영 좋다</li>
                        <li>• 확실하고: 실정 기능대물 실어진부력에서의 시장과 간경잘 변동 위 위안업 업의 보 추 정하등 없 오개 청제 세요</li>
                        <li>• 전문가 조언: 정제한와 채능 내향에 이 경험을 간행 대부조언을 관년한 어보되어 건여여 교과대다, 공검 투 조성 이대에 가요</li>
                      </ul>
                    </div>

                    {/* 4. 포트폴리오 조정 및 재분석 */}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">4. 포트폴리오 조정 및 재분석</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li>• 주식 포트폴리오 분야 의해 보고판과 책한 상황아 진약 계보경 입량 입권 호향한년 용하한 금과한 재무지표</li>
                        <li>• 주가한 투자: 새고한 소지 관례 고터 장대면애신 수준소에 진하전 고대기모니산기 좋보다, 공화 적 무형을 무정히 조기</li>
                        <li>• 정기적 경정조기 투 간계 원으로, 조기 검고주터 맞는 강제고적, 엳회 근앉터의 사회보고기 화기 조기의 대한 기확한 조준</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 푸터 */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>개인정보 처리방침 | 고객센터 0000-0000 | 공지사항</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>사업자 등록번호 : 000-00-0000 대표 : 스토킹 주소 : 46733 부산광역시 강서구 녹산산업중로 333</p>
                    <p>스토킹에서 제공되는 투자 정보 및 정보는 투자 판단을 위한 단순 참고용일 뿐이며, 투자 권유 및 광고, 종목 추천을 위한 목적이 절대 아닙니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">비밀번호 변경</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="현재 비밀번호를 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">새로운 비밀번호</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="새로운 비밀번호를 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">새로운 비밀번호 확인</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="새로운 비밀번호를 한 번 더 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  변경하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 정보 수정 모달 */}
      {showEditInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">내 정보 수정</h3>
              <button
                onClick={() => setShowEditInfoModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <input
                  type="text"
                  name="name"
                  value={editInfoForm.name}
                  onChange={handleEditInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                <input
                  type="tel"
                  name="contact"
                  value={editInfoForm.contact}
                  onChange={handleEditInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이메일 주소</label>
                <input
                  type="email"
                  name="email"
                  value={editInfoForm.email}
                  onChange={handleEditInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 프로필 편집 모달 */}
      {showProfileEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">내 커뮤니티 프로필 수정</h3>
              <button
                onClick={() => setShowProfileEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              setShowProfileEditModal(false);
            }}>
              <div>
                <label className="block text-left text-m font-bold text-gray-900 mb-4">프로필 이미지</label>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, selectedAvatar: avatar.id })}
                      className={`w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform ${
                        profileForm.selectedAvatar === avatar.id ? 'ring-4 ring-blue-500' : ''
                      }`}
                    >
                      <img 
                        src={avatar.image} 
                        alt={avatar.id} 
                        className="w-14 h-14 rounded-full"
                      />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowImageUploadModal(true)}
                    className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-left text-m font-bold text-gray-900 mb-2">닉네임</label>
                <input
                  type="text"
                  name="nickname"
                  value={profileForm.nickname}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 회원탈퇴 모달 */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">회원 탈퇴</h3>
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-gray-700">
                <p className="mb-2">회원 탈퇴를 진행하면 모든 계정의 정보가 삭제되고 다시 복구할 수 없습니다.</p>
                <p>삭제를 원치 않는 경우 "돌아가기" 버튼을 누르세요.</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  회원탈퇴
                </button>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 이미지 추가 모달 */}
      {showImageUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">프로필 이미지 추가</h3>
              <button
                onClick={() => setShowImageUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">파일명</label>
                <input
                  type="text"
                  value={imageUploadForm.fileName}
                  placeholder="파일을 선택해주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
              <div className="flex space-x-3">
                <input
                  type="file"
                  id="file-upload"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer"
                >
                  파일등록
                </label>
                <button
                  type="button"
                  onClick={handleFileDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  파일삭제
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 프로필 사진은 300x400px 사이즈를 권장합니다.</li>
                  <li>• 파일 형식은 JPGE(.jpg, .jpeg) 또는 PNG(.png)만 지원합니다.</li>
                  <li>• 업로드 파일 용량은 2MB 이하만 가능합니다.</li>
                </ul>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};

export default MyPage; 