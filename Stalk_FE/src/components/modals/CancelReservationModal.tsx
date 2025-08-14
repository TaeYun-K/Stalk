import React from 'react';

type CancelReasonType = 'PERSONAL_REASON' | 'SCHEDULE_CHANGE' | 'HEALTH_ISSUE' | 'NO_LONGER_NEEDED' | 'OTHER';

interface CancelReservationModalProps {
  isOpen: boolean;
  isCancelling?: boolean;
  cancelReason: CancelReasonType;
  cancelMemo: string;
  errorMessage?: string | null;
  onChangeReason: (reason: CancelReasonType) => void;
  onChangeMemo: (memo: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const CancelReservationModal: React.FC<CancelReservationModalProps> = ({
  isOpen,
  isCancelling = false,
  cancelReason,
  cancelMemo,
  errorMessage,
  onChangeReason,
  onChangeMemo,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-left text-lg font-semibold text-gray-900">상담 예약 취소</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">취소 사유</label>
            <select
              value={cancelReason}
              onChange={(e) => onChangeReason(e.target.value as CancelReasonType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PERSONAL_REASON">개인사정</option>
              <option value="SCHEDULE_CHANGE">일정변경</option>
              <option value="HEALTH_ISSUE">건강상 이유</option>
              <option value="NO_LONGER_NEEDED">상담 불필요</option>
              <option value="OTHER">기타</option>
            </select>
          </div>
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">상세 사유(선택)</label>
            <textarea
              value={cancelMemo}
              onChange={(e) => onChangeMemo(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="상세 사유를 입력해주세요 (최대 500자)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {errorMessage && (
            <div className="text-sm text-red-600">{errorMessage}</div>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isCancelling}
            >
              닫기
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={isCancelling}
            >
              {isCancelling ? '취소 중...' : '취소 확정'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelReservationModal;


