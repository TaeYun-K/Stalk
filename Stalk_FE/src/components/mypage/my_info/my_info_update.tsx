import React from "react";
import { EditInfoForm } from "@/types";

interface MyInfoUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  editInfoForm: EditInfoForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
}

const MyInfoUpdate: React.FC<MyInfoUpdateProps> = ({
  isOpen,
  onClose,
  editInfoForm,
  onChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">내 정보 수정</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">이름</label>
            <input
              type="text"
              name="name"
              value={editInfoForm.name}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">연락처</label>
            <input
              type="tel"
              name="contact"
              value={editInfoForm.contact}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyInfoUpdate;



