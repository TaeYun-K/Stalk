import { TabItem } from '@/types';

// 사용자 타입 상수
export const USER_TYPES = {
  GENERAL: 'general' as const,
  EXPERT: 'expert' as const,
};

// 상담 상태 상수
export const CONSULTATION_STATUS = {
  SCHEDULED: 'scheduled' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const,
};

// 마이페이지 탭 설정
export const GENERAL_TABS: TabItem[] = [
  { id: '내 정보', label: '내 정보' },
  { id: '내 상담 내역', label: '내 상담 내역' },
  { id: '찜한 전문가', label: '찜한 전문가' }
];

export const EXPERT_TABS: TabItem[] = [
  { id: '내 정보', label: '내 정보' },
  { id: '내 상담 내역', label: '내 상담 내역' },
  { id: '전문가 페이지 수정', label: '전문가 페이지 수정' },
  { id: '상담 영업 스케줄 관리', label: '상담 영업 스케줄 관리' }
];

// 상담 탭 상수
export const CONSULTATION_TABS = {
  BEFORE: '상담 전',
  COMPLETED: '상담 완료'
} as const;

// 이메일 인증 타이머 (초)
export const EMAIL_VERIFICATION_TIMER = 300; // 5분

// 프로필 아바타 옵션
export const AVATAR_OPTIONS = [
  'default',
  'cat',
  'cheek', 
  'fox',
  'panda',
  'puppy',
  'rabbit'
] as const;

// 전문가 자격증 목록
export const QUALIFICATIONS = [
  '투자자산운용사',
  '재무설계사',
  '펀드매니저',
  '증권분석사',
  '기타'
] as const; 