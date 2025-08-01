import React, { useState } from 'react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (_password: string) => void;
  isLoading?: boolean;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [password, setPassword] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && isConfirmed) {
      onConfirm(password);
      setPassword('');
      setIsConfirmed(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setIsConfirmed(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-red-600">회원탈퇴</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h4 className="text-red-800 font-medium">주의사항</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>회원탈퇴 시 모든 개인정보가 삭제됩니다.</li>
              <li>상담 내역 및 관심종목 정보가 모두 사라집니다.</li>
              <li>탈퇴 후 같은 이메일로 재가입이 제한될 수 있습니다.</li>
              <li>이 작업은 되돌릴 수 없습니다.</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              본인 확인을 위해 비밀번호를 입력해주세요
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="비밀번호"
              required
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="confirmWithdrawal"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 mr-3"
            />
            <label htmlFor="confirmWithdrawal" className="text-sm text-gray-700">
              위 내용을 모두 확인했으며, 회원탈퇴에 동의합니다.
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!password || !isConfirmed || isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '탈퇴 처리중...' : '회원탈퇴'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalModal; 