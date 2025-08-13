import React from "react";
import { ConsultationDiaryResponse, VideoRecording, ConsultationItem } from "@/types";

type VideoAnalysisResult = {
  processedAt: string;
  summary: string;
};

interface ConsultationNoteProps {
  selectedConsultation: ConsultationItem;
  isLoadingDiary: boolean;
  diaryError: string | null;
  consultationDiary: ConsultationDiaryResponse | null;
  onBack: () => void;
  onRetry: () => void;
  onAnalyzeVideo: (url: string) => void;
  videoAnalysisResult: VideoAnalysisResult | null;
}

const ConsultationNote: React.FC<ConsultationNoteProps> = ({
  selectedConsultation,
  isLoadingDiary,
  diaryError,
  consultationDiary,
  onBack,
  onRetry,
  onAnalyzeVideo,
  videoAnalysisResult,
}) => {
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">상담일지</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m0 7h18" />
          </svg>
          <span>뒤로가기</span>
        </button>
      </div>

      {isLoadingDiary ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">상담일지를 불러오는 중...</span>
        </div>
      ) : diaryError ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">⚠️ {diaryError}</div>
          <button onClick={onRetry} className="text-blue-600 hover:text-blue-700 text-sm">다시 시도</button>
        </div>
      ) : consultationDiary ? (
        <div className="mb-6">
          {consultationDiary.recordings && consultationDiary.recordings.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📹 상담 녹화 영상</h3>
              <div className="space-y-4">
                {consultationDiary.recordings.map((recording: VideoRecording, index: number) => (
                  <div key={recording.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">녹화 영상 {index + 1}</h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recording.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : recording.status === "PROCESSING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {recording.status === "COMPLETED" ? "완료" : recording.status === "PROCESSING" ? "처리중" : "대기중"}
                      </span>
                    </div>

                    <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center mb-3">
                      {recording.url ? (
                        <video controls className="w-full h-full rounded-lg" src={recording.url}>
                          브라우저가 비디오를 지원하지 않습니다.
                        </video>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <button className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center transition-colors">
                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {recording.url && (
                      <div className="mb-3">
                        <button
                          onClick={() => onAnalyzeVideo(recording.url)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          영상 요약하기
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">시작 시간:</span>
                        <span className="ml-2">{new Date(recording.startTime).toLocaleString("ko-KR")}</span>
                      </div>
                      <div>
                        <span className="font-medium">종료 시간:</span>
                        <span className="ml-2">{new Date(recording.endTime).toLocaleString("ko-KR")}</span>
                      </div>
                      <div>
                        <span className="font-medium">세션 ID:</span>
                        <span className="ml-2 font-mono text-xs">{recording.sessionId}</span>
                      </div>
                      <div>
                        <span className="font-medium">녹화 ID:</span>
                        <span className="ml-2 font-mono text-xs">{recording.recordingId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>이 상담의 녹화 영상이 없습니다.</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 상담 정보</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">상담 ID:</span>
                <span className="ml-2 text-gray-900">{consultationDiary.consultationInfo.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">상담일:</span>
                <span className="ml-2 text-gray-900">{consultationDiary.consultationInfo.date}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">상담시간:</span>
                <span className="ml-2 text-gray-900">{consultationDiary.consultationInfo.time}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">전문가:</span>
                <span className="ml-2 text-gray-900">{consultationDiary.consultationInfo.expert}</span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">상담 내용:</span>
                <span className="ml-2 text-gray-900">{consultationDiary.consultationInfo.content}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-600 text-xl mr-3">🤖</div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Stalk AI가 상담 영상을 자동으로 요약해드립니다</h3>
                <p className="text-blue-700 text-sm">상담내용을 전문가가 직접 분석 작성한 상담일지에 대한 신뢰도와 정확성을 책임집니다.</p>
              </div>
            </div>
          </div>

          {videoAnalysisResult && (
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  영상 분석 결과
                </h3>
                <div className="text-sm text-gray-500">{new Date(videoAnalysisResult.processedAt).toLocaleString("ko-KR")}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                {(() => {
                  try {
                    const summaryData = JSON.parse(videoAnalysisResult.summary);
                    if (
                      summaryData.lecture_content &&
                      Array.isArray(summaryData.lecture_content) &&
                      summaryData.lecture_content.length === 0 &&
                      summaryData.key_takeaways?.main_subject === "이 영상에는 투자에 대한 내용이 포함되어 있지 않습니다."
                    ) {
                      return (
                        <div className="text-center py-8">
                          <div className="text-gray-500 text-lg font-medium">이 영상에는 투자에 대한 내용이 포함되어 있지 않습니다.</div>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-6">
                        {summaryData.lecture_content && summaryData.lecture_content.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">📚 강의 내용</h4>
                            <div className="space-y-3">
                              {summaryData.lecture_content.map((item: { topic: string; details: string }, index: number) => (
                                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h5 className="font-medium text-blue-600 mb-2">{item.topic}</h5>
                                  <p className="text-gray-700 leading-relaxed">{item.details}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {summaryData.key_takeaways && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 핵심 요약</h4>
                            <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">주요 주제</h5>
                                <p className="text-gray-700">{summaryData.key_takeaways.main_subject}</p>
                              </div>
                              {summaryData.key_takeaways.core_concepts && summaryData.key_takeaways.core_concepts.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">핵심 개념</h5>
                                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                    {summaryData.key_takeaways.core_concepts.map((concept: string, idx: number) => (
                                      <li key={idx}>{concept}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  } catch (e) {
                    return <div className="text-gray-500">분석 결과를 표시할 수 없습니다.</div>;
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ConsultationNote;


