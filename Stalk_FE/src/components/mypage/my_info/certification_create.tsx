import React from "react";
import certificationExample from "@/assets/images/dummy/certification_example.svg";
import { CertificateApprovalRequest } from "@/types";

interface CertificationCreateProps {
  isOpen: boolean;
  onClose: () => void;
  certForm: CertificateApprovalRequest;
  onChange: (form: CertificateApprovalRequest) => void;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
  isSubmitting: boolean;
}

const CertificationCreate: React.FC<CertificationCreateProps> = ({
  isOpen,
  onClose,
  certForm,
  onChange,
  onSubmit,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full h-[80%] shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">전문 자격 인증</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={onSubmit}>
            <div className="mb-6">
              <img src={certificationExample} alt="Certificate Example" className="w-full max-w-2xl mx-auto" />
            </div>

            <div className="w-full pl-10 text-left border border-gray-200 rounded-lg p-4 mb-6">
              <ul className="text-left text-sm text-gray-700 space-y-3 py-3">
                <li>• 위 합격증 원본대조 번호 입력 방식을 보고 아래 창에 입력해주세요.</li>
                <li>• 입력 시 하이픈('-') 없이 숫자만 입력하시기 바랍니다.</li>
              </ul>
            </div>

            <div className="w-full flex flex-row gap-4 mb-6">
              <div className="w-1/4 flex flex-col gap-3">
                <h3 className="text-left pl-5">전문 자격명</h3>
                <div className="w-full">
                  <select
                    name="certificateName"
                    value={certForm.certificateName}
                    onChange={(e) => onChange({ ...certForm, certificateName: e.target.value })}
                    className="text-sm text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">전문 자격을 선택하세요</option>
                    <option value="financial_advisor">금융투자상담사</option>
                    <option value="securities_analyst">증권분석사</option>
                    <option value="cfa">CFA</option>
                    <option value="cpa">CPA</option>
                  </select>
                </div>
              </div>

              <div className="w-3/4 flex flex-col gap-3">
                <h3 className="text-left pl-5">인증번호 입력</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={certForm.certificateFileSn}
                      onChange={(e) => onChange({ ...certForm, certificateFileSn: e.target.value })}
                      placeholder="('-') 없이 숫자만 입력"
                      maxLength={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">중앙에 위치한 합격증 번호 (8자리)</p>
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={certForm.birth}
                      onChange={(e) => onChange({ ...certForm, birth: e.target.value })}
                      placeholder="YYYYMMDD"
                      maxLength={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">생년월일 (YYYYMMDD)</p>
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={certForm.certificateFileNumber}
                      onChange={(e) => onChange({ ...certForm, certificateFileNumber: e.target.value })}
                      placeholder="6자리 입력"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">발급번호 마지막 6자리</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CertificationCreate;


