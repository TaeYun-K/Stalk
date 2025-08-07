import {
  OpenVidu,
  Publisher,
  Session,
  Subscriber,
} from "openvidu-browser";
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthService from "@/services/authService";

import cameraOffIcon from "@/assets/images/icons/consultation/camera-off.svg";
import cameraOnIcon from "@/assets/images/icons/consultation/camera-on.svg";
import chatIcon from "@/assets/images/icons/consultation/chat.svg";
import micOffIcon from "@/assets/images/icons/consultation/mic-off.svg";
import micOnIcon from "@/assets/images/icons/consultation/mic-on.svg";
import screenShareIcon from "@/assets/images/icons/consultation/screen-share.svg";
import stalkLogoWhite from "@/assets/Stalk_logo_white.svg";

import ChatPanel from "@/components/consultation/Chat.panel";
import ConsultationChart from "@/components/consultation/ConsultationChart";

interface LocationState {
  connectionUrl: string;
  consultationId: string;
  sessionId: string;
  userRole?: 'ADVISOR' | 'USER';
}

interface StockData {
  ticker: string;
  name: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

interface ChartTab {
  id: string;
  ticker: string;
  name: string;
}

// Popular stocks for quick access
const POPULAR_STOCKS: StockData[] = [
  { ticker: '005930', name: '삼성전자' },
  { ticker: '000660', name: 'SK하이닉스' },
  { ticker: '035720', name: '카카오' },
  { ticker: '035420', name: 'NAVER' },
  { ticker: '051910', name: 'LG화학' },
  { ticker: '006400', name: '삼성SDI' },
];

const VideoConsultationChartFocused: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const consultationId = state?.consultationId || "DEMO-001";

  // OpenVidu states
  const [ov, setOv] = useState<OpenVidu | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [ovToken, setOvToken] = useState<string>("");

  // Media states
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const screenPublisherRef = useRef<Publisher | null>(null);

  // UI states
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [chartTabs, setChartTabs] = useState<ChartTab[]>([]);
  const [activeChartTab, setActiveChartTab] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<StockData[]>([]);

  // User info
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState<boolean>(true);

