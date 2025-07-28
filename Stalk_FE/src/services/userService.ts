import { User, PasswordForm, EditInfoForm } from '@/types';

class UserService {
  // 사용자 정보 조회
  static async getUserInfo(userId: string): Promise<User> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          userId,
          name: '김싸피',
          contact: '010-0000-0000',
          email: 'ssafy@samsung.com',
          nickname: '김싸피',
          qualification: '투자자산운용사',
          isApproved: true,
          userType: 'expert',
          profilePhoto: '/assets/images/profiles/Profile_default.svg'
        });
      }, 1000);
    });
  }

  // 사용자 정보 수정
  static async updateUserInfo(_userId: string, _data: EditInfoForm): Promise<{ success: boolean; message: string }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '사용자 정보가 성공적으로 수정되었습니다.'
        });
      }, 1000);
    });
  }

  // 비밀번호 변경
  static async changePassword(_userId: string, _data: PasswordForm): Promise<{ success: boolean; message: string }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '비밀번호가 성공적으로 변경되었습니다.'
        });
      }, 1000);
    });
  }

  // 프로필 사진 업로드
  static async uploadProfilePhoto(userId: string, _file: File): Promise<{ success: boolean; url?: string; message: string }> {
    // TODO: 실제 파일 업로드 로직
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          url: `/uploads/profiles/${userId}_${Date.now()}.jpg`,
          message: '프로필 사진이 업로드되었습니다.'
        });
      }, 2000);
    });
  }

  // 회원 탈퇴
  static async deleteAccount(_userId: string, _password: string): Promise<{ success: boolean; message: string }> {
    // TODO: 실제 계정 삭제 로직
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '회원 탈퇴가 완료되었습니다.'
        });
      }, 1000);
    });
  }

  // 사용자 아이디 중복 확인
  static async checkUserIdAvailability(userId: string): Promise<{ available: boolean; message: string }> {
    // TODO: 실제 중복 확인 로직
    return new Promise((resolve) => {
      setTimeout(() => {
        const isAvailable = userId !== 'admin' && userId !== 'test'; // 임시 로직
        resolve({
          available: isAvailable,
          message: isAvailable ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
        });
      }, 500);
    });
  }

  // 이메일 중복 확인
  static async checkEmailAvailability(email: string): Promise<{ available: boolean; message: string }> {
    // TODO: 실제 중복 확인 로직
    return new Promise((resolve) => {
      setTimeout(() => {
        const isAvailable = !email.includes('test@'); // 임시 로직
        resolve({
          available: isAvailable,
          message: isAvailable ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'
        });
      }, 500);
    });
  }
}

export default UserService; 