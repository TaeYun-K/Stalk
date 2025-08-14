import React from "react";
import { ConsultationItem, ConsultationDiaryResponse } from "@/types";
import ConsultationNote from "@/components/mypage/my_consultation/consultation_note";
import { useAuth } from "@/context/AuthContext";

type ConsultationTab = "상담 전" | "상담 완료";

interface MyConsultationListProps {
  consultationTab: ConsultationTab;
  onChangeTab: (tab: ConsultationTab) => void;
  isLoading: boolean;
  error: string | null;
  realConsultationData: {
    "상담 전": ConsultationItem[];
    "상담 완료": ConsultationItem[];
  };
  onEnterConsultation: (item: ConsultationItem) => void;
  onCancelConsultation: (item: ConsultationItem) => void;
  isCancelling: boolean;
  onViewDiary: (item: ConsultationItem) => void;
  onNavigateAdvisor: (expertName: string) => void;
  hardcodedConsultationData: {
    "상담 전": ConsultationItem[];
    "상담 완료": ConsultationItem[];
  };
  // Diary section
  activeTab?: string;
  selectedConsultation?: ConsultationItem | null;
  isLoadingDiary?: boolean;
  diaryError?: string | null;
  consultationDiary?: ConsultationDiaryResponse | null;
  onCloseDiary?: () => void;
  onRetryDiary?: () => void;
  onAnalyzeVideo?: (url: string) => void;
  videoAnalysisResult?: { processedAt: string; summary: string } | null;
}

const MyConsultationList: React.FC<MyConsultationListProps> = ({
  consultationTab,
  onChangeTab,
  isLoading,
  error,
  realConsultationData,
  onEnterConsultation,
  onCancelConsultation,
  isCancelling,
  onViewDiary,
  onNavigateAdvisor: _onNavigateAdvisor,
  hardcodedConsultationData: _hardcodedConsultationData,
  activeTab,
  selectedConsultation,
  isLoadingDiary,
  diaryError,
  consultationDiary,
  onCloseDiary,
  onRetryDiary,
  onAnalyzeVideo,
  videoAnalysisResult,
}) => {
  const { userRole } = useAuth();
  const expertHeaderLabel = userRole === 'ADVISOR' ? '의뢰인' : '전문가';
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-left text-xl font-semibold text-gray-900 mb-6">내 상담 내역</h2>

      {/* Sub-tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => onChangeTab("상담 전")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            consultationTab === "상담 전"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-300"
          }`}
        >
          상담 전
        </button>
        <button
          onClick={() => onChangeTab("상담 완료")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            consultationTab === "상담 완료"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-300"
          }`}
        >
          상담 완료
        </button>
      </div>

      {/* 로딩 상태 표시 */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">상담 내역을 불러오는 중...</span>
        </div>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 실제 상담 내역 테이블 */}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">상담일자</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">상담시간</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">상담 요청 내용</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">{expertHeaderLabel}</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {consultationTab === "상담 전" ? "화상상담" : "화상상담"}
                </th>
                {consultationTab === "상담 전" && (
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  상담취소
                </th>
                )}
                {consultationTab === "상담 완료" && (
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">상담일지</th>
                )}
              </tr>
            </thead>
            <tbody>
              {realConsultationData[consultationTab].length > 0 ? (
                realConsultationData[consultationTab].map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-4 py-3 text-center text-sm text-gray-900">{item.date}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">{item.time}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">{item.content}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">{item.expert}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className={`${(item.status === 'cancelled' || consultationTab === '상담 완료')
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-500 text-white hover:bg-gray-600'
                        } px-3 py-1 rounded-lg text-sm transition-colors`}
                        onClick={() => onEnterConsultation(item)}
                        disabled={item.status === 'cancelled' || consultationTab === '상담 완료'}
                      >
                        {item.videoConsultation}
                      </button>
                    </td>
                    {consultationTab === "상담 전" && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onCancelConsultation(item)}
                          className={`${item.status === 'cancelled'
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                          } px-3 py-1 rounded-lg text-sm transition-colors`}
                          disabled={isCancelling || item.status === 'cancelled'}
                        >
                          상담취소
                        </button>
                      </td>
                    )}
                    {consultationTab === "상담 완료" && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onViewDiary(item)}
                          className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                        >
                          상담일지
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={consultationTab === "상담 완료" ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    {consultationTab === "상담 전" ? "예정된 상담이 없습니다." : "완료된 상담이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}


      {activeTab === "상담일지" && selectedConsultation && (
        <div className="mt-8">
          <ConsultationNote
            selectedConsultation={selectedConsultation}
            isLoadingDiary={!!isLoadingDiary}
            diaryError={diaryError || null}
            consultationDiary={consultationDiary || null}
            onBack={onCloseDiary || (() => {})}
            onRetry={onRetryDiary || (() => {})}
            onAnalyzeVideo={onAnalyzeVideo || (() => {})}
            videoAnalysisResult={videoAnalysisResult || null}
          />
        </div>
      )}
    </div>
  );
};

export default MyConsultationList;


