import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConsultationService from "@/services/consultationService";
import AuthService from "@/services/authService";
import type { VideoRecording } from "@/types";

type VideoAnalysisResult = {
	analysisId?: number;
	fileName?: string;
	processedAt: string;
	summary: string;
};

const ConsultationRecordingsPage: React.FC = () => {
	const navigate = useNavigate();
	const { consultationId } = useParams();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [recordings, setRecordings] = useState<VideoRecording[]>([]);
    const [analysisByRecordingId, setAnalysisByRecordingId] = useState<Record<number, VideoAnalysisResult | null>>({});
    const [analyzingByRecordingId, setAnalyzingByRecordingId] = useState<Record<number, boolean>>({});
	const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
	const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
	
    const handleAnalyzeVideo = async (videoUrl: string, recordingId: number) => {
		try {
            setAnalyzingByRecordingId((prev) => ({ ...prev, [recordingId]: true }));
			const token = AuthService.getAccessToken();
			if (!token) {
				alert("로그인이 필요합니다. 다시 로그인해주세요.");
                setAnalyzingByRecordingId((prev) => ({ ...prev, [recordingId]: false }));
                return;
			}

			const analysisResponse = await fetch("/api/ai/analyze-video", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ videoUrl }),
			});

            if (analysisResponse.ok) {
				const result = await analysisResponse.json();
				console.log("분석 결과:", result);
				setAnalysisByRecordingId((prev) => ({ ...prev, [recordingId]: result }));
			} else {
				const errorData = await analysisResponse.json().catch(() => ({}));
				throw new Error(errorData.message || "분석 실패");
			}
		} catch (e) {
			console.error("영상 분석 중 오류:", e);
			alert("영상 분석 중 오류가 발생했습니다.");
        } finally {
            setAnalyzingByRecordingId((prev) => ({ ...prev, [recordingId]: false }));
        }
	};

	const extractSummaryJson = (summary: string): any | null => {
		if (!summary) return null;
		let raw = summary.trim();
		if (raw.includes("```")) {
			const first = raw.indexOf("```");
			const last = raw.lastIndexOf("```");
			if (first !== -1 && last !== -1 && last > first) {
				raw = raw.substring(first + 3, last);
				// 제거된 언어 태그(json 등) 한 줄 제거
				raw = raw.replace(/^\s*json\s*/i, "");
			}
		}
		try {
			return JSON.parse(raw);
		} catch {
			return null;
		}
	};

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			if (!consultationId) {
				setError("상담 ID가 없습니다.");
				setIsLoading(false);
				return;
			}
			try {
				setIsLoading(true);
				setError(null);
				const list = await ConsultationService.getConsultationRecordings(
					consultationId
				);
				if (isMounted) setRecordings(list);
			} catch (e: any) {
				if (isMounted) setError(e?.message || "녹화 목록 조회에 실패했습니다.");
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};
		load();
		return () => {
			isMounted = false;
		};
	}, [consultationId]);

	// Sidebar state sync: adjust right padding so content doesn't go under the sidebar
	useEffect(() => {
		const onSidebarChange = (e: Event) => {
			const detail = (e as CustomEvent)?.detail as { expanded?: boolean } | undefined;
			if (typeof detail?.expanded === "boolean") {
				setIsSidebarExpanded(detail.expanded);
			}
		};
		const onResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener("sidebarStateChange", onSidebarChange as EventListener);
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("sidebarStateChange", onSidebarChange as EventListener);
			window.removeEventListener("resize", onResize);
		};
	}, []);

	const contentRightPaddingPx = useMemo(() => {
		const collapsedPx = isMobile ? 56 : 64; // w-14 or w-16
		const expandedPanelPx = isMobile ? 256 : 320; // w-64 or w-80
		const basePagePaddingPx = 24; // px-6
		return (isSidebarExpanded ? collapsedPx + expandedPanelPx : collapsedPx) + basePagePaddingPx;
	}, [isSidebarExpanded, isMobile]);

	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-7xl mx-auto px-6 py-8 pt-28" style={{ paddingRight: contentRightPaddingPx }}>
				<div className="flex items-center mb-6">
					<button
						onClick={() => navigate(-1)}
						className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center space-x-2 mr-2 p-2 hover:bg-gray-100 rounded-lg"
					>
						&lt;
					</button>
					<h1 className="text-2xl font-bold text-gray-900">상담 녹화 영상</h1>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<span className="ml-3 text-gray-600">녹화 목록을 불러오는 중...</span>
					</div>
				) : error ? (
					<div className="text-center py-12 text-red-600">⚠️ {error}</div>
				) : recordings.length === 0 ? (
					<div className="text-center py-12 text-gray-600">표시할 녹화 영상이 없습니다.</div>
				) : (
					<div className="space-y-6">
								{recordings.map((recording, index) => (
									<div key={recording.id} className="p-4">
										<div className="w-full max-w-3xl mx-auto space-y-4">
											<div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
									<h4 className="rounded-full bg-blue-500 text-white px-4 py-1 text-sm mr-4 font-medium text-gray-500">
                    Recording No. {index + 1}</h4>
                  </div>
								</div>

										<div className="relative bg-black rounded-lg aspect-video flex items-center justify-center w-full">
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
                <div className="grid grid-rows-2 border border-red-200 bg-red-50 rounded-lg p-4 mb-6">
                  <div className="text-lg font-semibold text-gray-600">📸 녹화 정보</div>
                  <hr className="w-full my-4 border-red-200" />
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-semibold">시작 시간</span>
                      <span>{new Date(recording.startTime).toLocaleString("ko-KR")}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-semibold">종료 시간</span>
                      <span>{new Date(recording.endTime).toLocaleString("ko-KR")}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-600 text-xl mr-3">🤖</div>
              <div className="w-full">
                <h3 className="font-semibold text-left text-blue-800 mb-2">Stalk AI가 상담 영상을 자동으로 요약해드립니다!</h3>
                <div className="space-y-1">
                  <p className="text-blue-700 text-sm text-left">· 상담내용을 전문가가 직접 분석 작성한 상담일지에 대한 신뢰도와 정확성을 책임집니다.</p>
                  <p className="text-blue-700 text-sm text-left">· 영상 요약은 약 30초 ~ 1분 가량 소요될 수 있습니다.</p>
                </div>
                <hr className="w-full my-4 border-blue-200" />
                <p className="text-left text-sm text-gray-500">※ AI 요약 상담 일지는 상담 녹화 영상이 있을 때 제공됩니다.</p>
              </div>
            </div>
          </div>
                                        {recording.url && (
                                            <div>
                                        <button
                                            onClick={() => handleAnalyzeVideo(recording.url, recording.id)}
                                            disabled={!!analyzingByRecordingId[recording.id]}
                                            className={`w-full ${analyzingByRecordingId[recording.id] ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                            {analyzingByRecordingId[recording.id] ? '영상 요약중...' : '영상 요약하기'}
                                        </button>
                                    </div>
                                )}

										{analysisByRecordingId[recording.id] && (
											<div className="mt-2 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
										<div className="flex items-center justify-between mb-4">
											<h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
												<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
												</svg>
												영상 분석 결과
											</h3>
											<div className="text-sm text-gray-500">
												{new Date(analysisByRecordingId[recording.id]!.processedAt).toLocaleString("ko-KR")}
											</div>
										</div>

										{(() => {
											const parsed = extractSummaryJson(analysisByRecordingId[recording.id]!.summary);
											if (!parsed) {
												return <div className="text-gray-500">분석 결과를 표시할 수 없습니다.</div>;
											}

											if (
												parsed.lecture_content &&
												Array.isArray(parsed.lecture_content) &&
												parsed.lecture_content.length === 0 &&
												parsed.key_takeaways?.main_subject === "이 영상에는 투자에 대한 내용이 포함되어 있지 않습니다."
											) {
												return (
													<div className="text-center py-8">
														<div className="text-gray-500 text-lg font-medium">이 영상에는 투자에 대한 내용이 포함되어 있지 않습니다.</div>
													</div>
												);
											}

											return (
												<div className="space-y-6">
													{parsed.lecture_content && parsed.lecture_content.length > 0 && (
														<div>
															<h4 className="text-lg font-semibold text-left text-gray-900 mb-3">📚 강의 내용</h4>
															<div className="space-y-8 rounded-lg p-6 border border-gray-200">
																{parsed.lecture_content.map((item: { topic: string; details: string }, idx: number) => (
																	<div key={idx} className="flex flex-col items-start mb-2">
																		<h5 className="font-medium font-semibold text-blue-600 mb-2 text-left">{item.topic}</h5>
																		<p className="pl-5 text-gray-700 leading-relaxed text-left">{item.details}</p>
																	</div>
																))}
															</div>
														</div>
													)}

													{parsed.key_takeaways && (
														<div>
															<h4 className="text-left text-lg font-semibold text-gray-900 mb-3 mt-8">🎯 핵심 요약</h4>
													<div className="flex flex-col bg-white rounded-lg p-4 border border-gray-200 space-y-3">
																<div className="flex flex-col items-start mb-4">
																	<h5 className="font-medium text-gray-900 mb-2 font-semibold text-left">📌 주요주제</h5>
                                  <span className="text-gray-700 font-normal text-left pl-6">{parsed.key_takeaways.main_subject}</span>
																</div>
																{parsed.key_takeaways.core_concepts && parsed.key_takeaways.core_concepts.length > 0 && (
																	<div>
																		<h5 className="font-semibold text-gray-900 mb-2 text-left">⭐ 핵심개념</h5>
                                    <div className="flex flex-col items-start bg-yellow-50 rounded-lg py-4 px-7">
                                      <ol className="list-decimal list-inside space-y-1 text-gray-800 text-left space-y-2">
                                        {parsed.key_takeaways.core_concepts.map((concept: string, cidx: number) => (
                                          <li key={cidx}><span className="font-semibold">{concept}</span></li>
                                        ))}
                                      </ol>
                                    </div>
																	</div>
																)}
														{parsed.key_takeaways.conclusion_and_strategy && (
															<div className="flex flex-col items-start pt-4">
																<h5 className="font-medium text-gray-900 mb-2 font-semibold text-left">💡 결론 및 전략</h5>
																<p className="pl-6 text-gray-700 leading-relaxed text-left">{parsed.key_takeaways.conclusion_and_strategy}</p>
															</div>
														)}
															</div>
														</div>
													)}
											</div>
										);
									})()}
									</div>
								)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default ConsultationRecordingsPage;


