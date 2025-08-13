import React, { useEffect, useState } from 'react';
import ReviewService from '@/services/reviewService';
import { ReviewResponseDto } from '@/types/review';
import { CursorPage } from '@/types';

const MyReviewsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CursorPage<ReviewResponseDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (pageNo: number) => {
    try {
      setLoading(true);
      const res = await ReviewService.listMine(pageNo, 10);
      setData(res);
    } catch (e: any) {
      setError(e?.message || '내 리뷰 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  if (loading && !data) {
    return <div className="p-6">불러오는 중...</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error}</div>
        <button className="mt-2 px-3 py-2 bg-blue-500 text-white rounded" onClick={() => load(page)}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pt-28">
      <h1 className="text-2xl font-bold mb-6">내가 작성한 리뷰</h1>
      <div className="space-y-4">
        {data?.content.map((r) => (
          <div key={r.reviewId} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">{r.advisorName}</div>
              <div className="text-yellow-500">⭐ {r.rating}</div>
            </div>
            <div className="text-sm text-gray-500 mb-2">{new Date(r.createdAt).toLocaleString()}</div>
            <div className="text-gray-800 whitespace-pre-wrap">{r.content}</div>
          </div>
        ))}
        {data && data.content.length === 0 && (
          <div className="text-center text-gray-500 py-8">작성한 리뷰가 없습니다.</div>
        )}
      </div>
      <div className="flex justify-between items-center mt-6">
        <button
          className="px-4 py-2 rounded border disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          이전
        </button>
        <div className="text-sm text-gray-500">{page} 페이지</div>
        <button
          className="px-4 py-2 rounded border disabled:opacity-50"
          onClick={() => setPage((p) => p + 1)}
          disabled={!data?.hasNext}
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default MyReviewsPage;


