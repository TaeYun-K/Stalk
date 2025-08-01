import React from 'react';
import { QualificationData } from '@/types';
import { QUALIFICATIONS } from '@/constants';

interface QualificationFormProps {
  qualifications: QualificationData[];
  onChange: (_qualifications: QualificationData[]) => void;
  className?: string;
}

const QualificationForm: React.FC<QualificationFormProps> = ({
  qualifications,
  onChange,
  className = ''
}) => {
  const addQualification = () => {
    const newQualification: QualificationData = {
      qualification: '',
      certificateNumber: '',
      birthDate: '',
      verificationNumber: ''
    };
    onChange([...qualifications, newQualification]);
  };

  const removeQualification = (index: number) => {
    const updated = qualifications.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateQualification = (index: number, field: keyof QualificationData, value: string) => {
    const updated = qualifications.map((qual, i) => 
      i === index ? { ...qual, [field]: value } : qual
    );
    onChange(updated);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">전문 자격 증명</h3>
        <button
          type="button"
          onClick={addQualification}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
        >
          + 자격증 추가
        </button>
      </div>

      {qualifications.map((qual, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">자격증 {index + 1}</h4>
            {qualifications.length > 1 && (
              <button
                type="button"
                onClick={() => removeQualification(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                삭제
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 자격증 종류 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자격증 종류 *
              </label>
              <select
                value={qual.qualification}
                onChange={(e) => updateQualification(index, 'qualification', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">선택하세요</option>
                {QUALIFICATIONS.map((qualification) => (
                  <option key={qualification} value={qualification}>
                    {qualification}
                  </option>
                ))}
              </select>
            </div>

            {/* 자격증 번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자격증 번호 *
              </label>
              <input
                type="text"
                value={qual.certificateNumber}
                onChange={(e) => updateQualification(index, 'certificateNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="자격증 번호를 입력하세요"
                required
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생년월일 *
              </label>
              <input
                type="date"
                value={qual.birthDate}
                onChange={(e) => updateQualification(index, 'birthDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* 검증 번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검증 번호 *
              </label>
              <input
                type="text"
                value={qual.verificationNumber}
                onChange={(e) => updateQualification(index, 'verificationNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="검증 번호를 입력하세요"
                required
              />
            </div>
          </div>
        </div>
      ))}

      {/* 자격증 이미지 업로드 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">자격증 인증 안내</p>
            <ul className="space-y-1 text-blue-700">
              <li>• 자격증 사본을 첨부해주세요</li>
              <li>• 관리자 승인 후 전문가 서비스 이용이 가능합니다</li>
              <li>• 승인 과정은 1-2 영업일이 소요됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualificationForm; 