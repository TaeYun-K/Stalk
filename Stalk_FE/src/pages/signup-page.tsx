import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NewNavbar from '@/components/new-navbar';
import certificationExample from '@/assets/certification_example.svg';
import stalkLogoBlue from '@/assets/Stalk_logo_blue.svg';

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState('general');
  const [timeLeft, setTimeLeft] = useState(300); // 5분 타이머
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showThirdPartyModal, setShowThirdPartyModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    contact: '',
    email: '',
    emailDomain: '',
    verificationCode: '',
    userType: 'general',
    profilePhoto: null,
    qualification: '',
    certificateNumber: '',
    birthDate: '',
    verificationNumber: '',
    termsAgreement: false,
    privacyAgreement: false,
    thirdPartyAgreement: false
  });

  // URL 파라미터에서 사용자 타입 읽기
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'expert' || typeParam === 'general') {
      setUserType(typeParam);
      setFormData(prev => ({ ...prev, userType: typeParam }));
    }
  }, [searchParams]);

  // 타이머 효과
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}분 ${secs.toString().padStart(2, '0')}초`;
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setFormData(prev => ({ ...prev, userType: type }));
    navigate(`/signup?type=${type}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/signup-complete');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // 비밀번호 확인 검증
    if (name === 'password' || name === 'confirmPassword') {
      const password = name === 'password' ? value : formData.password;
      const confirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword;
      
      if (confirmPassword) {
        setPasswordsMatch(password === confirmPassword);
      } else {
        setPasswordsMatch(true); // 입력하지 않았으면 에러 표시 안함
      }
    }
  };

  const handleSendVerification = () => {
    setIsTimerActive(true);
    setTimeLeft(300);
    setIsEmailSent(true);
  };

  const handleAllTermsAgreement = (checked) => {
    setFormData({
      ...formData,
      privacyAgreement: checked,
      thirdPartyAgreement: checked,
      termsAgreement: checked
    });
  };

  // 개별 약관 체크 시 전체 동의 자동 체크
  const handleIndividualAgreement = (name, checked) => {
    const newFormData = {
      ...formData,
      [name]: checked
    };
    
    // 개별 약관이 모두 체크되면 전체 동의도 체크
    if (name === 'privacyAgreement' || name === 'thirdPartyAgreement') {
      const otherAgreement = name === 'privacyAgreement' ? 'thirdPartyAgreement' : 'privacyAgreement';
      if (checked && newFormData[otherAgreement]) {
        newFormData.termsAgreement = true;
      } else if (!checked) {
        newFormData.termsAgreement = false;
      }
    }
    
    setFormData(newFormData);
  };

  // 모든 필수 약관이 체크되었는지 확인
  const isAllTermsAgreed = formData.privacyAgreement && formData.thirdPartyAgreement;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <NewNavbar 
        userType={userType}
        onUserTypeChange={handleUserTypeChange}
        showUserTypeToggle={true}
      />

      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Signup Form */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-lg text-gray-600">Sign up</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Photo Section (Expert only) */}
            {userType === 'expert' && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">프로필 사진</h3>
                <div className="flex items-start space-x-6">
                  <div className="w-24 h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                    {formData.profilePhoto ? (
                      <img src={URL.createObjectURL(formData.profilePhoto)} alt="Profile" className="w-120 h-160 rounded-lg object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="mb-3 flex flex-row justify-between">
                      <input
                        type="text"
                        readOnly
                        value={formData.profilePhoto ? formData.profilePhoto.name : ''}
                        className="w-3/4 px-3 py-3 border border-gray-300 rounded text-sm bg-gray-50 focus:outline-none"
                        placeholder="파일명"
                      />
                      <div className="flex space-x-2 mb-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFormData({...formData, profilePhoto: e.target.files[0]})}
                          className="hidden"
                          id="profilePhoto"
                        />
                        <label htmlFor="profilePhoto" className="bg-blue-500 text-white px-4 py-3 rounded text-sm cursor-pointer hover:bg-blue-600 transition-colors">
                          파일 등록
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, profilePhoto: null})}
                          className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          파일 삭제
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1 text-left">
                      <p>• 프로필 사진은 300x400px 사이즈를 권장합니다.</p>
                      <p>• 파일 형식은 JPGE(.jpg, .jpeg) 또는 PNG(.png)만 지원합니다.</p>
                      <p>• 업로드 파일 용량은 2MB 이하만 가능합니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* User ID */}
                <div className='flex flex-row items-center mb-2'>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 text-left w-1/6">
                    아이디
                  </h3>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                      placeholder="아이디를 입력하세요"
                      required
                    />
                    <button
                      type="button"
                      className="bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      중복확인
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-row items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700 w-1/6 text-left">
                  이름
                </h3>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                  placeholder="이름을 입력해주세요"
                  required
                />
              </div>


                {/* Nickname */}
                <div className='flex flex-row items-center mb-2'>
                  <h3 className="text-sm font-medium text-gray-700 w-1/6 text-left">
                    닉네임
                  </h3>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      id="nickname"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                      placeholder="닉네임을 입력하세요"
                      required
                    />
                    <button
                      type="button"
                      className="bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      중복확인
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className='flex flex-row items-center mb-2'>
                  <h3 className="text-sm font-medium text-gray-700 w-1/6 text-left">
                    비밀번호
                  </h3>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-5/6 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                    placeholder="비밀번호를 입력해주세요"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className='flex flex-row items-center mb-2 gap-3'>
                  <h3 className="w-1/6 text-sm font-medium text-gray-700 mb-2 text-left">
                    비밀번호 확인
                  </h3>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 ${
                      !passwordsMatch && formData.confirmPassword 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="비밀번호를 한 번 더 입력해주세요"
                    required
                  />
                  {formData.password && formData.confirmPassword && passwordsMatch && (
                    <div className="flex items-center space-x-2 mt-2 text-green-600 justify-start">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">입력한 비밀번호와 일치합니다.</span>
                    </div>
                  )}
                  {!passwordsMatch && formData.confirmPassword && (
                    <div className="flex items-center space-x-2 mt-2 text-red-600 justify-start">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm">비밀번호가 일치하지 않습니다.</span>
                    </div>
                  )}
                </div>

                
                
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Contact */}
                <div className='flex flex-row items-center mb-2'>
                    <h3 className="w-1/6 text-sm font-medium text-gray-700 mb-2 text-left">
                      연락처
                    </h3>
                    <input
                      type="tel"
                      id="contact"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                      placeholder="연락처를 입력해주세요"
                      required
                    />
                  </div>
                {/* Email */}
                <div className='flex flex-row items-center mb-2'>
                  <h3 className="w-1/6 text-sm font-medium text-gray-700 mb-2 text-left">
                    이메일
                  </h3>
                  
                  
                  
                    <div>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                          placeholder="이메일을 입력하세요"
                          required
                        />
                        <span className="flex items-center px-3 text-gray-500 font-medium">@</span>
                        
                      </div>
                        <div className="flex justify-end gap-3">
                        <select
                        name="emailDomain"
                        value={formData.emailDomain}
                        onChange={handleChange}
                        className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300 ${
                          formData.emailDomain === '' ? 'text-gray-400' : 'text-black'
                        }`}
                      >
                        <option value="" disabled hidden>
                          이메일 주소를 입력하세요
                        </option>
                        <option value="gmail.com">gmail.com</option>
                        <option value="naver.com">naver.com</option>
                        <option value="daum.net">daum.net</option>
                        <option value="hanmail.net">hanmail.net</option>
                        <option value="outlook.com">outlook.com</option>
                      </select>

                        
                      </div>
                      <button
                          type="button"
                          onClick={handleSendVerification}
                          className="w-full bg-gray-200 text-gray-600 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition-colors"
                        >
                          {isEmailSent ? '인증번호 재발송' : '인증번호 보내기'}
                        </button>
                    </div>
                  
                </div>

                {/* Email Verification */}
                <div className='flex flex-row items-center mb-2'>
                  <div className="w-1/6 text-sm text-gray-600 mb-2 text-left">
                    {isTimerActive ? `${formatTime(timeLeft)} 안에 인증을 완료하세요` : '인증하기'}
                  </div>
                  <div className="flex flex-col ">
                    <input
                      type="text"
                      id="verificationCode"
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      className="px-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                      placeholder="6자리 인증번호"
                      maxLength="6"
                    />
                    <button
                      type="button"
                      className="bg-gray-200 text-gray-600 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition-colors whitespace-nowrap"
                    >
                      인증하기
                    </button>
                  </div>
                  {formData.verificationCode && (
                    <div className="flex items-center space-x-2 mt-2 text-green-600 justify-start">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">정상적으로 인증되었습니다.</span>
                    </div>
                  )}
                </div>

                
              </div>
            </div>
            {userType === 'expert' && (
              <div className="border-t border-gray-200 pt-6 w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">전문 자격 인증</h3>

                {/* Certificate Example Image */}
                <div className="mb-6">
                  <img 
                    src={certificationExample} 
                    alt="Certificate Example" 
                    className="w-full max-w-2xl mx-auto border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Instructions */}
                <div className="mx-20 pl-10 text-left border border-gray-200 rounded-lg p-4 mb-6">
                  <ul className="text-left  text-sm text-gray-700 space-y-1">
                    <li>• 위 합격증 원본대조 번호 입력 방식을 보고 아래 창에 입력해주세요.</li>
                    <li>• 입력 시 하이픈('-') 없이 숫자만 입력하시기 바랍니다.</li>
                  </ul>
                </div>

                {/* Form 제목 라벨 */}
                <div className="grid grid-cols-4 gap-4 mb-1 w-full">
                  <h4 className="text-sm font-medium text-gray-700 text-left">전문 자격명</h4>
                  <h4 className="text-sm font-medium text-gray-700 text-left col-span-3">합격증 원본대조 번호</h4>
                </div>

                {/* Form 입력 부분 */}
                <div className="grid grid-cols-4 gap-4 w-full">
                  {/* Select */}
                  <div>
                    <select
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className="text-sm text-gray-500 w-full h-3/4 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">전문 자격을 선택하세요</option>
                      <option value="financial_advisor">금융투자상담사</option>
                      <option value="securities_analyst">증권분석사</option>
                      <option value="cfa">CFA</option>
                      <option value="cpa">CPA</option>
                    </select>
                    
                  </div>

                  {/* Input 1 */}
                  <div className="flex flex-col">
                    <input
                      type="text"
                      name="certificateNumber"
                      value={formData.certificateNumber}
                      onChange={handleChange}
                      placeholder="없이 숫자만 입력"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">중앙에 위치한 합격증 번호</p>
                  </div>

                  {/* Input 2 */}
                  <div className="flex flex-col">
                    <input
                      type="text"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      placeholder="없이 숫자만 입력"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">합격증에 표기된 생년월일</p>
                  </div>

                  {/* Input 3 */}
                  <div className="flex flex-col">
                    <input
                      type="text"
                      name="verificationNumber"
                      value={formData.verificationNumber}
                      onChange={handleChange}
                      placeholder="없이 숫자만 입력"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">하단 발급번호의 마지막 6자리</p>
                  </div>
                </div>
              </div>
            )}


            <div className="space-y-2 pt-5 border-t border-gray-200">
              {/* 개인정보 수집·이용 동의 */}
              <div className="flex items-start space-x-3">
                <input
                  id="privacyAgreement"
                  name="privacyAgreement"
                  type="checkbox"
                  checked={formData.privacyAgreement}
                  onChange={(e) =>
                    handleIndividualAgreement('privacyAgreement', e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <div className="flex-1 flex items-center">
                  <label
                    htmlFor="privacyAgreement"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    개인정보 수집·이용 동의
                  </label>
                  <button 
                    type="button" 
                    className="ml-auto text-blue-500 hover:text-blue-700"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              

              {/* 개인정보 제3자 제공 동의 */}
              <div className="flex items-start space-x-3">
                <input
                  id="thirdPartyAgreement"
                  name="thirdPartyAgreement"
                  type="checkbox"
                  checked={formData.thirdPartyAgreement}
                  onChange={(e) =>
                    handleIndividualAgreement('thirdPartyAgreement', e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <div className="flex-1 flex items-center">
                  <label
                    htmlFor="thirdPartyAgreement"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    개인정보 제3자 제공 동의
                  </label>
                  <button 
                    type="button" 
                    className="ml-auto text-blue-500 hover:text-blue-700"
                    onClick={() => setShowThirdPartyModal(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <hr className="my-2 border-gray-200" />

              {/* 필수 약관 전체 동의 */}
              <div className="flex items-start space-x-3">
                <input
                  id="termsAgreement"
                  name="termsAgreement"
                  type="checkbox"
                  checked={formData.termsAgreement}
                  onChange={(e) => handleAllTermsAgreement(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <div className="flex-1 flex items-center">
                  <label
                    htmlFor="termsAgreement"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    필수 약관에 모두 동의
                  </label>
                </div>
              </div>
              <hr className="my-2 border-gray-200" />

              {/* 제출 버튼 */}
              <div className="text-center mt-6">
                <button
                  type="submit"
                  disabled={!isAllTermsAgreed}
                  className={`w-full font-semibold py-4 px-6 rounded-lg transition duration-300 shadow-md ${
                    isAllTermsAgreed 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  회원가입 완료
                </button>
                {!isAllTermsAgreed && (
                  <p className="text-red-500 text-sm mt-2">
                    필수 약관에 모두 동의해주세요.
                  </p>
                )}
              </div>
            </div>


          </form>
        </div>
      </div>

      {/* 개인정보 수집·이용 동의 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img src={stalkLogoBlue} alt="Stalk Logo" className="h-8" />
                <h2 className="text-xl font-bold text-blue-600">개인정보 수집·이용 동의</h2>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* 모달 내용 */}
            <div className="p-6 text-left">
              <p className="text-gray-700 mb-6">
                Stalk는 회원가입 및 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">1. 수집 항목</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">- 필수: 이름, 이메일, 비밀번호, 휴대폰 번호</p>
                      <p className="text-sm text-gray-600">- 선택: 생년월일, 프로필 이미지</p>
                    </div>
                    
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">2. 수집 및 이용 목적</h3>
                  <p className="text-sm text-gray-600"> - 회원 식별 및 가입 의사 확인</p>
                  <p className="text-sm text-gray-600"> - 서비스 제공 및 이용자 관리</p>
                  <p className="text-sm text-gray-600"> - 고객 문의 대응 및 공지사항 전달</p>
                  <p className="text-sm text-gray-600"> - 맞춤형 콘텐츠 추천 및 서비스 개선</p>
                  
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">3. 보유 및 이용 기간</h3>
                  <p className="text-sm text-gray-600 mb-2"> - 회원 탈퇴 시까지</p>
                  <p className="text-sm text-gray-600">
                   - 단, 관련 법령에 따라 일정 기간 보관이 필요한 정보는 해당 기간 동안 보관됩니다.
                  </p>
                  <ul className="text-sm text-gray-600 ml-4 mt-2 space-y-1">
                    <li>• 계약 또는 청약철회 기록: 5년</li>
                    <li>• 대금 결제 및 재화 공급 기록: 5년</li>
                    <li>• 소비자 불만 또는 분쟁처리 기록: 3년</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보 제3자 제공 동의 모달 */}
      {showThirdPartyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img src={stalkLogoBlue} alt="Stalk Logo" className="h-8" />
                <h2 className="text-xl font-bold text-blue-600">개인정보 제3자 제공 동의</h2>
              </div>
              <button
                onClick={() => setShowThirdPartyModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* 모달 내용 */}
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Stalk는 서비스 제공을 위해 아래와 같이 개인정보를 제3자에게 제공할 수 있습니다.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">제공 항목</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 이름, 이메일, 휴대폰 번호</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">제공 목적</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 서비스 제공 및 운영</li>
                    <li>• 고객 지원 및 문의 응대</li>
                    <li>• 법적 의무 이행</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">보유 및 이용 기간</h3>
                  <p className="text-sm text-gray-600">
                    서비스 제공 목적 달성 시까지 또는 회원 탈퇴 시까지
                  </p>
                </div>
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowThirdPartyModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupPage; 