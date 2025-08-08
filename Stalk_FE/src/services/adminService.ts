import { 
  AdvisorApprovalRequest, 
  ApprovalRequestListRequest, 
  ApprovalActionRequest,
  ApprovalActionResponse,
  CursorPage,
  ApprovalStatus,
  RejectionReason 
} from '@/types';
import AuthService from '@/services/authService';

class AdminService {
  private baseURL = '/api/admin/advisor-requests';

  // 전문가 인증 요청 목록 조회
  async getApprovalRequests(params: ApprovalRequestListRequest): Promise<CursorPage<AdvisorApprovalRequest>> {
    const queryParams = new URLSearchParams({
      status: params.status,
      pageNo: params.pageNo.toString(),
      pageSize: params.pageSize.toString()
    });

    const response = await AuthService.authenticatedRequest(`${this.baseURL}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }

  // 전문가 인증 요청 승인
  async approveRequest(requestId: number): Promise<ApprovalActionResponse> {
    const response = await AuthService.authenticatedRequest(`${this.baseURL}/${requestId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }

  // 전문가 인증 요청 거절
  async rejectRequest(requestId: number, request: ApprovalActionRequest): Promise<ApprovalActionResponse> {
    const response = await AuthService.authenticatedRequest(`${this.baseURL}/${requestId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }
}

export default new AdminService(); 