import {
  OpenVidu,
  Publisher,
  Session,
  Subscriber,
} from "openvidu-browser";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import AuthService from "@/services/authService";

import cameraOffIcon from "@/assets/images/icons/consultation/camera-off.svg";
import cameraOnIcon from "@/assets/images/icons/consultation/camera-on.svg";
import chatIcon from "@/assets/images/icons/consultation/chat.svg";
import micOffIcon from "@/assets/images/icons/consultation/mic-off.svg";
import micOnIcon from "@/assets/images/icons/consultation/mic-on.svg";
import participantsIcon from "@/assets/images/icons/consultation/participants.svg";
import screenShareIcon from "@/assets/images/icons/consultation/screen-share.svg";
import settingsIcon from "@/assets/images/icons/consultation/settings.svg";
import stalkLogoWhite from "@/assets/Stalk_logo_white.svg";
import ChatPanel from "@/components/consultation/Chat.panel";
import StockChart from "@/components/stock/charts/stock-chart";
import StockSearch from "@/components/stock/stock-search";

interface LocationState {
  connectionUrl: string;    // wss://… 전체 URL
  consultationId: string;
  sessionId: string;        // OpenVidu 세션 ID
  userRole?: 'ADVISOR' | 'USER';  // 사용자 역할 추가
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

type HoveredButton =
  | "audio"
  | "video"
  | "screen"
  | "chat"
  | "participants"
  | "stock"
  | "settings"
  | null;

const DEFAULT_VIDEO_CONFIG = {
  resolution: "1280x720",
  frameRate: 30,
  insertMode: "APPEND",
  mirror: true,
};

const TIMER_INTERVAL_MS = 1000;

const VideoConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const {state} = useLocation();
  const { connectionUrl: ovToken, consultationId, sessionId : ovSessionId } = (state as LocationState) || {};

  const [session, setSession] = useState<Session | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [ov, setOv] = useState<OpenVidu | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [subscriberStatusMap, setSubscriberStatusMap] = useState<Record<string, { audio: boolean; video: boolean }>>({});


