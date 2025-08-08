import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NewNavbar from "@/components/new-navbar";
import ExpertProfileImage from "@/assets/expert_profile_image.png";
import AuthService from "@/services/authService";
import ProfileDefaultImage from "@/assets/images/profiles/Profile_default.svg";

// 전문가 정보 API Response Interfaces
interface ApiCareer {
  id: number;
  title: string;
  description: string;
  started_at: string;
  ended_at: string;
  created_at: string;
}

interface ApiCertificate {
  id: number;
  certificate_file_sn: string;
  birth: string;
  certificate_file_number: string;
  certificate_name: string;
  issued_by: string;
  issued_at: string;
  expires_at: string;
  certificate_url: string;
  created_at: string;
}

interface ApiReview {
  review_id: number;
  nickname: string;
  rating: number;
  content: string;
  profile_image: string;
  created_at: string;
}

interface ApiAdvisorDetail {
  user_id: number;
  name: string;
  profile_image_url: string;
  short_intro: string;
  long_intro: string;
  preferred_trade_style: string;
  contact: string;
  avg_rating: number;
  review_count: number;
  careers: ApiCareer[];
  certificates: ApiCertificate[];
  reviews: ApiReview[];
  has_more_reviews: boolean;
}

interface ApiResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: ApiAdvisorDetail;
}

interface Review {
  id: number;
  avatar: string;
  username: string;
  date: string;
  content: string;
  rating: number;
}

// 전문가 예약 시간 테이블 API Response Interfaces
interface ApiTimeSlot {
  time: string;
  is_available: boolean;
  is_reserved: boolean;
  is_blocked: boolean;
}

interface ApiAvailableTimesResponse {
  date: string;
  time_slots: ApiTimeSlot[];
}

interface ApiAvailableTimesApiResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: ApiAvailableTimesResponse;
}

// 예약 요청 인터페이스
interface PaymentReservationRequest {
  advisorUserId: string;
  date: string; // YYYY-MM-DD 형식
  time: string; // HH:mm 형식
  requestMessage: string;
}

// 예약 응답 인터페이스 (백엔드 PaymentReservationResponseDto와 매칭)
interface PaymentReservationResponse {
  reservationId: number;
  scheduledTime: string;
  orderId: string;
  amount: number;
  paymentData: {
    // 토스페이먼츠 SDK에 필요한 데이터들
    orderId: string;
    orderName: string;
    amount: number;
    customerKey: string;
    customerName: string;
    successUrl: string;
    failUrl: string;
  };
}

interface PaymentReservationApiResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: PaymentReservationResponse;
}

const ExpertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [requestMessage] = useState<string>("");
  const [showReservationModal, setShowReservationModal] =
    useState<boolean>(false);
  const [displayedReviews, setDisplayedReviews] = useState<number>(3);

  // API 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expertData, setExpertData] = useState<ApiAdvisorDetail | null>(null);

  // 예약 가능 시간 API 상태 관리
  const [availableTimesLoading, setAvailableTimesLoading] = useState(false);
  const [availableTimesError, setAvailableTimesError] = useState<string | null>(
    null
  );
  const [availableTimes, setAvailableTimes] = useState<ApiTimeSlot[]>([]);

  // 전문가 간 예약 제한 오류 메시지 상태
  const [expertReservationError, setExpertReservationError] = useState<
    string | null
  >(null);

  // 현재 전문가의 ID (URL 파라미터의 id)
  const advisorId = id;

  // API 호출
  useEffect(() => {
    // 페이지 로드 시 전문가 간 예약 오류 메시지 초기화
    setExpertReservationError(null);

    const fetchExpertDetails = async () => {
      if (!id) {
        setError("전문가 ID가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 토큰 확인
        const token = AuthService.getAccessToken();
        if (!token) {
          throw new Error("로그인 후 이용하실 수 있는 서비스입니다.");
        }

        const response = await AuthService.authenticatedRequest(
          `/api/advisors/${id}`
        );

        if (response.status === 401) {
          // 401 에러 시 토큰 제거하고 로그인 페이지로 리다이렉트
          AuthService.removeAccessToken();
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch expert details");
        }

        const data: ApiResponse = await response.json();
        if (data.isSuccess) {
          setExpertData(data.result);
        } else {
          throw new Error(data.message || "Failed to fetch expert details");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching expert details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpertDetails();
  }, [id, navigate]);

  const [reservationForm, setReservationForm] = useState({
    name: "",
    phone: "",
    requestDetails: "",
  });
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    null
  );

  // 연도만 추출하는 함수
  const formatPeriod = (period: string): string => {
    // "현재"가 포함된 경우
    if (period.includes("현재")) {
      const yearMatch = period.match(/(\d{4})년/);
      if (yearMatch) {
        return `${yearMatch[1]} - 현재`;
      }
      return "현재";
    }

    // 연도 범위 추출 (예: "2018년 - 2020년" -> "2018 - 2020")
    const yearRangeMatch = period.match(/(\d{4})년\s*-\s*(\d{4})년/);
    if (yearRangeMatch) {
      return `${yearRangeMatch[1]} - ${yearRangeMatch[2]}`;
    }

    // 단일 연도 추출 (예: "2012년 6월" -> "2012")
    const singleYearMatch = period.match(/(\d{4})년/);
    if (singleYearMatch) {
      return singleYearMatch[1];
    }

    // 기타 경우 원본 반환
    return period;
  };

  // API 데이터를 기반으로 전문가 정보 생성
  const expert = expertData
    ? {
        id: expertData.user_id.toString(),
        name: expertData.name,
        title: "컨설턴트",
        tagline: expertData.short_intro,
        image: expertData.profile_image_url || ExpertProfileImage,
        introduction: expertData.long_intro,
        qualifications: expertData.certificates.map(
          (cert) => cert.certificate_name
        ),
        experience: expertData.careers.map((career) => ({
          period: `${new Date(career.started_at).getFullYear()} - ${
            career.ended_at ? new Date(career.ended_at).getFullYear() : "현재"
          }`,
          position: career.title,
        })),
        rating: expertData.avg_rating,
        reviewCount: expertData.review_count,
        consultationFee: "상담료 정보 없음", // API에 consultationFee가 없으므로 기본값 사용
      }
    : null;

  // API 리뷰 데이터를 기반으로 리뷰 생성
  const reviews: Review[] = expertData
    ? expertData.reviews.map((review) => ({
        id: review.review_id,
        avatar: review.profile_image || ProfileDefaultImage,
        username: review.nickname,
        rating: review.rating,
        date: new Date(review.created_at)
          .toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
          .replace(/\./g, "."),
        content: review.content,
      }))
    : [];

  // 달력 관련 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    // 로컬 시간대 기준으로 YYYY-MM-DD 형식 생성 (UTC 변환 문제 방지)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isSelected = (date: Date) => {
    return (
      selectedCalendarDate &&
      date.toDateString() === selectedCalendarDate.toDateString()
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedCalendarDate(date);
    const formattedDate = formatDate(date);
    setSelectedDate(formattedDate);

    // 날짜 선택 시 예약 가능 시간 조회
    if (id) {
      fetchAvailableTimes(id, formattedDate);
    }
  };

  // 예약 가능 시간 조회 API
  const fetchAvailableTimes = async (advisorId: string, date: string) => {
    try {
      setAvailableTimesLoading(true);
      setAvailableTimesError(null);

      // 현재 사용자 정보 확인
      const userInfo = AuthService.getUserInfo();
      console.log("Current user info:", userInfo);
      console.log("Current user role:", userInfo?.role);

      // 토큰 상태 확인
      const currentToken = AuthService.getAccessToken();
      console.log("Current token exists:", !!currentToken);

      if (currentToken) {
        // JWT 토큰 디코딩하여 만료 시간 확인
        try {
          const base64Url = currentToken.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(window.atob(base64));

          const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초)
          const expirationTime = payload.exp; // 토큰 만료 시간

          console.log("Token expiration check:");
          console.log(
            "- Current time:",
            new Date(currentTime * 1000).toISOString()
          );
          console.log(
            "- Expiration time:",
            new Date(expirationTime * 1000).toISOString()
          );
          console.log(
            "- Time until expiration:",
            expirationTime - currentTime,
            "seconds"
          );
          console.log("- Is expired:", currentTime >= expirationTime);

          if (currentTime >= expirationTime) {
            console.log("Token is expired, attempting refresh...");
            try {
              await AuthService.refreshToken();
              console.log("Token refreshed successfully after expiration");
            } catch (error) {
              console.log("Token refresh failed after expiration:", error);
              throw new Error("토큰이 만료되었습니다. 다시 로그인해주세요.");
            }
          } else if (expirationTime - currentTime <= 180) {
            // 3분 이내 만료
            console.log("Token expires soon, attempting refresh...");
            try {
              await AuthService.refreshToken();
              console.log("Token refreshed successfully before expiration");
            } catch (error) {
              console.log("Token refresh failed before expiration:", error);
            }
          } else {
            console.log("Token is still valid");
          }
        } catch (error) {
          console.log("Error decoding token:", error);
        }
      } else {
        console.log("No token found");
        throw new Error("로그인이 필요한 서비스입니다.");
      }

      // 전문가 본인인지 확인
      const isExpertOwner =
        userInfo?.role === "ADVISOR" && userInfo?.name === expertData?.name;

      // 전문가 본인인 경우 차단된 시간 조회
      if (isExpertOwner) {
        console.log(
          "Expert owner viewing their own schedule - fetching blocked times"
        );
        console.log(`🔍 Fetching blocked times for date: ${date}`);
        console.log(`🔑 Current token exists:`, !!AuthService.getAccessToken());
        console.log(`👤 Current user info:`, AuthService.getUserInfo());

        // JWT 토큰 디코딩해서 페이로드 확인
        const token = AuthService.getAccessToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            console.log(`🔓 JWT payload:`, payload);
            console.log(`⏰ Token expiry:`, new Date(payload.exp * 1000));
            console.log(`🕐 Current time:`, new Date());
            console.log(`⌛ Token expired:`, payload.exp * 1000 < Date.now());
          } catch (e) {
            console.error(`❌ Failed to decode JWT:`, e);
          }
        }

        // 임시로 API 호출 우회해서 문제 격리
        console.log(`⚠️ API 호출 우회 중 - 임시 더미 데이터 반환`);

        // 임시 더미 데이터 (실제 운영에서는 제거 필요)
        const dummyBlockedTimes = ["12:00", "13:00"]; // 점심시간 차단 예시

        // 기본 시간 슬롯 생성 (09:00 ~ 20:00)
        const allTimeSlots = [
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
          "17:00",
          "18:00",
          "19:00",
          "20:00",
        ];

        // 각 시간 슬롯의 상태 결정
        const timeSlots: ApiTimeSlot[] = allTimeSlots.map((time) => ({
          time,
          is_available: !dummyBlockedTimes.includes(time), // 차단된 시간이 아니면 예약 가능
          is_reserved: false, // 전문가 본인 확인용이므로 예약 상태는 false로 설정
          is_blocked: dummyBlockedTimes.includes(time), // 차단된 시간인지 확인
        }));

        console.log("Generated time slots for expert (dummy data):", timeSlots);
        setAvailableTimes(timeSlots);
        return;

        /* 원래 API 호출 코드 (임시 주석처리)
        try {
          // 전문가 본인의 차단된 시간 조회 API 호출
          const blockedTimesResponse = await AuthService.authenticatedRequest(
            `/api/advisors/blocked-times?date=${date}`
          );

          if (blockedTimesResponse.ok) {
            const blockedTimesData = await blockedTimesResponse.json();
            console.log("Blocked times data:", blockedTimesData);

            // 차단된 시간 목록을 가져옴
            const blockedTimes = blockedTimesData.result?.blockedTimes || [];
            
            // 각 시간 슬롯의 상태 결정
            const timeSlots: ApiTimeSlot[] = allTimeSlots.map(time => ({
              time,
              is_available: !blockedTimes.includes(time), // 차단된 시간이 아니면 예약 가능
              is_reserved: false, // 전문가 본인 확인용이므로 예약 상태는 false로 설정
              is_blocked: blockedTimes.includes(time) // 차단된 시간인지 확인
            }));

            console.log("Generated time slots for expert:", timeSlots);
            setAvailableTimes(timeSlots);
            return;
          } else {
            console.warn("Failed to fetch blocked times, using fallback");
            throw new Error("차단된 시간 조회 실패");
          }
        } catch (error) {
          console.error("Error fetching blocked times:", error);
          console.warn("Using fallback data due to API error");
          
          // API 호출 실패 시 폴백 데이터 제공 (점심시간 차단 예시)
          const fallbackTimeSlots: ApiTimeSlot[] = [
            { time: "09:00", is_available: true, is_reserved: false, is_blocked: false },
            { time: "10:00", is_available: true, is_reserved: false, is_blocked: false },
            { time: "11:00", is_available: true, is_reserved: false, is_blocked: false },
            { time: "12:00", is_available: false, is_reserved: false, is_blocked: true },
            { time: "13:00", is_available: false, is_reserved: false, is_blocked: true },
            { time: "14:00", is_available: true, is_reserved: false, is_blocked: false },
            { time: "15:00", is_available: true, is_reserved: false, is_blocked: false },
            { time: "16:00", is_available: true, is_reserved: false, is_blocked: false },
            { time: "17:00", is_available: true, is_reserved: false, is_blocked: false },
            { time: "18:00", is_available: true, is_reserved: false, is_blocked: false },
            { time: "19:00", is_available: true, is_reserved: false, is_blocked: false },
            { time: "20:00", is_available: true, is_reserved: false, is_blocked: false },
          ];
          setAvailableTimes(fallbackTimeSlots);
          return;
        }
        */
      }

      // 전문가가 다른 전문가에게 예약하려는 경우 차단
      if (userInfo?.role === "ADVISOR" && !isExpertOwner) {
        console.log("ADVISOR trying to book another advisor - blocking");
        throw new Error("🚫 전문가는 다른 전문가에게 예약할 수 없습니다.");
      }

      // 일반 사용자인 경우 기존 API 호출
      const response = await AuthService.authenticatedRequest(
        `/api/advisors/${advisorId}/available-times?date=${date}`
      );

      if (response.status === 401) {
        throw new Error("로그인이 필요한 서비스입니다.");
      }

      if (response.status === 403) {
        throw new Error("일반 사용자만 사용 가능한 서비스입니다.");
      }

      if (response.status === 404) {
        throw new Error("존재하지 않은 전문가입니다.");
      }

      if (!response.ok) {
        throw new Error("예약 가능 시간 조회에 실패했습니다.");
      }

      const data: ApiAvailableTimesApiResponse = await response.json();
      if (data.isSuccess) {
        setAvailableTimes(data.result.time_slots);
      } else {
        throw new Error(data.message || "예약 가능 시간 조회에 실패했습니다.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "예약 가능 시간 조회 중 오류가 발생했습니다.";
      setAvailableTimesError(errorMessage);
      console.error("Error fetching available times:", err);
    } finally {
      setAvailableTimesLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedCalendarDate(today);
    setSelectedDate(formatDate(today));
  };

  // 예약 + 결제 API 호출 함수
  const createReservationWithPayment = async (
    requestData: PaymentReservationRequest
  ): Promise<PaymentReservationResponse> => {
    try {
      const response = await fetch("/api/reservations/with-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`, // 토큰 방식에 맞게 수정
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: PaymentReservationApiResponse = await response.json();

      if (!apiResponse.isSuccess) {
        throw new Error(apiResponse.message);
      }

      return apiResponse.result;
    } catch (error) {
      console.error("예약 생성 실패:", error);
      throw error;
    }
  };

  // 토스페이먼츠 결제창으로 이동하는 함수
  const redirectToPayment = (
    paymentData: PaymentReservationResponse["paymentData"]
  ) => {
    // 토스페이먼츠 결제창 SDK 사용
    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;

    if (window.TossPayments) {
      const tossPayments = window.TossPayments(clientKey);

      tossPayments.requestPayment("카드", {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerKey: paymentData.customerKey,
        customerName: paymentData.customerName,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
      });
    } else {
      console.error("토스페이먼츠 SDK가 로드되지 않았습니다.");
      alert("결제 시스템을 불러오는 중 오류가 발생했습니다.");
    }
  };

  // 결제/예약 취소 API 호출
  const cancelPaymentReservation = async (orderId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await fetch("/api/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }), // PaymentCancelRequestDto와 매칭
      });
    } catch (e) {
      // 취소 실패는 사용자에겐 조용히 처리(재시도는 선택)
      console.warn("예약 취소 API 호출 실패(무시):", e);
    }
  };

  // 예약 및 결제 처리 함수
  const handleReservation = async (
    reservationData: PaymentReservationRequest,
    onSuccess?: () => void,
    onError?: (message: string) => void
  ) => {
    // 중복 취소 방지용
    let cancelSent = false;
    const safeCancel = async (orderId?: string | null) => {
      if (!orderId || cancelSent) return;
      cancelSent = true;
      await cancelPaymentReservation(orderId);
    };

    // beforeunload 핸들러 (탭 닫기/새로고침 시 취소 시도)
    let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

    // 결제 생성 후에만 값이 들어감
    let orderIdForCancel: string | null = null;

    try {
      // 토큰 확인
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
      }

      // 예약 생성 + 결제 준비 (orderId 생성 구간)
      const response = await fetch("/api/reservations/with-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reservationData),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.isSuccess) {
        if (response.status === 401 || data.code === 401) {
          throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
        }
        throw new Error(data.message || "예약 생성에 실패했습니다.");
      }

      const reservationResult =
        data.result as unknown as PaymentReservationResponse;

      // orderId 확보 (이게 있어야만 취소 가능)
      const paymentData = reservationResult.paymentData;
      orderIdForCancel = paymentData?.orderId ?? null;

      // Toss SDK 확인
      if (!window.TossPayments) {
        // 여기서 실패하면 생성해놓은 예약은 취소 필요
        await safeCancel(orderIdForCancel);
        throw new Error(
          "결제 시스템을 불러오는 중입니다. 잠시 후 다시 시도해주세요."
        );
      }

      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
      if (!clientKey) {
        await safeCancel(orderIdForCancel);
        throw new Error("결제 설정에 오류가 있습니다.");
      }

      const tossPayments = window.TossPayments(clientKey);

      // 탭 닫기/새로고침 대비: 결제 진행 구간에서만 임시 등록
      beforeUnloadHandler = (e: BeforeUnloadEvent) => {
        // 사용자에게 경고를 띄우고(브라우저가 무시할 수도), 백엔드 취소 시도
        // e.preventDefault(); // 일부 브라우저에서 필요 없음
        // e.returnValue = ""; // 크롬에서 커스텀 메시지는 무시됨
        void safeCancel(orderIdForCancel);
      };
      window.addEventListener("beforeunload", beforeUnloadHandler);

      // 실 결제창 호출 (여기서 사용자 취소/닫힘/에러 시 Promise reject)
      await tossPayments.requestPayment("카드", {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerKey: paymentData.customerKey,
        customerName: paymentData.customerName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });

      // 주의: 위에서 성공하면 곧바로 리다이렉트되어 아래 코드는 보통 실행 안 됨
      console.log("결제창 호출 성공");
    } catch (error: any) {
      console.error("예약/결제 처리 오류:", error);

      // TossPayments 에러 케이스 분기(주요 예: USER_CANCEL)
      // SDK에서 주는 error.code가 있으면 참고해서 취소 요청
      const code = error?.code as string | undefined;
      if (code) {
        // 대표 코드 예시: 'USER_CANCEL', 'INVALID_CARD', 'EXCEED_LIMIT' 등
        // 어떤 코드든 결제 실패면 PENDING 예약은 정리하는 편이 안전
        await safeCancel(orderIdForCancel);
      } else {
        // 일반 오류라도, 예약이 생성된 상태(orderId 있음)면 취소
        await safeCancel(orderIdForCancel);
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      onError?.(errorMessage);
    } finally {
      // 정리
      if (beforeUnloadHandler) {
        window.removeEventListener("beforeunload", beforeUnloadHandler);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setReservationForm({
      ...reservationForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoadMoreReviews = () => {
    setDisplayedReviews((prev) => prev + 3);
  };

  const handleDeleteExpert = async () => {
    if (
      !window.confirm(
        "정말로 전문가 프로필을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      return;
    }

    try {
      const response = await AuthService.authenticatedRequest(
        `/api/advisors/${advisorId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("전문가 프로필이 성공적으로 삭제되었습니다.");
        navigate("/experts");
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "전문가 프로필 삭제에 실패했습니다."
        );
      }
    } catch (error) {
      console.error("Error deleting expert:", error);
      alert(
        error instanceof Error
          ? error.message
          : "전문가 프로필 삭제 중 오류가 발생했습니다."
      );
    }
  };

  // 달력 렌더링
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // 이전 달의 마지막 날들
    const prevMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1
    );
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth(),
        daysInPrevMonth - i
      );
      days.push(
        <div key={`prev-${i}`} className="text-gray-300 text-center py-2">
          {date.getDate()}
        </div>
      );
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isSelectedDate = isSelected(date);

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`text-center py-2 cursor-pointer ${
            isSelectedDate
              ? "bg-blue-500 text-white rounded-full"
              : isWeekend
              ? date.getDay() === 0
                ? "text-red-500"
                : "text-blue-500"
              : "text-gray-900"
          } hover:bg-blue-100 hover:rounded-full transition-colors`}
        >
          {day}
        </div>
      );
    }

    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length; // 6주 표시를 위해
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        i
      );
      days.push(
        <div key={`next-${i}`} className="text-gray-300 text-center py-2">
          {date.getDate()}
        </div>
      );
    }

    return days;
  };

  // Loading 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <NewNavbar userType="general" onUserTypeChange={() => {}} />
        <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">전문가 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error 상태
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <NewNavbar userType="general" onUserTypeChange={() => {}} />
        <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                오류가 발생했습니다
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!expert) {
    return (
      <div className="min-h-screen bg-white">
        <NewNavbar userType="general" onUserTypeChange={() => {}} />
        <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                전문가 정보를 찾을 수 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                요청하신 전문가 정보가 존재하지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NewNavbar userType="general" onUserTypeChange={() => {}} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8 min-h-screen">
          {/* Left Content */}
          <div className="flex-1">
            {/* Expert Header */}
            <div className="flex items-end justify-between mb-8 border-b border-gray-300 pb-5">
              <div className="flex-1">
                <div className="flex flex-row items-end gap-2">
                  <h1 className="text-left text-3xl font-bold text-gray-900 mb-2">
                    {expert.name}
                  </h1>
                  <h3 className="text-left text-l font-semibold text-blue-500 mb-2">
                    {expert.title}
                  </h3>
                  <h3 className="text-left text-l font-medium text-gray-400 mb-2">
                    / {expertData?.contact || "010-0000-0000"}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center mb-2 ml-4">
                      <div className="flex text-yellow-400">⭐</div>
                      <span className="ml-2 font-semibold text-gray-900">
                        {expert.rating}
                      </span>
                      <span className="text-gray-600 ml-4">
                        리뷰 {expert.reviewCount}개
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-left text-lg text-gray-600 italic mb-4">
                  "{expert.tagline}"
                </p>
              </div>
              <div className="w-48 h-60 rounded-2xl overflow-hidden">
                <img
                  src={expert.image}
                  alt={expert.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Expert Introduction */}
            <section className=" border-b border-gray-300 pb-8">
              <header className="flex flex-row items-end space-x-3">
                <h2 className="text-left text-2xl font-bold text-gray-900 mb-4">
                  전문가 소개
                </h2>
                <h3 className="text-left text-gray-500 text-sm mb-4">
                  Expert Introduction
                </h3>
              </header>
              <p className="text-left text-gray-700 leading-loose">
                {expert.introduction}
              </p>
            </section>
            <div className="flex flex-row mt-8 border-b border-gray-300 pb-8">
              {/* Qualifications */}
              <section className="mb-8  w-1/2">
                <div className="flex flex-row items-end space-x-3 mb-4">
                  <h2 className="text-left text-2xl font-bold text-gray-900">
                    자격 증명
                  </h2>
                  <p className="text-left text-gray-500 text-sm">
                    Certifications
                  </p>
                </div>
                <ul className="space-y-4">
                  {expert.qualifications.map((qualification, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span className="text-gray-700">{qualification}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Experience */}
              <section className="w-1/2">
                <div className="flex flex-row items-end space-x-3 mb-4">
                  <h2 className="text-left text-2xl font-bold text-gray-900">
                    학력 및 경력사항
                  </h2>
                  <p className="text-left text-gray-500 text-sm">
                    Education & Professional Experience
                  </p>
                </div>
                <div className="space-y-4">
                  {expert.experience.map((exp, index) => (
                    <div key={index} className="flex">
                      <div className="w-32 text-sm text-left text-gray-500 font-medium">
                        {formatPeriod(exp.period)}
                      </div>
                      <div className="text-left flex-1 text-gray-700">
                        {exp.position}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            {/* Reviews */}
            <section className="mt-8">
              <div className="flex flex-row items-end space-x-3 mb-4">
                <h2 className="text-left text-2xl font-bold text-gray-900">
                  상담 후기
                </h2>
                <h3 className="text-left text-gray-500 text-sm">Reviews</h3>
              </div>
              <div className="space-y-6">
                {reviews.slice(0, displayedReviews).map((review) => (
                  <div key={review.id} className="py-6">
                    <div className="flex items-center mb-3">
                      <img
                        src={review.avatar}
                        alt={`${review.username}의 프로필 사진`}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="ml-3">
                        <div className="text-left font-medium text-gray-90 font-semibold">
                          {review.username} ⭐ {review.rating}
                        </div>
                        <div className="text-left text-sm text-gray-500">
                          {review.date}
                        </div>
                      </div>
                    </div>
                    <p className="text-left text-gray-700 leading-relaxed">
                      {review.content}
                    </p>
                  </div>
                ))}
              </div>
              {displayedReviews < reviews.length && (
                <button
                  onClick={handleLoadMoreReviews}
                  className="mt-4 text-gray-600 bg-gray-100 py-3 px-6 rounded-full hover:text-gray-700 hover:bg-gray-200 hover:font-semibold font-medium transition-colors"
                >
                  더보기
                </button>
              )}
            </section>
          </div>

          {/* Right Sidebar - Reservation */}
          <div className="text-left w-80 flex-shrink-0 ml-4">
            <div className="fixed top-32 right-30 w-80 z-10">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  예약 유의사항
                </h3>
                <ul className="space-y-3 mb-6 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span>예약은 1시간 단위로 가능합니다.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span>
                      예약 후 즉시 예약이 확정되며 예약 정보는 마이페이지의 내
                      상담 내역에서 확인할 수 있습니다.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span>
                      방해 행위(욕설 등) 시 전문가가 상담을 중단할 수 있습니다.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 현재 로그인한 사용자가 이 전문가인지 확인 */}
              {(() => {
                const currentUserInfo = AuthService.getUserInfo();
                const isExpertOwner =
                  currentUserInfo?.role === "ADVISOR" &&
                  currentUserInfo?.name === expertData?.name;

                return (
                  <>
                    {/* 모든 사용자(전문가 본인 포함)에게 예약하기 버튼 표시 */}
                    <button
                      onClick={() => {
                        // 토큰 확인
                        const token = AuthService.getAccessToken();
                        if (!token) {
                          alert("로그인이 필요한 서비스입니다.");
                          navigate("/login");
                          return;
                        }

                        const currentUserInfo = AuthService.getUserInfo();

                        // 전문가가 다른 전문가에게 예약하려는 경우 차단
                        if (
                          currentUserInfo?.role === "ADVISOR" &&
                          currentUserInfo?.name !== expertData?.name
                        ) {
                          setExpertReservationError(
                            "🚫 전문가는 다른 전문가에게 예약할 수 없습니다."
                          );
                          return;
                        }

                        // 정상적인 경우 오류 메시지 초기화
                        setExpertReservationError(null);

                        setReservationForm({
                          name: currentUserInfo?.name || "",
                          phone: currentUserInfo?.contact || "",
                          requestDetails: "",
                        });
                        setSelectedDate("");
                        setSelectedTime("");
                        setSelectedCalendarDate(null);
                        setAvailableTimes([]);
                        setAvailableTimesError(null);
                        setShowReservationModal(true);
                      }}
                      className={`w-full font-semibold py-3 px-6 mb-3 rounded-lg transition-colors shadow-lg ${
                        isExpertOwner
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      예약하기
                    </button>

                    {/* 전문가 간 예약 제한 오류 메시지 */}
                    {expertReservationError && (
                      <div className="w-full mb-3 p-3 border border-red-300 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                        {expertReservationError}
                      </div>
                    )}
                    {isExpertOwner && (
                      <>
                        {/* 전문가 본인인 경우 수정/삭제 버튼 */}
                        <button
                          onClick={() =>
                            navigate(`/expert-introduction-update/${advisorId}`)
                          }
                          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg mb-3"
                        >
                          수정하기
                        </button>
                        <button
                          onClick={handleDeleteExpert}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg mb-3"
                        >
                          삭제하기
                        </button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border-2 border border-blue-300 max-w-md w-full shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-8 pb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {(() => {
                  const currentUserInfo = AuthService.getUserInfo();
                  const isExpertOwner =
                    currentUserInfo?.role === "ADVISOR" &&
                    currentUserInfo?.name === expertData?.name;
                  return isExpertOwner ? "예약하기" : "예약하기";
                })()}
              </h3>
              <button
                onClick={() => setShowReservationModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pr-6 scrollbar-hide">
              {(() => {
                const currentUserInfo = AuthService.getUserInfo();
                const isExpertOwner =
                  currentUserInfo?.role === "ADVISOR" &&
                  currentUserInfo?.name === expertData?.name;

                if (isExpertOwner) {
                  return (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start flex-col space-y-2">
                        <div className="text-blue-600 mr-2">
                          ℹ️ <strong>전문가 모드</strong>
                        </div>
                        <div className="text-sm text-blue-700 text-left pl-7 space-y-1">
                          <p>실제 차단된 시간 정보를 확인할 수 있습니다.</p>
                          <p>일반 사용자의 예약화면과 동일합니다.</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <form className="space-y-6 pb-4">
                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={reservationForm.name}
                    onChange={handleInputChange}
                    placeholder="이름을 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline focus:outline-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                    휴대폰 번호
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={reservationForm.phone}
                    onChange={handleInputChange}
                    placeholder="휴대폰 번호를 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline focus:outline-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                    상담 일자
                  </label>

                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      &lt;
                    </button>
                    <span className="font-bold text-gray-900">
                      {currentMonth.getFullYear()}년{" "}
                      {String(currentMonth.getMonth() + 1).padStart(2, "0")}월
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        &gt;
                      </button>
                      <button
                        type="button"
                        onClick={handleToday}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-full hover:bg-blue-100"
                      >
                        Today
                      </button>
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["일", "월", "화", "수", "목", "금", "토"].map(
                        (day, index) => (
                          <div
                            key={day}
                            className={`text-center text-sm font-medium py-2 ${
                              index === 0
                                ? "text-red-500"
                                : index === 6
                                ? "text-blue-500"
                                : "text-gray-900"
                            }`}
                          >
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                    상담 시간
                  </label>

                  {/* 에러 메시지 표시 */}
                  {availableTimesError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">
                        {availableTimesError}
                      </p>
                    </div>
                  )}

                  {/* 로딩 상태 */}
                  {availableTimesLoading && (
                    <div className="mb-4 flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-sm text-gray-600">
                        예약 가능 시간을 불러오는 중...
                      </span>
                    </div>
                  )}

                  {/* 시간 슬롯 표시 */}
                  {!availableTimesLoading &&
                    !availableTimesError &&
                    selectedDate && (
                      <div className="grid grid-cols-3 gap-2">
                        {availableTimes.length > 0 ? (
                          availableTimes.map((timeSlot) => {
                            const isDisabled =
                              !timeSlot.is_available ||
                              timeSlot.is_reserved ||
                              timeSlot.is_blocked;
                            const isSelected = selectedTime === timeSlot.time;

                            return (
                              <button
                                key={timeSlot.time}
                                type="button"
                                onClick={() =>
                                  !isDisabled && setSelectedTime(timeSlot.time)
                                }
                                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                  isSelected
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : isDisabled
                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                                }`}
                                disabled={isDisabled}
                              >
                                {timeSlot.time}
                              </button>
                            );
                          })
                        ) : (
                          <div className="col-span-3 text-center py-4 text-gray-500 text-sm border border-red-500 rounded-lg p-3 bg-red-50 text-red-500">
                            선택한 날짜에 예약 가능한 시간이 없습니다.
                          </div>
                        )}
                      </div>
                    )}

                  {/* 날짜를 선택하지 않은 경우 안내 메시지 */}
                  {!selectedDate &&
                    !availableTimesLoading &&
                    !availableTimesError && (
                      <div className="text-center py-4 text-sm border border-blue-500 rounded-lg p-3 bg-blue-50 text-blue-500">
                        날짜 선택 시 예약 가능한 시간을 확인할 수 있습니다.
                      </div>
                    )}
                </div>

                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                    상담 요청 사항
                  </label>
                  <textarea
                    name="requestDetails"
                    value={reservationForm.requestDetails}
                    onChange={handleInputChange}
                    placeholder="상담 요청 사항을 입력하세요."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:ring-2 focus:outline focus:outline-blue-500 resize-none"
                  />
                </div>
              </form>
            </div>

            <div className="flex justify-end p-8 pt-4 border-t border-gray-200 bg-white">
              {(() => {
                const currentUserInfo = AuthService.getUserInfo();
                const isExpertOwner =
                  currentUserInfo?.role === "ADVISOR" &&
                  currentUserInfo?.name === expertData?.name;

                if (isExpertOwner) {
                  // 전문가 본인인 경우 - 예약 현황 확인용
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setShowReservationModal(false);
                      }}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      닫기
                    </button>
                  );
                } else {
                  // 일반 사용자인 경우 - 실제 예약 진행
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const reservationData = {
                          advisorUserId: advisorId!, // 실제 어드바이저 ID
                          date: selectedDate, // 선택된 날짜
                          time: selectedTime, // 선택된 시간
                          requestMessage: requestMessage, // 요청 메시지
                        };

                        handleReservation(
                          reservationData,
                          () => console.log("예약 성공"), // 성공 콜백
                          (error) => setError(error) // 에러 콜백
                        );
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      예약 완료
                    </button>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertDetailPage;
