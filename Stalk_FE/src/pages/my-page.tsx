import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// import certificationExample from "@/assets/images/dummy/certification_example.svg";
import ConsultationService from "@/services/consultationService";
import MyInfo from "@/components/mypage/my_info/my_info";
import AuthService from "@/services/authService";
import AdvisorService from "@/services/advisorService";
import ReservationService from "@/services/reservationService";
import { CancelReservationModal } from "@/components/modals";
import UserService from "@/services/userService";
import AdvisorTimeTable from "@/components/AdvisorTimeTable";
import MyConsultationList from "@/components/mypage/my_consultation/my_consultation_list";
import FavoriteService, {
  FavoriteAdvisorResponseDto,
} from "@/services/favoriteService";
import {
  ApprovalHistoryResponse,
  CertificateApprovalRequest,
  ConsultationDiaryResponse,
  VideoRecording,
} from "@/types";

interface ConsultationItem {
  id: string;
  date: string;
  time: string;
  content: string;
  expert: string;
  videoConsultation: string;
  action: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
}

// 영상 분석 결과 타입 정의
interface VideoAnalysisResult {
  analysisId: number;
  fileName: string;
  summary: string;
  processedAt: string;
}

// 백엔드 API 응답 타입 정의
interface UserProfileResponse {
  userId: string;
  name: string;
  nickname: string;  // 닉네임 필드 추가
  contact: string;
  email: string;
  profileImage: string;
  role: "USER" | "ADVISOR" | "ADMIN";
}

