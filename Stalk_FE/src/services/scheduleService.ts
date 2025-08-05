import AuthService from './authService';

class ScheduleService {
  // 차단 시간 조회
  static async getBlockedTimes(date: string): Promise<string[]> {
    const response = await AuthService.authenticatedRequest(
      `/api/advisors/blocked-times?date=${date}`
    );
    
    if (!response.ok) {
      throw new Error('차단 시간 조회 실패');
    }
    
    const data = await response.json();
    return data.result.blockedTimes;
  }

  // 차단 시간 업데이트
  static async updateBlockedTimes(date: string, blockedTimes: string[]): Promise<void> {
    const response = await AuthService.authenticatedRequest(
      `/api/advisors/blocked-times?date=${date}`,
      {
        method: 'PUT',
        body: JSON.stringify({ blockedTimes })
      }
    );
    
    if (!response.ok) {
      throw new Error('차단 시간 업데이트 실패');
    }
  }
}

export default ScheduleService; 