import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
  };
  easyPay?: {
    provider: string;
  };
}

interface ApiResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: any; // TossPaymentResponse 타입으로 캐스팅해서 사용
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentResult, setPaymentResult] =
    useState<TossPaymentResponse | null>(null);
  const [countdown, setCountdown] = useState(5);

  // 🔥 중복 호출 방지를 위한 ref
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 🔥 이미 처리된 경우 중복 실행 방지
    if (hasProcessed.current) {
      console.log("이미 결제 승인 처리 완료됨");
      return;
    }

    const processPayment = async () => {
      try {
        // 🔥 처리 시작 플래그 설정
        hasProcessed.current = true;

        console.log("🔥 결제 승인 처리 시작");

        // URL 파라미터 추출
        const paymentKey = searchParams.get("paymentKey");
        const orderId = searchParams.get("orderId");
        const amount = searchParams.get("amount");

        console.log("결제 성공 페이지 - URL 파라미터:", {
          paymentKey,
          orderId,
          amount,
        });

        if (!paymentKey || !orderId || !amount) {
          console.error("결제 정보 누락:", { paymentKey, orderId, amount });
          throw new Error("결제 정보가 올바르지 않습니다.");
        }

        // 토큰 확인
        const token = localStorage.getItem("accessToken");
        console.log("토큰 확인:", token ? "토큰 있음" : "토큰 없음");

        if (!token) {
          console.error("인증 토큰이 없습니다");
          setError("로그인이 만료되었습니다. 다시 로그인해주세요.");
          setLoading(false);
          return;
        }

        const requestData: PaymentConfirmRequest = {
          paymentKey,
          orderId,
          amount: parseInt(amount, 10),
        };

        console.log("결제 승인 API 호출:", requestData);

        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        });

        console.log("결제 승인 API 응답 상태:", response.status);

        const data: ApiResponse = await response.json();
        console.log("결제 승인 API 응답 데이터:", data);

        if (!response.ok || !data.isSuccess) {
          console.error("결제 승인 실패:", data);

          if (response.status === 401 || data.code === 401) {
            setError("로그인이 만료되었습니다. 다시 로그인해주세요.");
          } else {
            setError(data.message || "결제 승인 처리 중 오류가 발생했습니다.");
          }
          setLoading(false);
          return;
        }

        const paymentData = data.result as unknown as TossPaymentResponse;
        console.log("결제 승인 성공:", paymentData);

        setPaymentResult(paymentData);
        setSuccess(true);
        setLoading(false);

        // 5초 후 예약 내역 페이지로 자동 이동
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/reservations");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        console.error("결제 처리 오류:", err);
        let errorMessage = "알 수 없는 오류가 발생했습니다.";

        if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams, navigate]); // 🔥 hasProcessed는 의존성에서 제외

  const handleGoToReservations = () => {
    navigate("/reservations");
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  const handleLoginRedirect = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  // 결제 수단 표시명 변환
  const getPaymentMethodDisplay = (result: TossPaymentResponse) => {
    const method = result.method;
    if (!method) return "알 수 없음";

    switch (method) {
      case "카드":
        if (result.card) {
          return `${result.card.company} 카드`;
        }
        return "카드";
      case "간편결제":
        if (result.easyPay) {
          return `${result.easyPay.provider} 간편결제`;
        }
        return "간편결제";
      case "계좌이체":
        return "계좌이체";
      default:
        return method;
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            {/* 로딩 스피너 */}
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              결제 승인 처리 중...
            </h2>
            <p className="text-gray-600">
              결제 승인을 처리하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            {/* 에러 아이콘 */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              결제 승인 실패
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              {/* 인증 오류인 경우 로그인 버튼 표시 */}
              {error.includes("로그인") ? (
                <button
                  onClick={handleLoginRedirect}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  다시 로그인하기
                </button>
              ) : (
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  이전 페이지로
                </button>
              )}
              <button
                onClick={handleGoToHome}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 성공 상태
  if (success && paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full mx-4">
          <div className="text-center">
            {/* 성공 아이콘 */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              결제가 완료되었습니다!
            </h2>
            <p className="text-gray-600 mb-6">
              상담 예약이 성공적으로 완료되었습니다.
            </p>

            {/* 결제 정보 표시 */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">결제 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">주문번호:</span>
                  <span className="font-medium">{paymentResult.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제금액:</span>
                  <span className="font-medium text-blue-600">
                    {paymentResult.totalAmount?.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제수단:</span>
                  <span className="font-medium">
                    {getPaymentMethodDisplay(paymentResult)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제상태:</span>
                  <span className="font-medium text-green-600">
                    {paymentResult.status}
                  </span>
                </div>
                {paymentResult.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">승인시간:</span>
                    <span className="font-medium">
                      {new Date(paymentResult.approvedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 자동 이동 안내 */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                {countdown}초 후 예약 내역 페이지로 자동 이동됩니다.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoToReservations}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                지금 예약 내역 보기
              </button>
              <button
                onClick={handleGoToHome}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccess;
