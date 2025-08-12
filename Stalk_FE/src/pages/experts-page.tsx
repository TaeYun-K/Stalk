import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

interface Certificate {
  advisorId: number;
  certificateName: string;
  issuedBy: string;
}

interface Expert {
  id: number;
  name: string;
  profileImageUrl: string;
  preferredStyle: "SHORT" | "MID_SHORT" | "MID" | "MID_LONG" | "LONG";
  shortIntro: string;
  averageRating: number;
  reviewCount: number;
  consultationFee: number;
  isApproved: boolean;
  createdAt: string;
  certificates: Certificate[];
}

interface ApiResponse {
  httpStatus: string;
  isSuccess: boolean;
  message: string;
  code: number;
  result: {
    content: Expert[];
    nextCursor: string | null;
    hasNext: boolean;
    pageSize: number;
    pageNo: number;
  };
}

const ExpertsPage = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API 호출
  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setLoading(true);

        // // 토큰 확인
        // const token = AuthService.getAccessToken();
        // if (!token) {
        //   throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
        // }

        const response = await AuthService.publicRequest("/api/advisors");

        if (response.status === 401) {
          // 401 에러 시 토큰 제거하고 로그인 페이지로 리다이렉트
          AuthService.removeAccessToken();
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch experts");
        }

        const data: ApiResponse = await response.json();
        if (data.isSuccess) {
          setExperts(data.result.content);
        } else {
          throw new Error(data.message || "Failed to fetch experts");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching experts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, [navigate]);

  const filteredExperts = experts.filter((expert) => {
    const matchesSearch =
      expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.shortIntro.toLowerCase().includes(searchTerm.toLowerCase());

    // 카테고리를 두 그룹으로 미리 정의
    const investmentStyles = ["단기", "중단기", "중기", "중장기", "장기"];
    const certificateCategories = [
      "금융투자상담사",
      "증권분석사",
      "CFA",
      "CPA",
    ];

    // 선택된 카테고리를 두 그룹으로 분리
    const selectedInvestmentStyles = selectedCategories.filter((category) =>
      investmentStyles.includes(category)
    );
    const selectedCertificates = selectedCategories.filter((category) =>
      certificateCategories.includes(category)
    );

    let matchesCategories = true;

    if (
      selectedInvestmentStyles.length > 0 ||
      selectedCertificates.length > 0
    ) {
      let investmentStyleMatch = true;
      let certificateMatch = true;

      // 투자성향 그룹 처리 (OR 조건)
      if (selectedInvestmentStyles.length > 0) {
        const styleMap: Record<string, string> = {
          단기: "SHORT",
          중단기: "MID_SHORT",
          중기: "MID",
          중장기: "MID_LONG",
          장기: "LONG",
        };

        investmentStyleMatch = selectedInvestmentStyles.some(
          (style) => styleMap[style] === expert.preferredStyle
        );
      }

      // 자격증 그룹 처리 (OR 조건)
      if (selectedCertificates.length > 0) {
        certificateMatch = selectedCertificates.some((certCategory) =>
          expert.certificates.some((cert) =>
            cert.certificateName.includes(certCategory)
          )
        );
      }

      // 두 그룹 간 AND 처리
      matchesCategories = investmentStyleMatch && certificateMatch;
    }

    return matchesSearch && matchesCategories;
  });

  // 디버깅용 로그
  console.log("전체 전문가 수:", experts.length);
  console.log("선택된 카테고리:", selectedCategories);
  console.log("필터링된 전문가 수:", filteredExperts.length);

  // 모든 전문가의 preferredStyle 값들 확인
  const allStyles = experts.map((expert) => ({
    name: expert.name,
    style: expert.preferredStyle,
  }));
  console.log("모든 전문가의 스타일:", allStyles);

  if (filteredExperts.length > 0) {
    console.log("첫 번째 전문가 스타일:", filteredExperts[0].preferredStyle);
  }

  const sortedExperts = [...filteredExperts].sort((a, b) => {
    const currentUserInfo = AuthService.getUserInfo();
    const currentUserId = currentUserInfo?.id; // 👈 이제 숫자 ID 사용 가능

    // 로그인한 전문가의 글이 있다면 맨 위로 고정
    if (userInfo?.role === "ADVISOR" && currentUserId) {
      const aIsCurrentUser = a.id === currentUserId;
      const bIsCurrentUser = b.id === currentUserId;

      if (aIsCurrentUser && !bIsCurrentUser) return -1;
      if (!aIsCurrentUser && bIsCurrentUser) return 1;

      console.log("로그인한 전문가가 존재하므로 해당 프로필을 맨 위에 고정");
    }

    // 일반 정렬 로직
    if (sortBy === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "many reviews") {
      return b.reviewCount - a.reviewCount;
    }
    return 0;
  });

  const handleCategoryClick = (category: string) => {
    console.log("카테고리 클릭:", category);
    if (category === "전체") {
      // 전체 클릭 시 모든 선택 해제
      setSelectedCategories([]);
      console.log("전체 선택 - 카테고리 초기화");
    } else {
      // 전체가 아닌 카테고리 클릭 시 다중 선택
      setSelectedCategories((prev) => {
        const newCategories = prev.includes(category)
          ? prev.filter((c) => c !== category)
          : [...prev, category];
        console.log("선택된 카테고리들:", newCategories);
        return newCategories;
      });
    }
  };

  const handleExpertClick = (expertId: number) => {
    navigate(`/expert-detail/${expertId}`);
  };

  const getPreferredStyleText = (style: string) => {
    switch (style) {
      case "SHORT":
        return "단기";
      case "MID_SHORT":
        return "중단기";
      case "MID":
        return "중기";
      case "MID_LONG":
        return "중장기";
      case "LONG":
        return "장기";
      default:
        return style;
    }
  };

  const formatConsultationFee = (fee: number) => {
    return `${fee.toLocaleString()}원`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">전문가 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            오류가 발생했습니다
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    // 추천 키워드 및 정렬 ---------------------------------------------------------------------
    <div className="min-h-screen bg-white relative">
      {/* 전문가 등록 버튼 - ADVISOR 역할인 경우에만 표시 */}
      {userInfo?.role === "ADVISOR" && (
        <button
          onClick={() => navigate(`/expert-registration/${userInfo.userId}`)}
          className="fixed bottom-8 right-28 bg-blue-500 px-3 py-2hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-600 group z-50"
          style={{ width: "fit-content" }}
        >
          <div className="flex items-center pb-1">
            <span className="text-2xl font-bold">+</span>
            <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-xs">
              전문가 등록
            </span>
          </div>
        </button>
      )}

      {/* 카테고리 */}
      <div className="max-w-7xl mt-16 mx-auto px-6 py-8">
        {/* Filter/Keywords Section */}
        <div className="flex items-center justify-between mb-8">
          {/* Keywords Section */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <span className="text-gray-700 font-medium whitespace-nowrap">
              추천 키워드
            </span>
            <div
              className="flex space-x-2 overflow-x-auto hide-scrollbar"
              onWheel={(e) => {
                e.preventDefault();
                const container = e.currentTarget;
                container.scrollLeft += e.deltaY;
              }}
            >
              <button
                onClick={() => handleCategoryClick("전체")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.length === 0
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                전체
              </button>
              <button
                onClick={() => handleCategoryClick("단기")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.includes("단기")
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                단기
              </button>
              <button
                onClick={() => handleCategoryClick("중단기")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.includes("중단기")
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                중단기
              </button>
              <button
                onClick={() => handleCategoryClick("중기")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.includes("중기")
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                중기
              </button>
              <button
                onClick={() => handleCategoryClick("중장기")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.includes("중장기")
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                중장기
              </button>
              <button
                onClick={() => handleCategoryClick("장기")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.includes("장기")
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                장기
              </button>
              {/* Certificates */}
              <button
                onClick={() => handleCategoryClick("금융투자상담사")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.includes("금융투자상담사")
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                금융투자상담사
              </button>
              <button
                onClick={() => handleCategoryClick("CFA")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.includes("CFA")
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                CFA
              </button>
              <button
                onClick={() => handleCategoryClick("CPA")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.includes("CPA")
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                CPA
              </button>
              <button
                onClick={() => handleCategoryClick("증권분석사")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategories.includes("증권분석사")
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                증권분석사
              </button>
            </div>
          </div>
          <div className="flex flex-row items-center gap-2 flex-shrink-0 focus:outline-none focus:ring-0">
            <select
              id="sorting"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm text-gray-500 px-4 py-3"
            >
              <option value="recent">최근 등록순</option>
              <option value="many reviews">리뷰 많은순</option>
            </select>
          </div>
        </div>

        {/* 전문가 프로필 목록 --------------------------------------------------------------------- */}
        {/* Expert Profiles */}
        <div className="space-y-6">
          {sortedExperts.map((expert) => {
            const currentUserInfo = AuthService.getUserInfo();
            const currentUserId = currentUserInfo?.id; // ✅ 소문자 id, 숫자 값
            const isCurrentUser =
              userInfo?.role === "ADVISOR" &&
              currentUserId &&
              expert.id === currentUserId; // ✅ 숫자끼리 비교로 정상 매칭

            return (
              <div
                key={expert.id}
                className={`flex flex-col bg-white rounded-lg border transition-all duration-300 cursor-pointer ${
                  isCurrentUser
                    ? "border-blue-500 bg-blue-50 hover:border-blue-600 hover:shadow-xl"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-lg"
                }`}
                onClick={() => handleExpertClick(expert.id)}
              >
                {isCurrentUser && (
                  <span className="flex px-12 py-1 text-sm font-medium bg-blue-500 text-white h-10 w-full rounded-t-lg text-left items-center">
                    내 프로필
                  </span>
                )}
                <div className="px-12 flex h-50 items-start items-end justify-between">
                  <div className="flex-1 py-10">
                    {/* Preferred Style */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-blue-500 py-1 text-xs font-semibold">
                        #{getPreferredStyleText(expert.preferredStyle)}
                      </span>
                      {expert.certificates.map((cert, index) => (
                        <span
                          key={index}
                          className="text-blue-500 py-1 text-xs font-semibold"
                        >
                          #{cert.certificateName}
                        </span>
                      ))}
                    </div>

                    {/* Name and Title & Rating and Reviews */}
                    <div className="mb-3 flex flex-row items-end gap-2">
                      <h3 className="text-left text-2xl font-extrabold text-gray-900">
                        {expert.name}{" "}
                      </h3>
                      <p className="text-left text-blue-600">컨설턴트</p>
                      <div className="flex items-center ml-4">
                        <div className="flex text-yellow-400">⭐</div>
                        <span className="ml-2 font-semibold text-gray-900">
                          {expert.averageRating.toFixed(1)}
                        </span>
                        <span className="ml-4 text-gray-600">
                          리뷰 {expert.reviewCount}개
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-lg font- text-left text-gray-700 mb-4">
                      {expert.shortIntro}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-4 py-2 rounded-2xl text-xs font-medium bg-blue-100 text-blue-700">
                        {formatConsultationFee(expert.consultationFee)}
                      </span>
                      <span className="px-4 py-2 rounded-2xl text-xs font-medium bg-green-100 text-green-700">
                        번개 답변
                      </span>
                    </div>
                  </div>

                  {/* Profile Image */}
                  <div
                    className="w-40 h-50
                 ml-6 flex items-end"
                  >
                    <img
                      src={expert.profileImageUrl}
                      alt={expert.name}
                      className="w-full h-full rounded-lg object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {sortedExperts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              다른 검색어나 카테고리를 시도해보세요
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategories([]);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              전체 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertsPage;
