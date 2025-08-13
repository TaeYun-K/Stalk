import AuthService from '@/services/authService';
import { CursorPage } from '@/types';
import {
  ReviewCreateRequestDto,
  ReviewCreateResponseDto,
  ReviewResponseDto,
  AdvisorReviewResponseDto,
  ReviewUpdateRequestDto,
} from '@/types/review';

export default class ReviewService {
  static async create(data: ReviewCreateRequestDto): Promise<ReviewCreateResponseDto> {
    const res = await AuthService.authenticatedRequest('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || '리뷰 작성 실패');
    }
    const json = await res.json();
    return json.result || json;
  }

  static async update(reviewId: number, data: ReviewUpdateRequestDto): Promise<void> {
    const res = await AuthService.authenticatedRequest(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || '리뷰 수정 실패');
    }
  }

  static async remove(reviewId: number): Promise<void> {
    const res = await AuthService.authenticatedRequest(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || '리뷰 삭제 실패');
    }
  }

  static async listMine(pageNo = 1, pageSize = 10): Promise<CursorPage<ReviewResponseDto>> {
    const res = await AuthService.authenticatedRequest(`/api/reviews?pageNo=${pageNo}&pageSize=${pageSize}`);
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || '내 리뷰 목록 조회 실패');
    }
    const json = await res.json();
    return json.result || json;
  }

  static async listByAdvisor(advisorId: number, pageNo = 1, pageSize = 10): Promise<CursorPage<AdvisorReviewResponseDto>> {
    const res = await AuthService.authenticatedRequest(`/api/reviews/advisors/${advisorId}?pageNo=${pageNo}&pageSize=${pageSize}`);
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || '전문가 리뷰 목록 조회 실패');
    }
    const json = await res.json();
    return json.result || json;
  }
}


