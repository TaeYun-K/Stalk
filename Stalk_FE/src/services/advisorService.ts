import AuthService from './authService';
import { 
  CertificateApprovalRequest, 
  CertificateApprovalResponse, 
  ApprovalHistoryResponse, 
  ProfileStatusResponse, 
  CursorPage 
} from '@/types';

class AdvisorService {
  // 자격증 승인 요청
  static async requestCertificateApproval(data: CertificateApprovalRequest): Promise<CertificateApprovalResponse> {
    const response = await AuthService.authenticatedRequest('/api/advisors/certificate-approval', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`승인 요청 실패: ${response.status}`);
    }
    
    const result = await response.json();
    return result.result;
  }

  // 승인 이력 조회
  static async getApprovalHistory(pageNo: number = 1, pageSize: number = 10): Promise<CursorPage<ApprovalHistoryResponse>> {
    const response = await AuthService.authenticatedRequest(`/api/advisors/certificate-approval?pageNo=${pageNo}&pageSize=${pageSize}`);
    
    if (!response.ok) {
      throw new Error(`이력 조회 실패: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result;
  }

  // 프로필 상태 확인
  static async getProfileStatus(): Promise<ProfileStatusResponse> {
    const response = await AuthService.authenticatedRequest('/api/advisors/profile/status');
    
    if (!response.ok) {
      throw new Error(`상태 확인 실패: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result;
  }

  // 프로필 이미지 업로드 - 실제 파일 업로드 서비스 필요
  static async uploadProfileImage(file: File): Promise<{ fileUrl: string }> {
    // TODO: 실제 이미지 업로드 API가 구현되면 해당 엔드포인트를 사용
    // 현재는 임시로 로컬 URL을 반환
    const fileUrl = URL.createObjectURL(file);
    return { fileUrl };
  }

  // 프로필 생성 - JSON만 사용
  static async createProfile(profileData: any): Promise<{
    id: number;
    profileImageUrl: string;
    publicContact: string;
    shortIntro: string;
    longIntro: string;
    preferredTradeStyle: string;
    careerEntries: Array<{
      id: number;
      action: string;
      title: string;
      description: string;
      startedAt: string;
      endedAt: string;
      validForUpdate: boolean;
      validForDelete: boolean;
      deleteAction: boolean;
      updateAction: boolean;
      createAction: boolean;
    }>;
  }> {
    const response = await AuthService.authenticatedRequest('/api/advisors/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      const msg = err?.message || response.statusText;
      throw new Error(`프로필 생성 실패: ${response.status} (${msg})`);
    }

    const result = await response.json();
    return result;
  }

  // 프로필 수정 - PUT 메서드 사용
  static async updateProfile(profileData: any): Promise<{
    id?: number;
    profileImageUrl: string;
    publicContact: string;
    shortIntro: string;
    longIntro: string;
    preferredTradeStyle: string;
    careerEntries: Array<{
      id: number;
      action: string;
      title: string;
      description: string;
      startedAt: string;
      endedAt: string;
      validForUpdate: boolean;
      validForDelete: boolean;
      deleteAction: boolean;
      updateAction: boolean;
      createAction: boolean;
    }>;
  }> {
    const response = await AuthService.authenticatedRequest('/api/advisors/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      const msg = err?.message || response.statusText;
      throw new Error(`프로필 수정 실패: ${response.status} (${msg})`);
    }

    const result = await response.json();
    return result;
  }
}

export default AdvisorService;
