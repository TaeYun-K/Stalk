import AuthService from './authService';

class ScheduleService {
  // 차단 시간 조회
  static async getBlockedTimes(date: string): Promise<string[]> {
    const response = await AuthService.authenticatedRequest(
      `/api/advisors/blocked-times?date=${date}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '차단 시간 조회 실패');
    }
    
    const data = await response.json();
    return data.result.blockedTimeSlots; // 백엔드 응답 필드명에 맞춤
  }

  // 차단 시간 업데이트
  static async updateBlockedTimes(date: string, blockedTimes: string[]): Promise<void> {
    const response = await AuthService.authenticatedRequest(
      `/api/advisors/blocked-times?date=${date}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ blockedTimes })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '차단 시간 업데이트 실패');
    }
  }
}

export default ScheduleService; 