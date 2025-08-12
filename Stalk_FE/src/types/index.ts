// 백엔드 UserProfileResponseDto와 일치
export interface UserProfileResponse {
  userId: string; // 로그인 ID
  name: string; // 이름
  nickname: string; // 닉네임 (백엔드에서 추가됨)
  contact: string; // 연락처
  email: string; // 이메일
  profileImage: string; // 프로필 이미지
  role: "USER" | "ADVISOR" | "ADMIN"; // 역할
}

// 백엔드 User Entity와 일치
export interface User {
  id: number; // PK (Long → number)
  name: string;
  userId: string; // 로그인 ID
  email: string;
  password?: string; // 비밀번호 (보안상 optional)
  contact: string;
  nickname: string;
  loginType?: string;
  role: "USER" | "ADVISOR" | "ADMIN";
  image?: string; // 프로필 이미지
  isVerified?: boolean;
  termsAgreed?: boolean;
  isActive?: boolean;
  deletedAt?: string; // LocalDateTime → string (ISO format)
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 백엔드 UserUpdateRequestDto와 일치
export interface UserUpdateRequest {
  name: string;
  contact: string; // 010으로 시작하는 11자리
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

// 전문가 회원가입 요청 타입
export interface AdvisorSignupRequest {
  userId: string;
  name: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
  contact: string;
  email: string;
  certificateName: string;
  certificateFileSn: string;
  birth: string;
  certificateFileNumber: string;
  profileImage: File;
  agreedTerms: boolean;
  agreedPrivacy: boolean;
}

// 백엔드 SignupResponse와 일치
export interface SignupResponse {
  success: boolean;
  userId: number; // Long → number
  message: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserInfo {
  userId: number;
  userName: string;
  role: "USER" | "ADVISOR" | "ADMIN";
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
  status: "scheduled" | "completed" | "cancelled";
}

// 전문가 자격증 정보
export interface QualificationData {
  certificateName: string;
  certificateFileSn: string;
  birth: string;
  certificateFileNumber: string;
}

// 관심종목 타입 (기존에서 이동)
export interface WatchlistItem {
  code: string;
  name: string;
  price: number; // 현재가
  changeAmount: number; // 전일 대비 가격 변화 (원)
  changeRate: number; // 전일 대비 등락률 (%)
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
  userType: "general" | "expert";
  profilePhoto: File | null;
  qualification: QualificationData;
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

// 커뮤니티 관련 타입들
export enum PostCategory {
  ALL = "ALL",
  QUESTION = "QUESTION",
  TRADE_RECORD = "TRADE_RECORD",
  STOCK_DISCUSSION = "STOCK_DISCUSSION",
  MARKET_ANALYSIS = "MARKET_ANALYSIS",
}

export interface CommunityPostSummaryDto {
  postId: number;
  title: string;
  authorName: string;
  authorRole: string;
  category: string;
  categoryDisplayName: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

export interface CommunityPostDetailDto {
  postId: number;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  category: string;
  categoryDisplayName: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostCreateRequestDto {
  category: string;
  title: string;
  content: string;
}

export interface CommunityPostUpdateRequestDto {
  category: string;
  title: string;
  content: string;
}

export interface CommunityCommentDto {
  commentId: number;
  content: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface CommunityCommentCreateRequestDto {
  content: string;
}

export interface CommunityCommentUpdateRequestDto {
  content: string;
}

// 관리자 관련 타입들
export enum ApprovalStatus {
  ALL = "ALL",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum RejectionReason {
  INVALID_CERTIFICATE = "INVALID_CERTIFICATE",
  EXPIRED_CERTIFICATE = "EXPIRED_CERTIFICATE",
  INSUFFICIENT_DOCUMENTS = "INSUFFICIENT_DOCUMENTS",
  VERIFICATION_FAILED = "VERIFICATION_FAILED",
  OTHER = "OTHER",
}

// 전문가 인증 요청 정보
export interface AdvisorApprovalRequest {
  requestId: number;
  advisorId: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  advisorName: string;
  email: string;
  contact: string;
  certificateInfo: {
    certificateName: string;
    certificateNumber: string;
    serialNumber: string;
  };
  processedBy: {
    adminId: number;
    adminName: string;
  } | null;
  rejectionReason: string | null;
  customReason: string | null;
}

// 인증 요청 목록 조회 요청
export interface ApprovalRequestListRequest {
  status: ApprovalStatus;
  pageNo: number;
  pageSize: number;
}

// 승인/거절 액션 요청
export interface ApprovalActionRequest {
  rejectionReason: RejectionReason;
  customReason?: string;
}

// 승인/거절 액션 응답
export interface ApprovalActionResponse {
  requestId: number;
  advisorId: number;
  status: string;
  processedAt: string;
  processedBy: string;
  rejectionReason?: string;
  customReason?: string;
}

// 페이징 응답
export interface CursorPage<T> {
  content: T[];
  nextCursor: number | null;
  hasNext: boolean;
  pageSize: number;
  pageNo: number;
}

// 전문가 자격증 승인 요청 관련 타입들
export interface CertificateApprovalRequest {
  previousRequestId?: number;
  certificateName: string;
  certificateFileSn: string;
  birth: string;
  certificateFileNumber: string;
}

export interface CertificateApprovalResponse {
  requestId: number;
  status: string;
  requestType: string;
  message: string;
}

export interface ApprovalHistoryResponse {
  requestId: number;
  certificateName: string;
  certificateFileSn: string;
  certificateFileNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  statusDisplayName: string;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  processedByAdminName?: string;
  previousRequestId?: number;
}

export interface ProfileStatusResponse {
  advisorId: number;
  message: string;
}

// 상담일지 관련 타입들
export interface VideoRecording {
  id: number;
  consultationId: number;
  recordingId: string;
  sessionId: string;
  url: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface ConsultationDiaryResponse {
  recordings: VideoRecording[];
  consultationInfo: {
    id: number;
    date: string;
    time: string;
    content: string;
    expert: string;
  };
}