  // Timer
  const [consultationStartTime] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

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

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userProfile = await AuthService.getUserProfile();
        setUserInfo(userProfile);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        setUserInfo({ name: 'Guest', role: 'USER', userId: '0' });
      } finally {
        setIsLoadingUserInfo(false);
      }
    };
    fetchUserInfo();
  }, []);

  // Extract token from connection URL
  useEffect(() => {
    if (state?.connectionUrl) {
      const url = new URL(state.connectionUrl);
      const token = url.searchParams.get('token');
      if (token) {
        setOvToken(token);
      }
    }
  }, [state]);

  // Initialize OpenVidu
  const initializeOpenVidu = async () => {
    if (session || ov || !ovToken || !userInfo) return;

    try {
      const newOv = new OpenVidu();
      const newSession = newOv.initSession();

      // Set up session event handlers
      newSession.on('streamCreated', (event) => {
        const subscriber = newSession.subscribe(event.stream, undefined);
        setSubscribers(prev => [...prev, subscriber]);
      });

      newSession.on('streamDestroyed', (event) => {
        setSubscribers(prev => prev.filter(sub => sub !== event.stream.streamManager));
      });

      // Connect to session
      await newSession.connect(ovToken, {
        clientData: JSON.stringify({
          userData: userInfo.name || 'Anonymous',
          role: userInfo.role || 'USER'
        })
      });

      // Initialize publisher
      const newPublisher = await newOv.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: true,
        publishVideo: true,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: true
      });

      await newSession.publish(newPublisher);

      setOv(newOv);
      setSession(newSession);
      setPublisher(newPublisher);
    } catch (error) {
      console.error('Error initializing OpenVidu:', error);
      alert('상담 연결에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (ovToken && userInfo && !isLoadingUserInfo) {
      initializeOpenVidu();
    }
  }, [ovToken, userInfo, isLoadingUserInfo]);

  // Toggle camera
  const toggleCamera = () => {
    if (publisher) {
      publisher.publishVideo(!isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (publisher) {
      publisher.publishAudio(!isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (!isScreenSharing && ov && session) {
      try {
        const screenPublisher = await ov.initPublisherAsync(undefined, {
          videoSource: "screen",
          publishAudio: false,
          publishVideo: true,
        });

        screenPublisher.once("accessDenied", () => {
          console.error("Screen share access denied");
          alert("화면 공유가 거부되었습니다.");
        });

        await session.publish(screenPublisher);
        screenPublisherRef.current = screenPublisher;
        setIsScreenSharing(true);
      } catch (error) {
        console.error("Error sharing screen:", error);
        alert("화면 공유를 시작할 수 없습니다.");
      }
    } else if (isScreenSharing && screenPublisherRef.current && session) {
      session.unpublish(screenPublisherRef.current);
      screenPublisherRef.current = null;
      setIsScreenSharing(false);
    }
  };

  // Leave session
  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }
    setOv(null);
    setSession(null);
    setPublisher(null);
    setSubscribers([]);
    navigate('/');
  };

  // Handle stock search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Local search through popular stocks (replace with API when fixed)
    const filtered = POPULAR_STOCKS.filter(stock => 
      stock.name.toLowerCase().includes(query.toLowerCase()) ||
      stock.ticker.includes(query)
    );
    
    setSearchResults(filtered);
  };

  // Handle stock selection
  const handleStockSelect = (stock: StockData) => {
    const tabId = `${stock.ticker}-${Date.now()}`;
    const newTab: ChartTab = {
      id: tabId,
      ticker: stock.ticker,
      name: stock.name
    };
    
    setChartTabs(prev => [...prev, newTab]);
    setActiveChartTab(tabId);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  // Close chart tab
  const closeChartTab = (tabId: string) => {
    setChartTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeChartTab === tabId) {
      const remainingTabs = chartTabs.filter(tab => tab.id !== tabId);
      setActiveChartTab(remainingTabs.length > 0 ? remainingTabs[0].id : "");
    }
  };

  // Send message
  const sendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: userInfo?.name || 'Me',
      message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    if (session) {
      session.signal({
        data: JSON.stringify(newMessage),
        type: 'chat'
      });
    }
  };

  const activeChart = chartTabs.find(tab => tab.id === activeChartTab);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Main Content Area - Chart Focused */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chart Area - Primary Focus */}
        <div className="flex-1 flex flex-col bg-gray-850">
          {/* Integrated Top Bar with Search */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={stalkLogoWhite} alt="Stalk" className="h-6" />
              
              {/* Compact Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="종목 검색..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className={`w-48 px-3 py-1 text-sm bg-gray-700 text-gray-200 placeholder-gray-500 rounded-md outline-none transition-all ${
                    isSearchFocused ? 'w-64 bg-gray-600' : ''
                  } focus:ring-2 focus:ring-blue-500`}
                />
                
                {/* Search Results Dropdown */}
                {isSearchFocused && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {searchResults.map((stock) => (
                      <button
                        key={stock.ticker}
                        onMouseDown={() => handleStockSelect(stock)}
                        className="w-full px-3 py-1.5 text-left hover:bg-gray-700 transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm">{stock.name}</span>
                        <span className="text-xs text-gray-400">{stock.ticker}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stock Buttons */}
              <div className="flex gap-1">
                {POPULAR_STOCKS.slice(0, 3).map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => handleStockSelect(stock)}
                    className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    {stock.name}
                  </button>
                ))}
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

          {/* Chart Tabs */}
          {chartTabs.length > 0 && (
            <div className="flex items-center gap-1 px-4 py-1 bg-gray-800 border-b border-gray-700 overflow-x-auto">
              {chartTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveChartTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                    activeChartTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{tab.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeChartTab(tab.id);
                    }}
                    className="ml-1 hover:text-red-400"
                  >
                    ×
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Main Chart Content - Maximum Space */}
          <div className="flex-1 relative">
            {activeChart ? (
              <div className="absolute inset-0 p-4">
                <ConsultationChart
                  ticker={activeChart.ticker}
                  name={activeChart.name}
                  darkMode={true}
                  compact={false}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-20 h-20 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-400 mb-2">차트를 선택해주세요</p>
                  <p className="text-sm text-gray-500">상단 검색창에서 종목을 검색하거나</p>
                  <p className="text-sm text-gray-500">인기 종목 버튼을 클릭하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Panel - Collapsible/Minimizable */}
        {!isVideoMinimized && (
          <div className="w-80 bg-gray-850 border-l border-gray-700 flex flex-col">
            <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium">참가자</span>
              <button
                onClick={() => setIsVideoMinimized(true)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="비디오 숨기기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {/* Publisher Video */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                {publisher && (
                  <video
                    ref={(videoElement) => {
                      if (videoElement && publisher) {
                        publisher.addVideoElement(videoElement);
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
                  나 ({userInfo?.role === 'ADVISOR' ? '전문가' : '의뢰인'})
                </div>
                {!isCameraOn && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-gray-400">카메라 꺼짐</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subscriber Videos */}
              {subscribers.map((subscriber, index) => (
                <div key={index} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={(videoElement) => {
                      if (videoElement && subscriber.stream) {
                        const stream = subscriber.stream.getMediaStream();
                        if (videoElement.srcObject !== stream) {
                          videoElement.srcObject = stream;
                          videoElement.play().catch(console.error);
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    muted={false}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
                    참가자 {index + 1}
                  </div>
                </div>
              ))}
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
              <span>참가자 {subscribers.length + 1}명</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Chat Panel */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <ChatPanel 
              messages={messages}
              onSendMessage={sendMessage}
              darkMode={true}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls - Always visible, spans full width */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Media Controls */}
          <button
            onClick={toggleMic}
            className={`p-2 rounded-lg transition-colors ${
              isMicOn 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <img src={isMicOn ? micOnIcon : micOffIcon} alt="Mic" className="w-4 h-4" />
          </button>

          <button
            onClick={toggleCamera}
            className={`p-2 rounded-lg transition-colors ${
              isCameraOn 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <img src={isCameraOn ? cameraOnIcon : cameraOffIcon} alt="Camera" className="w-4 h-4" />
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-2 rounded-lg transition-colors ${
              isScreenSharing 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <img src={screenShareIcon} alt="Screen Share" className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-700 mx-1"></div>

          {/* UI Controls */}
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

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2 rounded-lg transition-colors ${
              isChatOpen 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            💬
          </button>
        </div>

        <button
          onClick={leaveSession}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
        >
          상담 종료
        </button>
      </div>
    </div>
  );
};

export default VideoConsultationChartFocused;