import React from 'react';
import { useForm } from '@/hooks';
import { EditInfoForm } from '@/types';
import { isValidEmail, formatPhoneNumber } from '@/utils';

interface UserInfoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (_data: EditInfoForm) => void;
  initialData: EditInfoForm;
  isLoading?: boolean;
}

const UserInfoEditModal: React.FC<UserInfoEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false
}) => {
  const { values, errors, handleChange, handleSubmit, resetForm } = useForm<EditInfoForm>(
    initialData,
    {
      email: (value: unknown) => {
        if (!isValidEmail(value as string)) {
          return '올바른 이메일 주소를 입력해주세요.';
        }
        return undefined;
      },
      contact: (value: unknown) => {
        const cleaned = (value as string).replace(/\D/g, '');
        if (cleaned.length !== 11) {
          return '올바른 휴대폰 번호를 입력해주세요.';
        }
        return undefined;
      }
    }
  );

  const handleFormSubmit = handleSubmit((formData: EditInfoForm) => {
    onSubmit({
      ...formData,
      contact: formatPhoneNumber(formData.contact)
    });
    onClose();
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">정보 수정</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              type="text"
              name="name"
              value={values.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              휴대폰 번호
            </label>
            <input
              type="tel"
              name="contact"
              value={values.contact}
              onChange={handleChange}
              placeholder="010-0000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {errors.contact && (
              <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 주소
            </label>
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
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
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserInfoEditModal; 