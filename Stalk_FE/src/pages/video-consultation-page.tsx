import {
  OpenVidu,
  Publisher,
  Session,
  StreamManager,
} from "openvidu-browser";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthService from "@/services/authService";
import axios from "axios";

import cameraOffIcon from "@/assets/images/icons/consultation/camera-off.svg";
import cameraOnIcon from "@/assets/images/icons/consultation/camera-on.svg";
import chatIcon from "@/assets/images/icons/consultation/chat.svg";
import micOffIcon from "@/assets/images/icons/consultation/mic-off.svg";
import micOnIcon from "@/assets/images/icons/consultation/mic-on.svg";
import participantsIcon from "@/assets/images/icons/consultation/participants.svg";
import screenShareIcon from "@/assets/images/icons/consultation/screen-share.svg";
import settingsIcon from "@/assets/images/icons/consultation/settings.svg";
import stalkLogoWhite from "@/assets/Stalk_logo_white.svg";
import StockChart from "@/components/chart/stock-chart";
import StockSearch from "@/components/chart/stock-search";

interface LocationState {
  connectionUrl: string;    // wss://… 전체 URL
  consultationId: string;
  sessionId: string;        // OpenVidu 세션 ID
}

interface Participant {
  id: string;
  name: string;
  role: "expert" | "client";
  videoEnabled: boolean;
  audioEnabled: boolean;
  streamManager?: StreamManager;
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
  insertMode: "APPEND" as const,
  mirror: true,
};

const TIMER_INTERVAL_MS = 1000;

const VideoConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { connectionUrl: ovToken, consultationId, sessionId : ovSessionId } = (state as LocationState) || {};

  const [session, setSession] = useState<Session | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  // 구독자 관련 상태 제거
  const [ov, setOv] = useState<OpenVidu | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

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
  const [showParticipantFaces, setShowParticipantFaces] =
    useState<boolean>(true);

  const [participants] = useState<Participant[]>([
    {
      id: "1",
      name: "박주현",
      role: "expert",
      videoEnabled: true,
      audioEnabled: true,
    },
    {
      id: "2",
      name: "김철수",
      role: "client",
      videoEnabled: false,
      audioEnabled: false,
    },
  ]);

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

  const initializeOpenVidu = async () => {
    try {
      const openVidu = new OpenVidu()
      setOv(openVidu);
      
      // If we have session ID and token, connect to the session
      if (ovToken) {
        const session = openVidu.initSession();

        // Connect to the session
        await session.connect(ovToken);
        setSession(session);
        
        // 구독자 관련 로직 제거
        
        // Start publishing after connecting
        if (openVidu) {
          const publisher = await openVidu.initPublisherAsync(undefined, {
            audioSource: undefined,
            videoSource: undefined,
            publishAudio: true,
            publishVideo: true,
            ...DEFAULT_VIDEO_CONFIG,
          });
          
          await session.publish(publisher);
          setPublisher(publisher);
          setIsVideoEnabled(true);
          setIsAudioEnabled(true);
        }
      }
    } catch (error) {
      console.error("Error initializing OpenVidu:", error);
      alert("OpenVidu 연결에 실패했습니다. 토큰을 확인해주세요.");
    }
  };

  const startMedia = async () => {
    if (!ov) return;
    
    // If already connected to session with publisher, don't reinitialize
    if (session && publisher) {
      return;
    }

    try {
      if (publisher) {
        const stream = publisher.stream?.getMediaStream();
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }

      const newPublisher = await ov.initPublisherAsync(undefined, {
        videoSource: undefined,
        audioSource: undefined,
        publishAudio: true,
        publishVideo: true,
        ...DEFAULT_VIDEO_CONFIG,
      });

      setPublisher(newPublisher);
      
      // If we have a session, publish to it
      if (session) {
        await session.publish(newPublisher);
      }

      const mediaStream = newPublisher.stream.getMediaStream();
      setLocalStream(mediaStream);

      setTimeout(() => {
        const videoElement = document.getElementById(
          "local-video-element"
        ) as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = mediaStream;
        }
      }, 100);

      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
    } catch (error) {
      console.error("Error starting media:", error);
      alert(
        "카메라 또는 마이크에 접근할 수 없습니다. 브라우저 권한을 확인해주세요."
      );
    }
  };

  const leaveSession = async () => {
  try {
    // JWT 토큰 가져오기
    const token = AuthService.getAccessToken();
    
    // 1. 백엔드에 상담 종료 알림 (JWT 토큰 포함)
    await axios.post(`/api/consultations/${consultationId}/close`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // 2. 세션 연결 해제
    if (session) session.disconnect();

    // 3. 로컬 스트림 종료
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (publisher) {
      const pubStream = publisher.stream?.getMediaStream();
      if (pubStream) {
        pubStream.getTracks().forEach((track) => track.stop());
      }
    }

    // 4. 상태 초기화
    setSession(null);
    setPublisher(null);
    // setSubscribers([]); // 구독자 관련 상태 제거
    setOv(null);
    navigate("/");
  } catch (error) {
    console.error("상담 종료 실패:", error);
  }
};

  const toggleVideo = async () => {
    if (!ov) return;

    const newVideoState = !isVideoEnabled;

    try {
      if (!newVideoState) {
        if (publisher) {
          publisher.publishVideo(false);

          const stream = publisher.stream?.getMediaStream();
          if (stream) {
            stream.getVideoTracks().forEach((track) => {
              track.stop();
              stream.removeTrack(track);
            });
          }
        }
      } else {
        if (publisher) {
          const currentStream = publisher.stream?.getMediaStream();
          if (currentStream) {
            currentStream.getTracks().forEach((track) => track.stop());
          }
        }

        const newPublisher = await ov.initPublisherAsync(undefined, {
          videoSource: undefined,
          audioSource: isAudioEnabled ? undefined : false,
          publishAudio: isAudioEnabled,
          publishVideo: true,
          ...DEFAULT_VIDEO_CONFIG,
        });

        setPublisher(newPublisher);
        const mediaStream = newPublisher.stream.getMediaStream();
        setLocalStream(mediaStream);

        setTimeout(() => {
          const videoElement = document.getElementById(
            "local-video-element"
          ) as HTMLVideoElement;
          if (videoElement) {
            videoElement.srcObject = mediaStream;
          }
        }, 100);
      }

      setIsVideoEnabled(newVideoState);
    } catch (error) {
      console.error("Error toggling video:", error);
      alert(
        newVideoState
          ? "카메라를 시작할 수 없습니다."
          : "카메라를 중지할 수 없습니다."
      );
    }
  };

  const toggleAudio = async () => {
    if (!ov) return;

    const newAudioState = !isAudioEnabled;

    try {
      if (!newAudioState) {
        if (publisher) {
          publisher.publishAudio(false);

          const stream = publisher.stream?.getMediaStream();
          if (stream) {
            stream.getAudioTracks().forEach((track) => {
              track.stop();
              stream.removeTrack(track);
            });
          }
        }
      } else {
        if (publisher) {
          const currentStream = publisher.stream?.getMediaStream();
          if (currentStream) {
            currentStream.getTracks().forEach((track) => track.stop());
          }
        }

        const newPublisher = await ov.initPublisherAsync(undefined, {
          videoSource: isVideoEnabled ? undefined : false,
          audioSource: undefined,
          publishAudio: true,
          publishVideo: isVideoEnabled,
          ...DEFAULT_VIDEO_CONFIG,
        });

        setPublisher(newPublisher);
        const mediaStream = newPublisher.stream.getMediaStream();
        setLocalStream(mediaStream);

        setTimeout(() => {
          const videoElement = document.getElementById(
            "local-video-element"
          ) as HTMLVideoElement;
          if (videoElement) {
            videoElement.srcObject = mediaStream;
          }
        }, 100);
      }

      setIsAudioEnabled(newAudioState);
    } catch (error) {
      console.error("Error toggling audio:", error);
      alert(
        newAudioState
          ? "마이크를 시작할 수 없습니다."
          : "마이크를 중지할 수 없습니다."
      );
    }
  };

  useEffect(() => {
    initializeOpenVidu();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (publisher) {
        const pubStream = publisher.stream?.getMediaStream();
        if (pubStream) {
          pubStream.getTracks().forEach((track) => track.stop());
        }
      }
    };
  }, []);

  useEffect(() => {
    if (publisher) {
      const videoElement = document.getElementById("local-video-element") as HTMLVideoElement;
      if (videoElement) {
        const mediaStream = publisher.stream.getMediaStream();
        (videoElement as HTMLVideoElement).srcObject = mediaStream;
      }
    }
  }, [publisher]);

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
        sender: "김철수",
        message: newMessage.trim(),
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, message]);
      setNewMessage("");
    }
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
        {!showStockChart ? (
          <div className="flex-1 p-4">
            <div className="h-full grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-2xl overflow-hidden relative group">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
                    박
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-medium">박주현 (전문가)</span>
                </div>
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
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
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
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
                  <span className="text-sm font-medium">김철수 (나)</span>
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
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 min-h-0">
              <div className="h-full bg-gray-800 rounded-2xl p-6 flex flex-col">
                <div className="mb-4">
                  <StockSearch
                    onStockSelect={setSelectedStock}
                    darkMode={true}
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <StockChart selectedStock={selectedStock} darkMode={true} />
                </div>
              </div>
            </div>

            <div
              className={`bg-gradient-to-b from-gray-900 to-gray-950 border-t-2 border-gray-700 transition-all duration-300 ease-in-out shadow-inner ${
                showParticipantFaces ? "h-44" : "h-8"
              }`}
            >
              <div className="relative h-full">
                {/* Discord-style toggle button */}
                <button
                  onClick={() => setShowParticipantFaces(!showParticipantFaces)}
                  className="absolute left-1/2 transform -translate-x-1/2 -top-4 z-20 bg-gray-800 hover:bg-gray-700 rounded-full p-1.5 border-2 border-gray-600 hover:border-gray-500 transition-all duration-200 group shadow-lg"
                  title={showParticipantFaces ? "참가자 숨기기" : "참가자 보기"}
                >
                  <svg
                    className={`w-5 h-5 text-gray-300 group-hover:text-white transition-all duration-200 ${
                      showParticipantFaces ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>

                {showParticipantFaces && (
                  <div className="flex items-center justify-between p-4 h-full">
                    <div className="flex items-center space-x-4 overflow-x-auto flex-1">
                      <div className="flex-shrink-0 w-40 h-28 bg-gray-800 rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow duration-200">
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                            박
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium">
                          박주현 (전문가)
                        </div>
                        <div className="absolute top-2 right-2 flex space-x-1">
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

                      <div className="flex-shrink-0 w-40 h-28 bg-gray-800 rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow duration-200">
                        {(publisher || localStream) &&
                        (isVideoEnabled || isAudioEnabled) ? (
                          <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden">
                            <video
                              autoPlay
                              muted
                              playsInline
                              className={`w-full h-full object-cover rounded-lg mirror-video ${
                                !isVideoEnabled ? "hidden" : ""
                              }`}
                              style={{ transform: "scaleX(-1)" }}
                              // srcObject는 직접 할당하므로 prop에서 제거
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
                          김철수 (나)
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
            </div>
          </div>
        )}

        {!showStockChart && (showParticipants || showChat) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            {showParticipants && (
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold mb-4">
                  참가자 ({participants.length})
                </h3>
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {participant.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {participant.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {participant.role === "expert" ? "전문가" : "의뢰인"}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            participant.audioEnabled
                              ? "bg-green-500"
                              : "bg-red-500"
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
                            participant.videoEnabled
                              ? "bg-green-500"
                              : "bg-red-500"
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
                  ))}
                </div>
              </div>
            )}

            {showChat && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold">채팅</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">
                            {msg.sender}
                          </span>
                          <span className="text-xs text-gray-400">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-200">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendChatMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      전송
                    </button>
                  </div>
                </div>
              </div>
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

            <div className="relative">
              <button
                onClick={() => !showStockChart && setShowChat(!showChat)}
                onMouseEnter={() => setHoveredButton("chat")}
                onMouseLeave={() => setHoveredButton(null)}
                disabled={showStockChart}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-lg ${
                  showStockChart
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
                  {showStockChart
                    ? "차트 모드에서 사용 불가"
                    : showChat
                    ? "채팅 닫기"
                    : "채팅 열기"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>

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

            <div className="relative">
              <button
                onClick={() => {
                  const newShowStockChart = !showStockChart;
                  setShowStockChart(newShowStockChart);
                  if (newShowStockChart) {
                    setShowChat(false);
                    setShowParticipants(false);
                  }
                }}
                onMouseEnter={() => setHoveredButton("stock")}
                onMouseLeave={() => setHoveredButton(null)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-lg ${
                  showStockChart
                    ? "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20 hover:shadow-blue-500/40"
                    : "bg-gray-600 hover:bg-gray-500 text-white hover:shadow-gray-500/20"
                }`}
              >
                {showStockChart ? (
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
                  {showStockChart ? "비디오 뷰로 전환" : "차트 보기"}
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
    </div>
  );
};

export default VideoConsultationPage;
