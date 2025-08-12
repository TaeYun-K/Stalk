import { useState, useEffect } from 'react';
import { 
  AdvisorApprovalRequest, 
  ApprovalStatus, 
  RejectionReason, 
  ApprovalActionRequest 
} from '@/types';
import AdminService from '@/services/adminService';
import kofiaLogo from '@/assets/images/logos/kofia_logo.png';

const AdminPage = () => {
  const [is_admin] = useState<boolean>(true); // 관리자 권한 변수
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<RejectionReason>(RejectionReason.OTHER);
  const [customReason, setCustomReason] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus>(ApprovalStatus.ALL);
  
  // API 연동을 위한 상태
  const [expertList, setExpertList] = useState<AdvisorApprovalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 초기 데이터 로드
  useEffect(() => {
    fetchApprovalRequests();
  }, [statusFilter]);

  const fetchApprovalRequests = async (pageNo: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AdminService.getApprovalRequests({
        status: statusFilter,
        pageNo: pageNo,
        pageSize: 10
      });
      
      if (pageNo === 1) {
        setExpertList(result.content);
      } else {
        setExpertList(prev => [...prev, ...result.content]);
      }
      
      setHasNext(result.hasNext);
      setCurrentPage(result.pageNo);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching approval requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      setLoading(true);
      await AdminService.approveRequest(requestId);
      
      // 로컬 상태 업데이트
      setExpertList(prev => 
        prev.map(expert => 
          expert.requestId === requestId 
            ? { ...expert, status: 'APPROVED', processedAt: new Date().toISOString() }
            : expert
        )
      );
      
      alert('전문가 인증이 승인되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '승인 처리에 실패했습니다.');
      console.error('Error approving request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (requestId: number) => {
    setSelectedRequestId(requestId);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequestId) return;

    try {
      setLoading(true);
      const request: ApprovalActionRequest = {
        rejectionReason: rejectReason,
        customReason: customReason.trim() || undefined
      };

      await AdminService.rejectRequest(selectedRequestId, request);
      
      // 로컬 상태 업데이트
      setExpertList(prev => 
        prev.map(expert => 
          expert.requestId === selectedRequestId 
            ? { 
                ...expert, 
                status: 'REJECTED', 
                processedAt: new Date().toISOString(),
                rejectionReason: rejectReason,
                customReason: customReason
              }
            : expert
        )
      );
      
      alert('전문가 인증이 거절되었습니다.');
      setShowRejectModal(false);
      setRejectReason(RejectionReason.OTHER);
      setCustomReason('');
      setSelectedRequestId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '거절 처리에 실패했습니다.');
      console.error('Error rejecting request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectReason(RejectionReason.OTHER);
    setCustomReason('');
    setSelectedRequestId(null);
  };

  const handleLoadMore = () => {
    if (hasNext && !loading) {
      fetchApprovalRequests(currentPage + 1);
    }
  };

  const handleStatusFilterChange = (newStatus: ApprovalStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  if (!is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 에러 메시지 */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">닫기</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 페이지</h1>
        </div>

        {/* Sidebar and Content */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg p-6">
            <nav className="space-y-4">
              <div>
                <h2 className="px-4 text-left text-lg font-semibold text-gray-900 mb-4">관리자</h2>
                <ul className="space-y-2">
                  <li>
                    <button className="w-full text-left px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">
                      전문가 자격증 관리
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          </div>



          {/* Main Content */}
          <div className="flex-1">
            <div className="flex justify-between items-center py-4">
              <h2 className="flex items-center text-left text-xl font-semibold text-gray-900">전문가 자격증 관리</h2>
              {/* 필터 */}
              <div className="flex gap-4 items-center">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value as ApprovalStatus)}
                  className="px-4 py-2 focus:outline-none bg-transparent"
                >
                  <option value={ApprovalStatus.ALL}>전체</option>
                  <option value={ApprovalStatus.PENDING}>대기중</option>
                  <option value={ApprovalStatus.APPROVED}>승인됨</option>
                  <option value={ApprovalStatus.REJECTED}>거절됨</option>
                </select>
              </div>
            </div>
            
            <a
              className='flex justify-center items-center font-semibold bg-yellow-400 py-2 px-4 rounded-lg mb-4 hover:bg-yellow-500'
              href="https://license.kofia.or.kr/scsInquiry/ablNoOrg/getAblNoOrgPage.do"
              target="_blank"
              rel="noopener noreferrer">
                <img src={kofiaLogo} alt="kofia_logo" className='w-5 h-5 mr-3' />
                금융투자협회 합격증원본대조 바로가기</a>
            <div className="bg-white">
              {/* Content Header */}
              {/* Expert List */}
              <div className="py-2">
                {loading && expertList.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">로딩 중...</p>
                  </div>
                ) : expertList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    인증 요청이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {expertList.map((expert) => (
                      <div key={expert.requestId} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            {/* Expert Info */}
                            <div className="flex-1">
                              <div className="pl-4 h-fit">
                                <h3 className="text-left text-lg font-bold text-gray-900 mb-1">
                                  {expert.advisorName}
                                </h3>
                                <div className="text-left text-sm text-gray-600 space-y-2">
                                  <p><span className="font-semibold">자격증명:</span> {expert.certificateInfo.certificateName}</p>
                                  <p><span className="font-semibold">자격증 번호: </span>
                                    certificateNumber-birth-serialNumber</p>
                                  <p><span className="font-semibold">이메일:</span> {expert.email}</p>
                                  <p><span className="font-semibold">연락처:</span> {expert.contact}</p>
                                  <p><span className="font-semibold">요청일:</span> {new Date(expert.requestedAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-2 ml-4">
                            {expert.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(expert.requestId)}
                                  disabled={loading}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50"
                                >
                                  자격증 승인
                                </button>
                                <button
                                  onClick={() => handleReject(expert.requestId)}
                                  disabled={loading}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                >
                                  자격증 거절
                                </button>
                              </>
                            )}
                            {expert.status === 'APPROVED' && (
                              <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg">
                                승인완료
                              </span>
                            )}
                            {expert.status === 'REJECTED' && (
                              <span className="px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg">
                                승인거절
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 더보기 버튼 */}
                {hasNext && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          로딩 중...
                        </div>
                      ) : (
                        '더보기'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 거절 모달 */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">거절 사유</h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  거절 사유
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value as RejectionReason)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={RejectionReason.INVALID_CERTIFICATE}>자격증 정보 오류</option>
                  <option value={RejectionReason.EXPIRED_CERTIFICATE}>자격증 만료</option>
                  <option value={RejectionReason.INSUFFICIENT_DOCUMENTS}>서류 미비</option>
                  <option value={RejectionReason.VERIFICATION_FAILED}>신원 확인 실패</option>
                  <option value={RejectionReason.OTHER}>기타</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추가 사유 (선택)
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="추가 사유를 입력해주세요"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  onClick={handleRejectCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleRejectConfirm}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage; 