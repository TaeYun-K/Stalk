import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import advisorService from "@/services/advisorService";
import AdvisorTimeTable from "@/components/AdvisorTimeTable";

interface CareerEntry {
  id: string;
  startDate: string;
  endDate: string;
  company: string;
  position: string;
}

const ExpertsIntroductionRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  // 인적 사항
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [expertContact, setExpertContact] = useState<string>("");

  // 영업관리
  const [experTitle, setExpertTitle] = useState<string>(""); // 간단한 소개
  const [expertIntroduction, setExpertIntroduction] = useState<string>(""); // 상세한 소개
  const [preferredTradeStyle, setPreferredTradeStyle] = useState<string>(""); // 선호하는 거래 스타일
  const [consultationFee, setConsultationFee] = useState<string>(""); // 상담료 (API 연결 준비용)

  // 경력사항
  const [careerEntries, setCareerEntries] = useState<CareerEntry[]>([]);
  const [newCareerEntry, setNewCareerEntry] = useState<Omit<CareerEntry, "id">>(
    {
      startDate: "",
      endDate: "",
      company: "",
      position: "",
    }
  );

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, "");

    // 11자리 이하로 제한
    const limitedNumbers = numbers.slice(0, 11);

    // 전화번호 형식으로 변환
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(
        3,
        7
      )}-${limitedNumbers.slice(7)}`;
    }
  };

  // 전화번호 입력 핸들러
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setExpertContact(formattedValue);
  };

  // 시간 설정 완료 상태
  const [isOperatingHoursComplete, setIsOperatingHoursComplete] =
    useState(false);
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [editingCareerData, setEditingCareerData] =
    useState<CareerEntry | null>(null);

  // 날짜 포맷팅 함수
  const formatDate = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, "");

    // 8자리 이하로 제한
    const limitedNumbers = numbers.slice(0, 8);

    // 날짜 형식으로 변환
    if (limitedNumbers.length <= 4) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 4)}.${limitedNumbers.slice(4)}`;
    } else {
      return `${limitedNumbers.slice(0, 4)}.${limitedNumbers.slice(
        4,
        6
      )}.${limitedNumbers.slice(6)}`;
    }
  };

  // 날짜 유효성 검사 함수
  const isValidDate = (dateString: string) => {
    const regex = /^\d{4}\.\d{2}\.\d{2}$/;
    if (!regex.test(dateString)) return false;

    const parts = dateString.split(".");
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);

    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  // 날짜 입력 핸들러
  const handleDateChange = (value: string, setter: (value: string) => void) => {
    const formattedValue = formatDate(value);
    setter(formattedValue);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setFileName(file.name);
    }
  };

  const handleFileDelete = () => {
    setProfileImage(null);
    setFileName("");
  };

  // 경력사항 추가/삭제
  const addCareerEntry = () => {
    if (
      newCareerEntry.startDate &&
      newCareerEntry.endDate &&
      newCareerEntry.company &&
      newCareerEntry.position
    ) {
      const newEntry: CareerEntry = {
        id: Date.now().toString(),
        ...newCareerEntry,
      };
      setCareerEntries([...careerEntries, newEntry]);
      setNewCareerEntry({
        startDate: "",
        endDate: "",
        company: "",
        position: "",
      });
    }
  };

  const deleteCareerEntry = (id: string) => {
    setCareerEntries(careerEntries.filter((entry) => entry.id !== id));
  };

  // 경력사항 편집 함수들
  const startEditingCareer = (entry: CareerEntry) => {
    setEditingCareerId(entry.id);
    setEditingCareerData(entry);
  };

  const saveCareerEdit = () => {
    if (editingCareerData) {
      setCareerEntries(
        careerEntries.map((entry) =>
          entry.id === editingCareerData.id ? editingCareerData : entry
        )
      );
      setEditingCareerId(null);
      setEditingCareerData(null);
    }
  };

  const cancelCareerEdit = () => {
    setEditingCareerId(null);
    setEditingCareerData(null);
  };

  // 각 항목별 입력 완료 상태 확인 함수들
  const isProfileImageComplete = () => {
    return profileImage !== null;
  };

  const isContactComplete = () => {
    return expertContact.trim() !== "";
  };

  const isCareerComplete = () => {
    return careerEntries.length > 0;
  };

  const isTitleComplete = () => {
    return experTitle.trim() !== "";
  };

  const isIntroductionComplete = () => {
    return expertIntroduction.trim() !== "";
  };

  const isPreferredTradeStyleComplete = () => {
    return preferredTradeStyle !== "";
  };

  const isConsultationFeeComplete = () => {
    return consultationFee.trim() !== "";
  };

  const checkOperatingHoursComplete = () => {
    return isOperatingHoursComplete;
  };

  // 전체 등록 처리 함수
  const handleSubmitAll = async () => {
    try {
      console.log("Starting registration process...");

      // 필수 필드 검증
      if (!experTitle.trim()) {
        alert("전문가 제목(간단 소개)을 입력해주세요.");
        return;
      }
      if (careerEntries.length === 0) {
        alert("경력 정보를 최소 1개 이상 입력해주세요.");
        return;
      }

      // 1. 프로필 이미지 업로드
      let uploadedImageUrl = "";
      if (profileImage) {
        try {
          const response = await advisorService.uploadProfileImage(
            profileImage
          );
          uploadedImageUrl = response.fileUrl;
          console.log("Profile image uploaded:", uploadedImageUrl);
        } catch (error) {
          console.error("Profile image upload failed:", error);
          alert("프로필 이미지 업로드에 실패했습니다.");
          return;
        }
      }

      // 2. 프로필 데이터 생성
      const profileData = {
        profileImageUrl: uploadedImageUrl,
        publicContact: expertContact,
        shortIntro: experTitle.trim(), // experTitle을 shortIntro에 매핑
        longIntro: expertIntroduction,
        preferredTradeStyle: preferredTradeStyle || "MID_LONG", // 기본값 설정
        careerEntries: careerEntries.map((entry) => ({
          action: "CREATE",
          title: entry.company, // company를 title에 매핑
          description: entry.position, // position을 description에 매핑
          startedAt: entry.startDate.replace(/\./g, "-"),
          endedAt: entry.endDate ? entry.endDate.replace(/\./g, "-") : null,
        })),
        consultationFee: consultationFee,
      };

      console.log("Submitting profile data:", profileData);

      // 3. 프로필 데이터 전송
      const response = await advisorService.createProfile(profileData);
      console.log("Profile created successfully:", response);
      const expertId = response.id; // 응답에서 전문가 ID를 가져와야 함 (API 응답 구조에 따라 달라질 수 있음)

      alert("전문가 프로필이 성공적으로 등록되었습니다.");

      // 5. 전문가 상세 페이지로 이동
      if (expertId) {
        navigate(`/expert-detail/${expertId}`);
      } else {
        // expertId가 없는 경우, 목록 페이지나 마이페이지 등으로 이동
        navigate("/experts-page");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("등록 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 pt-28">
          <div className="flex gap-8 relative">
            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 space-y-12">
              {/* 페이지 제목 */}
              <div className="text-3xl font-semibold text-black mb-8">
                Stalk 전문가 소개 등록
              </div>
              <div className="w-full pl-10 text-left bg-gray-100 rounded-lg p-4 mb-6">
                <h3 className="text-left text-md font-semibold text-black py-1">
                  자격(면허)에 대한 안내
                </h3>
                <ul className="text-left text-sm text-gray-700 space-y-3 py-2">
                  <li>
                    • 회원가입 시 입력한 자격증 정보가 연동되어 자동으로
                    등록됩니다.
                  </li>
                  <li>
                    • 자격증 추가를 원하시는 경우 마이페이지에서 직접 추가할 수
                    있습니다.
                  </li>
                </ul>
              </div>
              {/* 인적사항 섹션 */}
              <section className="space-y-8">
                <div className="text-left text-2xl font-semibold text-black border-b border-black pb-2">
                  인적사항
                </div>

                {/* 프로필 사진 등록 */}
                <div className="space-y-4">
                  <h3 className="text-left text-xl font-semibold text-black">
                    프로필 사진 등록
                  </h3>
                  <div className="flex gap-6 items-start">
                    <div className="w-48 h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <img
                          src={URL.createObjectURL(profileImage)}
                          alt="Profile"
                          className="w-full h-full object-cover object-top rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full object-cover rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">사진 미리보기</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-row">
                        <label className="whitespace-nowrap text-sm font-medium text-black pt-3 pr-4">
                          파일명
                        </label>
                        <div className="w-full space-y-2">
                          <input
                            type="text"
                            value={fileName}
                            readOnly
                            placeholder="파일을 선택해주세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <div className="flex gap-4 pb-2">
                            <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors text-sm">
                              파일등록
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>

                            <button
                              onClick={handleFileDelete}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              파일삭제
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pl-14 text-left text-sm text-gray-600 space-y-2">
                        <p>· 프로필 사진은 300x400px 사이즈를 권장합니다.</p>
                        <p>
                          · 파일 형식은 JPG(.jpg, .jpeg) 또는 PNG(.png)만
                          지원합니다.
                        </p>
                        <p>· 업로드 파일 용량은 2MB 이하만 가능합니다.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 전문가 공개 연락처 */}
                <div className="space-y-2">
                  <h3 className="text-left text-xl font-semibold text-black">
                    전문가 공개 연락처
                  </h3>
                  <input
                    type="text"
                    value={expertContact}
                    onChange={handleContactChange}
                    placeholder="000-0000-0000"
                    maxLength={13}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* 경력사항 섹션 */}
                <div className="space-y-4">
                  <h3 className="text-left text-xl font-semibold text-black">
                    경력사항
                  </h3>

                  <div className="w-full pl-10 text-left bg-gray-100 rounded-lg p-4 mb-6">
                    <ul className="text-left text-sm text-gray-700 space-y-3 py-2">
                      <li>
                        • 퇴사일자에 빈 값으로 두시면 "재직 중"으로 인식됩니다.
                      </li>
                      <li>
                        • 경력사항 입력 후 반드시 (+) 버튼을 눌러 추가해주세요.
                      </li>
                    </ul>
                  </div>

                  {/* 경력사항 테이블 */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-600 text-white">
                          <th className="p-2 text-center font-medium text-sm">
                            입사일자
                          </th>
                          <th className="p-2 text-center font-medium text-sm">
                            퇴사일자
                          </th>
                          <th className="p-2 text-center font-medium text-sm">
                            회사명(부서명)
                          </th>
                          <th className="p-2 text-center font-medium text-sm">
                            직책
                          </th>
                          <th className="p-2 text-center font-medium text-sm"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 기존 경력사항 항목들 */}
                        {careerEntries.map((entry) => {
                          const isEditing = editingCareerId === entry.id;
                          return (
                            <tr key={entry.id}>
                              {isEditing && editingCareerData ? (
                                <>
                                  <td className="p-2 relative">
                                    <div className="flex">
                                      <input
                                        type="text"
                                        value={editingCareerData.startDate}
                                        onChange={(e) =>
                                          handleDateChange(
                                            e.target.value,
                                            (value) =>
                                              setEditingCareerData({
                                                ...editingCareerData,
                                                startDate: value,
                                              })
                                          )
                                        }
                                        placeholder="0000.00.00"
                                        maxLength={10}
                                        className={`flex-1 px-3 py-2 border rounded-l-lg text-sm focus:outline-none focus:border-blue-500 ${
                                          editingCareerData.startDate &&
                                          !isValidDate(
                                            editingCareerData.startDate
                                          )
                                            ? "border-red-500"
                                            : "border-gray-300"
                                        }`}
                                      />
                                    </div>
                                  </td>
                                  <td className="p-2 relative">
                                    <div className="flex">
                                      <input
                                        type="text"
                                        value={editingCareerData.endDate}
                                        onChange={(e) =>
                                          handleDateChange(
                                            e.target.value,
                                            (value) =>
                                              setEditingCareerData({
                                                ...editingCareerData,
                                                endDate: value,
                                              })
                                          )
                                        }
                                        placeholder="0000.00.00"
                                        maxLength={10}
                                        className={`flex-1 px-3 py-2 border rounded-l-lg text-sm focus:outline-none focus:border-blue-500 ${
                                          editingCareerData.endDate &&
                                          !isValidDate(
                                            editingCareerData.endDate
                                          )
                                            ? "border-red-500"
                                            : "border-gray-300"
                                        }`}
                                      />
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={editingCareerData.company}
                                      onChange={(e) =>
                                        setEditingCareerData({
                                          ...editingCareerData,
                                          company: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={editingCareerData.position}
                                      onChange={(e) =>
                                        setEditingCareerData({
                                          ...editingCareerData,
                                          position: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={saveCareerEdit}
                                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs"
                                      >
                                        저장
                                      </button>
                                      <button
                                        onClick={cancelCareerEdit}
                                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="p-3 text-sm">
                                    {entry.startDate}
                                  </td>
                                  <td className="p-3 text-sm">
                                    {entry.endDate}
                                  </td>
                                  <td className="p-3 text-sm">
                                    {entry.company}
                                  </td>
                                  <td className="p-3 text-sm">
                                    {entry.position}
                                  </td>
                                  <td className="p-2">
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() =>
                                          startEditingCareer(entry)
                                        }
                                        className="px-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-2xs"
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={() =>
                                          deleteCareerEntry(entry.id)
                                        }
                                        className="px-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-2xs"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}

                        {/* 새로운 경력사항 입력 행 */}
                        <tr>
                          <td className="p-2 relative">
                            <div className="flex">
                              <input
                                type="text"
                                value={newCareerEntry.startDate}
                                onChange={(e) =>
                                  handleDateChange(e.target.value, (value) =>
                                    setNewCareerEntry({
                                      ...newCareerEntry,
                                      startDate: value,
                                    })
                                  )
                                }
                                placeholder="0000.00.00"
                                maxLength={10}
                                className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 ${
                                  newCareerEntry.startDate &&
                                  !isValidDate(newCareerEntry.startDate)
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />
                            </div>
                          </td>
                          <td className="p-2 relative">
                            <div className="flex">
                              <input
                                type="text"
                                value={newCareerEntry.endDate}
                                onChange={(e) =>
                                  handleDateChange(e.target.value, (value) =>
                                    setNewCareerEntry({
                                      ...newCareerEntry,
                                      endDate: value,
                                    })
                                  )
                                }
                                placeholder="0000.00.00"
                                maxLength={10}
                                className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 ${
                                  newCareerEntry.endDate &&
                                  !isValidDate(newCareerEntry.endDate)
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={newCareerEntry.company}
                              onChange={(e) =>
                                setNewCareerEntry({
                                  ...newCareerEntry,
                                  company: e.target.value,
                                })
                              }
                              placeholder="회사명(부서명)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={newCareerEntry.position}
                              onChange={(e) =>
                                setNewCareerEntry({
                                  ...newCareerEntry,
                                  position: e.target.value,
                                })
                              }
                              placeholder="직책"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex space-x-1">
                              <button
                                onClick={addCareerEntry}
                                className="px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-s"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* 영업 관리 섹션 */}
              <section className="space-y-8">
                <div className="text-left text-2xl font-semibold text-black border-b border-black pb-2">
                  영업 관리
                </div>

                {/* 전문가 소개 타이틀 */}
                <div className="space-y-2">
                  <label className="block text-left text-lg font-semibold text-black">
                    전문가 소개 타이틀
                  </label>
                  <textarea
                    value={experTitle}
                    onChange={(e) => setExpertTitle(e.target.value)}
                    placeholder="전문가 소개 타이틀을 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* 전문가 소개 */}
                <div className="space-y-2">
                  <label className="block text-left text-lg font-semibold text-black">
                    전문가 소개
                  </label>
                  <textarea
                    value={expertIntroduction}
                    onChange={(e) => setExpertIntroduction(e.target.value)}
                    placeholder="전문가 소개를 입력하세요"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* 상담 가능 거래 스타일 (단일 선택) */}
                <div className="space-y-2">
                  <label className="block text-left text-lg font-semibold text-black">
                    상담 가능 거래 스타일
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "단기", value: "SHORT" },
                      { label: "중단기", value: "MID_SHORT" },
                      { label: "중기", value: "MID" },
                      { label: "중장기", value: "MID_LONG" },
                      { label: "장기", value: "LONG" },
                    ].map((opt) => {
                      const selected = preferredTradeStyle === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setPreferredTradeStyle(opt.value)}
                          className={
                            `px-4 py-2 rounded-full border text-sm font-medium transition-colors ` +
                            (selected
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white focus:bg-blue-500 focus:text-white")
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 시간당 상담료 설정 (준비만, API 미연결) */}
                <div className="space-y-2">
                  <label className="block text-left text-lg font-semibold text-black">
                    시간 당 상담료 설정
                    <span className="text-sm text-gray-500 ml-2 font-normal">
                      (단위: 원)
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={consultationFee}
                    onChange={(e) => {
                      // 숫자만 허용
                      const onlyNums = e.target.value.replace(/[^\d]/g, "");
                      setConsultationFee(onlyNums);
                    }}
                    placeholder="예: 30000"
                    className="w-full px-4 py-3 border border-blue-500 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:bg-blue-50"
                  />
                </div>

                {/* 초기 상담 영업 시간 설정 */}
                <div>
                  <h3 className="py-3 text-left text-lg font-semibold text-black">
                    초기 상담 영업 시간 설정
                  </h3>
                  <AdvisorTimeTable
                    onOperatingHoursChange={setIsOperatingHoursComplete}
                  />
                </div>
              </section>
            </div>

            {/* 사이드바 */}
            <div className="w-80 flex-shrink-0 ml-4">
              <div className="fixed top-32 right-30 w-80 z-10">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-left font-semibold text-black border-b border-gray-300 pb-2 mb-4">
                        인적사항
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isProfileImageComplete()
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span>프로필 사진 등록</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isContactComplete()
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span>전문가 공개 연락처</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isCareerComplete() ? "bg-blue-500" : "bg-gray-300"
                            }`}
                          ></div>
                          <span>경력사항</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-left font-semibold text-black border-b border-gray-300 pb-2 mb-4">
                        영업 관리
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isTitleComplete() ? "bg-blue-500" : "bg-gray-300"
                            }`}
                          ></div>
                          <span>전문가 소개 타이틀</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isIntroductionComplete()
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span>전문가 소개</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isPreferredTradeStyleComplete()
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span>상담 가능 거래 스타일</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isConsultationFeeComplete()
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span>시간당 상담료 설정</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              checkOperatingHoursComplete()
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span>초기 상담 영업 시간 설정</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSubmitAll}
                  className="w-full py-3 mt-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpertsIntroductionRegistrationPage;
