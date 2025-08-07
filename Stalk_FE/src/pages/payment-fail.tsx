import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const PaymentFail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // 10초 후 홈으로 자동 이동
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToHome = () => {
    navigate("/");
  };

  const handleRetry = () => {
    // 이전 페이지로 돌아가기 (예약 페이지)
    navigate(-1);
  };

  // URL 파라미터에서 에러 정보 추출
  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  // 에러 메시지 매핑
  const getErrorMessage = () => {
    if (errorMessage) {
      return errorMessage;
    }

    switch (errorCode) {
      case "PAY_PROCESS_CANCELED":
        return "사용자에 의해 결제가 취소되었습니다.";
      case "PAY_PROCESS_ABORTED":
        return "결제 진행 중 오류가 발생했습니다.";
      case "REJECT_CARD_COMPANY":
        return "카드사에서 결제를 거절했습니다.";
      case "INVALID_CARD_COMPANY":
        return "유효하지 않은 카드입니다.";
      case "NOT_ENOUGH_MONEY":
        return "잔액이 부족합니다.";
      case "EXCEED_MAX_DAILY_PAYMENT_COUNT":
        return "일일 결제 한도를 초과했습니다.";
      case "EXCEED_MAX_PAYMENT_MONEY":
        return "결제 금액 한도를 초과했습니다.";
      case "CARD_PROCESSING_ERROR":
        return "카드 처리 중 오류가 발생했습니다.";
      case "INVALID_CARD_INSTALLMENT_PLAN":
        return "유효하지 않은 할부 개월 수입니다.";
      case "NOT_ALLOWED_POINT_USE":
        return "포인트 사용이 허용되지 않습니다.";
      case "INVALID_CARD_EXPIRATION":
        return "카드 유효기간이 만료되었습니다.";
      case "INVALID_STOPPED_CARD":
        return "정지된 카드입니다.";
      case "EXCEED_MAX_ONE_DAY_PAYMENT_MONEY":
        return "일일 결제 금액 한도를 초과했습니다.";
      case "NOT_AVAILABLE_BANK":
        return "은행 서비스를 이용할 수 없습니다.";
      case "INVALID_PASSWORD":
        return "결제 비밀번호가 틀렸습니다.";
      default:
        return "결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          {/* 실패 아이콘 */}
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
            결제에 실패했습니다
          </h2>

          <p className="text-gray-600 mb-4">{getErrorMessage()}</p>

          {/* 주문번호 표시 (있는 경우) */}
          {orderId && (
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">주문번호:</span> {orderId}
              </p>
            </div>
          )}

          {/* 에러 코드 표시 (개발/디버깅용, 필요에 따라 제거 가능) */}
          {errorCode && (
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="text-xs text-gray-500">
                <span className="font-medium">오류 코드:</span> {errorCode}
              </p>
            </div>
          )}

          {/* 자동 이동 안내 */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              {countdown}초 후 홈페이지로 자동 이동됩니다.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              다시 시도하기
            </button>
            <button
              onClick={handleGoToHome}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              홈으로 돌아가기
            </button>
          </div>

          {/* 고객센터 안내 */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              문제가 지속될 경우 고객센터로 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFail;
