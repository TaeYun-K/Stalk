import React, { useEffect, useState } from 'react';
import ReviewService from '@/services/reviewService';
import { AdvisorReviewResponseDto } from '@/types/review';
import { CursorPage } from '@/types';

interface Props {
  advisorId: number;
}

const AdvisorReviews: React.FC<Props> = ({ advisorId }) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CursorPage<AdvisorReviewResponseDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (pageNo: number) => {
    try {
      setLoading(true);
      const res = await ReviewService.listByAdvisor(advisorId, pageNo, 10);
      setData(res);
    } catch (e: any) {
      setError(e?.message || '전문가 리뷰 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorId, page]);

  if (loading && !data) return <div className="p-4">불러오는 중...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      {data?.content.map((r) => (
        <div key={r.reviewId} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">{r.userName}</div>
            <div className="text-yellow-500">⭐ {r.rating}</div>
          </div>
          <div className="text-sm text-gray-500 mb-2">{new Date(r.createdAt).toLocaleString()}</div>
          <div className="text-gray-800 whitespace-pre-wrap">{r.content}</div>
        </div>
      ))}
      {data && data.content.length === 0 && (
        <div className="text-center text-gray-500 py-8">아직 등록된 리뷰가 없습니다.</div>
      )}
      <div className="flex justify-between items-center mt-4">
        <button
          className="px-3 py-1 rounded border disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          이전
        </button>
        <div className="text-sm text-gray-500">{page} 페이지</div>
        <button
          className="px-3 py-1 rounded border disabled:opacity-50"
          onClick={() => setPage((p) => p + 1)}
          disabled={!data?.hasNext}
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default AdvisorReviews;


