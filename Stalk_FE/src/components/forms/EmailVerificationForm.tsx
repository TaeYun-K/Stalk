import React from 'react';
import { useTimer } from '@/hooks';
import { formatTime } from '@/utils';
import { EMAIL_VERIFICATION_TIMER } from '@/constants';

interface EmailVerificationFormProps {
  email: string;
  emailDomain: string;
  verificationCode: string;
  onEmailChange: (_email: string) => void;
  onDomainChange: (_domain: string) => void;
  onCodeChange: (_code: string) => void;
  onSendCode: () => void;
  onVerifyCode: () => void;
  isCodeSent: boolean;
  className?: string;
}

const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  email,
  emailDomain,
  verificationCode,
  onEmailChange,
  onDomainChange,
  onCodeChange,
  onSendCode,
  onVerifyCode,
  isCodeSent,
  className = ''
}) => {
  const { timeLeft, isActive, start } = useTimer(EMAIL_VERIFICATION_TIMER);

  const handleSendCode = () => {
    onSendCode();
    start();
  };

  const fullEmail = `${email}@${emailDomain}`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 이메일 입력 */}
      <div className="flex flex-row items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700 w-1/6 text-left">
          이메일
        </h3>
        <div className="flex space-x-2 flex-1">
          <input
            type="text"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
            placeholder="이메일"
            required
          />
          <span className="flex items-center text-gray-500">@</span>
          <select
            value={emailDomain}
            onChange={(e) => onDomainChange(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
          >
            <option value="">선택하세요</option>
            <option value="gmail.com">gmail.com</option>
            <option value="naver.com">naver.com</option>
            <option value="daum.net">daum.net</option>
            <option value="yahoo.com">yahoo.com</option>
            <option value="nate.com">nate.com</option>
          </select>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={!email || !emailDomain}
            className="bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            인증 발송
          </button>
        </div>
      </div>

      {/* 인증 코드 입력 */}
      {isCodeSent && (
        <div className="flex flex-row items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700 w-1/6 text-left">
            인증번호
          </h3>
          <div className="flex space-x-2 flex-1">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => onCodeChange(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300"
              placeholder="인증번호 6자리를 입력하세요"
              maxLength={6}
              required
            />
            {isActive && (
              <div className="flex items-center text-red-600 text-sm font-medium">
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              type="button"
              onClick={onVerifyCode}
              disabled={!verificationCode}
              className="bg-green-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 이메일 표시 */}
      {email && emailDomain && (
        <div className="text-sm text-gray-600">
          입력된 이메일: <span className="font-medium">{fullEmail}</span>
        </div>
      )}
    </div>
  );
};

export default EmailVerificationForm; 