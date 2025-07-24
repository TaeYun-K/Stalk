import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NewNavbar from '@/components/new-navbar';


const MyPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('내 정보');
  const [consultationTab, setConsultationTab] = useState('상담 전');
  
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
    selectedAvatar: 'default'
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
  const expertCards = Array(8).fill(null).map((_, index) => favoriteExperts[0]);

  // Avatar options
  const avatarOptions = [
    { id: 'default', icon: '👤', color: 'bg-blue-200' },
    { id: 'fox', icon: '🦊', color: 'bg-orange-200' },
    { id: 'chick', icon: '🐤', color: 'bg-yellow-200' },
    { id: 'panda', icon: '🐼', color: 'bg-gray-200' },
    { id: 'rabbit', icon: '🐰', color: 'bg-pink-200' },
    { id: 'shiba', icon: '🐕', color: 'bg-amber-200' }
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
                  <div className="flex items-center justify-between mb-6">
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
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">아이디</span>
                      <span className="text-gray-900 font-medium">{userInfo.userId}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">이름</span>
                      <span className="text-gray-900 font-medium">{userInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">휴대폰 번호</span>
                      <span className="text-gray-900 font-medium">{userInfo.contact}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
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
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">커뮤니티 프로필</h2>
                    <button 
                      onClick={() => setShowProfileEditModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      프로필 편집
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-medium">🦊</span>
                    </div>
                    <span className="text-gray-900 font-medium">{userInfo.nickname}</span>
                  </div>
                </div>

                {/* 회원탈퇴 Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
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
                <h2 className="text-xl font-semibold text-gray-900 mb-6">상담 영업 스케줄 관리</h2>
                <p className="text-gray-600">상담 영업 스케줄 관리 기능이 여기에 표시됩니다.</p>
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
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-4">프로필 이미지</label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, selectedAvatar: avatar.id })}
                      className={`w-16 h-16 ${avatar.color} rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform ${
                        profileForm.selectedAvatar === avatar.id ? 'ring-4 ring-blue-500' : ''
                      }`}
                    >
                      {avatar.icon}
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
                <label className="block text-sm font-bold text-gray-900 mb-2">닉네임</label>
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