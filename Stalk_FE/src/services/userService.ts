import { User, PasswordForm, EditInfoForm } from '@/types';
import AuthService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

  // 사용자 정보 수정 - 실제 API 연동
  static async updateUserInfo(userId: string, data: EditInfoForm): Promise<{ success: boolean; message: string }> {
    try {
      // JWT 토큰 가져오기 (AuthService 사용)
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      // API 요청 데이터 준비 (백엔드 API 형식에 맞춤)
      const requestData = {
        name: data.name,
        contact: data.contact?.replace(/[^0-9]/g, '') // 하이픈 제거하여 11자리 숫자만 전송
      };

      const response = await fetch(`/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 정보 수정에 실패했습니다.');
      }

      const result = await response.json();
      
      return {
        success: true,
        message: result.data?.message || '사용자 정보가 성공적으로 수정되었습니다.'
      };
    } catch (error) {
      console.error('사용자 정보 수정 오류:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '사용자 정보 수정에 실패했습니다.'
      };
    }
  }

  // 비밀번호 변경
  static async changePassword(_userId: string, data: PasswordForm): Promise<{ success: boolean; message: string }> {
    try {
      const token = AuthService.getAccessToken();
      if (!token) throw new Error('로그인이 필요합니다.');

      const response = await fetch(`/api/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.message || '비밀번호 변경에 실패했습니다.');
      }

      return { success: true, message: json.message || '비밀번호가 성공적으로 변경되었습니다.' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.'
      };
    }
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

  // 프로필 수정 (닉네임, 프로필 이미지)
  static async updateProfile(nickname: string, profileImage?: File): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      // FormData 생성 (multipart/form-data)
      const formData = new FormData();
      formData.append('nickname', nickname);
      
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await fetch(`/api/users/me/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '프로필 수정에 실패했습니다.');
      }

      const result = await response.json();
      
      return {
        success: true,
        message: '프로필이 성공적으로 수정되었습니다.',
        data: result.data
      };
    } catch (error) {
      console.error('프로필 수정 오류:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '프로필 수정에 실패했습니다.'
      };
    }
  }

  // 회원 탈퇴
  static async deleteAccount(_userId: string, _password: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = AuthService.getAccessToken();
      if (!token) throw new Error('로그인이 필요합니다.');

      const response = await fetch(`/api/users/me/deactivate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.message || '회원 탈퇴에 실패했습니다.');
      }

      return { success: true, message: json.message || '회원 탈퇴가 완료되었습니다.' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '회원 탈퇴에 실패했습니다.'
      };
    }
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