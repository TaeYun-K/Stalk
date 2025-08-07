import AuthService from '@/services/authService';

interface ReservationDetailResponse {
  reservationId: number;
  consultationDate: string;
  consultationTime: string;
  requestMessage?: string;
  advisorName: string;
  advisorUserId: number;
  profileImageUrl?: string;
  status: string;
  createdAt: string;
}

interface CursorPage<T> {
  content: T[];
  hasNext: boolean;
  pageSize: number;
  pageNo: number;
}

class ReservationService {
  private baseURL = '/api/reservations';

  // 예약 내역 조회
  async getReservations(pageNo: number = 1, pageSize: number = 20): Promise<CursorPage<ReservationDetailResponse>> {
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

  // 예약 상태별 정렬 함수
  sortReservations(reservations: ReservationDetailResponse[]): ReservationDetailResponse[] {
    return reservations.sort((a, b) => {
      // 상태별 우선순위: PENDING > CONFIRMED > COMPLETED > CANCELLED
      const statusPriority = {
        'PENDING': 0,
        'CONFIRMED': 1,
        'COMPLETED': 2,
        'CANCELLED': 3
      };

      const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 4;
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 4;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // 같은 상태 내에서는 날짜순 정렬 (미래가 위로)
      const aDate = new Date(`${a.consultationDate} ${a.consultationTime}`);
      const bDate = new Date(`${b.consultationDate} ${b.consultationTime}`);
      
      return aDate.getTime() - bDate.getTime();
    });
  }
}

export default new ReservationService(); 