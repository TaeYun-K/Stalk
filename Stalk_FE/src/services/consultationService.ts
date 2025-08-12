import { ApprovalHistoryResponse, CertificateApprovalRequest, ConsultationDiaryResponse } from '@/types';
import AuthService from './authService';

interface AuthContextType {
  getAccessToken: () => string | null;
}

interface ConsultationRequest {
  expertId: string;
  date: string;
  time: string;
  content: string;
}

interface BaseResponse<T> {
  isSuccess: boolean;
  code:      number;
  message:   string;
  result:    T;
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
  static async createSessionToken(consultationId: string | number, auth: AuthContextType): Promise<SessionTokenResponse> {
      try {
        console.log('🚀 ConsultationService.createSessionToken 호출됨');
        console.log('🚀 consultationId:', consultationId);
        
        const accessToken = auth.getAccessToken();
        console.log('🚀 auth.getAccessToken() 결과:', accessToken ? '토큰있음' : '토큰없음');
        if (accessToken) {
          console.log('🚀 JWT 토큰 전체:', accessToken);
        }
        
        if (!accessToken) {
          console.error('❌ JWT 토큰이 없어서 API 호출 중단');
          throw new Error('인증이 필요합니다.');
        }

        if (!consultationId) {
          console.error('❌ consultationId가 없어서 API 호출 중단');
          throw new Error('상담 ID가 필요합니다.');
        }
        
        console.log('✅ JWT 토큰과 consultationId 모두 준비완료, API 호출 시작');
        
        const apiUrl = `/api/consultations/${consultationId}/session`;
        console.log('🌐 API 요청 URL:', apiUrl);
        console.log('🌐 API 요청 헤더 Authorization:', `Bearer ${accessToken}`);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        console.log('📡 API 응답 상태:', response.status, response.statusText);
        console.log('📡 API 응답 ok:', response.ok);

        let responseData;
        try {
          responseData = await response.json();
        } catch (e) {
          throw new Error(`서버 응답 처리 실패 (${response.status}): ${response.statusText}`);
        }

        if (!response.ok) {
          console.error('서버 에러 응답:', responseData);
          
          // 500 에러의 경우 상세 정보 출력
          if (response.status === 500) {
            console.error('500 에러 상세:', {
              status: response.status,
              statusText: response.statusText,
              responseData: responseData
            });
            
            // OpenVidu 서버 연결 문제로 인한 임시 처리
            // TODO: 백엔드에서 OpenVidu 설정을 확인해야 함
            throw new Error('상담 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
          }
          
          if (responseData && responseData.message) {
            throw new Error(responseData.message);
          }
          throw new Error(`상담방 생성 실패 (${response.status})`);
        }

        const data = responseData;
        
        if (!data.isSuccess) {
          throw new Error(data.message || '상담방 생성에 실패했습니다.');
        }

        if (!data.result || !data.result.sessionId || !data.result.token) {
          throw new Error('서버 응답 형식이 올바르지 않습니다.');
        }

        console.log('🎉 상담방 세션 생성 성공!');
        console.log('🎉 응답 데이터:', {
          sessionId: data.result.sessionId,
          token: data.result.token ? '토큰있음' : '토큰없음',
          createdAt: data.result.createdAt
        });

        return {
          sessionId: data.result.sessionId,
          token: data.result.token,
          createdAt: data.result.createdAt || new Date().toISOString()
        };
      } catch (error) {
        console.error('💥 ConsultationService.createSessionToken 실패:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('상담방 생성 중 오류가 발생했습니다.');
      }
  }

  // 세션 정보 조회
  static async getSessionInfo(consultationId: string): Promise<SessionInfo> {
    try {
      const accessToken = AuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/consultations/${consultationId}/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
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

  // 상담별 녹화 목록 조회
  static async getConsultationRecordings(consultationId: string): Promise<VideoRecording[]> {
    try {
      const accessToken = AuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch(`/api/recordings/consultations/${consultationId}/recordings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.isSuccess) {
        throw new Error(data.message || '녹화 목록 조회에 실패했습니다.');
      }

      return data.result || [];
    } catch (error) {
      console.error('Failed to get consultation recordings:', error);
      throw new Error('상담 녹화 목록 조회에 실패했습니다.');
    }
  }

  // 상담일지 전체 정보 조회 (녹화 + 상담 정보)
  static async getConsultationDiary(consultationId: string): Promise<ConsultationDiaryResponse> {
    try {
      // 녹화 목록 조회
      const recordings = await this.getConsultationRecordings(consultationId);
      
      // 상담 정보는 현재 하드코딩된 데이터 사용 (실제로는 별도 API 호출 필요)
      const consultationInfo = {
        id: parseInt(consultationId),
        date: '2025. 07. 19.',
        time: '20:00',
        content: '입문 투자 상담',
        expert: '김범주'
      };

      return {
        recordings,
        consultationInfo
      };
    } catch (error) {
      console.error('Failed to get consultation diary:', error);
      throw new Error('상담일지 조회에 실패했습니다.');
    }
  }
}

export default ConsultationService;
export type { SessionTokenResponse, SessionInfo, ConsultationRequest, BaseResponse };
