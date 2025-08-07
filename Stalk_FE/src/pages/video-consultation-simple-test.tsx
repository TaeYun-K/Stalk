import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import stalkLogoWhite from "@/assets/Stalk_logo_white.svg";

const VideoConsultationSimpleTest: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [consultationStartTime] = useState<Date>(new Date());
  const [isVideoMinimized, setIsVideoMinimized] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getDuration = (): string => {
    const diff = Math.floor(
      (currentTime.getTime() - consultationStartTime.getTime()) / 1000
    );
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <img src={stalkLogoWhite} alt="Stalk" className="h-6" />
          
          {/* Compact Search Bar */}
          <input
            type="text"
            placeholder="종목 검색..."
            className="w-48 px-3 py-1 text-sm bg-gray-700 text-gray-200 placeholder-gray-500 rounded-md outline-none"
          />

          {/* Quick Stock Buttons */}
          <div className="flex gap-1">
            <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              삼성전자
            </button>
            <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              SK하이닉스
            </button>
            <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              카카오
            </button>
          </div>
        </div>

        {/* Status & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">상담중</span>
            <span className="text-xs text-gray-400">{getDuration()}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chart Area - Primary Focus */}
        <div className={`${isVideoMinimized ? 'flex-1' : 'flex-1'} bg-gray-850 flex flex-col transition-all duration-300`}>
          {/* Chart Placeholder */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-400 mb-2">✅ 새로운 차트 중심 레이아웃이 작동합니다!</h2>
              <p className="text-gray-400 mb-2">이것은 테스트 페이지입니다</p>
              <p className="text-sm text-gray-500">실제 차트 컴포넌트를 여기에 추가할 예정입니다</p>
              <div className="mt-4 p-3 bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-400">
                  ✅ Footer 크로핑 문제 해결됨<br/>
                  ✅ 닫기 버튼 기능 추가됨<br/>
                  ✅ 사이드바 토글 작동함
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Panel - Conditionally rendered */}
        {!isVideoMinimized && (
          <div className="w-80 bg-gray-850 border-l border-gray-700 flex flex-col">
            <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium">참가자</span>
              <button 
                onClick={() => setIsVideoMinimized(true)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="비디오 패널 숨기기"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {/* Video Placeholder */}
              <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center">
                    👤
                  </div>
                  <p className="text-sm text-gray-400">나 (전문가)</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center">
                    👤
                  </div>
                  <p className="text-sm text-gray-400">참가자 1</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Minimized Video Indicator */}
        {isVideoMinimized && (
          <div className="fixed bottom-20 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
            <button
              onClick={() => setIsVideoMinimized(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg transition-colors"
              title="비디오 패널 열기"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>참가자 2명</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls - Always visible, spans full width */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            🎤
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            📹
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            🖥️
          </button>
          <div className="w-px h-6 bg-gray-700 mx-1"></div>
          <button 
            onClick={() => setIsVideoMinimized(!isVideoMinimized)}
            className={`p-2 rounded-lg transition-colors ${
              !isVideoMinimized 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isVideoMinimized ? "비디오 패널 보기" : "비디오 패널 숨기기"}
          >
            👥
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            💬
          </button>
        </div>
        <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
          상담 종료
        </button>
      </div>
    </div>
  );
};

export default VideoConsultationSimpleTest;