const MyPage = () => {
  const [searchParams] = useSearchParams();
  const { userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState("내 정보");
  const [consultationTab, setConsultationTab] = useState("상담 전");
  const navigate = useNavigate();

  // URL 파라미터에서 탭 설정
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "내 정보",
        "내 상담 내역",
        "찜한 전문가",
        "전문가 페이지 수정",
        "상담 영업 스케줄 관리",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // API 관련 상태
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null
  );

  // 찜한 전문가 관련 상태
  const [favoriteAdvisors, setFavoriteAdvisors] = useState<
    FavoriteAdvisorResponseDto[]
  >([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  // 영상 분석 결과 상태
  const [videoAnalysisResult, setVideoAnalysisResult] =
    useState<VideoAnalysisResult | null>(null);

  // 예약 취소 모달 상태
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReservationId, setCancelReservationId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<
    'PERSONAL_REASON' | 'SCHEDULE_CHANGE' | 'HEALTH_ISSUE' | 'NO_LONGER_NEEDED' | 'OTHER'
  >('PERSONAL_REASON');
  const [cancelMemo, setCancelMemo] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // 프로필 수정 상태
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(null);

  // 찜한 전문가 목록 로드
  useEffect(() => {
    const isExpertUser = userProfile?.role === "ADVISOR";
    if (activeTab === "찜한 전문가" && !isExpertUser && userProfile) {
      loadFavoriteAdvisors();
    }
  }, [activeTab, userProfile]);

  // 영상 분석 처리 함수
  const handleVideoAnalysis = async (videoUrl: string) => {
    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다. 다시 로그인해주세요.");
        return;
      }

      console.log("분석할 비디오 URL:", videoUrl);

      const analysisResponse = await fetch("/api/ai/analyze-video", {
        method: "POST",
        headers: {
          // JWT 토큰 헤더 추가
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoUrl: videoUrl }),
      });

      if (analysisResponse.ok) {
        const result = await analysisResponse.json();
        alert("영상 분석이 완료되었습니다!");
        console.log("분석 결과:", result);
        setVideoAnalysisResult(result);
      } else {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.message || "분석 실패");
      }
    } catch (error) {
      console.error("영상 분석 중 오류:", error);
      alert("영상 분석 중 오류가 발생했습니다.");
    }
  };

  // 상담 취소 모달 열기
  const handleCancelConsultation = (item: ConsultationItem) => {
    const idNum = Number(item.id);
    if (!Number.isFinite(idNum)) {
      alert("유효하지 않은 예약 ID 입니다.");
      return;
    }
    setCancelReservationId(idNum);
    setCancelReason('PERSONAL_REASON');
    setCancelMemo("");
    setCancelError(null);
    setShowCancelModal(true);
  };

  // 상담 취소 확정
  const confirmCancelConsultation = async () => {
    if (!cancelReservationId) return;
    try {
      setIsCancelling(true);
      setCancelError(null);
      await ReservationService.cancelReservation(cancelReservationId, {
        cancelReason,
        cancelMemo: cancelMemo.trim() || undefined,
      });
      setShowCancelModal(false);
      await loadConsultationHistory();
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : "취소 중 오류가 발생했습니다.");
    } finally {
      setIsCancelling(false);
    }
  };

  // 찜한 전문가 목록 로드 함수
  const loadFavoriteAdvisors = async () => {
    try {
      setFavoriteLoading(true);
      setFavoriteError(null);

      const response = await FavoriteService.getFavoriteAdvisors();

      // 백엔드 응답 구조에 맞게 수정
      const result = response.result;

      setFavoriteAdvisors(result?.content || []);
    } catch (error) {
      setFavoriteError(
        error instanceof Error
          ? error.message
          : "찜한 전문가 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleRemoveFavorite = async (advisorId: number) => {
    try {
      await FavoriteService.removeFavoriteAdvisor(advisorId);
      // 찜해제 후 목록 다시 로드
      await loadFavoriteAdvisors();
    } catch (error) {
      alert(error instanceof Error ? error.message : "찜해제에 실패했습니다.");
    }
  };

  // 백엔드 기준 preferredTradeStyle enum 값을 한글로 변환하는 함수
  const getTradeStyleDisplayName = (tradeStyle: string): string => {
    switch (tradeStyle) {
      case "SHORT":
        return "단기";
      case "MID_SHORT":
        return "중단기";
      case "MID":
        return "중기";
      case "MID_LONG":
        return "중장기";
      case "LONG":
        return "장기";
      default:
        return tradeStyle;
    }
  };

  // 투자 스타일별 색상 클래스 매핑 (home-page.tsx와 동일)
  const getStyleClasses = (style: string) => {
    switch (style) {
      case "SHORT":
        return {
          headerBg: "bg-green-100",
          headerText: "text-green-600",
          accentText: "text-green-600",
          buttonSelected: "bg-green-500 text-white hover:bg-green-600",
        };
      case "MID_SHORT":
        return {
          headerBg: "bg-blue-100",
          headerText: "text-blue-600",
          accentText: "text-blue-600",
          buttonSelected: "bg-blue-500 text-white hover:bg-blue-600",
        };
      case "MID":
        return {
          headerBg: "bg-orange-100",
          headerText: "text-orange-600",
          accentText: "text-orange-600",
          buttonSelected: "bg-orange-500 text-white hover:bg-orange-600",
        };
      case "MID_LONG":
        return {
          headerBg: "bg-purple-100",
          headerText: "text-purple-600",
          accentText: "text-purple-600",
          buttonSelected: "bg-purple-500 text-white hover:bg-purple-600",
        };
      case "LONG":
        return {
          headerBg: "bg-red-100",
          headerText: "text-red-600",
          accentText: "text-red-600",
          buttonSelected: "bg-red-500 text-white hover:bg-red-600",
        };
      default:
        return {
          border: "border-gray-200",
          headerBg: "bg-gray-100",
          headerText: "text-gray-700",
          accentText: "text-gray-700",
          buttonSelected: "bg-gray-600 text-white hover:bg-gray-700",
        };
    }
  };

  // 사용자 정보 로드 함수
  const loadUserInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 로그인 상태가 아니면 로드하지 않음
      if (!AuthService.isLoggedIn()) {
        setError("로그인이 필요합니다.");
        return;
      }

      const userProfileData = await AuthService.getUserProfile();

      if (!userProfileData) {
        throw new Error("사용자 정보를 불러올 수 없습니다.");
      }

      // 백엔드 응답 구조에 맞게 데이터 설정
      const profileData: UserProfileResponse = {
        userId: userProfileData.userId || "",
        name: userProfileData.name || "",
        nickname: userProfileData.nickname || "",  // 닉네임 사용
        contact: userProfileData.contact || "",
        email: userProfileData.email || "",
        profileImage: userProfileData.profileImage || "default",
        role: userProfileData.role || "USER",
      };

      setUserProfile(profileData);

      // 폼 데이터 업데이트
      setEditInfoForm({
        name: profileData.name,
        contact: profileData.contact,
        email: profileData.email,
      });

      // 프로필 폼 업데이트 (닉네임은 nickname 사용)
      setProfileForm((prev) => ({
        ...prev,
        nickname: profileData.nickname,
        selectedAvatar: profileData.profileImage ? "default" : "fox",
      }));
    } catch (err) {
      console.error("사용자 정보 로드 실패:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "사용자 정보를 불러올 수 없습니다.";
      setError(errorMessage);

      // 네트워크 에러인 경우에만 기본값 설정
      if (err instanceof Error && err.message.includes("network")) {
        setEditInfoForm({
          name: userInfo?.userName || "",
          contact: "",
          email: "",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 정보 로드 (의존성 경고 억제: loadUserInfo는 stable / 외부 영향 없음)
  useEffect(() => {
    loadUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);

  // 스케줄 관리 상태들 (AdvisorTimeTable 사용으로 로컬 상태 불필요하여 제거)

  // 상담일지 관련 상태
  const [selectedConsultation, setSelectedConsultation] =
    useState<ConsultationItem | null>(null);
  const [consultationDiary, setConsultationDiary] =
    useState<ConsultationDiaryResponse | null>(null);
  const [isLoadingDiary, setIsLoadingDiary] = useState(false);
  const [diaryError, setDiaryError] = useState<string | null>(null);

  // 사용자 역할에 따른 전문가 여부 확인 (백엔드 데이터 사용)
  const isExpert = userProfile?.role === "ADVISOR";

  // 전문가 페이지 수정 탭 선택 시 라우팅 (렌더 중 navigate 방지)
  useEffect(() => {
    const routeToUpdate = async () => {
      if (activeTab !== "전문가 페이지 수정" || !isExpert) return;
      try {
        // 내 advisorId 조회
        const status = await AdvisorService.getProfileStatus();
        if (status?.advisorId) {
          navigate(`/advisors-introduction-update/${status.advisorId}`);
        }
      } catch {
        // 무시: 상태 조회 실패 시 이동하지 않음
      }
    };
    routeToUpdate();
  }, [activeTab, isExpert, navigate]);

  // (삭제) 로컬 스케줄 상태 로드: AdvisorTimeTable가 자체 로직으로 처리

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [editInfoForm, setEditInfoForm] = useState({
    name: "",
    contact: "",
    email: "",
  });

  const [profileForm, setProfileForm] = useState({
    nickname: userInfo?.userName || "",
    selectedAvatar: userProfile?.profileImage ? "default" : "fox",
  });

  const [imageUploadForm, setImageUploadForm] = useState<{
    fileName: string;
    selectedFile: File | null;
  }>({
    fileName: "",
    selectedFile: null,
  });

  const generalTabs = [
    { id: "내 정보", label: "내 정보" },
    { id: "내 상담 내역", label: "내 상담 내역" },
    { id: "찜한 전문가", label: "찜한 전문가" },
  ];

  const expertTabs = [
    { id: "내 정보", label: "내 정보" },
    { id: "내 상담 내역", label: "내 상담 내역" },
    { id: "전문가 페이지 수정", label: "전문가 페이지 수정" },
    { id: "상담 영업 스케줄 관리", label: "상담 영업 스케줄 관리" },
  ];

  const tabs = isExpert ? expertTabs : generalTabs;

  const consultationData = {
    "상담 전": [
      {
        id: "1",
        date: "2025. 07. 18.",
        time: "17:00",
        content: "입문 투자 상담",
        expert: "김범주",
        videoConsultation: "상담 입장",
        action: "취소 요청",
      },

      {
        id: "2",
        date: "2025. 08. 04.",
        time: "17:00",
        content: "AMD 30만원 가자",
        expert: "김태윤",
        videoConsultation: "상담 입장",
        action: "취소 요청",
      },
    ],
    "상담 완료": [
      {
        id: "1",
        date: "2025. 07. 19.",
        time: "20:00",
        content: "입문 투자 상담",
        expert: "김범주",
        videoConsultation: "상담 완료",
        action: "상세보기",
      },
    ],
  };

  // 실제 상담 내역을 위한 상태 추가
  const [realConsultationData, setRealConsultationData] = useState<{
    "상담 전": ConsultationItem[];
    "상담 완료": ConsultationItem[];
  }>({
    "상담 전": [],
    "상담 완료": [],
  });
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
  const [consultationError, setConsultationError] = useState<string | null>(
    null
  );

  // 실제 상담 내역 불러오기
  const loadConsultationHistory = async () => {
    if (activeTab !== "내 상담 내역") return;

    try {
      setIsLoadingConsultations(true);
      setConsultationError(null);

      // 로그인 상태 확인
      if (!AuthService.isLoggedIn()) {
        setConsultationError("로그인이 필요합니다.");
        return;
      }

      // 예약 내역 조회 API 호출
      const response = await fetch("/api/reservations?pageNo=1&pageSize=50", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("상담 내역을 불러올 수 없습니다.");
      }

      const data = await response.json();
      console.log("상담 내역 API 응답:", data);

      if (data.isSuccess && data.result) {
        const reservations = data.result.content || [];

        // 예약 데이터를 ConsultationItem 형태로 변환 및 정렬
        const scheduledConsultations: ConsultationItem[] = [];
        const completedConsultations: ConsultationItem[] = [];

        reservations.forEach(
          (reservation: {
            reservationId?: number;
            consultationDate?: string;
            consultationTime?: string;
            requestMessage?: string;
            status?: string;
            advisorName?: string;
            advisorUserId?: number;
            profileImageUrl?: string;
          }) => {
            const rawStatus = (reservation.status || '').toUpperCase();
            const normalizedStatus: ConsultationItem['status'] =
              ['CANCELLED', 'CANCELED', 'CANCEL', 'CANCELLED_BY_USER', 'REJECTED'].includes(rawStatus)
                ? 'cancelled'
                : ['COMPLETED', 'APPROVED', 'DONE'].includes(rawStatus)
                ? 'completed'
                : 'scheduled';

            // 상담 시작 후 30분 경과 시 자동 완료 처리
            let effectiveStatus: ConsultationItem['status'] = normalizedStatus;
            if (normalizedStatus !== 'cancelled') {
              const dateStr = (reservation.consultationDate || '').trim();
              const timeStr = (reservation.consultationTime || '').trim();
              if (dateStr && timeStr) {
                const consultationDateTime = new Date(`${dateStr} ${timeStr}`);
                const thirtyMinutesMs = 30 * 60 * 1000;
                if (!Number.isNaN(consultationDateTime.getTime())) {
                  const now = new Date();
                  if (now.getTime() > consultationDateTime.getTime() + thirtyMinutesMs) {
                    effectiveStatus = 'completed';
                  }
                }
              }
            }

            // 취소된 상담은 목록에서 제외
            if (effectiveStatus === 'cancelled') {
              return;
            }

            const consultationItem: ConsultationItem = {
              id: reservation.reservationId?.toString() || "",
              date: reservation.consultationDate || "",
              time: reservation.consultationTime || "",
              content: reservation.requestMessage || "상담 요청",
              expert:
                reservation.advisorName ||
                reservation.advisorUserId?.toString() ||
                "전문가",
              videoConsultation:
                effectiveStatus === "completed" ? "상담 완료" : "상담 입장",
              action:
                effectiveStatus === "completed" ? "상세보기" : "취소 요청",
              status: effectiveStatus,
            };

            if (effectiveStatus === "completed") {
              completedConsultations.push(consultationItem);
            } else {
              scheduledConsultations.push(consultationItem);
            }
          }
        );

        // 다가오는 일정 우선, 취소 항목은 하단 배치
        scheduledConsultations.sort((a, b) => {
          const aCancelled = a.status === 'cancelled';
          const bCancelled = b.status === 'cancelled';
          if (aCancelled !== bCancelled) return aCancelled ? 1 : -1;
          const aTime = new Date(`${a.date} ${a.time}`).getTime();
          const bTime = new Date(`${b.date} ${b.time}`).getTime();
          return aTime - bTime;
        });

        setRealConsultationData({
          "상담 전": scheduledConsultations,
          "상담 완료": completedConsultations,
        });
      } else {
        throw new Error(data.message || "상담 내역을 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("상담 내역 로드 에러:", error);
      setConsultationError(
        error instanceof Error
          ? error.message
          : "상담 내역을 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoadingConsultations(false);
    }
  };

  // 상담 내역 탭이 활성화될 때 데이터 로드 (의존성 경고 억제)
  useEffect(() => {
    if (activeTab === "내 상담 내역") {
      loadConsultationHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 업로드/상대경로/절대경로를 절대 URL로 변환
  const resolveImageUrl = (imagePath?: string | null) => {
    if (!imagePath) {
      return `${import.meta.env.VITE_API_URL}/uploads/profile_default.png`;
    }
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    if (imagePath.startsWith('/')) {
      return `${import.meta.env.VITE_API_URL}${imagePath}`;
    }
    return `${import.meta.env.VITE_API_URL}/uploads/profile_default.png`;
  };

  const defaultAvatarImage = resolveImageUrl(userProfile?.profileImage);

  // Avatar options (백엔드 uploads 경로 사용)
  const avatarOptions = [
    { id: "default", image: defaultAvatarImage },
    { id: "cat", image: `${import.meta.env.VITE_API_URL}/uploads/profile_cat.png` },
    { id: "cheek", image: `${import.meta.env.VITE_API_URL}/uploads/profile_cheek.png` },
    { id: "fox", image: `${import.meta.env.VITE_API_URL}/uploads/profile_fox.png` },
    { id: "panda", image: `${import.meta.env.VITE_API_URL}/uploads/profile_panda.png` },
    { id: "puppy", image: `${import.meta.env.VITE_API_URL}/uploads/profile_dog.png` },
    { id: "rabbit", image: `${import.meta.env.VITE_API_URL}/uploads/profile_rabbit.png` },
  ];

  // Form handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  // 비밀번호 변경 제출 핸들러 (API 연동)
  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      alert("모든 비밀번호 항목을 입력해주세요.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    const result = await UserService.changePassword(
      userProfile?.userId || "",
      passwordForm
    );
    alert(result.message);
    if (result.success) setShowPasswordModal(false);
  };

  const handleEditInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditInfoForm({ ...editInfoForm, [e.target.name]: e.target.value });
  };

  // 정보 수정 제출 핸들러
  const handleEditInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 로딩 상태 설정
      setIsLoading(true);

      // 사용자 정보 수정 API 호출
      const result = await UserService.updateUserInfo(
        userProfile?.userId || "",
        editInfoForm
      );

      if (result.success) {
        // 성공 시 사용자 정보 다시 로드
        await loadUserInfo();
        setShowEditInfoModal(false);

        // 성공 메시지 표시
        alert(result.message);
      } else {
        // 에러 메시지 표시
        alert(result.message);
      }
    } catch (error) {
      console.error("정보 수정 오류:", error);
      alert("정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setImageUploadForm({
        fileName: files[0].name,
        selectedFile: files[0],
      });
    }
  };

  const handleFileDelete = () => {
    setImageUploadForm({
      fileName: "",
      selectedFile: null,
    });
  };

  

  // 백엔드에서 받은 프로필 이미지 표시
  const getProfileImage = () => {
    // 1. 유저 프로필 정보나 이미지 경로가 없으면 기본 이미지 반환
    if (!userProfile?.profileImage) {
      return `${import.meta.env.VITE_API_URL}/uploads/profile_default.png`;
    }

    const imagePath = userProfile.profileImage; // 예: "/uploads/image.png"

    // 2. 경로가 http로 시작하는 완전한 URL이면 그대로 사용
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // 3. 경로가 '/'로 시작하는 상대 경로이면, 앞에 백엔드 서버 주소를 붙여줌
    if (imagePath.startsWith('/')) {
      console.log(`[ 절대 경로 생성 ] ${import.meta.env.VITE_API_URL}${imagePath}`);
      return `${import.meta.env.VITE_API_URL}${imagePath}`;
    }

    // 4. 그 외의 경우 (예: 레거시 아바타 ID 등) 처리
    const avatar = avatarOptions.find((avatar) => avatar.id === imagePath);
    return avatar ? avatar.image : `${import.meta.env.VITE_API_URL}/uploads/profile_default.png`;
  };


  // (삭제) formatDateKey: 로컬 스케줄 계산 제거

  // (삭제됨) getDaysInMonth, getFirstDayOfMonth, isOperatingHourSelected, isRestDay

  // (삭제됨) toggleOperatingHour: AdvisorTimeTable 사용으로 대체

  // (삭제됨) toggleRestDay: AdvisorTimeTable 사용으로 대체

  // (삭제됨) saveSchedule: AdvisorTimeTable 내부 저장 로직 사용

  // 상담일지 관련 함수들
  const handleConsultationDiaryClick = async (
    consultation: ConsultationItem
  ) => {
    setSelectedConsultation(consultation);
    setActiveTab("상담일지");
    setIsLoadingDiary(true);
    setDiaryError(null);

    try {
      const diaryData = await ConsultationService.getConsultationDiary(
        consultation.id
      );
      setConsultationDiary(diaryData);
    } catch (error) {
      console.error("상담일지 조회 실패:", error);
      setDiaryError("상담일지를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingDiary(false);
    }
  };

  const handleCloseDiary = () => {
    setSelectedConsultation(null);
    setConsultationDiary(null);
    setDiaryError(null);
    setVideoAnalysisResult(null);
    setActiveTab("내 상담 내역");
  };

  // 상담 입장 처리
  const auth = useAuth();

  const handleEnterConsultation = async (
    consultationItem: ConsultationItem
  ) => {
    try {
      const consultationId = consultationItem.id;

      // JWT 토큰 확인 로그
      console.log("🔑 상담방 입장 시도 - consultationId:", consultationId);
      const currentToken = auth.getAccessToken();
      console.log("🔑 현재 JWT 토큰 상태:", currentToken ? "있음" : "없음");
      if (currentToken) {
        console.log("🔑 JWT 토큰 길이:", currentToken.length);
        console.log("🔑 JWT 토큰 전체:", currentToken);
      } else {
        console.error("❌ JWT 토큰이 없습니다!");
      }

      const { sessionId, token } = await ConsultationService.createSessionToken(
        consultationId,
        auth
      );

      navigate(
        // parameter 여러개 넘기기
        `/video-consultation/${sessionId}`,
        {
          state: {
            sessionId: sessionId,
            connectionUrl: token,
            consultationId,
          },
        }
      );
    } catch (error) {
      console.error("Failed to start consultation:", error);
      alert("상담 입장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // (삭제됨) renderScheduleCalendar: AdvisorTimeTable 사용으로 대체

  const [certificates, setCertificates] = useState<ApprovalHistoryResponse[]>(
    []
  );
  const [certLoading, setCertLoading] = useState(true);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certForm, setCertForm] = useState<CertificateApprovalRequest>({
    certificateName: "",
    certificateFileSn: "",
    birth: "",
    certificateFileNumber: "",
  });
  const [certSubmitting, setCertSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile?.role === "ADVISOR") {
      setCertLoading(true);
      AdvisorService.getApprovalHistory()
        .then((res) => {
          setCertificates(res.content.filter((c) => c.status === "APPROVED"));
        })
        .finally(() => setCertLoading(false));
    }
  }, [userProfile]);

  // 자격증 이름을 한글로 변환하는 함수
  const getCertificateDisplayName = (certificateName: string): string => {
    const certificateMap: { [key: string]: string } = {
      financial_advisor: "금융투자상담사",
      securities_analyst: "증권분석사",
      cfa: "CFA",
      cpa: "CPA",
    };
    return certificateMap[certificateName] || certificateName;
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertSubmitting(true);

    try {
      await AdvisorService.requestCertificateApproval(certForm);
      alert("자격증 승인 요청이 접수되었습니다.");
      setShowCertModal(false);
      setCertForm({
        certificateName: "",
        certificateFileSn: "",
        birth: "",
        certificateFileNumber: "",
      });
      // 자격증 목록 새로고침
      const res = await AdvisorService.getApprovalHistory();
      setCertificates(res.content.filter((c) => c.status === "APPROVED"));
    } catch {
      alert("자격증 승인 요청에 실패했습니다.");
    } finally {
      setCertSubmitting(false);
    }
  };

  // 프로필 수정 핸들러 추가
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      setProfileUpdateError(null);

      // 프로필 이미지 파일 처리
      let profileImageFile: File | undefined;
      
      // 업로드된 파일이 있으면 사용, 없으면 기본 아바타 사용
      if (imageUploadForm.selectedFile) {
        profileImageFile = imageUploadForm.selectedFile;
      }
      
      // UserService.updateProfile 호출
      const result = await UserService.updateProfile(profileForm.nickname, profileImageFile);
      console.log("result:", result);
      if (result.success) {
        // 성공 시 모달 닫기 및 사용자 정보 새로고침
        setShowProfileEditModal(false);
        alert(result.message);
        
        // profileForm 업데이트하여 UI에 즉시 반영
        setProfileForm(prev => ({
          ...prev,
          nickname: profileForm.nickname.trim()
        }));
        
        // 사용자 정보 새로고침
        await loadUserInfo();
        
        // 이미지 업로드 폼 초기화
        setImageUploadForm({
          fileName: "",
          selectedFile: null,
        });
      } else {
        setProfileUpdateError(result.message);
      }
    } catch (error) {
      console.error('프로필 수정 오류:', error);
      setProfileUpdateError('프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 기본 제공 아바타 이미지를 클릭했을 때 해당 이미지를 파일로 업로드하여 저장
  const handleSelectPredefinedAvatar = async (avatarId: string, imageUrl: string) => {
    try {
      setIsUpdatingProfile(true);
      setProfileUpdateError(null);

      // URL에서 Blob을 가져와 File 객체로 변환
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const fallbackName = imageUrl.split('/').pop() || 'profile.png';
      const file = new File([blob], fallbackName, { type: blob.type || 'image/png' });

      const nicknameToUse = (profileForm.nickname && profileForm.nickname.trim())
        ? profileForm.nickname.trim()
        : (userProfile?.nickname || '');

      const result = await UserService.updateProfile(nicknameToUse, file);
      if (result.success) {
        // 선택 상태 업데이트 및 사용자 정보 새로고침
        setProfileForm(prev => ({ ...prev, selectedAvatar: avatarId }));
        await loadUserInfo();
      } else {
        setProfileUpdateError(result.message);
      }
    } catch (error) {
      console.error('기본 아바타 적용 오류:', error);
      setProfileUpdateError('프로필 이미지 적용 중 오류가 발생했습니다.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
    

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === "내 정보" && (
              <MyInfo
                isLoading={isLoading}
                error={error}
                userProfile={userProfile}
                userInfo={userInfo}
                editInfoForm={editInfoForm}
                setEditInfoForm={setEditInfoForm}
                setShowPasswordModal={setShowPasswordModal}
                setShowEditInfoModal={setShowEditInfoModal}
                isExpert={isExpert}
                certificates={certificates}
                certLoading={certLoading}
                getCertificateDisplayName={getCertificateDisplayName}
                setShowCertModal={setShowCertModal}
                setShowProfileEditModal={setShowProfileEditModal}
                getProfileImage={getProfileImage}
                profileForm={profileForm}
                setShowWithdrawalModal={setShowWithdrawalModal}
                showPasswordModal={showPasswordModal}
                passwordForm={passwordForm}
                onChangePasswordForm={handlePasswordChange}
                onSubmitPasswordChange={submitPasswordChange}
                onClosePasswordModal={() => setShowPasswordModal(false)}
                showEditInfoModal={showEditInfoModal}
                onChangeEditInfo={handleEditInfoChange}
                onSubmitEditInfo={handleEditInfoSubmit}
                onCloseEditInfoModal={() => setShowEditInfoModal(false)}
                // Community profile edit modal
                showProfileEditModal={showProfileEditModal}
                avatarOptions={avatarOptions}
                onSelectPredefinedAvatar={handleSelectPredefinedAvatar}
                onOpenImageUploadModal={() => setShowImageUploadModal(true)}
                showImageUploadModal={showImageUploadModal}
                onCloseImageUploadModal={() => setShowImageUploadModal(false)}
                onFileSelect={handleFileSelect}
                imageUploadForm={imageUploadForm}
                onFileDelete={handleFileDelete}
                onChangeProfileForm={handleProfileChange}
                isUpdatingProfile={isUpdatingProfile}
                profileUpdateError={profileUpdateError}
                onSubmitProfileEdit={handleProfileSubmit}
                // Account delete modal
                showWithdrawalModal={showWithdrawalModal}
                onConfirmAccountDelete={async () => {
                  const res = await UserService.deleteAccount(
                    userProfile?.userId || "",
                    ""
                  );
                  alert(res.message);
                  if (res.success) {
                    AuthService.removeAccessToken();
                    setShowWithdrawalModal(false);
                    navigate("/login");
                  }
                }}
                onCloseWithdrawalModal={() => setShowWithdrawalModal(false)}
                // Certification create modal
                showCertModal={showCertModal}
                certForm={certForm}
                onChangeCertForm={(form) => setCertForm(form)}
                onSubmitCertForm={handleCertSubmit}
                certSubmitting={certSubmitting}
                onCloseCertModal={() => setShowCertModal(false)}
              />
            )}

            {(activeTab === "내 상담 내역" || activeTab === "상담일지") && (
              <MyConsultationList
                consultationTab={consultationTab as "상담 전" | "상담 완료"}
                onChangeTab={(tab) => setConsultationTab(tab)}
                isLoading={isLoadingConsultations}
                error={consultationError}
                realConsultationData={realConsultationData}
                onEnterConsultation={handleEnterConsultation}
                onCancelConsultation={handleCancelConsultation}
                isCancelling={isCancelling}
                onViewDiary={handleConsultationDiaryClick}
                onNavigateAdvisor={(expertName) => navigate(`/advisors-detail/${encodeURIComponent(expertName)}`)}
                hardcodedConsultationData={consultationData as any}
                activeTab={activeTab}
                selectedConsultation={selectedConsultation}
                isLoadingDiary={isLoadingDiary}
                diaryError={diaryError}
                consultationDiary={consultationDiary}
                onCloseDiary={handleCloseDiary}
                onRetryDiary={() => handleConsultationDiaryClick(selectedConsultation as any)}
                onAnalyzeVideo={handleVideoAnalysis}
                videoAnalysisResult={videoAnalysisResult}
              />
            )}

            {activeTab === "찜한 전문가" && !isExpert && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  찜한 전문가
                </h2>
                {favoriteLoading ? (
                  <div className="text-center py-8">
                    <p>로딩 중...</p>
                  </div>
                ) : favoriteError ? (
                  <div className="text-center py-8 text-red-600">
                    <p>{favoriteError}</p>
                  </div>
                ) : !favoriteAdvisors || favoriteAdvisors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>찜한 전문가가 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {favoriteAdvisors.map((advisor) => {
                      const cls = getStyleClasses(advisor.preferredTradeStyle);
                      return (
                        <div
                          key={advisor.advisorId}
                          className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow relative`}
                        >
                          {/* Preferred Style Badge (홈페이지와 동일 색상 체계) */}
                          <div className={`text-left text-xs font-semibold ${cls.headerText} ${cls.headerBg} w-fit rounded-full px-3 py-1 mx-auto mb-4`}>
                            {getTradeStyleDisplayName(advisor.preferredTradeStyle)} 투자
                          </div>

                        {/* Profile Image */}
                        <div className="text-center mb-3">
                          <img
                            src={advisor.profileImage || `${import.meta.env.VITE_API_URL}/uploads/profile_default.png`}
                            alt={advisor.name}
                            className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-gray-200"
                          />
                        </div>

                        <div className="flex flex-row items-center justify-center space-x-2">
                          {/* 찜해제 버튼 - 오른쪽 위 */}
                          <button
                            onClick={() =>
                              handleRemoveFavorite(advisor.advisorId)
                            }
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="찜해제"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>

                          {/* Name */}
                          <div className="text-center mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {advisor.name}
                            </h3>
                          </div>
                        </div>
                        
                        {/* 평점 */}
                        <div className="flex flex-row items-center justify-center space-x-2">
                          <div className="flex items-center justify-center mb-3">
                            <svg
                                className="w-4 h-4 text-yellow-400 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm text-gray-600">
                                {Number(advisor.averageRating ?? 0).toFixed(1)}
                              </span>
                            </div>

                            {/* Review Count */}
                            <div className="flex items-center justify-center mb-3">
                            <svg
                              className="w-4 h-4 text-gray-400 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M3 4a3 3 0 013-3h8a3 3 0 013 3v6a3 3 0 01-3 3H8l-4 4v-4a3 3 0 01-1-2V4z" />
                            </svg>
                            <span className="text-sm text-gray-600">
                              리뷰({advisor.reviewCount ?? 0})
                            </span>
                          </div>
                        </div>


                        {/* Short Intro */}
                        <p className="text-sm text-gray-600 mb-4 text-center line-clamp-2">
                          {advisor.shortIntro}
                        </p>

                        {/* Action Button */}
                        <div className="text-center">
                          <button
                            onClick={() =>
                              navigate(`/advisors-detail/${advisor.advisorId}`)
                            }
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors w-full"
                          >
                            상세보기
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            )}

            {/* 전문가 전용 탭들 */}
            {/* 전문가 페이지 수정 탭은 useEffect에서 라우팅 처리 */}

            {activeTab === "상담 영업 스케줄 관리" && isExpert && (
              <div className="bg-white rounded-lg p-6">
                <h1 className="font-bold text-left text-xl font-semibold text-gray-900 mb-6">
                  상담 영업 스케줄 관리
                </h1>

                
                {/* 추가: 캘린더 기반 스케줄 관리 컴포넌트 (기존 기능 유지) */}
                <div className="mt-8">
                  <AdvisorTimeTable onOperatingHoursChange={(_hasOperatingHours) => {}} />
                </div>
              </div>
            )}

            {activeTab === "상담일지" && selectedConsultation && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">상담일지</h2>
                  <button
                    onClick={handleCloseDiary}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m0 7h18"
                      />
                    </svg>
                    <span>뒤로가기</span>
                  </button>
                </div>

                {isLoadingDiary ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">
                      상담일지를 불러오는 중...
                    </span>
                  </div>
                ) : diaryError ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-4">⚠️ {diaryError}</div>
                    <button
                      onClick={() =>
                        handleConsultationDiaryClick(selectedConsultation)
                      }
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : consultationDiary ? (
                  <div className="mb-6">
                    {/* 녹화 영상 목록 */}
                    {consultationDiary.recordings &&
                    consultationDiary.recordings.length > 0 ? (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          📹 상담 녹화 영상
                        </h3>
                        <div className="space-y-4">
                          {consultationDiary.recordings.map(
                            (recording: VideoRecording, index: number) => (
                              <div
                                key={recording.id}
                                className="border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-gray-900">
                                    녹화 영상 {index + 1}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      recording.status === "COMPLETED"
                                        ? "bg-green-100 text-green-800"
                                        : recording.status === "PROCESSING"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {recording.status === "COMPLETED"
                                      ? "완료"
                                      : recording.status === "PROCESSING"
                                      ? "처리중"
                                      : "대기중"}
                                  </span>
                                </div>

                                {/* 비디오 플레이어 */}
                                <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center mb-3">
                                  {recording.url ? (
                                    <video
                                      controls
                                      className="w-full h-full rounded-lg"
                                      src={recording.url}
                                    >
                                      브라우저가 비디오를 지원하지 않습니다.
                                    </video>
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full">
                                      <button className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center transition-colors">
                                        <svg
                                          className="w-6 h-6 ml-1"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M8 5v14l11-7z" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 영상 요약하기 버튼 */}
                                {recording.url && (
                                  <div className="mb-3">
                                    <button
                                      onClick={() =>
                                        handleVideoAnalysis(recording.url)
                                      }
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                        />
                                      </svg>
                                      영상 요약하기
                                    </button>
                                  </div>
                                )}

                                {/* 녹화 정보 */}
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">
                                      시작 시간:
                                    </span>
                                    <span className="ml-2">
                                      {new Date(
                                        recording.startTime
                                      ).toLocaleString("ko-KR")}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      종료 시간:
                                    </span>
                                    <span className="ml-2">
                                      {new Date(
                                        recording.endTime
                                      ).toLocaleString("ko-KR")}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      세션 ID:
                                    </span>
                                    <span className="ml-2 font-mono text-xs">
                                      {recording.sessionId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      녹화 ID:
                                    </span>
                                    <span className="ml-2 font-mono text-xs">
                                      {recording.recordingId}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg
                          className="w-12 h-12 mx-auto mb-4 text-gray-300"
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
                        <p>이 상담의 녹화 영상이 없습니다.</p>
                      </div>
                    )}

                    {/* 상담 정보 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        📋 상담 정보
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            상담 ID:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {consultationDiary.consultationInfo.id}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            상담일:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {consultationDiary.consultationInfo.date}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            상담시간:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {consultationDiary.consultationInfo.time}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            전문가:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {consultationDiary.consultationInfo.expert}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-gray-700">
                            상담 내용:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {consultationDiary.consultationInfo.content}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI 안내 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <div className="text-blue-600 text-xl mr-3">🤖</div>
                        <div>
                          <h3 className="font-semibold text-blue-800 mb-2">
                            Stalk AI가 상담 영상을 자동으로 요약해드립니다
                          </h3>
                          <p className="text-blue-700 text-sm">
                            상담내용을 전문가가 직접 분석 작성한 상담일지에 대한
                            신뢰도와 정확성을 책임집니다.
                          </p>
                        </div>
                      </div>
                    </div>

                   

                    {/* 영상 분석 결과 */}
                    {videoAnalysisResult && (
                      <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <svg
                              className="w-6 h-6 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                            영상 분석 결과
                          </h3>
                          <div className="text-sm text-gray-500">
                            {new Date(
                              videoAnalysisResult.processedAt
                            ).toLocaleString("ko-KR")}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          {(() => {
                            try {
                              const summaryData = JSON.parse(
                                videoAnalysisResult.summary
                              );
                              if (
                                summaryData.lecture_content &&
                                Array.isArray(summaryData.lecture_content) &&
                                summaryData.lecture_content.length === 0 &&
                                summaryData.key_takeaways?.main_subject ===
                                  "이 영상에는 투자에 대한 내용이 포함되어 있지 않습니다."
                              ) {
                                return (
                                  <div className="text-center py-8">
                                    <div className="text-gray-500 text-lg font-medium">
                                      이 영상에는 투자에 대한 내용이 포함되어
                                      있지 않습니다.
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div className="space-y-6">
                                  {summaryData.lecture_content &&
                                    summaryData.lecture_content.length > 0 && (
                                      <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                                          📚 강의 내용
                                        </h4>
                                        <div className="space-y-3">
                                          {summaryData.lecture_content.map(
                                            (item: { topic: string; details: string }, index: number) => (
                                              <div
                                                key={index}
                                                className="bg-white rounded-lg p-4 border border-gray-200"
                                              >
                                                <h5 className="font-medium text-blue-600 mb-2">{item.topic}</h5>
                                                <p className="text-gray-700 leading-relaxed">{item.details}</p>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  {summaryData.key_takeaways && (
                                    <div>
                                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                                        🎯 핵심 요약
                                      </h4>
                                      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                        <div>
                                          <h5 className="font-medium text-gray-900 mb-2">
                                            주요 주제
                                          </h5>
                                          <p className="text-gray-700">
                                            {
                                              summaryData.key_takeaways
                                                .main_subject
                                            }
                                          </p>
                                        </div>
                                        {summaryData.key_takeaways
                                          .core_concepts &&
                                          summaryData.key_takeaways
                                            .core_concepts.length > 0 && (
                                            <div>
                                              <h5 className="font-medium text-gray-900 mb-2">
                                                핵심 개념
                                              </h5>
                                              <ul className="list-disc list-inside space-y-1">
                                                {summaryData.key_takeaways.core_concepts.map(
                                                  (
                                                    concept: string,
                                                    index: number
                                                  ) => (
                                                    <li
                                                      key={index}
                                                      className="text-gray-700"
                                                    >
                                                      {concept}
                                                    </li>
                                                  )
                                                )}
                                              </ul>
                                            </div>
                                          )}
                                        <div>
                                          <h5 className="font-medium text-gray-900 mb-2">
                                            결론 및 전략
                                          </h5>
                                          <p className="text-gray-700">
                                            {
                                              summaryData.key_takeaways
                                                .conclusion_and_strategy
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            } catch {
                              return (
                                <div className="text-gray-700 whitespace-pre-wrap">
                                  {videoAnalysisResult.summary}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* 푸터 */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>개인정보 처리방침 | 고객센터 0000-0000 | 공지사항</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>
                      사업자 등록번호 : 000-00-0000 대표 : 스토킹 주소 : 46733
                      부산광역시 강서구 녹산산업중로 333
                    </p>
                    <p>
                      스토킹에서 제공되는 투자 정보 및 정보는 투자 판단을 위한
                      단순 참고용일 뿐이며, 투자 권유 및 광고, 종목 추천을 위한
                      목적이 절대 아닙니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달은 MyInfo 내부 PasswordUpdate 컴포넌트로 분리 */}

      <CancelReservationModal
        isOpen={showCancelModal}
        isCancelling={isCancelling}
        cancelReason={cancelReason}
        cancelMemo={cancelMemo}
        errorMessage={cancelError}
        onChangeReason={(r) => setCancelReason(r)}
        onChangeMemo={(m) => setCancelMemo(m)}
        onConfirm={confirmCancelConsultation}
        onClose={() => setShowCancelModal(false)}
      />

      {/* 내 정보 수정 모달 */}
      {/* 내 정보 수정 모달은 MyInfo 내부 MyInfoUpdate 컴포넌트로 분리 */}

      {/* 프로필 편집 모달은 MyInfo 내부 MyCommunityInfoUpdate 컴포넌트로 분리 */}

      {/* 회원탈퇴 모달은 MyInfo 내부 AccountDelete 컴포넌트로 분리 */}

      {/* 프로필 이미지 추가 모달 */}
      {showImageUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                프로필 이미지 추가
              </h3>
              <button
                onClick={() => setShowImageUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  파일명
                </label>
                <input
                  type="text"
                  value={imageUploadForm.fileName}
                  placeholder="파일을 선택해주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
              <div className="flex space-x-3">
                <input
                  type="file"
                  id="file-upload"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer"
                >
                  파일등록
                </label>
                <button
                  type="button"
                  onClick={handleFileDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  파일삭제
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="text-left text-sm text-gray-600 space-y-1">
                  <li>• 프로필 사진은 정사각형 사이즈를 권장합니다.</li>
                  <li>
                    • 지원하는 파일 형식은 아래와 같습니다.<br />
                      <span className="ml-3 text-red-600">JPGE(.jpg, .jpeg) 또는 PNG(.png)</span>
                  </li>
                  <li>• 업로드 파일 용량은 2MB 이하만 가능합니다.</li>
                </ul>
              </div>
              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowImageUploadModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (imageUploadForm.selectedFile) {
                      setShowImageUploadModal(false);
                    }
                  }}
                  disabled={!imageUploadForm.selectedFile}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 자격증 추가 모달은 MyInfo 내부 CertificationCreate 컴포넌트로 분리 */}
    </div>
  );
};

export default MyPage;