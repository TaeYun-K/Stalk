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
}

export default AdvisorService; 