import { ConsultationItem } from '@/types';

interface ConsultationRequest {
  expertId: string;
  date: string;
  time: string;
  content: string;
}

interface SessionTokenResponse {
  sessionId: string;
  token: string;
  createdAt: string;
}

interface SessionInfo {
  sessionId: string;
  createdAt: string;
}

class ConsultationService {
  // 상담 예약
  static async bookConsultation(_data: ConsultationRequest): Promise<{ success: boolean; consultationId?: string; message: string }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          consultationId: `consultation_${Date.now()}`,
          message: '상담이 성공적으로 예약되었습니다.'
        });
      }, 1000);
    });
  }

  // 사용자의 상담 내역 조회
  static async getUserConsultations(_userId: string): Promise<{
    scheduled: ConsultationItem[];
    completed: ConsultationItem[];
  }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          scheduled: [
            {
              id: '1',
              date: '2025. 07. 18.',
              time: '17:00',
              content: '입문 투자 상담',
              expert: '김범주',
              videoConsultation: '상담 입장',
              action: '취소 요청',
              status: 'scheduled'
            }
          ],
          completed: [
            {
              id: '2',
              date: '2025. 07. 19.',
              time: '14:00',
              content: '포트폴리오 검토',
              expert: '이전문가',
              videoConsultation: '상담 완료',
              action: '상담일지 보기',
              status: 'completed'
            }
          ]
        });
      }, 1000);
    });
  }

  // 전문가의 상담 내역 조회
  static async getExpertConsultations(_expertId: string): Promise<{
    scheduled: ConsultationItem[];
    completed: ConsultationItem[];
  }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          scheduled: [
            {
              id: '3',
              date: '2025. 07. 20.',
              time: '10:00',
              content: '투자 전략 상담',
              expert: '전문가',
              videoConsultation: '상담 대기',
              action: '승인',
              status: 'scheduled'
            }
          ],
          completed: [
            {
              id: '4',
              date: '2025. 07. 15.',
              time: '16:00',
              content: '리스크 관리 상담',
              expert: '전문가',
              videoConsultation: '상담 완료',
              action: '상담일지 작성완료',
              status: 'completed'
            }
          ]
        });
      }, 1000);
    });
  }

  // 상담 취소
  static async cancelConsultation(_consultationId: string): Promise<{ success: boolean; message: string }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '상담이 성공적으로 취소되었습니다.'
        });
      }, 1000);
    });
  }

  // 상담 일지 조회
  static async getConsultationLog(_consultationId: string): Promise<{
    content: string;
    recommendations: string[];
    attachments: string[];
  }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          content: '투자 포트폴리오에 대한 종합적인 검토를 진행했습니다. 현재 자산 배분 상태와 리스크 관리 방안에 대해 논의했습니다.',
          recommendations: [
            '채권 비중을 늘려 포트폴리오 안정성을 높이시기 바랍니다.',
            '해외 ETF 투자를 통한 분산투자를 고려해보세요.',
            '월 적립식 투자로 달러 코스트 평균 효과를 노려보시기 바랍니다.'
          ],
          attachments: [
            'portfolio_analysis.pdf',
            'investment_recommendation.pdf'
          ]
        });
      }, 1000);
    });
  }

  // 상담 일지 작성 (전문가용)
  static async createConsultationLog(
    _consultationId: string,
    _content: string,
    _recommendations: string[]
  ): Promise<{ success: boolean; message: string }> {
    // TODO: 실제 API 호출로 대체
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '상담 일지가 성공적으로 작성되었습니다.'
        });
      }, 1000);
    });
  }

  // OpenVidu 세션 생성 및 토큰 발급
  static async createSessionToken(consultationId: string): Promise<SessionTokenResponse> {
    try {
      const response = await fetch(`https://i13e205.p.ssafy.io:8443/api/consultations/${consultationId}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create session token:', error);
      throw new Error('세션 토큰 생성에 실패했습니다.');
    }
  }

  // 세션 정보 조회
  static async getSessionInfo(consultationId: string): Promise<SessionInfo> {
    try {
      const response = await fetch(`https://i13e205.p.ssafy.io:8443/api/consultations/${consultationId}/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get session info:', error);
      throw new Error('세션 정보 조회에 실패했습니다.');
    }
  }
}

export default ConsultationService;
export type { SessionTokenResponse, SessionInfo };
