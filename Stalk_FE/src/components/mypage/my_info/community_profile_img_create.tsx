import React from "react";

interface ImageUploadFormState {
  fileName: string;
  selectedFile: File | null;
}

interface CommunityProfileImgCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDelete: () => void;
  imageUploadForm: ImageUploadFormState;
}

const CommunityProfileImgCreate: React.FC<CommunityProfileImgCreateProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onFileSelect,
  onFileDelete,
  imageUploadForm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">프로필 이미지 추가</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <form className="flex flex-col space-y-6">
          <div className="flex flex-col">
            <label className="block justify-start text-sm font-medium text-gray-700 mb-2">파일명</label>
            <input
              type="text"
              value={imageUploadForm.fileName}
              placeholder="파일을 선택해주세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
          </div>
          <div className="flex space-x-3 justify-end">
            <input type="file" id="file-upload" accept=".jpg,.jpeg,.png" onChange={onFileSelect} className="hidden" />
            <label
              htmlFor="file-upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer"
            >
              파일등록
            </label>
            <button
              type="button"
              onClick={onFileDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              파일삭제
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="text-left text-sm text-gray-600 space-y-1">
              <li>• 프로필 사진은 정사각형 사이즈를 권장합니다.</li>
              <li>• 지원하는 파일 형식: JPGE(.jpg, .jpeg), PNG(.png)</li>
              <li>• 업로드 파일 용량은 2MB 이하만 가능합니다.</li>
            </ul>
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!imageUploadForm.selectedFile}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommunityProfileImgCreate;


