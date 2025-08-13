import {
  OpenVidu,
  Publisher,
  Session,
  Subscriber,
} from "openvidu-browser";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import axios from "axios";
import AuthService from "@/services/authService";

import cameraOffIcon from "@/assets/images/icons/consultation/camera-off.svg";
import cameraOnIcon from "@/assets/images/icons/consultation/camera-on.svg";
import chatIcon from "@/assets/images/icons/consultation/chat.svg";
import micOffIcon from "@/assets/images/icons/consultation/mic-off.svg";
import micOnIcon from "@/assets/images/icons/consultation/mic-on.svg";
import participantsIcon from "@/assets/images/icons/consultation/participants.svg";
import screenShareIcon from "@/assets/images/icons/consultation/screen-share.svg";
import stalkLogoWhite from "@/assets/Stalk_logo_white.svg";
import ChatPanel from "@/components/consultation/Chat.panel";
import { StockChart } from "@/components/stock";
import StockSearch from "@/components/stock/stock-search";
import ChartErrorBoundary from "@/components/ChartErrorBoundary";
import ChartControls from "@/components/stock/chart-controls/chart-controls";

// Indicator explanations for tooltips
const indicatorExplanations = {
  volume: {
    title: '거래량',
    description: '특정 기간 동안의 주식 거래량을 표시합니다.',
    usage: '거래량이 많으면 강한 추세를 의미합니다.',
  },
  rsi: {
    title: 'RSI (상대강도지수)',
    description: '가격의 상승압력과 하락압력 간의 상대적 강도를 나타냅니다.',
    usage: '70 이상: 과매수 구간, 30 이하: 과매도 구간',
    params: '기간(일): 일반적으로 14일 사용 (최소 14개 데이터 포인트 필요)'
  },
  macd: {
    title: 'MACD',
    description: '두 이동평균선의 차이를 이용한 추세 추종 모멘텀 지표입니다.',
    usage: 'MACD선이 시그널선을 상향 돌파시 매수 신호, 하향 돌파시 매도 신호',
    params: '단기(12), 장기(26), 시그널(9)이 기본값 (최소 26개 데이터 포인트 필요)'
  },
  stochastic: {
    title: '스토캐스틱',
    description: '일정 기간 중 현재 가격의 상대적 위치를 나타내는 모멘텀 지표입니다.',
    usage: '80 이상: 과매수, 20 이하: 과매도. %K와 %D선의 교차로 매매 신호 포착',
    params: '%K 기간, %D 기간 (smoothing) - 일반적으로 14일 사용 (최소 14개 데이터 포인트 필요)'
  }
};

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
  type : "system" | "user";
}

interface ChartInfo {
  ticker: string;
  period: string;
  name?: string;
}

type HoveredButton =
  | "audio"
  | "video"
  | "screen"
  | "chat"
  | "participants"
  | "stock"
  | null;

const DEFAULT_VIDEO_CONFIG = {
  resolution: "1280x720",
  frameRate: 30,
  insertMode: "APPEND",
  mirror: true,
};

// ✅ OV connection.data 안전 파서 (JSON/legacy 모두 흡수)
function parseOvData(raw: string): any {
  if (!raw) return {};

  // A. "clientDataJSON%/%serverDataJSON" 포맷 우선 처리
  if (raw.includes('%/%')) {
    const [clientPart] = raw.split('%/%');
    try { return JSON.parse(clientPart); } catch {}
  }

  // B. 통짜 JSON 포맷 처리
  try {
    const obj = JSON.parse(raw);
    if (obj?.clientData && typeof obj.clientData === 'string') {
      try { return JSON.parse(obj.clientData); } catch {}
    }
    if (obj?.serverData && typeof obj.serverData === 'string') {
      try { return JSON.parse(obj.serverData); } catch {}
    }
    if (obj && (obj.ownerId || obj.kind)) return obj;
  } catch {}

  // C. 레거시 key=value 포맷 방어
  const mClient = /clientData=([^,&]+)/.exec(raw);
  if (mClient) { try { return JSON.parse(decodeURIComponent(mClient[1])); } catch {} }
  const mServer = /serverData=([^,&]+)/.exec(raw);
  if (mServer) { try { return JSON.parse(decodeURIComponent(mServer[1])); } catch {} }

  return {};
}

const TIMER_INTERVAL_MS = 1000;


