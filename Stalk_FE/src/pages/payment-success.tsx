import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

interface PaymentSuccessRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface PaymentSuccessResponse {
  reservationId: number;
  paymentId: string;
  amount: number;
  status: string;
  paidAt: string;
}

interface ApiResponse<T> {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: T;
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // URL 파라미터 추출
        const paymentKey = searchParams.get("paymentKey");
        const orderId = searchParams.get("orderId");
        const amount = searchParams.get("amount");

        if (!paymentKey || !orderId || !amount) {
          throw new Error("결제 정보가 올바르지 않습니다.");
        }

        // 토큰 추출
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("로그인이 필요합니다.");
        }

        // 백엔드 결제 승인 API 호출
        const requestData: PaymentSuccessRequest = {
          paymentKey,
          orderId,
          amount: parseInt(amount, 10),
        };

        const response = await fetch("/api/payments/success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        });

        const data: ApiResponse<PaymentSuccessResponse> = await response.json();

        if (!response.ok || !data.isSuccess) {
          throw new Error(data.message || "결제 처리 중 오류가 발생했습니다.");
        }

        setSuccess(true);
        setLoading(false);

        // 5초 후 마이페이지로 자동 이동
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/my-page");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        console.error("결제 처리 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams, navigate]);

  const handleGoToMyPage = () => {
    navigate("/my-page");
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            {/* 로딩 스피너 */}
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              결제 처리 중...
            </h2>
            <p className="text-gray-600">
              결제 승인을 처리하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              결제 처리 실패
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleGoToHome}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                홈으로 돌아가기
              </button>
              <button
                onClick={handleGoToMyPage}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                마이페이지로 이동
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
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
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              결제가 완료되었습니다!
            </h2>
            <p className="text-gray-600 mb-6">
              상담 예약이 성공적으로 완료되었습니다.
            </p>

            {/* 자동 이동 안내 */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                {countdown}초 후 마이페이지로 자동 이동됩니다.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoToMyPage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                지금 마이페이지로 이동
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
