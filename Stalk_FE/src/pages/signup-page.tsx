import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NewNavbar from '@/components/new-navbar';
import certificationExample from '@/assets/images/dummy/certification_example.svg';
import stalkLogoBlue from '@/assets/images/logos/Stalk_logo_blue.svg';

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState('general');
  const [timeLeft, setTimeLeft] = useState(300); // 5분 타이머
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showThirdPartyModal, setShowThirdPartyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userIdVerified, setUserIdVerified] = useState(false);
  const [nicknameVerified, setNicknameVerified] = useState(false);
  // 자격증 정보를 위한 인터페이스
  interface QualificationData {
    certificateName: string;
    certificateFileSn: string;
    birth: string;
    certificateFileNumber: string;
  }

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
    profilePhoto: null as File | null,
    qualification: {
      certificateName: '',
      certificateFileSn: '',
      birth: '',
      certificateFileNumber: ''
    } as QualificationData,
    termsAgreement: false,
    privacyAgreement: false,
    thirdPartyAgreement: false
  });

  // 유효성 힌트 표시용 상태
  const getPasswordValidation = () => {
    if (!formData.password) return { isValid: true, errors: [] };
    
    const password = formData.password;
    const errors = [];
    
    if (password.length < 8 || password.length > 20) {
      errors.push('8~20자 길이');
    }
    if (!/(?=.*[0-9])/.test(password)) {
      errors.push('숫자 포함');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('소문자 포함');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('대문자 포함');
    }
    if (!/(?=.*[@#$%^&+=!])/.test(password)) {
      errors.push('특수문자(@#$%^&+=!) 포함');
    }
    if (/\s/.test(password)) {
      errors.push('공백 불가');
    }
    
    return { isValid: errors.length === 0, errors };
  };
  
  const passwordValidation = getPasswordValidation();

  const isContactValid = (() => {
    if (!formData.contact) return true; // 미입력 시 경고 비표시
    const onlyDigits = formData.contact.replace(/[^0-9]/g, '');
    return /^\d{9,11}$/.test(onlyDigits);
  })();

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
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}분 ${secs.toString().padStart(2, '0')}초`;
  };

  const handleUserTypeChange = (type: string) => {
    setUserType(type);
    setFormData(prev => ({ ...prev, userType: type }));
    navigate(`/signup?type=${type}`);
  };

  // 아이디 중복확인
  const handleUserIdCheck = async () => {
    if (!formData.userId) {
      setErrorMessage('아이디를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/auth/duplicate-check?${encodeURIComponent('id|nickname')}=id&value=${formData.userId}`);
      const result = await response.json();
      
      if (result.success && !result.duplicated) {
        setUserIdVerified(true);
        setErrorMessage('');
        alert('사용 가능한 아이디입니다.');
      } else {
        setUserIdVerified(false);
        setErrorMessage('이미 사용 중인 아이디입니다.');
      }
    } catch (error: unknown) {
      console.error('아이디 중복확인 중 오류:', error);
      setErrorMessage('아이디 중복확인 중 오류가 발생했습니다.');
    }
  };

  // 닉네임 중복확인
  const handleNicknameCheck = async () => {
    if (!formData.nickname) {
      setErrorMessage('닉네임을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/auth/duplicate-check?${encodeURIComponent('id|nickname')}=nickname&value=${formData.nickname}`);
      const result = await response.json();
      
      if (result.success && !result.duplicated) {
        setNicknameVerified(true);
        setErrorMessage('');
        alert('사용 가능한 닉네임입니다.');
      } else {
        setNicknameVerified(false);
        setErrorMessage('이미 사용 중인 닉네임입니다.');
      }
    } catch (error: unknown) {
      console.error('닉네임 중복확인 중 오류:', error);
      setErrorMessage('닉네임 중복확인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.name || !formData.userId || !formData.nickname || 
        !formData.password || !formData.confirmPassword || 
        !formData.contact || !formData.email || !formData.emailDomain) {
      setErrorMessage('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 비밀번호 패턴 검증
    const passwordPattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,20}$/;
    if (!passwordPattern.test(formData.password)) {
      setErrorMessage('비밀번호는 8~20자이며, 숫자·대문자·소문자·특수문자를 모두 포함해야 합니다.');
      return;
    }

    // 연락처 패턴 검증 (숫자만 9-11자리)
    const contactPattern = /^\d{9,11}$/;
    if (!contactPattern.test(formData.contact.replace(/[^0-9]/g, ''))) {
      setErrorMessage('연락처는 숫자 9~11자리여야 합니다.');
      return;
    }

    if (!userIdVerified) {
      setErrorMessage('아이디 중복확인을 완료해주세요.');
      return;
    }

    if (!nicknameVerified) {
      setErrorMessage('닉네임 중복확인을 완료해주세요.');
      return;
    }

    if (!isEmailVerified) {
      setErrorMessage('이메일 인증을 완료해주세요.');
      return;
    }

    if (!formData.privacyAgreement || !formData.termsAgreement) {
      setErrorMessage('필수 약관에 동의해주세요.');
      return;
    }

    // 전문가 회원가입 시 추가 검증
    if (userType === 'expert') {
      if (!formData.qualification.certificateName || !formData.qualification.certificateFileSn || 
          !formData.qualification.birth || !formData.qualification.certificateFileNumber) {
        setErrorMessage('모든 자격증 정보를 입력해주세요.');
        return;
      }

      // 자격증 번호 형식 검증 (8자리)
      if (formData.qualification.certificateFileSn.length !== 8) {
        setErrorMessage('합격증 번호는 정확히 8자리여야 합니다.');
        return;
      }

      // 생년월일 형식 검증 (8자리)
      if (formData.qualification.birth.length !== 8) {
        setErrorMessage('생년월일은 YYYYMMDD 형식의 8자리여야 합니다.');
        return;
      }

      // 발급번호 형식 검증 (6자리)
      if (formData.qualification.certificateFileNumber.length !== 6) {
        setErrorMessage('발급번호는 정확히 6자리여야 합니다.');
        return;
      }

      // 프로필 이미지 검증
      if (!formData.profilePhoto) {
        setErrorMessage('프로필 이미지를 업로드해주세요.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let response; // response 변수를 try 블록 시작에서 선언

      if (userType === 'expert') {
        // 전문가 회원가입 - FormData 사용
        const formDataToSend = new FormData();
        
        // 기본 정보
        formDataToSend.append('userId', formData.userId);
        formDataToSend.append('name', formData.name);
        formDataToSend.append('nickname', formData.nickname);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('passwordConfirm', formData.confirmPassword);
        formDataToSend.append('contact', formData.contact.replace(/[^0-9]/g, ''));
        formDataToSend.append('email', `${formData.email}@${formData.emailDomain}`);
        
        // 자격증 정보
        formDataToSend.append('certificateName', formData.qualification.certificateName);
        formDataToSend.append('certificateFileSn', formData.qualification.certificateFileSn);
        formDataToSend.append('birth', formData.qualification.birth);
        formDataToSend.append('certificateFileNumber', formData.qualification.certificateFileNumber);
        
        // 프로필 이미지
        if (formData.profilePhoto) {
          formDataToSend.append('profileImage', formData.profilePhoto);
        }
        
        // 약관 동의
        formDataToSend.append('agreedTerms', 'true');
        formDataToSend.append('agreedPrivacy', 'true');



        response = await fetch('/api/auth/advisor/signup', {
          method: 'POST',
          body: formDataToSend, // Content-Type은 브라우저가 자동으로 설정
        });
      } else {
        // 일반 회원가입 - JSON 사용
        const requestData = {
          name: formData.name,
          userId: formData.userId,
          nickname: formData.nickname,
          password: formData.password,
          passwordConfirm: formData.confirmPassword,
          contact: formData.contact.replace(/[^0-9]/g, ''),
          email: `${formData.email}@${formData.emailDomain}`,
          agreedTerms: true,
          agreedPrivacy: true
        };



        response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
      }


      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 오류:', errorText);
        console.error('응답 헤더:', Object.fromEntries(response.headers.entries()));
        setErrorMessage(`서버 오류 (${response.status}): ${errorText || '회원가입에 실패했습니다.'}`);
        return;
      }

      const result = await response.json();

      if (result.userId || result.success) {
        // 전문가 회원가입 성공 시 자동 로그인 시도
        if (userType === 'expert') {
          try {
            // 자동 로그인 시도
            const loginResponse = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: formData.userId,
                password: formData.password
              }),
            });

            if (loginResponse.ok) {
              const loginResult = await loginResponse.json();
              
              // 로그인 성공 시 토큰 저장
              if (loginResult.accessToken) {
                localStorage.setItem('accessToken', loginResult.accessToken);
                
                // 자격증 인증요청 API 호출
                try {
                  const qualificationResponse = await fetch('/api/advisors/certificate-approval', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${loginResult.accessToken}`
                    },
                    body: JSON.stringify({
                      certificateName: formData.qualification.certificateName,
                      certificateFileSn: formData.qualification.certificateFileSn,
                      birth: formData.qualification.birth,
                      certificateFileNumber: formData.qualification.certificateFileNumber
                    }),
                  });

                  if (qualificationResponse.ok) {
                    alert('회원가입이 완료되었습니다! 자동 로그인되었고 자격증 인증요청이 접수되었습니다.');
                  } else {
                    alert('회원가입이 완료되었습니다! 자동 로그인되었습니다. (자격증 인증요청은 별도로 진행해주세요)');
                  }
                } catch (qualificationError) {
                  console.error('자격증 인증요청 실패:', qualificationError);
                  alert('회원가입이 완료되었습니다! 자동 로그인되었습니다. (자격증 인증요청은 별도로 진행해주세요)');
                }
              } else {
                alert('회원가입이 완료되었습니다! 로그인 후 자격증 인증요청을 진행해주세요.');
              }
            } else {
              alert('회원가입이 완료되었습니다! 로그인 후 자격증 인증요청을 진행해주세요.');
            }
          } catch (loginError) {
            console.error('자동 로그인 실패:', loginError);
            alert('회원가입이 완료되었습니다! 로그인 후 자격증 인증요청을 진행해주세요.');
          }
        } else {
          // 일반 사용자는 기존과 동일
          alert('회원가입이 완료되었습니다!');
        }
        
        navigate('/signup-complete', { state: { name: formData.name, userType } });
      } else {
        setErrorMessage(result.message || '회원가입에 실패했습니다.');
      }
    } catch (error: unknown) {
      console.error('회원가입 중 오류:', error);
      setErrorMessage('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // 아이디나 닉네임이 변경되면 중복확인 상태 초기화
    if (name === 'userId') {
      setUserIdVerified(false);
    }
    if (name === 'nickname') {
      setNicknameVerified(false);
    }
  };



  const handleQualificationChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof QualificationData) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      qualification: {
        ...prev.qualification,
        [field]: value
      }
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 자격증 관련 필드인지 확인
    if (name === 'certificateName') {
      setFormData(prev => ({
        ...prev,
        qualification: {
          ...prev.qualification,
          certificateName: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 자격증 정보 초기화 함수는 현재 사용되지 않으므로 제거

  const handleSendVerification = async () => {
    if (!formData.email || !formData.emailDomain) {
      setErrorMessage('이메일 주소를 입력해주세요.');
      return;
    }

    const fullEmail = `${formData.email}@${formData.emailDomain}`;
    
    try {
      const response = await fetch('/api/auth/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: fullEmail }),
      });

      const result = await response.json();
      
              if (result.success) {
          setIsTimerActive(true);
          setTimeLeft(600); // 10분으로 수정 (600초)
          setIsEmailSent(true);
          setErrorMessage('');
        } else {
          setErrorMessage('인증 코드 발송에 실패했습니다.');
        }
    } catch (error: unknown) {
      console.error('인증 코드 발송 중 오류:', error);
      setErrorMessage('인증 코드 발송 중 오류가 발생했습니다.');
    }
  };

  const handleVerifyEmail = async () => {
    if (!formData.verificationCode) {
      setErrorMessage('인증 코드를 입력해주세요.');
      return;
    }

    const fullEmail = `${formData.email}@${formData.emailDomain}`;
    
    try {
      const response = await fetch('/api/auth/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: fullEmail, code: formData.verificationCode }),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsEmailVerified(true);
        setIsTimerActive(false);
        setErrorMessage('');
      } else {
        setErrorMessage(result.message || '인증 코드가 올바르지 않습니다.');
      }
    } catch (error: unknown) {
      console.error('인증 코드 확인 중 오류:', error);
      setErrorMessage('인증 코드 확인 중 오류가 발생했습니다.');
    }
  };

  const handleAllTermsAgreement = (checked: boolean) => {
    setFormData({
      ...formData,
      privacyAgreement: checked,
      thirdPartyAgreement: checked,
      termsAgreement: checked
    });
  };

  // 개별 약관 체크 시 전체 동의 자동 체크
  const handleIndividualAgreement = (name: string, checked: boolean) => {
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
        <div className="bg-white rounded-3xl py-12 px-16 shadow-lg border border-gray-200">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-lg text-gray-600">Sign up</p>
          </div>

          {/* Error Message moved below submit button */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Photo Section (Expert only) */}
            {userType === 'expert' && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 text-left mb-4">프로필 사진</h3>
                <div className="flex items-start space-x-6">
                  <div className="aspect-[3/4] w-1/6 max-w-[250px] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                    {formData.profilePhoto ? (
                      <img src={URL.createObjectURL(formData.profilePhoto)} alt="Profile" className="w-120 h-160 rounded-lg object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="w-5/6 flex-1 flex flex-col gap-4">
                    <div className="w-full mb-3 flex flex-row justify-between">
                      <input
                        type="text"
                        readOnly
                        value={formData.profilePhoto ? formData.profilePhoto.name : ''}
                        className="w-4/6 px-4 py-3 border border-gray-300 rounded text-m bg-gray-50 focus:outline-none"
                        placeholder="파일명"
                      />
                      <div className="w-2/6 flex space-x-2">
                        
                        {/* 파일 등록 버튼 */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFormData({...formData, profilePhoto: e.target.files?.[0] || null})}
                          className="hidden"
                          id="profilePhoto"
                        />
                        <label htmlFor="profilePhoto" className="w-full bg-blue-500 text-white px-4 py-3 rounded text-m cursor-pointer hover:bg-blue-600 hover:font-bold transition-colors">
                          파일 등록
                        </label>

                        {/* 파일 삭제 버튼 */}
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, profilePhoto: null})}
                          className="w-full bg-red-500 text-white px-4 py-3 rounded text-m hover:bg-red-600 hover:font-bold transition-colors"
                        >
                          파일 삭제
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-m text-gray-500 space-y-1 text-left flex flex-col gap-2">
                      <p>• 프로필 사진은 300x400px 사이즈를 권장합니다.</p>
                      <p>• 파일 형식은 JPGE(.jpg, .jpeg) 또는 PNG(.png)만 지원합니다.</p>
                      <p>• 업로드 파일 용량은 2MB 이하만 가능합니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              {/* Left Column */}
              <div className="space-y-6">
                {/* User ID */}
                <div className='flex flex-row items-center mb-2'>
                  <h3 className="text-sm font-medium text-gray-700 w-2/6 text-left">
                    아이디
                  </h3>
                  <div className="w-full flex space-x-2">
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
                      onClick={handleUserIdCheck}
                      disabled={!formData.userId}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        !formData.userId
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600 hover:font-bold'
                      }`}
                    >
                      중복확인
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-row items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700 w-2/6 text-left">
                  이름
                </h3>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                  placeholder="이름을 입력해주세요"
                  required
                />
              </div>


                {/* Nickname */}
                <div className='flex flex-row items-center mb-2'>
                  <h3 className="text-sm font-medium text-gray-700 w-2/6 text-left">
                    닉네임
                  </h3>
                  <div className="w-full flex space-x-2">
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
                      onClick={handleNicknameCheck}
                      disabled={!formData.nickname}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        !formData.nickname
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600 hover:font-bold'
                      }`}
                    >
                      중복확인
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className='flex flex-row items-center mb-2'>
                  <h3 className="text-sm font-medium text-gray-700 w-2/6 text-left">
                    비밀번호
                  </h3>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                    placeholder="비밀번호를 입력해주세요"
                    required
                  />
                </div>
                {/* Password helper */}
                <div className="text-left ml-[33%] -mt-2 mb-2 text-xs">
                  {formData.password ? (
                    passwordValidation.isValid ? (
                      <div className="text-green-600">✓ 비밀번호 조건을 모두 만족합니다</div>
                    ) : (
                      <div className="text-red-600">
                        
                        <ul className="list-disc list-inside ml-2">
                          {passwordValidation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  ) : (
                    <div className="text-gray-500">
                      비밀번호는 8~20자, 숫자·대문자·소문자·특수문자 포함, 공백 불가
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className='flex flex-row items-center mb-2'>
                  <h3 className="w-2/6 text-sm font-medium text-gray-700 mb-2 text-left">
                    비밀번호 확인
                  </h3>
                  <div className="relative w-full">
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
                    {/* 비밀번호 확인 메시지 - 절대 위치로 배치 */}
                    {formData.password && formData.confirmPassword && (
                      <div className="left-0 top-full mt-6 z-10">
                        {passwordsMatch ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">입력한 비밀번호와 일치합니다.</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm">비밀번호가 일치하지 않습니다.</span>
                          </div>
                                                )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Contact */}
                <div className='flex flex-row items-center mb-2'>
                    <h3 className="w-2/6 text-sm font-medium text-gray-700 mb-2 text-left">
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
                  {/* Contact helper */}
                  <p className={`ml-[33%] -mt-2 mb-2 text-xs ${isContactValid ? 'text-gray-500' : 'text-red-600'}`}>
                    숫자만 9~11자리 입력 (하이픈 제외)
                  </p>
                {/* Email */}
                <div className='flex flex-row items-start mb-2'>
                  <h3 className="mt-3 w-2/6 text-sm font-medium text-gray-700 mb-2 text-left">
                    이메일
                  </h3>
                    <div className="flex flex-col w-full gap-2">
                      <div className="w-full flex space-x-2">
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
                        <div className="w-full flex justify-end gap-3">
                        <select
                        name="emailDomain"
                        value={formData.emailDomain}
                        onChange={handleSelectChange}
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
                          disabled={!formData.email || !formData.emailDomain}
                          className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            !formData.email || !formData.emailDomain
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 hover:font-bold'
                          }`}
                        >
                          {isEmailSent ? '인증번호 재발송' : '인증번호 보내기'}
                        </button>
                        {/* Email helper */}
                        <p className="text-xs text-gray-500 mt-2">
                          유효한 이메일 주소 형식이어야 하며, 인증을 완료해야 회원가입이 가능합니다.
                        </p>
                    </div>
                  
                </div>

                {/* Email Verification */}
                <div className='flex flex-row items-start mb-2'>
                  <div className="mt-3 w-2/6 text-sm text-gray-600 mb-2 text-left">
                    {isTimerActive ? `${formatTime(timeLeft)} 안에 인증을 완료하세요` : '인증하기'}
                  </div>
                  <div className="flex flex-col w-full gap-2">
                    <input
                      type="text"
                      id="verificationCode"
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
                      placeholder="6자리 인증번호"
                      maxLength={6}
                      disabled={!isEmailSent}
                    />
                      {isEmailVerified && (
                        <div className="flex items-center space-x-2 mt-2 text-green-600 justify-start">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm">정상적으로 인증되었습니다.</span>
                        </div>
                      )}
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      disabled={!isEmailSent || !formData.verificationCode}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        !isEmailSent || !formData.verificationCode
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 hover:font-bold'
                      }`}
                    >
                      인증하기
                    </button>
                  </div>
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
                    className="w-full max-w-2xl mx-auto"
                  />
                </div>

                {/* Instructions */}
                <div className="w-full pl-10 text-left border border-gray-200 rounded-lg p-4 mb-6">
                  <ul className="text-left text-sm text-gray-700 space-y-3 py-3">
                    <li>• 위 합격증 원본대조 번호 입력 방식을 보고 아래 창에 입력해주세요.</li>
                    <li>• 입력 시 하이픈('-') 없이 숫자만 입력하시기 바랍니다.</li>
                  </ul>
                </div>

                {/* Form 제목 라벨 */}
                

                {/* 자격증 폼 */}
                <div className="w-full flex flex-row gap-4 mb-4">
                  {/* Select */}
                  <div className='w-1/4 flex flex-col gap-3'>
                    <h3 className="text-left pl-5">전문 자격명</h3>
                  
                    <div className='w-full'>
                      <select
                        name="certificateName"
                        value={formData.qualification.certificateName}
                        onChange={handleSelectChange}
                        className="text-sm text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">전문 자격을 선택하세요</option>
                        <option value="financial_advisor">금융투자상담사</option>
                        <option value="securities_analyst">증권분석사</option>
                        <option value="cfa">CFA</option>
                        <option value="cpa">CPA</option>
                      </select>
                    </div>
                  </div>

                  {/* Input 1 */}
                  <div className='w-3/4 flex flex-col gap-3'>
                    <h3 className='text-left pl-5'>인증번호 입력</h3>
                    <div className='grid grid-cols-3 gap-4'>
                    {/* Input 1 */}
                      <div className="flex flex-col">
                        <input
                          type="text"
                          value={formData.qualification.certificateFileSn}
                          onChange={(e) => handleQualificationChange(e, 'certificateFileSn')}
                          placeholder="('-') 없이 숫자만 입력"
                          maxLength={8}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">중앙에 위치한 합격증 번호 (8자리)</p>
                      </div>

                      {/* Input 2 */}
                      <div className="flex flex-col">
                        <input
                          type="text"
                          value={formData.qualification.birth}
                          onChange={(e) => handleQualificationChange(e, 'birth')}
                          placeholder="YYYYMMDD"
                          maxLength={8}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">생년월일 (YYYYMMDD)</p>
                      </div>

                      {/* Input 3 */}
                      <div className="flex flex-col">
                        <input
                          type="text"
                          value={formData.qualification.certificateFileNumber}
                          onChange={(e) => handleQualificationChange(e, 'certificateFileNumber')}
                          placeholder="6자리 입력"
                          maxLength={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">발급번호 마지막 6자리</p>
                      </div>
                    </div>
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
                    (필수) 개인정보 수집·이용 동의
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
              <div className="flex items-start space-x-3 py-2">
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
                    (필수) 개인정보 제3자 제공 동의
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
              <div className="flex items-start space-x-3 py-2">
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
                    (필수) 필수 약관에 모두 동의
                  </label>
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="text-center mt-6">
                <button
                  type="submit"
                  disabled={!isAllTermsAgreed || isSubmitting}
                  className={`w-full font-semibold py-4 px-6 rounded-lg transition duration-300 shadow-md ${
                    isAllTermsAgreed && !isSubmitting
                      ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? '처리 중...' : '회원가입 완료'}
                </button>
                {errorMessage && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                    <div className="flex items-center space-x-2 text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">{errorMessage}</span>
                    </div>
                  </div>
                )}
                {!isAllTermsAgreed && (
                  <p className="text-red-500 text-sm mt-5">
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
                onClick={() => {
                  handleIndividualAgreement('privacyAgreement', true);
                  setShowPrivacyModal(false);
                }}
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
                onClick={() => {
                  handleIndividualAgreement('thirdPartyAgreement', true);
                  setShowThirdPartyModal(false);
                }}
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