  // 사용자 정보 상태 추가
  const [userInfo, setUserInfo] = useState<{ name: string; role: string; userId: string; contact: string; email: string; profileImage: string } | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState<boolean>(true);

  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showStockChart, setShowStockChart] = useState<boolean>(false);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [chartPeriod, setChartPeriod] = useState<number>(30); // Default to 30 days (1 month)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [consultationStartTime] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [hoveredButton, setHoveredButton] = useState<HoveredButton>(null);
  const [showParticipantFaces, setShowParticipantFaces] =
    useState<boolean>(true);

  // Chart-focused mode states
  const [isChartFocusedMode, setIsChartFocusedMode] = useState<boolean>(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [chartTabs, setChartTabs] = useState<{id: string; ticker: string; name: string}[]>([]);
  const [activeChartTab, setActiveChartTab] = useState<string>("");

  // 참가자 역할 구분을 위한 함수들
  const getParticipantRole = (subscriber: Subscriber): 'ADVISOR' | 'USER' => {
    try {
      if (subscriber.stream.connection.data) {
        const raw = subscriber.stream.connection.data;
        const data = JSON.parse(raw.split('%/%')[0]);
        return data.role || 'USER';
      }
    } catch (error) {
      console.error('Error parsing subscriber data:', error);
    }
    // 기본값: 구독자는 반대 역할
    return userInfo?.role === 'ADVISOR' ? 'USER' : 'ADVISOR';
  };

  const getParticipantName = (subscriber: Subscriber): string => {
    try {
      if (subscriber.stream.connection.data) {
        const raw = subscriber.stream.connection.data;
        const data = JSON.parse(raw.split('%/%')[0]);
        return data.userData || data.name || '참가자';
      }
    } catch (error) {
      console.error('Error parsing subscriber data:', error);
    }
    return '참가자';
  };

  const getRoleDisplayName = (role: 'ADVISOR' | 'USER'): string => {
    return role === 'ADVISOR' ? '전문가' : '의뢰인';
  };

  // 사용자 정보 가져오기
  const fetchUserInfo = async () => {
  try {
    console.log('fetchUserInfo called');
    setIsLoadingUserInfo(true);
    
    const userProfile = await AuthService.getUserProfile();
    console.log('User profile received:', userProfile);
    
    setUserInfo(userProfile);
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    
    // 실패 시에도 기본 구조는 설정 (OpenVidu 초기화를 위해)
    setUserInfo({
      name: '', // 빈 문자열로 설정하여 기본값 로직이 작동하도록
      role: userInfo?.role || 'USER',
      userId: '0',
      contact: '',
      email: '',
      profileImage: ''
    });
  } finally {
    setIsLoadingUserInfo(false);
    console.log('fetchUserInfo completed');
    }
  };

  useEffect(() => {
  console.log('Component mounted, checking conditions for initialization...');
  console.log('ovToken exists:', !!ovToken);
  console.log('consultationId:', consultationId);
  console.log('userRole:', userInfo?.role);

  // OpenVidu 토큰과 상담 정보가 있는 경우에만 초기화
  if (ovToken && consultationId) {
    const initializeConsultation = async () => {
      try {
        console.log('Starting consultation initialization...');
        
        // 1. 미디어 권한 확인
        const hasPermissions = await checkMediaPermissions();
        if (!hasPermissions) {
          console.warn('Media permissions denied, cannot proceed');
          return;
        }

        // 2. 사용자 정보 가져오기
        console.log('Fetching user info...');
        await fetchUserInfo();

        // 3. OpenVidu 초기화는 사용자 정보 로딩 완료 후에 별도로 처리
        console.log('User info fetch completed, OpenVidu initialization will be handled separately');
        
      } catch (error) {
        console.error('Error during consultation initialization:', error);
        alert('상담 초기화 중 오류가 발생했습니다.');
      }
    };

    initializeConsultation();
  } else {
    console.warn('Missing required data for consultation:', {
      hasToken: !!ovToken,
      hasConsultationId: !!consultationId
    });
  }
  }, [ovToken, consultationId]); // ovToken과 consultationId가 변경될 때만 실행

  // 사용자 정보 로딩 완료 후 OpenVidu 초기화
  useEffect(() => {
    console.log('User info state changed:', {
      isLoadingUserInfo,
      hasUserInfo: !!userInfo,
      hasToken: !!ovToken,
      hasSession: !!session
    });

    // 조건 확인: 사용자 정보 로딩 완료, 사용자 정보 존재, 토큰 존재, 세션이 아직 없음
    if (!isLoadingUserInfo && userInfo && ovToken && !session) {
      console.log('All conditions met, initializing OpenVidu...');
      initializeOpenVidu();
    }
  }, [isLoadingUserInfo, userInfo, ovToken, session]);



  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, TIMER_INTERVAL_MS);
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

  // 1. OpenVidu 초기화 함수
  const initializeOpenVidu = async () => {
    if (session || ov) {
      console.warn('OpenVidu already initialized or in progress');
      return;
    }

    // 필수 조건 재확인
    if (!ovToken) {
      console.error('No OpenVidu token available');
      alert('상담 토큰이 없습니다. 다시 입장해주세요.');
      return;
    }

    if (!userInfo) {
      console.error('No user info available');
      return;
    }

    try {
      console.log('Initializing OpenVidu...');
      const openVidu = new OpenVidu();
      setOv(openVidu);
      
      if (ovToken) {
        const session = openVidu.initSession();
  
        // 세션 이벤트 구독을 먼저 설정 (이 부분이 중요!)
        session.on('streamCreated', (event) => {
          console.log('🔴 streamCreated 이벤트 발생:', event.stream.streamId);
          const subscriber = session.subscribe(event.stream, undefined);
          console.log('Subscriber 스트림:', subscriber.stream.getMediaStream());

          setSubscribers((prev) => {
            const newSubscribers = [...prev, subscriber];

            // 비디오 연결은 상태 업데이트 이후로 미루기
            setTimeout(() => {
              attachSubscriberVideo(subscriber, newSubscribers.length - 1);
            }, 100);
            
            return newSubscribers;
          });
        });

        // mic/video 상태 변경 이벤트 핸들링
        session.on('streamPropertyChanged', (event) => {
          const connectionId = event.stream.connection.connectionId;

          setSubscriberStatusMap(prev => ({
            ...prev,
            [connectionId]: {
              ...prev[connectionId],
              [event.changedProperty === 'audioActive' ? 'audio' : 'video']: event.newValue,
            },
          }));
        });

        // 채팅 메시지 수신 이벤트 핸들링
        session.on('signal:chat', (event) => {
          if (!event.data) {
            console.warn('수신된 채팅 데이터가 없습니다');
            return;
          }

          try {
            const receivedMessage: ChatMessage = JSON.parse(event.data);

            if (event.from?.connectionId === session.connection.connectionId) {
              return;
            }

            setChatMessages(prev => [...prev, receivedMessage]);
            console.log("📩 채팅 수신:", receivedMessage);
          } catch (err) {
            console.error("채팅 수신 파싱 오류:", err);
          }
        });
      
        session.on('streamDestroyed', (event) => {
          console.log('Stream destroyed:', event.stream.streamId);
          setSubscribers(prev => prev.filter(sub => sub !== event.stream.streamManager));
        });
  
        session.on('connectionCreated', (event) => {
          console.log('Connection created:', event.connection.connectionId);
        });
  
        session.on('connectionDestroyed', (event) => {
          console.log('Connection destroyed:', event.connection.connectionId);
        });
  
        // 사용자 정보를 포함한 연결 데이터 준비
        const connectionData = {
          role: userInfo?.role || 'USER',
          userData: userInfo?.name || ('익명'),
          userId: userInfo?.userId || '0'
        };
  
        // 세션에 연결
        console.log('Connecting to session with token:', ovToken.substring(0, 20) + '...');
        await session.connect(ovToken, JSON.stringify(connectionData));
        setSession(session);
        console.log('Connected to session successfully');
        
        // Publisher 생성 및 발행
        await createAndPublishStream(openVidu, session);
      }
    } catch (error) {
      console.error("Error initializing OpenVidu:", error);
      alert("OpenVidu 연결에 실패했습니다. 토큰을 확인해주세요.");
    }
  };

  // 2. Publisher 생성 함수 분리
  const createAndPublishStream = async (openVidu: OpenVidu, session: Session) => {
    try {
      const publisher = await openVidu.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: false,
        publishVideo: true,
        ...DEFAULT_VIDEO_CONFIG,
      });
      
      // Publisher 스트림이 준비되면 발행
      publisher.on('streamCreated', () => {
        console.log('Publisher stream created');
      });

      publisher.on('streamPlaying', () => {
        console.log('Publisher stream playing');
        // 로컬 비디오 요소에 연결
        setTimeout(() => attachLocalVideo(publisher), 100);
      });

      console.log('Publishing stream...');
      await session.publish(publisher);
      setPublisher(publisher);
      setIsVideoEnabled(true);
      setIsAudioEnabled(false); // 초기 상태는 오디오 비활성화
      
      console.log('Publisher created and published');
      
    } catch (error) {
      console.error("Error creating publisher:", error);
      throw error;
    }
  };

  // 3. 비디오 요소 연결 함수들 개선
  const attachLocalVideo = (publisher: Publisher) => {
    console.log('Attaching local video...');
    const videoElement = document.getElementById("local-video-element") as HTMLVideoElement;
    if (videoElement && publisher.stream) {
      const mediaStream = publisher.stream.getMediaStream();
      if (mediaStream) {
        videoElement.srcObject = mediaStream;
        videoElement.play().catch(e => console.error('Error playing local video:', e));
        console.log('Local video attached successfully');
      } else {
        console.warn('No media stream available for local video');
      }
    } else {
      console.warn('Local video element not found or publisher stream not ready');
    }
  };

  // 로컬 비디오 렌더링을 위한 useEffect
  useEffect(() => {
    if (publisher && isVideoEnabled) {
      const videoElement = document.getElementById("local-video-element") as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = publisher.stream.getMediaStream();
        videoElement.play().catch((e) => {
          console.error("Error playing local video:", e);
        });
      }
    }
  }, [publisher]);


  // 로컬 비디오 연결 & 차트 전환 시 연결
  useEffect(() => {
    if (publisher && isVideoEnabled) {
      setTimeout(() => {
        if (showStockChart) {
          // Chart mode - attach to sidebar video
          const sidebarVideo = document.getElementById("local-video-element-sidebar") as HTMLVideoElement;
          if (sidebarVideo && publisher.stream) {
            const mediaStream = publisher.stream.getMediaStream();
            if (mediaStream) {
              sidebarVideo.srcObject = mediaStream;
              sidebarVideo.play().catch(e => console.error('Error playing sidebar video:', e));
            }
          }
        } else {
          // Normal mode - attach to main video
          attachLocalVideo(publisher);
        }
      }, 100);
    }
  }, [publisher, isVideoEnabled, showStockChart]);


  // 구독자 비디오 연결 함수
  const attachSubscriberVideo = (subscriber: Subscriber, index: number) => {
    const videoElement = document.getElementById(`subscriber-video-${index}`) as HTMLVideoElement;
    if (!videoElement) {
      console.warn(`Video element subscriber-video-${index} not found`);
      return;
    }
    if (videoElement.srcObject) {
      console.log(`Video element subscriber-video-${index} already has a stream`);
      return;
    }
    const mediaStream = subscriber.stream.getMediaStream();
    if (mediaStream) {
      videoElement.srcObject = mediaStream;
      videoElement.playsInline = true;
      videoElement.muted = false;
      videoElement.play().catch((error) => {
        console.error(`Error playing subscriber video ${index}:`, error);
      });
      console.log(`Subscriber video ${index} attached`);
    } else {
      console.warn(`No media stream for subscriber ${index}`);
    }
  };

  // 미디어 시작 함수
  const startMedia = async () => {
    console.log('startMedia called');
    if (!ov || !session) {
      console.warn('OpenVidu or session not initialized');
      alert('연결이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    // 이미 publisher가 있다면 재시작하지 않음
    if (publisher) {
      console.log('Publisher already exists');
      return;
    }
  
    try {
      await createAndPublishStream(ov, session);
    } catch (error) {
      console.error("Error starting media:", error);
      alert("카메라 또는 마이크에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.");
    }
  };

  // 상담 종료 함수
  const leaveSession = async (): Promise<void> => {

    const token = AuthService.getAccessToken();
    try {
      // 1) 백엔드에 세션 종료 POST 요청
      await axios.post(`/api/consultations/${consultationId}/session/close`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('상담 종료 API 실패:', error);
    } finally {
      // 2) OpenVidu 세션 해제
      if (session) {
        try {
          session.disconnect();
        } catch (err) {
          console.error('세션 disconnect 중 오류:', err);
        }
      }

      // 3) 로컬 퍼블리셔(내 미디어) 트랙 정지 및 객체 파괴
      if (publisher) {
        try {
          publisher.stream
            .getMediaStream()
            .getTracks()
            .forEach(track => track.stop());
        } catch (err) {
          console.error('퍼블리셔 정리 중 오류:', err);
        }
      }

      // 4) 모든 구독자 스트림 언구독 및 트랙 정지
      subscribers.forEach(sub => {
        // 언구독
        try {
          session?.unsubscribe(sub);
        } catch (err) {
          console.error('구독 해제 실패:', err);
        }
        // 미디어 트랙 중지
        try {
          sub.stream
            .getMediaStream()
            .getTracks()
            .forEach(track => track.stop());
        } catch (err) {
          console.error('구독자 트랙 중지 실패:', err);
        }
      });

      // 5) 상태 초기화
      navigate(`/mypage`);
    }
  };

  // 비디오 및 오디오 토글 함수들
  const toggleVideo = async () => {
    console.log('toggleVideo called, current state:', isVideoEnabled);
    if (!publisher) {
      console.warn('Publisher not available');
      return;
    }
  
    const newVideoState = !isVideoEnabled;
  
    try {
      if (newVideoState) {
        // 비디오 켜기
        await publisher.publishVideo(true);
        
          setTimeout(() => {
          attachLocalVideo(publisher);
        }, 100); // 100ms 후 시도
      } else {
        // 비디오 끄기
        await publisher.publishVideo(false);
        console.log('Video disabled');
      }
  
      setIsVideoEnabled(newVideoState);
    } catch (error) {
      console.error("Error toggling video:", error);
      alert(newVideoState ? "카메라를 시작할 수 없습니다." : "카메라를 중지할 수 없습니다.");
    }
  };

  const toggleAudio = async () => {
    console.log('toggleAudio called, current state:', isAudioEnabled);
    if (!publisher) {
      console.warn('Publisher not available');
      return;
    }
  
    const newAudioState = !isAudioEnabled;
  
    try {
      if (newAudioState) {
        // 오디오 켜기
        await publisher.publishAudio(true);
        console.log('Audio enabled');
      } else {
        // 오디오 끄기
        await publisher.publishAudio(false);
        console.log('Audio disabled');
      }
  
      setIsAudioEnabled(newAudioState);
    } catch (error) {
      console.error("Error toggling audio:", error);
      alert(newAudioState ? "마이크를 시작할 수 없습니다." : "마이크를 중지할 수 없습니다.");
    }
  };

  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      leaveSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (session) {
        leaveSession();
      }
    };
  }, [session, consultationId, navigate]);

  // 카메라와 마이크 권한 확인 함수
  const checkMediaPermissions = async () => {
    try {
      console.log('Checking media permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      console.log('Media permissions granted');
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Media permissions denied:', error);
      alert('카메라와 마이크 권한이 필요합니다. 브라우저 설정을 확인해주세요.');
      return false;
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing && ov && session) {
      try {
        const screenPublisher = await ov.initPublisherAsync(undefined, {
          videoSource: "screen",
          publishAudio: false,
          publishVideo: true,
        });
        await session.publish(screenPublisher);
        setIsScreenSharing(true);
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      setIsScreenSharing(false);
    }
  };

  const sendChatMessage = () => {
    if (newMessage.trim() && session) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender: getCurrentUserDisplayName(),
        message: newMessage.trim(),
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, message]);
      setNewMessage("");

      session.signal({
        type: "chat",
        data: JSON.stringify(message),
      }).catch((error) => {
        console.error("채팅 메시지 전송 실패:", error);
      });
    }
  };

  const getCurrentUserDisplayName = (): string => {
    if (isLoadingUserInfo) {
      return '로딩 중...';
    }

    if (userInfo?.name) {
      return userInfo.name;
    }

    // 이름이 없을 경우에만 역할 기반 기본값 사용
    return userInfo?.role === 'ADVISOR' ? '전문가' : '의뢰인';
  };

  // 녹화 시작
  const handleStartRecording = async () => {
    if (!ovSessionId || !consultationId) {
      alert("세션 정보가 없습니다.");
      return;
    }
    try {
      const token = AuthService.getAccessToken();
      await axios.post(
        `/api/recordings/start/${ovSessionId}?consultationId=${consultationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // recordingId는 백엔드에서 반환하도록 개선 필요, 임시로 sessionId 사용
      setRecordingId(ovSessionId);
      setIsRecording(true);
    } catch (e) {
      alert("녹화 시작에 실패했습니다.");
      console.error(e);
    }
  };

  // 녹화 종료
  const handleStopRecording = async () => {
    if (!recordingId) {
      alert("녹화 ID가 없습니다.");
      return;
    }
    try {
      const token = AuthService.getAccessToken();
      await axios.post(
        `/api/recordings/stop/${recordingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsRecording(false);
      setRecordingId(null);
    } catch (e) {
      alert("녹화 종료에 실패했습니다.");
      console.error(e);
    }
  };

  // Chart mode helper functions
  const handleStockSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Use existing stock search functionality - this will be handled by the StockSearch component
  };

  const handleStockSelect = (stock: StockData) => {
    const tabId = `${stock.ticker}-${Date.now()}`;
    const newTab = {
      id: tabId,
      ticker: stock.ticker,
      name: stock.name
    };
    
    setChartTabs(prev => [...prev, newTab]);
    setActiveChartTab(tabId);
    setSelectedStock(stock);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const closeChartTab = (tabId: string) => {
    setChartTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeChartTab === tabId) {
      const remainingTabs = chartTabs.filter(tab => tab.id !== tabId);
      setActiveChartTab(remainingTabs.length > 0 ? remainingTabs[0].id : "");
      if (remainingTabs.length > 0) {
        const activeTab = remainingTabs[0];
        setSelectedStock({ ticker: activeTab.ticker, name: activeTab.name });
      } else {
        setSelectedStock(null);
      }
    }
  };

  const toggleChartFocusedMode = () => {
    setIsChartFocusedMode(!isChartFocusedMode);
    if (!isChartFocusedMode) {
      // Entering chart mode - disable other panels
      setShowChat(false);
      setShowParticipants(false);
      setShowStockChart(true);
    } else {
      // Exiting chart mode - reset to normal mode
      setShowStockChart(false);
      setIsVideoMinimized(false);
    }
  };

  const activeChart = chartTabs.find(tab => tab.id === activeChartTab);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-6">
          <img src={stalkLogoWhite} alt="Stalk Logo" className="h-8" />

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-600 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-medium">상담 진행중</span>
            </div>
            <div className="text-sm text-gray-400">
              상담 시간: {getDuration()}
            </div>
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-400">녹화 중</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            상담 ID: {consultationId || "DEMO-001"}
          </span>
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            title={isRecording ? "녹화 중지" : "녹화 시작"}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
          >
            {isRecording ? "녹화 중지" : "녹화 시작"}
          </button>
          <button
            onClick={leaveSession}
            title="상담 종료"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            상담 종료
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {isChartFocusedMode ? (
          /* Chart-Focused Mode Layout */
          <div className="flex-1 flex flex-col bg-gray-850">
            {/* Main Chart Content - Full Screen */}
            <div className="flex-1 relative">
              {selectedStock ? (
                <div className="absolute inset-0">
                  <div className="h-full flex flex-col overflow-hidden">
                    {/* Chart Content */}
                    <div className="flex-1 p-4 overflow-hidden">
                      <div className="h-full">
                        <StockChart 
                          selectedStock={{
                            ticker: selectedStock.ticker,
                            name: selectedStock.name
                          }}
                          period={chartPeriod}
                          chartType="line"
                          darkMode={true} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-20 h-20 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-400 mb-2">차트를 선택해주세요</p>
                    <p className="text-sm text-gray-500">하단 검색창에서 종목을 검색하세요</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Panel for Chart Mode */}
            {showChat && (
              <div className="w-80 bg-gray-800 border-l border-gray-700">
                <ChatPanel
                  chatMessages={chatMessages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  sendChatMessage={sendChatMessage}
                />
              </div>
            )}
          </div>
        ) : !showStockChart ? (
          <div className="flex-1 p-4">
            <div className="h-full grid grid-cols-2 gap-4">
              {/* 구독자 비디오 렌더링 */}
              {subscribers.length > 0 ? (
                subscribers.map((subscriber, index) => {
                  const name = getParticipantName(subscriber);
                  const role = getParticipantRole(subscriber);
                  const roleName = getRoleDisplayName(role);

                  const connectionId = subscriber.stream.connection.connectionId;
                  const mediaStatus = subscriberStatusMap[connectionId] || { audio: false, video: true };

                  return (
                  <div key={index} className="bg-gray-800 rounded-2xl overflow-hidden relative group">
                    <div className="w-full h-full flex-1">
                      <video
                        ref={(videoElement) => {
                          if (videoElement && subscriber.stream) {
                            const stream = subscriber.stream.getMediaStream();
                            if (videoElement.srcObject !== stream) {
                              videoElement.srcObject = stream;
                              videoElement.play().catch(console.error);
                              console.log(`▶️ 구독자 비디오 ${index} 최초 연결`);
                            }
                          }
                        }}
                        autoPlay
                        playsInline 
                        muted={false}
                        id={`subscriber-video-${index}`}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <span className="text-sm font-medium">
                        {name} ({roleName})
                      </span>
                    </div>


                    <div className="absolute bottom-4 right-4 flex space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${mediaStatus.audio ? 'bg-green-500' : 'bg-red-500'}`}>
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${mediaStatus.video ? 'bg-green-500' : 'bg-red-500'}`}>
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  );
                })
              ) : (
                // 구독자가 없을 때 기본 표시
                <div className="bg-gray-800 rounded-2xl overflow-hidden relative group">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
                      대기
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-medium">{getRoleDisplayName(userInfo?.role === 'ADVISOR' ? 'USER' : 'ADVISOR')} 대기 중</span>
                  </div>
                </div>
              )}

              <div className="bg-gray-800 rounded-2xl overflow-hidden relative">
                <div className="w-full h-full">
                  {(publisher || localStream) &&
                  (isVideoEnabled || isAudioEnabled) ? (
                    <div
                      id="local-video"
                      className="w-full h-full bg-gray-700 rounded-2xl overflow-hidden"
                    >
                      <video
                        id="local-video-element"
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover rounded-2xl mirror-video ${
                          !isVideoEnabled ? "hidden" : ""
                        }`}
                        style={{ transform: "scaleX(-1)" }}
                      />
                      {!isVideoEnabled && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center text-2xl font-bold">
                            김
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                      <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        김
                      </div>
                      <button
                        onClick={startMedia}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        카메라/마이크 시작
                      </button>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-medium">{getCurrentUserDisplayName()} ({getRoleDisplayName((userInfo?.role || 'USER') as 'ADVISOR' || 'USER')})</span>
                </div>
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isAudioEnabled ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isVideoEnabled ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                </div>
              </div>

              {isScreenSharing && (
                <div className="bg-gray-800 rounded-2xl overflow-hidden relative flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-400">화면 공유 중</p>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs">
                    화면 공유
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex">
            {/* Chart Section - Takes most of the space */}
            <div className="flex-1 flex flex-col p-4">
              <div className="flex-1 bg-gray-800 rounded-2xl flex flex-col overflow-hidden">
                {/* Chart Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="space-y-3">
                    <StockSearch
                      onStockSelect={setSelectedStock}
                      darkMode={true}
                    />
                    
                    {/* Period selection buttons */}
                    {selectedStock && (
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setChartPeriod(7)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              chartPeriod === 7
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            1주일
                          </button>
                          <button
                            onClick={() => setChartPeriod(30)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              chartPeriod === 30
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            1개월
                          </button>
                          <button
                            onClick={() => setChartPeriod(90)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              chartPeriod === 90
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            3개월
                          </button>
                          <button
                            onClick={() => setChartPeriod(180)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              chartPeriod === 180
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            6개월
                          </button>
                          <button
                            onClick={() => setChartPeriod(365)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              chartPeriod === 365
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            1년
                          </button>
                        </div>
                        <div className="text-sm text-gray-400">
                          {selectedStock.name} ({selectedStock.ticker})
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Chart Content */}
                <div className="flex-1 p-4 overflow-hidden">
                  {selectedStock ? (
                    <div className="h-full">
                      <StockChart 
                        selectedStock={{
                          ticker: selectedStock.ticker,
                          name: selectedStock.name
                        }}
                        period={chartPeriod}
                        chartType="line"
                        darkMode={true} 
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg
                          className="w-20 h-20 mx-auto mb-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                          />
                        </svg>
                        <p className="text-xl font-medium mb-2 text-gray-300">주식 차트</p>
                        <p className="text-base text-gray-500">상단 검색창에서 종목을 검색하세요</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Participants Sidebar */}
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300">참가자</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">

                {/* 구독자 비디오 미니뷰 */}
                {subscribers.map((subscriber) => {
                  const name = getParticipantName(subscriber);
                  const role = getParticipantRole(subscriber);
                  const roleName = getRoleDisplayName(role);

                      const connectionId = subscriber.stream.connection.connectionId;
                      const mediaStatus = subscriberStatusMap[connectionId] || { audio: false, video: true };

                  return (
                    <div key={subscriber.stream.streamId} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
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
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white">
                        {name} ({roleName})
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${mediaStatus.audio ? 'bg-green-500' : 'bg-red-500'}`}>
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${mediaStatus.video ? 'bg-green-500' : 'bg-red-500'}`}>
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )})}

                {/* Local Video */}
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {(publisher || localStream) && (isVideoEnabled || isAudioEnabled) ? (
                    <div className="w-full h-full">
                      <video
                        id="local-video-element-sidebar"
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover ${!isVideoEnabled ? "hidden" : ""}`}
                        style={{ transform: "scaleX(-1)" }}
                      />
                      {!isVideoEnabled && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-300">
                            {getCurrentUserDisplayName()[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-300">
                        {getCurrentUserDisplayName()[0]}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white">
                    {getCurrentUserDisplayName()} (나)
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isAudioEnabled ? "bg-green-500" : "bg-red-500"}`}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isVideoEnabled ? "bg-green-500" : "bg-red-500"}`}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showStockChart && (showParticipants || showChat) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            {showParticipants && (
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold mb-4">
                  참가자 ({publisher ? 1 : 0 + subscribers.length})
                </h3>
                <div className="space-y-3">
                  {/* 현재 사용자 (퍼블리셔) */}
                  {publisher && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        나
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{getCurrentUserDisplayName()}</p>
                        <p className="text-xs text-gray-400">{getRoleDisplayName( (userInfo?.role  || 'USER') as 'ADVISOR' | 'USER')}</p>
                      </div>
                      <div className="flex space-x-1">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            isAudioEnabled ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          <svg
                            className="w-2.5 h-2.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            isVideoEnabled ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          <svg
                            className="w-2.5 h-2.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 구독자들 */}
                  {subscribers.map((subscriber, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {getParticipantName(subscriber)[0] || '참'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {getParticipantName(subscriber)}
                        </p>
                        <p className="text-xs text-gray-400">{getRoleDisplayName(getParticipantRole(subscriber))}</p>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showChat && (
              <ChatPanel
                chatMessages={chatMessages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendChatMessage={sendChatMessage}
              />
            )}
          </div>
        )}
      </div>

      <div className="relative flex-shrink-0" style={{ zIndex: 100 }}>
        {/* Modern glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl border-t border-white/10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent"></div>

        <div className="relative px-6 py-4">
          <div className="flex items-center justify-center space-x-6">
            <div className="relative">
              <button
                onClick={toggleAudio}
                onMouseEnter={() => setHoveredButton("audio")}
                onMouseLeave={() => setHoveredButton(null)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                  isAudioEnabled
                    ? "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
                    : "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                }`}
              >
                <img
                  src={isAudioEnabled ? micOnIcon : micOffIcon}
                  alt={isAudioEnabled ? "마이크 켜짐" : "마이크 꺼짐"}
                  className="w-6 h-6"
                />
              </button>
              {hoveredButton === "audio" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 border border-gray-600">
                  {isAudioEnabled ? "마이크 끄기" : "마이크 켜기"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={toggleVideo}
                onMouseEnter={() => setHoveredButton("video")}
                onMouseLeave={() => setHoveredButton(null)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                  isVideoEnabled
                    ? "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
                    : "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                }`}
              >
                <img
                  src={isVideoEnabled ? cameraOnIcon : cameraOffIcon}
                  alt={isVideoEnabled ? "카메라 켜짐" : "카메라 꺼짐"}
                  className="w-6 h-6"
                />
              </button>
              {hoveredButton === "video" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 border border-gray-600">
                  {isVideoEnabled ? "카메라 끄기" : "카메라 켜기"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={toggleScreenShare}
                onMouseEnter={() => setHoveredButton("screen")}
                onMouseLeave={() => setHoveredButton(null)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                  isScreenSharing
                    ? "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                    : "bg-gray-600 hover:bg-gray-500 text-white shadow-lg hover:shadow-gray-500/20"
                }`}
              >
                <img
                  src={screenShareIcon}
                  alt="화면 공유"
                  className="w-6 h-6"
                />
              </button>
              {hoveredButton === "screen" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 border border-gray-600">
                  {isScreenSharing ? "화면 공유 중지" : "화면 공유"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>

            {/* Video Panel Toggle Button - Only in Chart Mode */}
            {isChartFocusedMode && (
              <div className="relative">
                <button
                  onClick={() => setIsVideoMinimized(!isVideoMinimized)}
                  onMouseEnter={() => setHoveredButton("participants")}
                  onMouseLeave={() => setHoveredButton(null)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-lg ${
                    !isVideoMinimized 
                      ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20 hover:shadow-blue-500/40'
                      : 'bg-gray-600 hover:bg-gray-500 text-white hover:shadow-gray-500/20'
                  }`}
                  title={isVideoMinimized ? "비디오 패널 보기" : "비디오 패널 숨기기"}
                >
                  <img src={participantsIcon} alt="참가자" className="w-6 h-6" />
                </button>
                {hoveredButton === "participants" && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 border border-gray-600">
                    {isVideoMinimized ? "비디오 패널 보기" : "비디오 패널 숨기기"}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => (!showStockChart && !isChartFocusedMode) && setShowChat(!showChat)}
                onMouseEnter={() => setHoveredButton("chat")}
                onMouseLeave={() => setHoveredButton(null)}
                disabled={showStockChart || isChartFocusedMode}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-lg ${
                  showStockChart || isChartFocusedMode
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
                    : showChat
                    ? "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20 hover:shadow-blue-500/40"
                    : "bg-gray-600 hover:bg-gray-500 text-white hover:shadow-gray-500/20"
                }`}
              >
                <img src={chatIcon} alt="채팅" className="w-6 h-6" />
              </button>
              {hoveredButton === "chat" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 border border-gray-600">
                  {showStockChart || isChartFocusedMode
                    ? "차트 모드에서 사용 불가"
                    : showChat
                    ? "채팅 닫기"
                    : "채팅 열기"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>

            {!isChartFocusedMode && (
              <div className="relative">
                <button
                  onClick={() =>
                    !showStockChart && setShowParticipants(!showParticipants)
                  }
                  onMouseEnter={() => setHoveredButton("participants")}
                  onMouseLeave={() => setHoveredButton(null)}
                  disabled={showStockChart}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    showStockChart
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : showParticipants
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
              >
                <img src={participantsIcon} alt="참가자" className="w-6 h-6" />
              </button>
              {hoveredButton === "participants" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 border border-gray-600">
                  {showStockChart
                    ? "차트 모드에서 사용 불가"
                    : showParticipants
                    ? "참가자 목록 닫기"
                    : "참가자 목록 열기"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
              </div>
            )}

            <div className="relative">
              <button
                onClick={toggleChartFocusedMode}
                onMouseEnter={() => setHoveredButton("stock")}
                onMouseLeave={() => setHoveredButton(null)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-lg ${
                  isChartFocusedMode
                    ? "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20 hover:shadow-blue-500/40"
                    : "bg-gray-600 hover:bg-gray-500 text-white hover:shadow-gray-500/20"
                }`}
              >
                {isChartFocusedMode ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                )}
              </button>
              {hoveredButton === "stock" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 border border-gray-600">
                  {isChartFocusedMode ? "비디오 뷰로 전환" : "차트 보기"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onMouseEnter={() => setHoveredButton("settings")}
                onMouseLeave={() => setHoveredButton(null)}
                className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-lg hover:shadow-gray-500/20"
              >
                <img src={settingsIcon} alt="설정" className="w-6 h-6" />
              </button>
              {hoveredButton === "settings" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 border border-gray-600">
                  설정
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls - Chart-focused mode */}
      {isChartFocusedMode && (
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Stock Search */}
            <div className="relative">
              <StockSearch
                onStockSelect={handleStockSelect}
                darkMode={true}
              />
            </div>

            {/* Period Selection */}
            {selectedStock && (
              <div className="flex space-x-1">
                <button
                  onClick={() => setChartPeriod(7)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    chartPeriod === 7
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  1주
                </button>
                <button
                  onClick={() => setChartPeriod(30)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    chartPeriod === 30
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  1개월
                </button>
                <button
                  onClick={() => setChartPeriod(90)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    chartPeriod === 90
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  3개월
                </button>
                <button
                  onClick={() => setChartPeriod(365)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    chartPeriod === 365
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  1년
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Media Controls */}
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg transition-colors ${
                isAudioEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <img src={isAudioEnabled ? micOnIcon : micOffIcon} alt="Mic" className="w-4 h-4" />
            </button>

            <button
              onClick={toggleVideo}
              className={`p-2 rounded-lg transition-colors ${
                isVideoEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <img src={isVideoEnabled ? cameraOnIcon : cameraOffIcon} alt="Camera" className="w-4 h-4" />
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

            {/* Chat Button */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg transition-colors ${
                showChat
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <img src={chatIcon} alt="채팅" className="w-4 h-4" />
            </button>

            {/* Video View Toggle */}
            <button
              onClick={toggleChartFocusedMode}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Settings */}
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              <img src={settingsIcon} alt="설정" className="w-4 h-4" />
            </button>

            <button
              onClick={leaveSession}
              className="ml-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              상담 종료
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConsultationPage;
