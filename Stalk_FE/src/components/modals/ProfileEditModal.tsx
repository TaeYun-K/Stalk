import React from 'react';
import { useForm } from '@/hooks';
import { ProfileForm } from '@/types';
import { AVATAR_OPTIONS } from '@/constants';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (_data: ProfileForm) => void;
  initialData: ProfileForm;
  isLoading?: boolean;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false
}) => {
  const { values, handleChange, handleSubmit, resetForm, setFieldValue } = useForm<ProfileForm>(
    initialData
  );

  const handleFormSubmit = handleSubmit((formData: ProfileForm) => {
    onSubmit(formData);
    onClose();
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAvatarSelect = (avatar: string) => {
    setFieldValue('selectedAvatar', avatar);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">프로필 편집</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <input
              type="text"
              name="nickname"
              value={values.nickname}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              프로필 아바타
            </label>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => handleAvatarSelect(avatar)}
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl hover:scale-105 transition-transform ${
                    values.selectedAvatar === avatar
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {avatar === 'default' && '👤'}
                  {avatar === 'cat' && '🐱'}
                  {avatar === 'cheek' && '😊'}
                  {avatar === 'fox' && '🦊'}
                  {avatar === 'panda' && '🐼'}
                  {avatar === 'puppy' && '🐶'}
                  {avatar === 'rabbit' && '🐰'}
                </button>
              ))}
            </div>
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
              {isLoading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal; 