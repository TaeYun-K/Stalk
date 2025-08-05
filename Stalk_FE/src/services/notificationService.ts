import AuthService from '@/services/authService';

interface NotificationResponse {
  notificationId: number;
  type: string;
  title: string;
  message: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

interface CursorPage<T> {
  content: T[];
  hasNext: boolean;
  pageSize: number;
  pageNo: number;
}

interface RecentNotificationsResponse {
  newCount: number;
  notifications: NotificationResponse[];
}

class NotificationService {
  private baseURL = '/api/notifications';

  // 알림 목록 조회
  async getNotifications(pageNo: number = 1, pageSize: number = 10): Promise<CursorPage<NotificationResponse>> {
    const queryParams = new URLSearchParams({
      pageNo: pageNo.toString(),
      pageSize: pageSize.toString()
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

  // 알림 읽음 처리
  async markAsRead(notificationId: number): Promise<void> {
    const response = await AuthService.authenticatedRequest(`${this.baseURL}/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // 최근 알림 확인
  async getRecentNotifications(): Promise<RecentNotificationsResponse> {
    const response = await AuthService.authenticatedRequest(`${this.baseURL}/recent`, {
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

  // 모든 알림 읽음 처리
  async markAllAsRead(): Promise<void> {
    const response = await AuthService.authenticatedRequest(`${this.baseURL}/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}

export default new NotificationService(); 