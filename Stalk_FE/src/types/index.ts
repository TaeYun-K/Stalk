// 백엔드 UserProfileResponseDto와 일치
export interface UserProfileResponse {
  userId: string;           // 로그인 ID
  name: string;             // 이름
  contact: string;          // 연락처
  email: string;            // 이메일
  profileImage: string;     // 프로필 이미지
  role: 'USER' | 'ADVISOR' | 'ADMIN';  // 역할
}

// 백엔드 User Entity와 일치
export interface User {
  id: number;               // PK (Long → number)
  name: string;
  userId: string;           // 로그인 ID
  email: string;
  password?: string;        // 비밀번호 (보안상 optional)
  contact: string;
  nickname: string;
  loginType?: string;
  role: 'USER' | 'ADVISOR' | 'ADMIN';
  image?: string;           // 프로필 이미지
  isVerified?: boolean;
  termsAgreed?: boolean;
  isActive?: boolean;
  deletedAt?: string;       // LocalDateTime → string (ISO format)
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 백엔드 UserUpdateRequestDto와 일치
export interface UserUpdateRequest {
  name: string;
  contact: string;          // 010으로 시작하는 11자리
}

// 백엔드 UserUpdateResponseDto와 일치
export interface UserUpdateResponse {
  message: string;
  updatedName: string;
  updatedContact: string;
}

// 백엔드 API 응답 타입
export interface LoginRequest {
  userId: string;
  password: string;
}

// 백엔드 SignupRequest와 일치
export interface SignupRequest {
  name: string;
  userId: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
  contact: string;
  email: string;
  agreedTerms: boolean;
  agreedPrivacy: boolean;
}

// 백엔드 SignupResponse와 일치
export interface SignupResponse {
  success: boolean;
  userId: number;           // Long → number
  message: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserInfo {
  userId: number;
  userName: string;
  role: 'USER' | 'ADVISOR' | 'ADMIN';
}

export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  userInfo: UserInfo | null;
}

export interface BaseApiResponse<T> {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: T;
}

// 상담 관련 타입
export interface ConsultationItem {
  id: string;
  date: string;
  time: string;
  content: string;
  expert: string;
  videoConsultation: string;
  action: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

// 전문가 자격증 정보
export interface QualificationData {
  qualification: string;
  certificateNumber: string;
  birthDate: string;
  verificationNumber: string;
}

// 관심종목 타입 (기존에서 이동)
export interface WatchlistItem {
  code: string;
  name: string;
  price: number;
  change: number;
}

// 폼 데이터 타입들
export interface PasswordForm extends Record<string, unknown> {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface EditInfoForm extends Record<string, unknown> {
  name: string;
  contact: string;
  email: string;
}

export interface ProfileForm extends Record<string, unknown> {
  nickname: string;
  selectedAvatar: string;
}

export interface SignupFormData {
  userId: string;
  name: string;
  nickname: string;
  password: string;
  confirmPassword: string;
  contact: string;
  email: string;
  emailDomain: string;
  verificationCode: string;
  userType: 'general' | 'expert';
  profilePhoto: File | null;
  qualifications: QualificationData[];
  termsAgreement: boolean;
  privacyAgreement: boolean;
  thirdPartyAgreement: boolean;
}

// 스케줄 관련 타입
export interface ScheduleData {
  [key: string]: {
    operating: string[];
    isRestDay: boolean;
  };
}

// 탭 타입
export interface TabItem {
  id: string;
  label: string;
} 