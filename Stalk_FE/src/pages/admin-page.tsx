import { useState, useEffect } from 'react';

const AdminPage = () => {
  const [is_admin] = useState<boolean>(true); // 관리자 권한 변수
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [selectedExpertId, setSelectedExpertId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [expertList, setExpertList] = useState([
    {
      id: 1,
      name: '제임스',
      qualifications: 'CFA, CPA',
      title: 'ChartMaster',
      email: 'abcdef@google.com',
      phone: '010-0000-0000',
      description: '중급 수치<-여유있는 실력 우수 수준 전문적인 분석을 제공합니다',
      status: 'pending',
      profileImage: '/api/placeholder/80/80'
    },
    {
      id: 2,
      name: '박주현',
      qualifications: '금융투자전문상담사',
      title: 'ChartMaster',
      email: 'abcdef@google.com',
      phone: '010-0000-0000',
      description: '중급 수치<-여유있는 실력 우수 수준 전문적인 분석을 제공합니다',
      status: 'pending',
      profileImage: '/api/placeholder/80/80'
    },
    {
      id: 3,
      name: '제임스',
      qualifications: 'CFA, CPA',
      title: 'ChartMaster',
      email: 'abcdef@google.com',
      phone: '010-0000-0000',
      description: '중급 수치<-여유있는 실력 우수 수준 전문적인 분석을 제공합니다',
      status: 'pending',
      profileImage: '/api/placeholder/80/80'
    },
    {
      id: 4,
      name: '박주현',
      qualifications: '금융투자전문상담사',
      title: 'ChartMaster',
      email: 'abcdef@google.com',
      phone: '010-0000-0000',
      description: '중급 수치<-여유있는 실력 우수 수준 전문적인 분석을 제공합니다',
      status: 'pending',
      profileImage: '/api/placeholder/80/80'
    },
    {
      id: 5,
      name: '박주현',
      qualifications: '금융투자전문상담사',
      title: 'ChartMaster',
      email: 'abcdef@google.com',
      phone: '010-0000-0000',
      description: '중급 수치<-여유있는 실력 우수 수준 전문적인 분석을 제공합니다',
      status: 'pending',
      profileImage: '/api/placeholder/80/80'
    }
  ]);

  useEffect(() => {
    console.log('AdminPage 컴포넌트 렌더링됨');
  }, []);

  const handleApprove = (expertId: number) => {
    setExpertList(prev => 
      prev.map(expert => 
        expert.id === expertId 
          ? { ...expert, status: 'approved' }
          : expert
      )
    );
    alert('상담이 승인되었습니다.');
  };

  const handleReject = (expertId: number) => {
    setSelectedExpertId(expertId);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }

    if (selectedExpertId) {
      setExpertList(prev => 
        prev.map(expert => 
          expert.id === selectedExpertId 
            ? { ...expert, status: 'rejected', rejectReason }
            : expert
        )
      );
      alert('상담이 거절되었습니다.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedExpertId(null);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedExpertId(null);
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
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 페이지</h1>
          
        </div>

        {/* Sidebar and Content */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-md p-6">
            <nav className="space-y-4">
              <div>
                <h2 className="text-left text-lg font-semibold text-gray-900 mb-4">관리</h2>
                <ul className="space-y-2">
                  <li>
                    <button className="w-full text-left px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">
                      전문 자격 관리
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                      제한된 사용자
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md">
              {/* Content Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-left text-xl font-semibold text-gray-900">전문가 승인 대기 목록</h2>
              </div>

              {/* Expert List */}
              <div className="p-6">
                <div className="space-y-6">
                  {expertList.map((expert) => (
                    <div key={expert.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {/* Profile Image */}
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <img 
                              src={expert.profileImage} 
                              alt={expert.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          </div>

                          {/* Expert Info */}
                          <div className="flex-1">
                            <div className="mb-4">
                              <h3 className="text-left text-lg font-bold text-gray-900 mb-1">
                                {expert.name}
                              </h3>
                              <div className="text-left text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">자격증:</span> {expert.qualifications}</p>
                                <p><span className="font-medium">직함:</span> {expert.title}</p>
                                <p><span className="font-medium">이메일:</span> {expert.email}</p>
                                <p><span className="font-medium">연락처:</span> {expert.phone}</p>
                              </div>
                            </div>
                            <p className="text-left text-sm text-gray-700">
                              {expert.description}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2 ml-4">
                          {expert.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(expert.id)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                상담 승인
                              </button>
                              <button
                                onClick={() => handleReject(expert.id)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                상담 거절
                              </button>
                            </>
                          )}
                          {expert.status === 'approved' && (
                            <span className="px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg">
                              승인됨
                            </span>
                          )}
                          {expert.status === 'rejected' && (
                            <span className="px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg">
                              거절됨
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              
              <div className="mb-6">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="거절 사유를 입력해주세요"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default AdminPage; 