const VideoConsultationPage: React.FC = () => {
  const navigate = useNavigate();

  // OpenVidu 입장 로직 관련 상태
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const {state} = useLocation();
  const { connectionUrl: ovToken, consultationId, sessionId : ovSessionId } = (state as LocationState) || {};
  const [session, setSession] = useState<Session | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [ov, setOv] = useState<OpenVidu | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [subscriberStatusMap, setSubscriberStatusMap] = useState<Record<string, { audio: boolean; video: boolean }>>({});
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isInSession] = useState(true);
  const ovTokenRef = useRef<string | null>(ovToken ?? sessionStorage.getItem("ovToken"));
  const consultationIdRef = useRef<string | null>(consultationId ?? sessionStorage.getItem("consultationId"));

  // 차트 관련 상태
  const [currentChart, setCurrentChart] = useState<ChartInfo | null>(null);
  const [chartPeriod, setChartPeriod] = useState<number>(30); // Increased default to 30 days for better indicator support
  const [chartIndicators, setChartIndicators] = useState<any>({});
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [activeIndicator, setActiveIndicator] = useState<string>('volume');
  const [dataPointCount, setDataPointCount] = useState<number>(0);
  const [hoveredIndicator, setHoveredIndicator] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number}>({x: 0, y: 0});

  // 사용자 정보 상태 추가
  const [userInfo, setUserInfo] = useState<{ name: string; role: string; userId: string; contact: string; email: string; profileImage: string } | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState<boolean>(true);

  // 상담 관련 상태
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showStockChart, setShowStockChart] = useState<boolean>(false);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [consultationStartTime] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [hoveredButton, setHoveredButton] = useState<HoveredButton>(null);
  const [showParticipantFaces, setShowParticipantFaces] = useState<boolean>(true);

  // 녹화 관련 상태
  const [screenOv, setScreenOv] = useState<OpenVidu | null>(null);
  const [screenSession, setScreenSession] = useState<Session | null>(null);
  const [screenPublisher, setScreenPublisher] = useState<Publisher | null>(null);
  const isMyScreenActive = () => !!screenPublisher || !!screenSession;
  const screenConnectingRef = useRef(false);
  const isCleaningScreenRef = useRef(false);
  const myScreenConnectionIdRef = useRef<string | null>(null);

  // 안전하게 트랙 정지
  const stopTracks = (pub?: Publisher | null) => {
    try {
      const ms = pub?.stream?.getMediaStream?.();
      ms?.getTracks?.().forEach(t => {
        try { t.stop(); } catch {}
      });
    } catch {}
  };

  const cleanupScreenShare = async () => {
    if (isCleaningScreenRef.current) return;
    isCleaningScreenRef.current = true;

    try {
      // 1) 퍼블리셔가 있으면 우선 unpublish
      if (screenPublisher) {
        try {
          // second connection 우선
          if (screenSession) {
            await screenSession.unpublish(screenPublisher);
          } else if (session) {
            // same-connection 방식 대비 (혹시 토글에서 같은 세션 퍼블리시한 경우)
            await session.unpublish(screenPublisher);
          }
        } catch (e) {
          // unpublish 실패해도 트랙은 반드시 정지
          console.warn("[cleanupScreenShare] unpublish failed:", e);
        } finally {
          stopTracks(screenPublisher);
        }
      }

      // 2) 두 번째 세션을 쓰는 경우 세션 종료
      if (screenSession) {
        try { await screenSession.disconnect(); } catch (e) {
          console.warn("[cleanupScreenShare] screenSession.disconnect failed:", e);
        }
      }

      // 3) OpenVidu 인스턴스는 세션 끊으면 같이 정리됨 (명시 해제는 선택)
      // try { (screenOv as any)?.off?.(); } catch {}

      // 4) 상태 초기화
      setScreenPublisher(null);
      setScreenSession(null);
      setScreenOv(null);
      myScreenConnectionIdRef.current = null; 
      setIsScreenSharing(false);

    } finally {
      isCleaningScreenRef.current = false;
    }
  };

  // 참가자 역할 구분을 위한 함수
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

  // 참가자 이름 가져오기
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

  // 참가자 역할 표시 이름 가져오기
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

  // 대화 시간 계산 함수
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
          const meta = parseOvData(event.stream.connection.data); 
          const isScreen = event.stream.typeOfVideo === 'SCREEN' || meta?.kind === 'screen';
          const mine = meta?.ownerId && meta.ownerId === userInfo?.userId;

          const fromThisConnection = session.connection?.connectionId === event.stream.connection.connectionId;
          const fromMySecondConn = myScreenConnectionIdRef.current === event.stream.connection.connectionId;
          if (isScreen && (mine || fromThisConnection || fromMySecondConn))  {
            console.log('[OV] skip subscribe for recording-only screen stream');
            return;
          }
  
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

          if(!showChat) {
            setHasUnreadMessages(true);
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
          const meta = parseOvData(event.connection.data);
          if (meta?.kind === 'screen') return; // ✅ 화면공유 connection은 입장 알림/리스트 제외

          const raw = event.connection.data;
          const userData = JSON.parse(raw.split("%/%")[0]);
          const username = userData.userData || "익명";
          const msg: ChatMessage = {
            id: `sys-${Date.now()}`,
            sender: "system",
            message: `${username}님이 입장했습니다.`,
            timestamp: new Date(),
            type: "system",
          };
          setChatMessages((prev) => [...prev, msg]);
        });

        session.on('connectionDestroyed', (event) => {
            const raw = event.connection.data;
            const userData = JSON.parse(raw.split("%/%")[0]);
            const username = userData.userData || "익명";
            const msg: ChatMessage = {
              id: `sys-${Date.now()}`,
              sender: "system",
              message: `${username}님이 퇴장했습니다.`,
              timestamp: new Date(),
              type: "system",
            };
            setChatMessages((prev) => [...prev, msg]);
        });

        const ownerId = userInfo?.userId ?? '0';
        const ownerName = userInfo?.name ?? 'unknown';

        // 사용자 정보를 포함한 연결 데이터 준비
        const connectionData = {
          role: userInfo?.role || 'USER',
          userData: userInfo?.name || ('익명'),
          userId: userInfo?.userId || '0',
          ownerId,                  // 🔑 그룹핑/녹화용 공통 키
          ownerName,                // 🔑 표시용
          kind: 'cam'               // 🔑 cam|screen 구분
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

  // 비디오 토글 함수
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

  // 오디오 토글 함수
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

  // 화면 공유 토글 함수
  const toggleScreenShare = async () => {
    if (!ov || !session) return;

    try {
      if (!screenPublisher) {
        const pub = await ov.initPublisherAsync(undefined, {
          videoSource: "screen",
          publishAudio: false,
          publishVideo: true,
        });
        await session.publish(pub);
        setScreenPublisher(pub);
        setIsScreenSharing(true);
      } else {
        try { await session.unpublish(screenPublisher); } catch {}
        try { screenPublisher.stream.getMediaStream().getTracks().forEach(t => t.stop()); } catch {}
        setScreenPublisher(null);
        setIsScreenSharing(false);
        await cleanupScreenShare();
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      await cleanupScreenShare();
    }
  };

  // 채팅 메시지 전송 함수
  const sendChatMessage = () => {
    if (newMessage.trim() && session) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender: getCurrentUserDisplayName(),
        message: newMessage.trim(),
        timestamp: new Date(),
        type: "user",
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

  // 현재 사용자 이름 가져오기
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

  // 차트 변경 감지 후 signaling
  const handleChartChange = (info: ChartInfo) => {
    // 로컬 상태 업데이트
    setCurrentChart(info);

    // signaling
    if (session) {
      session.signal({
        type: 'chart:change',
        data: JSON.stringify(info)
      }).then(() => {
          console.log('[chart] sent:', info);
      }).catch(err => console.error('Chart change signaling failed', err));
    }
  };

  // 기간 변경 하는 핸들러
  const handlePeriodChange = (period: number) => {
    console.log('handlePeriodChange called with period:', period);
    setChartPeriod(period);

    // 현재 선택/공유 중인 티커 기준으로 chart:change 브로드캐스트
    const info = {
      ticker: currentChart?.ticker || selectedStock?.ticker || '',
      period: String(period),
      name: selectedStock?.name || currentChart?.name || ''
    };

    // 로컬 state도 동기화
    setCurrentChart(prev => prev ? { ...prev, period: String(period) } : info);

    if (session) {
      // 권장: chart:change만 보내도 충분 (수신측은 이걸로만 처리하고 있음)
      session.signal({
        type: 'chart:change',
        data: JSON.stringify(info)
      }).catch(err => console.error('Chart change signaling failed', err));

      // (선택) 하위 호환: 기존 chart:period도 함께 보낼 거면 아래 유지
      session.signal({
        type: 'chart:period',
        data: JSON.stringify({ period })
      }).catch(err => console.error('Period change signaling failed', err));
    }
  };

  const handleIndicatorChange = (indicators: any) => {
    setChartIndicators(indicators);
    // You can also signal this change if needed
    if (session) {
      session.signal({
        type: 'chart:indicators',
        data: JSON.stringify(indicators)
      }).catch(err => console.error('Indicator change signaling failed', err));
    }
  };

  // 차트 선택 시 signaling
  useEffect(() => {
    if (!session) return;
    if (!selectedStock?.ticker) return;

    if (currentChart?.ticker !== selectedStock.ticker) {
      const info = { ticker: 
        selectedStock.ticker, period: currentChart?.period ?? '7', 
        name: selectedStock.name || currentChart?.name || '' };
      console.log('chartinfo : ' , info);
      setCurrentChart(info);
      session.signal({
        type: 'chart:change',
        data: JSON.stringify(info)
      }).then(() => console.log('[chart] sent (auto-select):', info))
        .catch(console.error);
    }
  }, [session, selectedStock?.ticker]);

  // 차트 변경 이벤트 수신
  useEffect(() => {
    if (!session) return;
    const onChartChange = (e: any) => {
      const info = JSON.parse(e.data) as ChartInfo;
      console.log('[chart] recv:', info);
      setCurrentChart(info);
      setShowStockChart(true);
    };
    session.on('signal:chart:change', onChartChange);
    return () => { session.off('signal:chart:change', onChartChange); };
  }, [session]);

  // 신규 입장 시 현재 차트 요청
  useEffect(() => {
    if (!session) return;
    session.signal({ type: 'chart:sync_request' }).catch(console.error);
  }, [session]);

  // 차트 동기화 요청을 수신하면 현재 차트 응답
  useEffect(() => {
    if (!session) return;
    const onSyncReq = async () => {
      if (currentChart) {      
        const chartWithName = {
          ...currentChart,
          name: currentChart.name || selectedStock?.name || currentChart.ticker
        };
        await session.signal({
          type: 'chart:sync_state',
          data: JSON.stringify(chartWithName),
        });
      }
    };
    session.on('signal:chart:sync_request', onSyncReq);
    return () => { session.off('signal:chart:sync_request', onSyncReq); };
  }, [session, publisher, currentChart]);

  // 응답을 수신해서 차트 랜더링
  useEffect(() => {
    if (!session) return;
    const onSyncState = (e: any) => {
      const info = JSON.parse(e.data) as ChartInfo;
      setCurrentChart(info);
    };
    session.on('signal:chart:sync_state', onSyncState);
    return () => { session.off('signal:chart:sync_state', onSyncState); };
  }, [session]);

  // 드로잉 모드 시그널 수신 처리
  useEffect(() => {
    if (!session) return;
    const onDrawingMode = (e: any) => {
      try {
        const msg = JSON.parse(e.data);
        if (typeof msg.enabled === 'boolean') {
          console.log('Received drawing mode signal:', msg.enabled);
          setIsDrawingMode(msg.enabled);
          // Drawing mode state will be passed to StockChart as prop
          // which will handle the future space addition
        }
      } catch (err) {
        console.error('Failed to parse drawing mode signal:', err);
      }
    };
    session.on('signal:chart:drawingMode', onDrawingMode);
    return () => { session.off('signal:chart:drawingMode', onDrawingMode); };
  }, [session]);

  // 이미 화면공유(본인/상대) 존재하는지 체크
  const hasAnyScreen = (sess?: Session | null) => {
    if (isMyScreenActive()) return true;
    return !!sess?.streamManagers?.some((sm: any) => {
      const st = sm?.stream;
      if (!st) return false;
      const meta = parseOvData(st?.connection?.data);
      return meta?.kind === 'screen' || st?.typeOfVideo === 'SCREEN';
    });
  };

  // 녹화 시작
  const handleStartRecording = async () => {
    if (!ovSessionId || !consultationId || !session) {
      alert("세션 정보가 없습니다.");
      return;
    }
    if (isRecording) return;
    if (screenConnectingRef.current) return;

    try {
      const userId = userInfo?.userId ?? '0';
      const name = userInfo?.name ?? 'unknown';
      const token = AuthService.getAccessToken();

      // 1) 화면공유 연결(두 번째 connection) 필요하면 한 번만 생성
      if (!isMyScreenActive() && !hasAnyScreen(session)) {
        screenConnectingRef.current = true;

        // ✅ 컨트롤러 경로 통일: /connections  +  kind=screen
        const tokenRes = await axios.post(
          `/api/recordings/sessions/${encodeURIComponent(ovSessionId)}/connections`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { kind: 'screen', userId, name },
          }
        );
        const screenToken = tokenRes?.data?.result?.token ?? tokenRes?.data?.data?.token;
        if (!screenToken) throw new Error("화면공유 토큰 발급 실패");

        const ov2 = new OpenVidu();
        const sess2 = ov2.initSession();

        // ✅ screen connection에도 동일 메타데이터 전달
        await sess2.connect(
          screenToken,
          JSON.stringify({ ownerId: userId, ownerName: name, kind: 'screen' })
        );
        myScreenConnectionIdRef.current = sess2.connection?.connectionId || null;
        setScreenOv(ov2);
        setScreenSession(sess2);

        const pub = await ov2.initPublisherAsync(undefined, {
          videoSource: "screen",
          mirror: false,
          // audioSource: "screen" // 브라우저 지원 시 필요하면 ON
        });
        await sess2.publish(pub);
        setScreenPublisher(pub);
        console.log("[recording] screen published on second connection");

        // (선택) 레이스 방지용 짧은 대기
        await new Promise((r) => setTimeout(r, 120));
      } else {
        console.log("[recording] screen exists → skip creating second connection");
      }

      // 2) 녹화 시작 (불필요 params 제거)
      const recRes = await axios.post(
        `/api/recordings/start/${encodeURIComponent(ovSessionId)}?consultationId=${encodeURIComponent(String(consultationId))}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const recId = (recRes?.data?.data?.recordingId as string) || ovSessionId;
      setRecordingId(recId);
      setIsRecording(true);

    } catch (e: any) {
      if (e?.name === "NotAllowedError" || String(e?.message || "").includes("Permission")) {
        alert("화면 공유가 취소되어 녹화를 시작하지 않았습니다.");
      } else {
        alert("녹화 시작에 실패했습니다.");
      }
      console.error("[recording] start failed:", e);
      cleanupScreenShare();
    } finally {
      screenConnectingRef.current = false;
    }
  };

  // 녹화 종료
  const handleStopRecording = async () => {
    if (!recordingId) {
      alert("녹화 ID가 없습니다.");
      return;
    }
    if (!isRecording) return;

    try {
      const token = AuthService.getAccessToken();

      const stopUrl = consultationId
        ? `/api/recordings/stop/${encodeURIComponent(recordingId)}?consultationId=${encodeURIComponent(
            String(consultationId)
          )}`
        : `/api/recordings/stop/${encodeURIComponent(recordingId)}`;

      const res = await axios.post(
        stopUrl,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const url = res?.data?.data?.url as string | undefined;
      const durationSec = res?.data?.data?.durationSec as number | undefined;
      const sizeBytes = res?.data?.data?.sizeBytes as number | undefined;

      // 화면공유 전용 Connection 정리
      try {
        screenPublisher?.stream?.getMediaStream()?.getTracks()?.forEach(t => t.stop());
      } catch {}
      try {
        screenSession?.disconnect();
      } catch {}
      setScreenPublisher(null);
      setScreenSession(null);
      setScreenOv(null);

      // UI 상태 초기화
      setIsRecording(false);
      setRecordingId(null);

      if (url) {
        console.log("[recording] saved:", { url, durationSec, sizeBytes });
        // 필요 시 자동 다운로드
        // window.open(url, "_blank");
      }
    } catch (e) {
      alert("녹화 종료에 실패했습니다.");
      console.error(e);
    }
  };


    // 상담 종료 함수
  const leaveSession = async (): Promise<void> => {

    const token = AuthService.getAccessToken();
    const id =
    consultationIdRef.current ||
    sessionStorage.getItem("consultationId") ||
    consultationId || null;


    try {
      // 1) 백엔드에 세션 종료 POST 요청
      await axios.post(`/api/consultations/${id}/session/close`,
        {}, {
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

      // 4) 상태 초기화
      navigate(`/mypage`);
    }
  };

    // 상태 변화를 추적하는 ref 추가
  const isInSessionRef = useRef(isInSession);
  useEffect(() => {
    isInSessionRef.current = isInSession;
  }, [isInSession]);

  // session storage에 상담 ID 저장
  useEffect(() => {
    if (ovToken) {
      ovTokenRef.current = ovToken;
      sessionStorage.setItem("ovToken", ovToken);
    }
    if (consultationId) {
      consultationIdRef.current = consultationId;
      sessionStorage.setItem("consultationId", consultationId);
    }
  }, [ovToken, consultationId]);

  // ovToken과 consultationId가 변경될 때 openvidu 초기화
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
  }, [ovToken, consultationId]);

  // 사용자 로딩 후 OpenVidu 초기화
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

  // 타이머 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, TIMER_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

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
    if (publisher && isVideoEnabled && (!showStockChart || showParticipantFaces || showParticipants)) {
      setTimeout(() => {
        attachLocalVideo(publisher);
      }, 100);
    }
  }, [publisher, isVideoEnabled, showStockChart, showParticipantFaces, showParticipants]);

  // 실시간 채팅 읽음 상태 변경
  useEffect(() => {
  if (showChat) {
    setHasUnreadMessages(false); // ✅ 열자마자 알림 꺼짐
    }
  }, [showChat]);

  // 채팅 창이 닫힐 때 읽음 상태 초기화
  useEffect(() => {
    if (!showChat) {
      setHasUnreadMessages(false);
    }
  }, [showChat]);

  // 새로고침으로 떠났다면, 재로드 직후 마이페이지로
  useEffect(() => {
    const flag = sessionStorage.getItem('navigateToMyPageAfterReload');
    if (flag === '1') {
      sessionStorage.removeItem('navigateToMyPageAfterReload');
      navigate('/mypage', { replace: true });
    }
  }, [navigate]);

  // 브라우저 뒤로가기 버튼 처리
  useEffect(() => {
    const handlePopState = async (_e: PopStateEvent) => {
      // 뒤로가기를 눌러도 결국 현재 URL로 고정
      window.history.pushState(null, '', window.location.href);

      const ok = window.confirm('상담을 종료하고 나가시겠습니까?');
      if (!ok) return;

      // 🔸 leaveSession 내부에서 이미 /mypage 로 navigate 하므로,
      // 여기서 따로 navigate(-1) 호출하지 않습니다.
      await leaveSession();
    };

    // 🔹 처음 마운트 시 더미 state 하나 넣어, 첫 뒤로가기를 우리가 가로챔
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // 새로고침/창 닫기 경고 및 처리 로직 추가
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInSessionRef.current) {
        // 사용자에게 경고 메시지를 표시
        e.preventDefault();
        e.returnValue = "";

        sessionStorage.setItem('navigateToMyPageAfterReload', '1');
      }
    };

    const handleUnload = async () => {
      // 창이 닫히거나 새로고침될 때 leaveSession 호출
      // 이 부분은 브라우저에 따라 비동기 API가 실행되지 않을 수 있음.
      // 하지만, 최대한 시도하는 것이 좋음.
      if (isInSessionRef.current) {
        // Navigator.sendBeacon 또는 동기 XHR 요청을 사용하면 더 확실하지만
        // 간단한 fetch/axios 요청도 시도해 볼 수 있음.
        const id = consultationIdRef.current;
        const token = AuthService.getAccessToken();

        if (id && token) {
          // 동기 XHR 요청 예시 (브라우저가 닫히기 전에 완료되도록)
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `/api/consultations/${id}/session/close`, false); // 'false'로 동기 설정
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send();
          console.log("동기 요청으로 상담 종료 API 시도 완료");
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, []); // 의존성 배열을 비워 한 번만 실행되도록 함

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Unified Header navbar - expands when chart mode is active */}
      <div className={`${showStockChart ? 'bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl' : 'bg-gray-800'} px-6 py-3 flex items-center justify-between border-b border-gray-700 transition-all duration-300 relative overflow-visible`}>
        <div className="flex items-center space-x-4 flex-1">
          <img src={stalkLogoWhite} alt="Stalk Logo" className="h-6" />

          {/* Chart Mode Controls */}
          {showStockChart && (
            <>
              {/* Stock Info */}
              {(selectedStock || currentChart) && (
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">
                    {selectedStock?.name ?? currentChart?.name ?? ''}
                  </span>
                  {(selectedStock?.ticker ?? currentChart?.ticker) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300">
                      {selectedStock?.ticker ?? currentChart?.ticker}
                    </span>
                  )}
                </div>
              )}
              {/* Period Controls */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-800/40 backdrop-blur-md border border-gray-700/30">
                <ChartControls
                  period={chartPeriod.toString()}
                  chartType={'line'}
                  onPeriodChange={(period) => handlePeriodChange(parseInt(period))}
                  onChartTypeChange={() => {}}
                  darkMode={true}
                />
              </div>

              {/* Indicator Controls - Complete set */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">지표:</span>

                {/* Volume Indicator */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const newIndicator = activeIndicator === 'volume' ? null : 'volume';
                      setActiveIndicator(newIndicator);
                      if (session) {
                        session.signal({
                          type: 'chart:indicator',
                          data: JSON.stringify({ indicator: newIndicator })
                        }).catch(console.error);
                      }
                    }}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      activeIndicator === 'volume'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
                    }`}
                  >
                    거래량
                  </button>
                </div>
                {/* RSI Indicator */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (dataPointCount >= 14) {
                        const newIndicator = activeIndicator === 'rsi' ? null : 'rsi';
                        setActiveIndicator(newIndicator);
                        if (session) {
                          session.signal({
                            type: 'chart:indicator',
                            data: JSON.stringify({ indicator: newIndicator })
                          }).catch(console.error);
                        }
                      }
                    }}
                    disabled={dataPointCount < 14}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      dataPointCount < 14
                        ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                        : activeIndicator === 'rsi'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
                    }`}
                    title={dataPointCount < 14 ? `RSI requires 14+ data points (current: ${dataPointCount})` : ''}
                  >
                    RSI
                  </button>
                  <div
                    className="relative"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const tooltipWidth = 320;
                      const tooltipHeight = 140;

                      let x = rect.right + 8;
                      let y = rect.top + rect.height / 2;

                      if (x + tooltipWidth > window.innerWidth) {
                        x = rect.left - tooltipWidth - 8;
                      }

                      if (y + tooltipHeight / 2 > window.innerHeight) {
                        y = window.innerHeight - tooltipHeight - 8;
                      } else if (y - tooltipHeight / 2 < 0) {
                        y = 8;
                      } else {
                        y = y - tooltipHeight / 2;
                      }

                      setTooltipPosition({ x, y });
                      setHoveredIndicator('rsi');
                    }}
                    onMouseLeave={() => setHoveredIndicator(null)}
                  >
                    <button
                      className="text-xs rounded-full w-4 h-4 flex items-center justify-center bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                      type="button"
                    >
                      ?
                    </button>
                  </div>
                </div>
                {/* MACD Indicator */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (dataPointCount >= 26) {
                        const newIndicator = activeIndicator === 'macd' ? null : 'macd';
                        setActiveIndicator(newIndicator);
                        if (session) {
                          session.signal({
                            type: 'chart:indicator',
                            data: JSON.stringify({ indicator: newIndicator })
                          }).catch(console.error);
                        }
                      }
                    }}
                    disabled={dataPointCount < 26}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      dataPointCount < 26
                        ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                        : activeIndicator === 'macd'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
                    }`}
                    title={dataPointCount < 26 ? `MACD requires 26+ data points (current: ${dataPointCount})` : ''}
                  >
                    MACD
                  </button>
                  <div
                    className="relative"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const tooltipWidth = 320;
                      const tooltipHeight = 140;

                      let x = rect.right + 8;
                      let y = rect.top + rect.height / 2;

                      if (x + tooltipWidth > window.innerWidth) {
                        x = rect.left - tooltipWidth - 8;
                      }

                      if (y + tooltipHeight / 2 > window.innerHeight) {
                        y = window.innerHeight - tooltipHeight - 8;
                      } else if (y - tooltipHeight / 2 < 0) {
                        y = 8;
                      } else {
                        y = y - tooltipHeight / 2;
                      }

                      setTooltipPosition({ x, y });
                      setHoveredIndicator('macd');
                    }}
                    onMouseLeave={() => setHoveredIndicator(null)}
                  >
                    <button
                      className="text-xs rounded-full w-4 h-4 flex items-center justify-center bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                      type="button"
                    >
                      ?
                    </button>
                  </div>
                </div>
                {/* Stochastic Indicator */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (dataPointCount >= 14) {
                        const newIndicator = activeIndicator === 'stochastic' ? null : 'stochastic';
                        setActiveIndicator(newIndicator);
                        if (session) {
                          session.signal({
                            type: 'chart:indicator',
                            data: JSON.stringify({ indicator: newIndicator })
                          }).catch(console.error);
                        }
                      }
                    }}
                    disabled={dataPointCount < 14}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      dataPointCount < 14
                        ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                        : activeIndicator === 'stochastic'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
                    }`}
                    title={dataPointCount < 14 ? `Stochastic requires 14+ data points (current: ${dataPointCount})` : ''}
                  >
                    스토캐스틱
                  </button>
                  <div
                    className="relative"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const tooltipWidth = 320;
                      const tooltipHeight = 140;

                      let x = rect.right + 8;
                      let y = rect.top + rect.height / 2;

                      if (x + tooltipWidth > window.innerWidth) {
                        x = rect.left - tooltipWidth - 8;
                      }

                      if (y + tooltipHeight / 2 > window.innerHeight) {
                        y = window.innerHeight - tooltipHeight - 8;
                      } else if (y - tooltipHeight / 2 < 0) {
                        y = 8;
                      } else {
                        y = y - tooltipHeight / 2;
                      }

                      setTooltipPosition({ x, y });
                      setHoveredIndicator('stochastic');
                    }}
                    onMouseLeave={() => setHoveredIndicator(null)}
                  >
                    <button
                      className="text-xs rounded-full w-4 h-4 flex items-center justify-center bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                      type="button"
                    >
                      ?
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawing Mode Button */}
              <div className="flex items-center">
                <button
                  onClick={() => {
                    const newDrawingMode = !isDrawingMode;
                    console.log('Consultation: Toggling drawing mode from', isDrawingMode, 'to', newDrawingMode);
                    setIsDrawingMode(newDrawingMode);
                    if (session) {
                      session.signal({
                        type: 'chart:drawingMode',
                        data: JSON.stringify({ enabled: newDrawingMode })
                      }).catch(console.error);
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    isDrawingMode
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
                  }`}
                >
                  {isDrawingMode ? '✏️ 그리기 중' : '✏️ 그리기'}
                </button>
              </div>

              {/* Stock Search - moved to right side */}
              <div className="ml-auto w-55 relative z-[1000] [&_input]:!py-0.5 [&_input]:!text-xs [&_input]:!px-2 [&_.mb-5]:!mb-0 [&_input]:!h-7 [&_.relative]:!mb-0 [&_.px-4.py-3]:!px-2 [&_.px-4.py-3]:!py-2">
                <StockSearch
                  onStockSelect={setSelectedStock}
                  darkMode={true}
                />
              </div>
            </>
          )}

          {/* Compact status indicators */}
          <div className="flex items-center space-x-3 ml-auto">
            <div className="flex items-center space-x-1.5 bg-blue-600/20 border border-blue-500/30 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">상담중</span>
            </div>
            <div className="text-xs text-gray-400">
              {getDuration()}
            </div>
            {isRecording && (
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-400">REC</span>
              </div>
            )}
            <span className="text-xs text-gray-500">
              #{consultationId?.slice(-6) || "DEMO"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-w-0">
        {!showStockChart ? (
          <div className="flex-1 p-2">
            <div className="h-full grid grid-cols-2 gap-2">
                {/* 구독자 비디오 렌더링 */}
                {subscribers.length > 0 ? (
                  subscribers
                  .filter(sub => {
                    const meta = parseOvData(sub.stream.connection.data);
                    const isScreen = sub.stream.typeOfVideo === 'SCREEN' || meta?.kind === 'screen';
                    const mine = meta?.ownerId === userInfo?.userId;
                    const fromMySecondConn = myScreenConnectionIdRef.current === sub.stream.connection.connectionId;
                    return !(isScreen && (mine || fromMySecondConn));
                  })
                  .map((subscriber, index) => {
                    const name = getParticipantName(subscriber);
                    const role = getParticipantRole(subscriber);
                    const roleName = getRoleDisplayName(role);

                    const connectionId = subscriber.stream.connection.connectionId;
                    const mediaStatus = subscriberStatusMap[connectionId] || { audio: false, video: true };

                    return (
                    <div key={index} className="bg-gray-800 rounded-lg overflow-hidden relative group">
                      <div className="w-full h-full flex items-center justify-center">
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
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                        <span className="text-xs font-medium">
                          {name} ({roleName})
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3 flex space-x-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${mediaStatus.audio ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                          <svg
                            className="w-3 h-3"
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
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${mediaStatus.video ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                          <svg
                            className="w-3 h-3"
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
                  <div className="bg-gray-800 rounded-lg overflow-hidden relative">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-blue-600/20 border-2 border-blue-500/40 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <p className="text-lg text-gray-300">{getRoleDisplayName(userInfo?.role === 'ADVISOR' ? 'USER' : 'ADVISOR')} 대기 중</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Local video */}
                <div className="bg-gray-800 rounded-lg overflow-hidden relative">
                  <div className="w-full h-full">
                    {(publisher || localStream) &&
                    (isVideoEnabled || isAudioEnabled) ? (
                      <div
                        id="local-video"
                        className="w-full h-full bg-gray-700 overflow-hidden flex items-center justify-center"
                      >
                        <video
                          id="local-video-element"
                          autoPlay
                          muted
                          playsInline
                          className={`w-full h-full object-contain mirror-video ${
                            !isVideoEnabled ? "hidden" : ""
                          }`}
                          style={{ transform: "scaleX(-1)" }}
                        />
                        {!isVideoEnabled && (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-xl font-bold">
                              {getCurrentUserDisplayName()[0] || '나'}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-xl font-bold mb-3">
                          {getCurrentUserDisplayName()[0] || '나'}
                        </div>
                        <button
                          onClick={startMedia}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          카메라/마이크 시작
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-medium">{getCurrentUserDisplayName()} ({getRoleDisplayName((userInfo?.role || 'USER') as 'ADVISOR' || 'USER')})</span>
                  </div>
                  <div className="absolute bottom-3 right-3 flex space-x-1.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isAudioEnabled ? "bg-green-500/80" : "bg-red-500/80"
                      }`}
                    >
                      <svg
                        className="w-3 h-3"
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
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isVideoEnabled ? "bg-green-500/80" : "bg-red-500/80"
                      }`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {isScreenSharing && (
                  <div className="bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-20 h-20 mx-auto mb-4 text-gray-400"
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
                      <p className="text-lg text-gray-300">화면 공유 중</p>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs">
                      화면 공유
                    </div>
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex min-w-0">
            {/* Main Chart Area - Takes most of the space */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 p-4 min-w-0 overflow-hidden">
                <div className="h-full bg-gray-800 rounded-2xl p-6 flex flex-col overflow-hidden">
                  <div className="flex-1 relative overflow-y-auto chart-scrollbar">
                    {selectedStock || currentChart ? (
                      <div
                        style={{
                          position: 'relative',
                          minHeight: '600px',
                          width: '100%',
                          maxWidth: '100%'
                        }}
                      >
                        <ChartErrorBoundary>
                          <div style={{ width: '100%', minHeight: '600px', minWidth: 0 }}>
                            <StockChart
                              selectedStock={selectedStock ?? (currentChart ? { ticker: currentChart.ticker, name: currentChart.name ?? '' } : null)}
                              darkMode={true}
                              session={session}
                              chartInfo={currentChart ?? undefined}
                              onChartChange={handleChartChange}
                              isConsultationMode={true}
                              onPeriodChange={handlePeriodChange}
                              onIndicatorChange={handleIndicatorChange}
                              drawingMode={isDrawingMode}
                              period={chartPeriod}
                              activeIndicator={activeIndicator as 'volume' | 'rsi' | 'macd' | 'stochastic' | null}
                              onDataPointsUpdate={setDataPointCount}
                              key={(selectedStock?.ticker ?? currentChart?.ticker) || 'chart'}
                              />
                          </div>
                        </ChartErrorBoundary>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">주식을 선택하거나, 상대방의 공유 차트를 선택해주세요</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel for Videos - Shows when participants are enabled and chart is active */}
            {showParticipants && showStockChart && (
              <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">참가자</h3>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {/* Subscriber videos */}
                  {subscribers.map((subscriber) => {
                    const name = getParticipantName(subscriber);
                    const role = getParticipantRole(subscriber);
                    const roleName = getRoleDisplayName(role);
                    const connectionId = subscriber.stream.connection.connectionId;
                    const mediaStatus = subscriberStatusMap[connectionId] || { audio: false, video: true };

                    return (
                      <div key={subscriber.stream.streamId} className="w-full aspect-video bg-gray-700 rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow duration-200">
                          <video
                            ref={(videoElement) => {
                              if (videoElement && subscriber.stream) {
                                const stream = subscriber.stream.getMediaStream();
                                if (videoElement.srcObject !== stream) {
                                  videoElement.srcObject = stream;
                                  videoElement.play().catch(console.error);
                                  console.log(`▶️ 구독자 비디오 최초 연결`);
                                }
                              }
                            }}
                            id={`subscriber-mini-video-${subscriber.stream.streamId}`}
                            autoPlay
                            playsInline
                            muted={false}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium">
                            {name} ({roleName})
                          </div>
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <div className={`w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ${mediaStatus.audio ? 'bg-green-500' : 'bg-red-500'}`}>
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
                            <div className={`w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ${mediaStatus.audio ? 'bg-green-500' : 'bg-red-500'}`}>
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
                    )})}

                  {/* Local video */}
                  <div className="w-full aspect-video bg-gray-700 rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow duration-200">
                        {(publisher || localStream) &&
                        (isVideoEnabled || isAudioEnabled) ? (
                          <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden">
                            <video
                              id="local-video-element"
                              autoPlay
                              muted
                              playsInline
                              className={`w-full h-full object-cover rounded-lg mirror-video ${
                                !isVideoEnabled ? "hidden" : ""
                              }`}
                              style={{ transform: "scaleX(-1)" }}
                            />
                            {!isVideoEnabled && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-lg font-bold">
                                  김
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-lg font-bold">
                              김
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium">
                          {getCurrentUserDisplayName()} ({getRoleDisplayName( (userInfo?.role  || 'USER') as 'ADVISOR' | 'USER')})
                        </div>
                        <div className="absolute top-2 right-2 flex space-x-1">
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
                </div>
              </div>
            )}
          </div>
        )}

        {((showParticipants && !showStockChart) || showChat) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            {showParticipants && !showStockChart && (
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
                currentUsername={getCurrentUserDisplayName()}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3 relative z-50 flex-shrink-0">
        <div className="flex items-center justify-between min-h-[60px] w-full max-w-full overflow-hidden">
          {/* Left side - Recording button */}
          <div className="flex-shrink-0 w-32">
            <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
          >
              {isRecording && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
              <span>{isRecording ? "녹화 중지" : "녹화 시작"}</span>
            </button>
          </div>

          {/* Center - Media Controls */}
          <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden">
            <div className="flex items-center space-x-2 relative z-10 flex-shrink-0">
            <button
              onClick={toggleAudio}
              onMouseEnter={() => setHoveredButton("audio")}
              onMouseLeave={() => setHoveredButton(null)}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto ${
                isAudioEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <img
                src={isAudioEnabled ? micOnIcon : micOffIcon}
                alt={isAudioEnabled ? "마이크 켜짐" : "마이크 꺼짐"}
                className="w-6 h-6"
              />
              {hoveredButton === "audio" && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                  {isAudioEnabled ? "마이크 끄기" : "마이크 켜기"}
                </div>
              )}
            </button>

            <button
              onClick={toggleVideo}
              onMouseEnter={() => setHoveredButton("video")}
              onMouseLeave={() => setHoveredButton(null)}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                isVideoEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <img
                src={isVideoEnabled ? cameraOnIcon : cameraOffIcon}
                alt={isVideoEnabled ? "카메라 켜짐" : "카메라 꺼짐"}
                className="w-6 h-6"
              />
              {hoveredButton === "video" && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                  {isVideoEnabled ? "카메라 끄기" : "카메라 켜기"}
                </div>
              )}
            </button>

            <button
              onClick={toggleScreenShare}
              onMouseEnter={() => setHoveredButton("screen")}
              onMouseLeave={() => setHoveredButton(null)}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                isScreenSharing
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <img src={screenShareIcon} alt="화면 공유" className="w-6 h-6" />
              {hoveredButton === "screen" && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                  {isScreenSharing ? "화면 공유 중지" : "화면 공유"}
                </div>
              )}
            </button>

            <button
              onClick={(e) => {
                console.log("🔥 Chat button CLICKED!", { showStockChart, showChat, event: e });
                e.stopPropagation();
                if (showChat) {
                  setShowChat(false);
                  setHasUnreadMessages(false);
                } else {
                  setShowChat(true);
                  setShowParticipants(false); // Close participants when opening chat
                }
              }}
              onMouseEnter={() => setHoveredButton("chat")}
              onMouseLeave={() => setHoveredButton(null)}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto ${
                showChat
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <img src={chatIcon} alt="채팅" className="w-6 h-6" />
              {hasUnreadMessages && !showChat && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800" />
              )}
              {hoveredButton === "chat" && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                  {showChat ? "채팅 닫기" : "채팅 열기"}
                </div>
              )}
            </button>

            <button
              onClick={(e) => {
                console.log("🔥 Participants button CLICKED!", { showStockChart, showParticipants, event: e });
                e.stopPropagation();
                if (showParticipants) {
                  setShowParticipants(false);
                } else {
                  setShowParticipants(true);
                  setShowChat(false); // Close chat when opening participants
                }
              }}
              onMouseEnter={() => setHoveredButton("participants")}
              onMouseLeave={() => setHoveredButton(null)}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto ${
                showParticipants
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <img src={participantsIcon} alt="참가자" className="w-6 h-6" />
              {hoveredButton === "participants" && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                  {showParticipants ? "참가자 숨기기" : "참가자 보기"}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setShowStockChart(!showStockChart);
              }}
              onMouseEnter={() => setHoveredButton("stock")}
              onMouseLeave={() => setHoveredButton(null)}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                showStockChart
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {showStockChart ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              )}
              {hoveredButton === "stock" && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                  {showStockChart ? "차트 닫기" : "차트 보기"}
                </div>
              )}
            </button>

            </div>
          </div>

          {/* Right side - End Call button */}
          <div className="flex-shrink-0 w-32 flex justify-end min-w-0 overflow-hidden">
            <button
              onClick={leaveSession}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              상담 종료
            </button>
          </div>
        </div>
      </div>

      {/* Indicator Tooltips */}
      {hoveredIndicator && createPortal(
        <div
          className="fixed p-4 rounded-xl shadow-2xl text-xs w-80 z-[2147483647] bg-gray-800/95 backdrop-blur-sm border border-gray-600/50"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            pointerEvents: 'none'
          }}
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-sm mb-1 text-blue-400">
                {indicatorExplanations[hoveredIndicator as keyof typeof indicatorExplanations]?.title}
              </h4>
              <p className="text-gray-300 leading-relaxed whitespace-normal">
                {indicatorExplanations[hoveredIndicator as keyof typeof indicatorExplanations]?.description}
              </p>
            </div>
            
            <div>
              <span className="text-green-400 font-semibold">사용법</span>
              <p className="text-gray-300 mt-1 leading-relaxed whitespace-normal">
                {indicatorExplanations[hoveredIndicator as keyof typeof indicatorExplanations]?.usage}
              </p>
            </div>
            
            {indicatorExplanations[hoveredIndicator as keyof typeof indicatorExplanations]?.params && (
              <div>
                <span className="text-yellow-400 font-semibold">설정</span>
                <p className="text-gray-300 mt-1 leading-relaxed whitespace-normal">
                  {indicatorExplanations[hoveredIndicator as keyof typeof indicatorExplanations]?.params}
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VideoConsultationPage;
