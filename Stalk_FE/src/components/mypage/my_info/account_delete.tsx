import React from "react";

interface AccountDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const AccountDelete: React.FC<AccountDeleteProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">회원 탈퇴</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="space-y-6">
          <div className="text-gray-700 space-y-1">
            <p>회원 탈퇴를 진행하면</p>
            <p>
              계정의 <span className="text-red-600 font-bold">모든 정보가 삭제되고 복구가 불가능</span>합니다.
            </p>
            <p>
              삭제를 원치 않는 경우 <span className="text-blue-600 font-bold">"돌아가기"</span> 버튼을 누르세요.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={onConfirm} className="bg-gray-500 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              회원탈퇴
            </button>
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDelete;


