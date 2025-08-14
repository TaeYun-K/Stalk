import React from 'react';
import { useParams } from 'react-router-dom';
import AdvisorReviews from '@/components/AdvisorReviews';

const AdvisorReviewsPage: React.FC = () => {
  const params = useParams();
  const advisorId = Number(params.advisorId);
  if (!advisorId) return <div className="p-6">잘못된 접근입니다.</div>;
  return (
    <div className="max-w-3xl mx-auto px-20 py-8 pt-28">
      <h1 className="text-2xl font-bold mb-6">전문가 리뷰</h1>
      <AdvisorReviews advisorId={advisorId} />
    </div>
  );
};

export default AdvisorReviewsPage;


