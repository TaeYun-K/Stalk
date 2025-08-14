import React from "react";
import { ProfileForm } from "@/types";
import CommunityProfileImgCreate from "@/components/mypage/my_info/community_profile_img_create";

interface AvatarOption {
  id: string;
  image: string;
}

interface ImageUploadFormState {
  fileName: string;
  selectedFile: File | null;
}

interface MyCommunityInfoUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  avatarOptions: AvatarOption[];
  onSelectPredefinedAvatar: (avatarId: string, imageUrl: string) => void;
  onOpenImageUploadModal: () => void;
  showImageUploadModal: boolean;
  onCloseImageUploadModal: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imageUploadForm: ImageUploadFormState;
  onFileDelete: () => void;
  profileForm: ProfileForm;
  onChangeProfileForm: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUpdatingProfile: boolean;
  profileUpdateError: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
}

const MyCommunityInfoUpdate: React.FC<MyCommunityInfoUpdateProps> = ({
  isOpen,
  onClose,
  avatarOptions,
  onSelectPredefinedAvatar,
  onOpenImageUploadModal,
  showImageUploadModal,
  onCloseImageUploadModal,
  onFileSelect,
  imageUploadForm,
  onFileDelete,
  profileForm,
  onChangeProfileForm,
  isUpdatingProfile,
  profileUpdateError,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">내 커뮤니티 프로필 수정</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
          </button>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-left text-m font-bold text-gray-900 mb-4">프로필 이미지</label>
            <div className="grid grid-cols-4 gap-4 mb-4 place-items-center">
              {avatarOptions.map((avatar) => (
                avatar.id === "default" ? (
                  <div className="relative" key={`now-${avatar.id}`}>
                    <div className="relative w-16 h-16 rounded-full flex items-center justify-center border-4 border-orange-400">
                      <img src={avatar.image} alt={avatar.id} className="w-14 h-14 rounded-full" />
                    </div>
                    <div className="absolute -top-1 right-5 text-white bg-orange-500 rounded-full w-fit px-2 py-1 text-xs">
                      Now
                    </div>
                  </div>
                ) : (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => onSelectPredefinedAvatar(avatar.id, avatar.image)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform ${
                      profileForm.selectedAvatar === avatar.id ? "ring-4 ring-blue-500" : ""
                    }`}
                  >
                    <img src={avatar.image} alt={avatar.id} className="w-14 h-14 rounded-full" />
                  </button>
                )
              ))}
              <button
                type="button"
                onClick={onOpenImageUploadModal}
                className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform"
              >
                +
              </button>
            </div>

            {imageUploadForm.selectedFile && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-700 font-medium">선택된 파일: {imageUploadForm.fileName}</span>
                  </div>
                  <button type="button" onClick={onFileDelete} className="text-red-500 hover:text-red-700 text-sm font-medium">
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-left text-m font-bold text-gray-900 mb-2">닉네임</label>
            <input
              type="text"
              name="nickname"
              value={profileForm.nickname}
              onChange={onChangeProfileForm}
              minLength={2}
              maxLength={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUpdatingProfile}
              placeholder="2자 이상 10자 이하로 입력해주세요"
            />
            <p className="mt-1 text-sm text-gray-500">{profileForm.nickname.length}/10자</p>
          </div>

          {profileUpdateError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{profileUpdateError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isUpdatingProfile ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
      <CommunityProfileImgCreate
        isOpen={showImageUploadModal}
        onClose={onCloseImageUploadModal}
        onConfirm={() => {
          if (imageUploadForm.selectedFile) onCloseImageUploadModal();
        }}
        onFileSelect={onFileSelect}
        onFileDelete={onFileDelete}
        imageUploadForm={imageUploadForm}
      />
    </div>
  );
};

export default MyCommunityInfoUpdate;



