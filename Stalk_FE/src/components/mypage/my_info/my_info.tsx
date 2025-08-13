import React from "react";
import { formatPhoneNumber } from "@/utils";
import {
  ApprovalHistoryResponse,
  UserInfo,
  UserProfileResponse,
  EditInfoForm,
  ProfileForm,
  PasswordForm,
} from "@/types";
import PasswordUpdate from "@/components/mypage/my_info/password-update";
import MyInfoUpdate from "@/components/mypage/my_info/my_info_update";
import MyCommunityInfoUpdate from "@/components/mypage/my_info/my_community_info_update";
import AccountDelete from "@/components/mypage/my_info/account_delete";
import CertificationCreate from "@/components/mypage/my_info/certification_create";

interface MyInfoProps {
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfileResponse | null;
  userInfo: UserInfo | null;
  editInfoForm: EditInfoForm;
  setEditInfoForm: React.Dispatch<React.SetStateAction<EditInfoForm>>;
  setShowPasswordModal: (open: boolean) => void;
  setShowEditInfoModal: (open: boolean) => void;
  isExpert: boolean;
  certificates: ApprovalHistoryResponse[];
  certLoading: boolean;
  getCertificateDisplayName: (certificateName: string) => string;
  setShowCertModal: (open: boolean) => void;
  setShowProfileEditModal?: (open: boolean) => void;
  getProfileImage: () => string;
  profileForm: ProfileForm;
  setShowWithdrawalModal: (open: boolean) => void;
  // Password update
  showPasswordModal?: boolean;
  passwordForm?: PasswordForm;
  onChangePasswordForm?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitPasswordChange?: (e: React.FormEvent) => Promise<void> | void;
  onClosePasswordModal?: () => void;
  // Edit info modal
  showEditInfoModal?: boolean;
  onChangeEditInfo?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitEditInfo?: (e: React.FormEvent) => Promise<void> | void;
  onCloseEditInfoModal?: () => void;
  // Community profile edit modal
  showProfileEditModal?: boolean;
  avatarOptions?: { id: string; image: string }[];
  onSelectPredefinedAvatar?: (avatarId: string, imageUrl: string) => void;
  onOpenImageUploadModal?: () => void;
  imageUploadForm?: { fileName: string; selectedFile: File | null };
  onFileDelete?: () => void;
  onChangeProfileForm?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUpdatingProfile?: boolean;
  profileUpdateError?: string | null;
  onSubmitProfileEdit?: (e: React.FormEvent) => Promise<void> | void;
  // Account delete modal
  showWithdrawalModal?: boolean;
  onConfirmAccountDelete?: () => Promise<void> | void;
  onCloseWithdrawalModal?: () => void;
  // Certification create modal
  showCertModal?: boolean;
  certForm?: import("@/types").CertificateApprovalRequest;
  onChangeCertForm?: (form: import("@/types").CertificateApprovalRequest) => void;
  onSubmitCertForm?: (e: React.FormEvent) => Promise<void> | void;
  certSubmitting?: boolean;
  onCloseCertModal?: () => void;
  // Image upload modal (forwarded to MyCommunityInfoUpdate)
  showImageUploadModal: boolean;
  onCloseImageUploadModal: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MyInfo: React.FC<MyInfoProps> = ({
  isLoading,
  error,
  userProfile,
  userInfo,
  editInfoForm,
  setEditInfoForm,
  setShowPasswordModal,
  setShowEditInfoModal,
  isExpert,
  certificates,
  certLoading,
  getCertificateDisplayName,
  setShowCertModal,
  setShowProfileEditModal,
  getProfileImage,
  profileForm,
  setShowWithdrawalModal,
  showPasswordModal,
  passwordForm,
  onChangePasswordForm,
  onSubmitPasswordChange,
  onClosePasswordModal,
  showEditInfoModal,
  onChangeEditInfo,
  onSubmitEditInfo,
  onCloseEditInfoModal,
  // community
  showProfileEditModal,
  avatarOptions,
  onSelectPredefinedAvatar,
  onOpenImageUploadModal,
  imageUploadForm,
  onFileDelete,
  onChangeProfileForm,
  isUpdatingProfile,
  profileUpdateError,
  onSubmitProfileEdit,
  // account delete
  showWithdrawalModal,
  onConfirmAccountDelete,
  onCloseWithdrawalModal,
  showCertModal,
  certForm,
  onChangeCertForm,
  onSubmitCertForm,
  certSubmitting,
  onCloseCertModal,
  showImageUploadModal,
  onCloseImageUploadModal,
  onFileSelect,
}) => {
  return (
    <div className="space-y-8">
      {/* 내 정보 Section */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">내 정보</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              비밀번호 변경
            </button>
            <button
              onClick={() => {
                setEditInfoForm((prev) => ({
                  ...prev,
                  name: userProfile?.name || prev.name || "",
                  contact: userProfile?.contact || prev.contact || "",
                  email: prev.email || "",
                }));
                setShowEditInfoModal(true);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              내 정보 수정
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">사용자 정보를 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">⚠️ {error}</div>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">아이디</span>
              <span className="text-gray-900 font-medium">
                {userProfile?.userId || userInfo?.userId || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">이름</span>
              <span className="text-gray-900 font-medium">
                {userProfile?.name || editInfoForm.name || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">휴대폰 번호</span>
              <span className="text-gray-900 font-medium">
                {userProfile?.contact
                  ? formatPhoneNumber(userProfile.contact)
                  : editInfoForm.contact
                  ? formatPhoneNumber(editInfoForm.contact)
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">이메일 주소</span>
              <span className="text-gray-900 font-medium">
                {userProfile?.email || editInfoForm.email || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">회원 구분</span>
              <span className="text-gray-900 font-medium">
                {userProfile?.role === "USER"
                  ? "일반 사용자"
                  : userProfile?.role === "ADVISOR"
                  ? "전문가"
                  : userProfile?.role === "ADMIN"
                  ? "관리자"
                  : "N/A"}
              </span>
            </div>
            {isExpert && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">전문 자격 증명</span>
                
                  {/* 전문자격 증명 */}
                  <div className="flex flex-col items-end gap-2">
                    <div>
                      {certLoading ? (
                        <span className="text-gray-400 text-sm">로딩 중...</span>
                      ) : certificates.length === 0 ? (
                        <span className="text-gray-400 text-sm">인증된 자격증이 없습니다.</span>
                      ) : (
                        certificates.map((cert) => (
                          <div
                            key={cert.requestId}
                            className="flex items-center justify-end space-x-2"
                          >
                            <span className="text-gray-900 font-medium">
                              {getCertificateDisplayName(cert.certificateName)}
                            </span>
                            <div className="flex bg-blue-500 rounded-full px-2 py-0.5 items-center space-x-1">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-white text-xs font-medium">승인</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => setShowCertModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      자격증 추가
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 커뮤니티 프로필 Section */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">커뮤니티 프로필</h2>
          <button
            onClick={() => (setShowProfileEditModal ? setShowProfileEditModal(true) : undefined)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            프로필 편집
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center">
            <img src={getProfileImage()} alt="profile" className="w-10 h-10 rounded-full" />
          </div>
          <span className="text-gray-900 font-medium">
            {userProfile?.nickname || userInfo?.userName || profileForm.nickname}
          </span>
        </div>
      </div>

      {/* 회원탈퇴 Section */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">회원탈퇴</h2>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            회원탈퇴
          </button>
        </div>
      </div>

      <PasswordUpdate
        isOpen={!!showPasswordModal}
        onClose={onClosePasswordModal || (() => {})}
        passwordForm={passwordForm as PasswordForm}
        onChange={onChangePasswordForm || (() => {})}
        onSubmit={onSubmitPasswordChange || (() => {})}
      />

      <MyInfoUpdate
        isOpen={!!showEditInfoModal}
        onClose={onCloseEditInfoModal || (() => {})}
        editInfoForm={editInfoForm}
        onChange={onChangeEditInfo || (() => {})}
        onSubmit={onSubmitEditInfo || (() => {})}
      />

      <MyCommunityInfoUpdate
        isOpen={!!showProfileEditModal}
        onClose={setShowProfileEditModal ? () => setShowProfileEditModal(false) : () => {}}
        avatarOptions={avatarOptions || []}
        onSelectPredefinedAvatar={onSelectPredefinedAvatar || (() => {})}
        onOpenImageUploadModal={onOpenImageUploadModal || (() => {})}
        showImageUploadModal={showImageUploadModal}
        onCloseImageUploadModal={onCloseImageUploadModal}
        onFileSelect={onFileSelect}
        imageUploadForm={imageUploadForm || { fileName: "", selectedFile: null }}
        onFileDelete={onFileDelete || (() => {})}
        profileForm={profileForm}
        onChangeProfileForm={onChangeProfileForm || (() => {})}
        isUpdatingProfile={!!isUpdatingProfile}
        profileUpdateError={profileUpdateError || null}
        onSubmit={onSubmitProfileEdit || (() => {})}
      />

      <AccountDelete
        isOpen={!!showWithdrawalModal}
        onClose={onCloseWithdrawalModal || (setShowWithdrawalModal ? () => setShowWithdrawalModal(false) : () => {})}
        onConfirm={onConfirmAccountDelete || (() => {})}
      />

      <CertificationCreate
        isOpen={!!showCertModal}
        onClose={onCloseCertModal || (() => setShowCertModal && setShowCertModal(false))}
        certForm={certForm as import("@/types").CertificateApprovalRequest}
        onChange={onChangeCertForm || (() => {})}
        onSubmit={onSubmitCertForm || (() => {})}
        isSubmitting={!!certSubmitting}
      />
    </div>
  );
};

export default MyInfo;


