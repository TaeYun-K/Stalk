# Stalk Frontend

> 투자 상담 및 관심종목 관리 플랫폼의 프론트엔드 애플리케이션

## 📋 목차

- [프로젝트 소개](#프로젝트-소개)
- [기술 스택](#기술-스택)
- [폴더 구조](#폴더-구조)
- [설치 및 실행](#설치-및-실행)
- [개발 가이드라인](#개발-가이드라인)
- [코드 컨벤션](#코드-컨벤션)
- [컴포넌트 사용법](#컴포넌트-사용법)
- [API 서비스 사용법](#api-서비스-사용법)
- [기여하기](#기여하기)

## 🚀 프로젝트 소개

Stalk은 투자 전문가와 일반 사용자를 연결하는 투자 상담 플랫폼입니다. 사용자는 관심종목을 관리하고, 전문가와 상담을 예약하며, 투자 정보를 공유할 수 있습니다.

### 주요 기능

- 🔐 사용자 인증 (일반 사용자 / 전문가)
- 📊 관심종목 관리 및 실시간 주가 정보
- 💬 전문가 상담 예약 및 관리
- 📅 전문가 스케줄 관리
- 👥 커뮤니티 게시판
- 🔍 전문가 검색 및 필터링

## 🛠 기술 스택

### Core
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구 및 개발 서버
- **React Router v7** - 클라이언트 사이드 라우팅

### Styling
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **PostCSS** - CSS 후처리기

### Development Tools
- **ESLint** - 코드 품질 관리
- **Vitest** - 테스트 프레임워크
- **TypeScript** - 정적 타입 검사

## 📁 폴더 구조

```
src/
├── 📂 assets/                 # 정적 자원들
│   └── images/               # 이미지 파일들
│       ├── backgrounds/      # 배경 이미지
│       ├── banners/         # 배너 이미지
│       ├── icons/           # 아이콘 모음
│       ├── logos/           # 로고 이미지
│       └── profiles/        # 프로필 이미지
│
├── 📂 components/            # React 컴포넌트들
│   ├── forms/               # 폼 관련 컴포넌트
│   │   ├── EmailVerificationForm.tsx
│   │   ├── QualificationForm.tsx
│   │   └── index.ts
│   ├── modals/              # 모달 컴포넌트
│   │   ├── PasswordChangeModal.tsx
│   │   ├── UserInfoEditModal.tsx
│   │   ├── ProfileEditModal.tsx
│   │   ├── WithdrawalModal.tsx
│   │   └── index.ts
│   ├── ui/                  # 재사용 가능한 UI 컴포넌트
│   │   ├── TabNavigation.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── index.ts
│   ├── footer.tsx           # 푸터 컴포넌트
│   ├── navbar.tsx           # 네비게이션 바
│   ├── sidebar.tsx          # 사이드바
│   └── ...
│
├── 📂 constants/            # 상수 정의
│   └── index.ts             # 앱 전역 상수들
│
├── 📂 context/              # React Context
│   └── WatchlistContext.tsx # 관심종목 전역 상태
│
├── 📂 hooks/                # 커스텀 훅
│   ├── useTimer.ts          # 타이머 관리
│   ├── useForm.ts           # 폼 상태 관리
│   ├── useModal.ts          # 모달 상태 관리
│   ├── useLocalStorage.ts   # 로컬스토리지 관리
│   └── index.ts
│
├── 📂 pages/                # 페이지 컴포넌트
│   ├── home-page.tsx        # 홈페이지
│   ├── login-page.tsx       # 로그인
│   ├── signup-page.tsx      # 회원가입
│   ├── my-page.tsx          # 마이페이지
│   ├── experts-page.tsx     # 전문가 목록
│   ├── community-page.tsx   # 커뮤니티
│   └── ...
│
├── 📂 services/             # API 서비스 로직
│   ├── authService.ts       # 인증 관련 API
│   ├── userService.ts       # 사용자 정보 API
│   ├── consultationService.ts # 상담 관련 API
│   ├── watchlistService.ts  # 관심종목 API
│   └── index.ts
│
├── 📂 types/                # TypeScript 타입 정의
│   └── index.ts             # 전역 타입 인터페이스
│
├── 📂 utils/                # 유틸리티 함수
│   └── index.ts             # 헬퍼 함수들
│
├── App.tsx                  # 메인 앱 컴포넌트
├── App.css                  # 앱 스타일
├── index.tsx                # 엔트리 포인트
└── index.css                # 전역 스타일
```

## 🔧 설치 및 실행

### 사전 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치
```bash
# 의존성 설치
npm install

# 또는
yarn install
```

### 개발 서버 실행
```bash
# 개발 서버 시작 (포트 3000)
npm run dev

# 또는
npm start
```

### 빌드
```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 테스트
```bash
# 테스트 실행
npm run test
```

### 린팅
```bash
# 코드 품질 검사
npm run lint
```

## 📐 개발 가이드라인

### 1. 폴더 및 파일 명명 규칙

- **컴포넌트**: PascalCase (예: `UserProfile.tsx`)
- **훅**: camelCase, `use` 접두사 (예: `useForm.ts`)
- **서비스**: camelCase, Service 접미사 (예: `authService.ts`)
- **타입**: PascalCase (예: `interface User {}`)
- **상수**: UPPER_SNAKE_CASE (예: `USER_TYPES`)

### 2. Import 순서

```typescript
// 1. React 관련
import React from 'react';
import { useState, useEffect } from 'react';

// 2. 외부 라이브러리
import { useNavigate } from 'react-router-dom';

// 3. 내부 모듈 (절대 경로)
import { useForm } from '@/hooks';
import { User } from '@/types';
import { AuthService } from '@/services';

// 4. 상대 경로
import './Component.css';
```

### 3. 타입 정의

모든 컴포넌트와 함수는 TypeScript 타입을 명시해야 합니다.

```typescript
interface Props {
  title: string;
  isLoading?: boolean;
  onSubmit: (data: FormData) => void;
}

const Component: React.FC<Props> = ({ title, isLoading = false, onSubmit }) => {
  // 컴포넌트 로직
};
```

## 🎯 코드 컨벤션

### 1. TypeScript & ESLint 규칙

본 프로젝트는 **Google TypeScript Style Guide** 기반의 엄격한 코딩 컨벤션을 따릅니다.

#### **기본 원칙**
- **함수형 컴포넌트** 사용 (클래스 컴포넌트 금지)
- **TypeScript Strict Mode** 활성화
- **ESLint** 규칙 100% 준수
- **명시적 타입 정의** 권장

```typescript
// ✅ 좋은 예
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
  isLoading?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onEdit, 
  isLoading = false 
}) => {
  const handleEditClick = () => {
    onEdit(user.id);
  };

  return (
    <div className="p-4 border rounded-lg">
      {/* 컴포넌트 내용 */}
    </div>
  );
};

export default UserCard;
```

```typescript
// ❌ 나쁜 예
const UserCard = (props: any) => {
  return <div>{props.user.name}</div>;
};
```

### 2. 변수 및 함수 명명 규칙

#### **변수명**
```typescript
// ✅ 좋은 예
const isUserLoggedIn = true;
const userProfileData = getUserProfile();
const maxRetryCount = 3;

// ❌ 나쁜 예
const flag = true;
const data = getUserProfile();
const max = 3;
```

#### **함수명**
```typescript
// ✅ 좋은 예
const handleUserLogin = () => { ... };
const validateEmailFormat = (email: string) => { ... };
const fetchUserProfile = async (userId: string) => { ... };

// ❌ 나쁜 예
const login = () => { ... };
const check = (email: string) => { ... };
const get = async (id: string) => { ... };
```

#### **상수명**
```typescript
// ✅ 좋은 예
const USER_TYPES = {
  GENERAL: 'general' as const,
  EXPERT: 'expert' as const,
} as const;

const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
} as const;

// ❌ 나쁜 예
const userTypes = { general: 'general', expert: 'expert' };
const endpoints = { login: '/api/auth/login' };
```

### 3. 컴포넌트 구조 규칙

#### **컴포넌트 파일 구조**
```typescript
// 1. Import 구문들
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@/hooks';
import { User } from '@/types';

// 2. 타입 정의
interface ComponentProps {
  // props 타입 정의
}

interface ComponentState {
  // 로컬 상태 타입 정의 (필요한 경우)
}

// 3. 컴포넌트 정의
const ComponentName: React.FC<ComponentProps> = ({ 
  prop1, 
  prop2 
}) => {
  // 4. Hooks (useState, useEffect 등)
  const [state, setState] = useState<ComponentState>();
  const navigate = useNavigate();
  
  // 5. 이벤트 핸들러
  const handleSubmit = () => {
    // 로직
  };
  
  // 6. useEffect (마운트/언마운트 로직)
  useEffect(() => {
    // 효과 로직
  }, []);
  
  // 7. 렌더링
  return (
    <div>
      {/* JSX 내용 */}
    </div>
  );
};

// 8. Export
export default ComponentName;
```

### 4. Hooks 사용 규칙

#### **Custom Hooks**
```typescript
// ✅ 좋은 예
const useUserAuth = (initialUser?: User) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(false);
  
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const authData = await AuthService.login(credentials);
      setUser(authData.user);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  return { user, isLoading, login };
};
```

#### **useEffect 사용 규칙**
```typescript
// ✅ 좋은 예 - 의존성 배열 명확히 명시
useEffect(() => {
  fetchUserData(userId);
}, [userId]);

// ✅ 좋은 예 - 정리 함수 제공
useEffect(() => {
  const subscription = subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, []);

// ❌ 나쁜 예 - 의존성 배열 누락
useEffect(() => {
  fetchUserData(userId);
}, []); // userId 의존성 누락
```

### 5. 에러 처리 규칙

#### **Service Layer 에러 처리**
```typescript
// ✅ 좋은 예
class UserService {
  static async updateUserInfo(
    userId: string, 
    data: EditInfoForm
  ): Promise<{ success: boolean; message: string; data?: User }> {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return { success: true, message: '수정 완료', data: result };
    } catch (error) {
      console.error('User update failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }
}
```

#### **컴포넌트 에러 처리**
```typescript
// ✅ 좋은 예
const UserProfile: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSave = async (data: UserData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await UserService.updateUserInfo(user.id, data);
      if (result.success) {
        // 성공 처리
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      {error && <ErrorMessage message={error} />}
      {/* 나머지 UI */}
    </div>
  );
};
```

### 6. 주석 및 문서화 규칙

#### **함수 문서화**
```typescript
/**
 * 사용자 비밀번호를 변경합니다.
 * 
 * @param userId - 사용자 ID
 * @param passwordData - 현재 및 새 비밀번호 정보
 * @returns 변경 결과와 메시지
 * 
 * @example
 * ```typescript
 * const result = await UserService.changePassword('user123', {
 *   currentPassword: 'old123',
 *   newPassword: 'new456',
 *   confirmPassword: 'new456'
 * });
 * ```
 */
static async changePassword(
  userId: string, 
  passwordData: PasswordForm
): Promise<{ success: boolean; message: string }> {
  // 구현 내용
}
```

#### **복잡한 로직 주석**
```typescript
// ✅ 좋은 예
const processUserData = (users: User[]) => {
  // 활성 상태인 전문가만 필터링
  const activeExperts = users.filter(user => 
    user.userType === 'expert' && user.isApproved
  );
  
  // 평점 기준 내림차순 정렬
  const sortedExperts = activeExperts.sort((a, b) => 
    (b.rating || 0) - (a.rating || 0)
  );
  
  return sortedExperts;
};
```

### 7. 성능 최적화 규칙

#### **React.memo 사용**
```typescript
// ✅ 무거운 컴포넌트는 memo 적용
const ExpensiveComponent: React.FC<Props> = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// 비교 함수가 필요한 경우
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});
```

#### **useCallback & useMemo 활용**
```typescript
const ComponentWithOptimization: React.FC<Props> = ({ items, onSelect }) => {
  // 비싼 계산은 useMemo로 메모화
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);
  
  // 이벤트 핸들러는 useCallback으로 메모화
  const handleItemClick = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);
  
  return (
    <div>
      <p>Total: {expensiveValue}</p>
      {items.map(item => (
        <Item 
          key={item.id}
          data={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
};
```

### 8. 코드 품질 체크리스트

#### **Pull Request 전 확인사항**
- [ ] ESLint 오류 0개
- [ ] TypeScript 컴파일 에러 0개
- [ ] 모든 함수/컴포넌트에 타입 정의
- [ ] 의미있는 변수/함수명 사용
- [ ] 적절한 주석 작성 (복잡한 로직)
- [ ] 에러 처리 구현
- [ ] 성능 최적화 적용 (필요시)
- [ ] 테스트 코드 작성
- [ ] 접근성 가이드라인 준수

#### **코드 리뷰 중점사항**
1. **타입 안전성**: `any` 타입 사용 금지
2. **재사용성**: 중복 코드 제거
3. **가독성**: 명확한 변수명과 구조
4. **성능**: 불필요한 렌더링 방지
5. **접근성**: ARIA 레이블, 키보드 네비게이션
6. **보안**: XSS, CSRF 방지

## 🧩 컴포넌트 사용법

### 1. 모달 컴포넌트

```typescript
import { useModal } from '@/hooks';
import { PasswordChangeModal } from '@/components/modals';
import { AuthService } from '@/services';

const MyComponent = () => {
  const { isOpen, open, close } = useModal();

  const handlePasswordChange = async (data: PasswordForm) => {
    try {
      await AuthService.changePassword('userId', data);
      // 성공 처리
    } catch (error) {
      // 에러 처리
    }
  };

  return (
    <>
      <button onClick={open}>비밀번호 변경</button>
      <PasswordChangeModal
        isOpen={isOpen}
        onClose={close}
        onSubmit={handlePasswordChange}
      />
    </>
  );
};
```

### 2. 폼 컴포넌트

```typescript
import { useForm } from '@/hooks';
import { SignupFormData } from '@/types';
import { EmailVerificationForm } from '@/components/forms';

const SignupPage = () => {
  const { values, handleChange } = useForm<SignupFormData>(initialValues);

  return (
    <form>
      <EmailVerificationForm
        email={values.email}
        emailDomain={values.emailDomain}
        verificationCode={values.verificationCode}
        onEmailChange={(email) => handleChange({ target: { name: 'email', value: email } })}
        onDomainChange={(domain) => handleChange({ target: { name: 'emailDomain', value: domain } })}
        onCodeChange={(code) => handleChange({ target: { name: 'verificationCode', value: code } })}
        onSendCode={handleSendVerificationCode}
        onVerifyCode={handleVerifyCode}
        isCodeSent={isEmailSent}
      />
    </form>
  );
};
```

### 3. UI 컴포넌트

```typescript
import { TabNavigation } from '@/components/ui';
import { GENERAL_TABS } from '@/constants';

const MyPage = () => {
  const [activeTab, setActiveTab] = useState('내 정보');

  return (
    <TabNavigation
      tabs={GENERAL_TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      variant="sidebar"
    />
  );
};
```

## 🌐 API 서비스 사용법

### 1. 인증 서비스

```typescript
import { AuthService } from '@/services';

// 로그인
const loginData = await AuthService.login({
  userId: 'user123',
  password: 'password123'
});

// 회원가입
const signupResult = await AuthService.signup(signupFormData);

// 이메일 인증
const verificationResult = await AuthService.sendEmailVerification({
  email: 'user@example.com'
});
```

### 2. 사용자 서비스

```typescript
import { UserService } from '@/services';

// 사용자 정보 조회
const userInfo = await UserService.getUserInfo('userId');

// 정보 수정
const updateResult = await UserService.updateUserInfo('userId', {
  name: '김싸피',
  contact: '010-1234-5678',
  email: 'user@example.com'
});
```

### 3. 관심종목 서비스

```typescript
import { WatchlistService } from '@/services';

// 관심종목 조회
const watchlist = await WatchlistService.getUserWatchlist('userId');

// 관심종목 추가
const addResult = await WatchlistService.addToWatchlist('userId', {
  code: '005930',
  name: '삼성전자',
  price: 71000,
  change: 1.5
});
```

## 🎨 스타일링 가이드

### Tailwind CSS 사용 규칙

1. **일관된 간격**: `space-x-4`, `space-y-2` 등 표준 간격 사용
2. **반응형 디자인**: `sm:`, `md:`, `lg:` 브레이크포인트 활용
3. **색상 시스템**: 블루(`blue-600`), 그레이(`gray-100`) 등 일관된 색상 팔레트
4. **컴포넌트 재사용**: 반복되는 스타일은 별도 컴포넌트로 분리

```typescript
// 좋은 예
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  버튼
</button>

// 나쁜 예 (인라인 스타일)
<button style={{ padding: '8px 16px', backgroundColor: '#2563eb' }}>
  버튼
</button>
```

## 🧪 테스트 가이드

### 단위 테스트

```typescript
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/ui';

describe('LoadingSpinner', () => {
  it('renders loading text', () => {
    render(<LoadingSpinner text="로딩 중..." />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });
});
```

## 🤝 기여하기

### 개발 워크플로우

1. **이슈 생성**: 새로운 기능이나 버그 리포트
2. **브랜치 생성**: `feature/feature-name` 또는 `fix/bug-name`
3. **개발**: 코딩 컨벤션 준수
4. **테스트**: 단위 테스트 작성 및 실행
5. **커밋**: [Conventional Commits](https://conventionalcommits.org/) 규칙 준수
6. **풀 리퀘스트**: 코드 리뷰 후 병합

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩터링
test: 테스트 추가/수정
chore: 빌드 관련 수정
```

### 코드 리뷰 체크리스트

- [ ] TypeScript 타입 정의가 올바른가?
- [ ] 컴포넌트가 재사용 가능한 구조인가?
- [ ] 접근성 가이드라인을 준수하는가?
- [ ] 테스트 코드가 작성되었는가?
- [ ] 문서가 업데이트되었는가?

## 📞 문의 및 지원

- **개발팀 이메일**: dev@stalk.com
- **이슈 리포팅**: [GitHub Issues](https://github.com/your-org/stalk-fe/issues)
- **문서**: [개발 가이드](https://docs.stalk.com)

---

**Stalk Frontend v0.1.0** | Built with ❤️ by SSAFY Team
