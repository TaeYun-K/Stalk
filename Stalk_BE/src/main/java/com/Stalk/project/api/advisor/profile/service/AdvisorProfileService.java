package com.Stalk.project.api.advisor.profile.service;

import com.Stalk.project.api.advisor.profile.dao.AdvisorProfileMapper;
import com.Stalk.project.api.advisor.profile.dto.in.AdvisorCertificateApprovalRequestDto;
import com.Stalk.project.api.advisor.profile.dto.in.AdvisorProfileCreateRequestDto;
import com.Stalk.project.api.advisor.profile.dto.in.AdvisorProfileUpdateRequestDto;
import com.Stalk.project.api.advisor.profile.dto.in.CareerEntryDto;
import com.Stalk.project.api.advisor.profile.dto.out.AdvisorProfileResponseDto;
import com.Stalk.project.api.advisor.profile.dto.out.ApprovalHistoryResponseDto;
import com.Stalk.project.api.advisor.profile.dto.out.CertificateApprovalResponseDto;
import com.Stalk.project.api.user.service.FileStorageService;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdvisorProfileService {

    private final AdvisorProfileMapper advisorProfileMapper;
    private final FileStorageService fileStorageService;

    // ===== 프로필 등록 =====

    @Transactional
    public AdvisorProfileResponseDto createAdvisorProfile(Long advisorId, AdvisorProfileCreateRequestDto request) {
        log.info("Creating advisor profile for advisorId: {}", advisorId);

        // 1. 전문가 승인 여부 확인
        validateApprovedAdvisor(advisorId);

        // 2. 이미 프로필이 등록되어 있는지 확인
        Boolean hasProfile = advisorProfileMapper.hasAdvisorDetailInfo(advisorId);
        if (Boolean.TRUE.equals(hasProfile)) {
            throw new BaseException(BaseResponseStatus.ADVISOR_PROFILE_ALREADY_EXISTS);
        }

        // 3. 경력 정보 유효성 검증
        validateCareerEntriesForCreate(request.getCareerEntries());

        try {
            // 이미지 업로드
            if (request.getProfileImage() != null && !request.getProfileImage().isEmpty()) {
                String url = fileStorageService.storeFile(request.getProfileImage());
                request.setProfileImageUrl(url);
                request.setProfileImage(null);
            }

            // 4. 프로필 상세 정보 등록
            advisorProfileMapper.insertAdvisorDetailInfo(advisorId, request);

            // 5. advisor 테이블 업데이트 (상담료 및 프로필 완성 상태)
            advisorProfileMapper.updateAdvisorProfileCompletion(advisorId, request.getConsultationFee());


            // 6. 경력 정보 등록
            for (CareerEntryDto career : request.getCareerEntries()) {
                int careerResult = advisorProfileMapper.insertCareerEntry(advisorId, career);
                if (careerResult == 0) {
                    throw new BaseException(BaseResponseStatus.CAREER_ENTRY_CREATE_FAILED);
                }
            }

            log.info("Successfully created advisor profile for advisorId: {}", advisorId);
            return AdvisorProfileResponseDto.success("프로필이 성공적으로 등록되었습니다.");

        } catch (Exception e) {
            log.error("Failed to create advisor profile for advisorId: {}", advisorId, e);
            throw new BaseException(BaseResponseStatus.ADVISOR_PROFILE_CREATE_FAILED);
        }
    }

    // ===== 프로필 수정 =====
    @Transactional
    public AdvisorProfileResponseDto updateAdvisorProfile(
        Long advisorId,
        AdvisorProfileUpdateRequestDto request
    ) {
        log.info("Updating advisor profile for advisorId: {}", advisorId);

        // 1) 전문가 승인 여부 확인
        validateApprovedAdvisor(advisorId);

        // 2) 프로필 존재 여부 확인
        Boolean hasProfile = advisorProfileMapper.hasAdvisorDetailInfo(advisorId);
        if (!Boolean.TRUE.equals(hasProfile)) {
            throw new BaseException(BaseResponseStatus.ADVISOR_PROFILE_NOT_FOUND);
        }

        // 3) 업데이트할 내용이 있는지 확인
        if (!request.hasAnyUpdates()) {
            throw new BaseException(BaseResponseStatus.NO_UPDATE_FIELDS);
        }

        try {
            // 4) 이미지 처리: 새 파일이 들어온 경우에만 업로드 -> URL 세팅
            if (request.getProfileImage() != null && !request.getProfileImage().isEmpty()) {
                String uploadedUrl = fileStorageService.storeFile(request.getProfileImage());
                request.setProfileImageUrl(uploadedUrl); // 이제 타입 에러 없음
                request.setProfileImage(null); // DB 내려갈 때 MultipartFile 제거
            }

            // 5) 프로필 기본 정보 수정 (여기서는 문자열/숫자 등 DB에 들어갈 값만 사용해야 함)
            updateProfileBasicInfo(advisorId, request);

            // 6) 경력 정보 변경 처리
            if (request.hasCareerChanges()) {
                processCareerChanges(advisorId, request);
            }

            log.info("Successfully updated advisor profile for advisorId: {}", advisorId);
            return AdvisorProfileResponseDto.success("프로필이 성공적으로 수정되었습니다.");

        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update advisor profile for advisorId: {}", advisorId, e);
            throw new BaseException(BaseResponseStatus.ADVISOR_PROFILE_UPDATE_FAILED);
        }
    }


    // ===== 자격증 승인 요청 =====

    @Transactional
    public CertificateApprovalResponseDto requestCertificateApproval(Long advisorId, AdvisorCertificateApprovalRequestDto request) {
        log.info("Processing certificate approval request for advisorId: {}, isReRequest: {}",
            advisorId, request.isReRequest());

        // 1. 재요청인 경우 이전 요청 유효성 확인
        if (request.isReRequest()) {
            validatePreviousRequest(advisorId, request.getPreviousRequestId());
        }

        try {
            // 2. 승인 요청 등록
            int result = advisorProfileMapper.insertApprovalRequest(advisorId, request);
            if (result == 0) {
                throw new BaseException(BaseResponseStatus.APPROVAL_REQUEST_FAILED);
            }

            // 3. 생성된 요청 ID 조회
            Long requestId = advisorProfileMapper.getLastInsertedApprovalRequestId();

            log.info("Successfully created approval request with ID: {} for advisorId: {}", requestId, advisorId);

            // 4. 응답 생성
            CertificateApprovalResponseDto response = request.isReRequest()
                ? CertificateApprovalResponseDto.reRequest(requestId)
                : CertificateApprovalResponseDto.newRequest(requestId);

            return response.withMessage("자격 승인 요청이 접수되었습니다.");

        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to process certificate approval request for advisorId: {}", advisorId, e);
            throw new BaseException(BaseResponseStatus.APPROVAL_REQUEST_FAILED);
        }
    }

    // ===== 승인 이력 조회 =====

    public CursorPage<ApprovalHistoryResponseDto> getApprovalHistory(Long advisorId, PageRequestDto pageRequest) {
        log.info("Getting approval history for advisorId: {}, page: {}", advisorId, pageRequest.getPageNo());

        try {
            // 1. 승인 이력 조회 (LinkedHashMap으로 받아서 변환)
            List<LinkedHashMap<String, Object>> rawHistory = advisorProfileMapper.findApprovalHistory(advisorId, pageRequest);

            // 2. LinkedHashMap을 ApprovalHistoryResponseDto로 변환
            List<ApprovalHistoryResponseDto> history = rawHistory.stream()
                .map(this::convertToApprovalHistoryDto)
                .collect(Collectors.toList());

            // 3. 페이지네이션 처리
            boolean hasNext = history.size() > pageRequest.getPageSize();
            if (hasNext) {
                history.remove(history.size() - 1);
            }

            Long nextCursor = hasNext && !history.isEmpty()
                ? history.get(history.size() - 1).getRequestId()
                : null;

            return CursorPage.<ApprovalHistoryResponseDto>builder()
                .content(history)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .pageSize(pageRequest.getPageSize())
                .pageNo(pageRequest.getPageNo())
                .build();

        } catch (Exception e) {
            log.error("Failed to get approval history for advisorId: {}", advisorId, e);
            throw new BaseException(BaseResponseStatus.APPROVAL_HISTORY_FETCH_FAILED);
        }
    }

    // ===== Private Helper Methods =====

    /**
     * 전문가 승인 상태 검증
     */
    private void validateApprovedAdvisor(Long advisorId) {
        Boolean isApproved = advisorProfileMapper.isApprovedAdvisor(advisorId);
        if (!Boolean.TRUE.equals(isApproved)) {
            throw new BaseException(BaseResponseStatus.ADVISOR_NOT_APPROVED);
        }
    }

    /**
     * 프로필 등록 시 경력 정보 유효성 검증
     */
    private void validateCareerEntriesForCreate(List<CareerEntryDto> careerEntries) {
        if (careerEntries == null || careerEntries.isEmpty()) {
            throw new BaseException(BaseResponseStatus.CAREER_ENTRIES_REQUIRED);
        }

        // CREATE 액션이 아닌 경력이 있으면 안됨
        boolean hasInvalidAction = careerEntries.stream()
            .anyMatch(career -> career.getAction() != null && !career.isCreateAction());

        if (hasInvalidAction) {
            throw new BaseException(BaseResponseStatus.INVALID_CAREER_ACTION_FOR_CREATE);
        }
    }

    private void updateProfileBasicInfo(Long advisorId, AdvisorProfileUpdateRequestDto request) {
        log.info("=== updateProfileBasicInfo 시작 ===");
        log.info("advisorId: {}", advisorId);
        log.info("consultationFee: {}", request.getConsultationFee());

        // advisor_detail_info 테이블 업데이트
        if (request.getProfileImageUrl() != null ||
                        request.getPublicContact() != null ||
                        request.getShortIntro() != null ||
                        request.getLongIntro() != null ||
                        request.getPreferredTradeStyle() != null) {

            log.info("advisor_detail_info 업데이트 실행");
            int result = advisorProfileMapper.updateAdvisorDetailInfo(advisorId, request);
            log.info("advisor_detail_info 업데이트 결과: {}", result);
            if (result == 0) {
                throw new BaseException(BaseResponseStatus.ADVISOR_PROFILE_UPDATE_FAILED);
            }
        }

        // advisor 테이블 업데이트 (상담료)
        if (request.getConsultationFee() != null) {
            log.info("상담료 업데이트 실행 - advisorId: {}, fee: {}", advisorId, request.getConsultationFee());
            int result = advisorProfileMapper.updateAdvisorConsultationFee(advisorId, request.getConsultationFee());
            log.info("상담료 업데이트 결과: {}", result);
            if (result == 0) {
                log.error("상담료 업데이트 실패 - 영향받은 행: 0");
                throw new BaseException(BaseResponseStatus.ADVISOR_PROFILE_UPDATE_FAILED);
            }
        } else {
            log.info("consultationFee가 null이므로 상담료 업데이트 건너뜀");
        }

        log.info("=== updateProfileBasicInfo 완료 ===");
    }

    /**
     * 경력 정보 변경 처리 (CREATE/UPDATE/DELETE)
     */
    private void processCareerChanges(Long advisorId, AdvisorProfileUpdateRequestDto request) {
        // 1. 삭제 처리
        List<CareerEntryDto> deleteEntries = request.getDeleteCareerEntries();
        for (CareerEntryDto career : deleteEntries) {
            // 소유권 확인
            Boolean isOwner = advisorProfileMapper.isCareerEntryOwner(advisorId, career.getId());
            if (!Boolean.TRUE.equals(isOwner)) {
                throw new BaseException(BaseResponseStatus.CAREER_ENTRY_NOT_FOUND);
            }

            int result = advisorProfileMapper.deleteCareerEntry(advisorId, career.getId());
            if (result == 0) {
                throw new BaseException(BaseResponseStatus.CAREER_ENTRY_DELETE_FAILED);
            }
        }

        // 2. 수정 처리
        List<CareerEntryDto> updateEntries = request.getUpdateCareerEntries();
        for (CareerEntryDto career : updateEntries) {
            // 소유권 확인
            Boolean isOwner = advisorProfileMapper.isCareerEntryOwner(advisorId, career.getId());
            if (!Boolean.TRUE.equals(isOwner)) {
                throw new BaseException(BaseResponseStatus.CAREER_ENTRY_NOT_FOUND);
            }

            int result = advisorProfileMapper.updateCareerEntry(advisorId, career);
            if (result == 0) {
                throw new BaseException(BaseResponseStatus.CAREER_ENTRY_UPDATE_FAILED);
            }
        }

        // 3. 생성 처리
        List<CareerEntryDto> createEntries = request.getCreateCareerEntries();
        for (CareerEntryDto career : createEntries) {
            int result = advisorProfileMapper.insertCareerEntry(advisorId, career);
            if (result == 0) {
                throw new BaseException(BaseResponseStatus.CAREER_ENTRY_CREATE_FAILED);
            }
        }

        // 4. 최종적으로 경력이 최소 1개는 있는지 확인
        validateMinimumCareerEntries(advisorId);
    }

    /**
     * 최소 경력 개수 검증
     */
    private void validateMinimumCareerEntries(Long advisorId) {
        int careerCount = advisorProfileMapper.countCareerEntries(advisorId);
        if (careerCount == 0) {
            throw new BaseException(BaseResponseStatus.MINIMUM_CAREER_ENTRIES_REQUIRED);
        }
    }

    /**
     * 이전 요청 유효성 검증
     */
    private void validatePreviousRequest(Long advisorId, Long previousRequestId) {
        Boolean isValid = advisorProfileMapper.isPreviousRequestValid(advisorId, previousRequestId);
        if (!Boolean.TRUE.equals(isValid)) {
            throw new BaseException(BaseResponseStatus.PREVIOUS_REQUEST_NOT_FOUND);
        }
    }

    /**
     * LinkedHashMap을 ApprovalHistoryResponseDto로 변환
     */
    private ApprovalHistoryResponseDto convertToApprovalHistoryDto(LinkedHashMap<String, Object> map) {
        ApprovalHistoryResponseDto dto = new ApprovalHistoryResponseDto();

        dto.setRequestId(((Number) map.get("requestId")).longValue());
        dto.setCertificateName((String) map.get("certificateName"));
        dto.setCertificateFileSn((String) map.get("certificateFileSn"));
        dto.setCertificateFileNumber((String) map.get("certificateFileNumber"));
        dto.setStatus((String) map.get("status"));
        dto.setRequestedAt(parseTimestamp(map.get("requestedAt")));
        dto.setProcessedAt(parseTimestamp(map.get("processedAt")));
        dto.setRejectionReason((String) map.get("rejectionReason"));
        dto.setProcessedByAdminName((String) map.get("processedByAdminName"));

        return dto;
    }

    /**
     * Timestamp 객체를 LocalDateTime으로 변환
     */
    private java.time.LocalDateTime parseTimestamp(Object timestamp) {
        if (timestamp == null) return null;
        try {
            if (timestamp instanceof java.sql.Timestamp) {
                return ((java.sql.Timestamp) timestamp).toLocalDateTime();
            } else if (timestamp instanceof java.time.LocalDateTime) {
                return (java.time.LocalDateTime) timestamp;
            } else if (timestamp instanceof String) {
                // 문자열인 경우 파싱 시도
                String dateStr = (String) timestamp;
                if (dateStr.contains("+09:00")) {
                    dateStr = dateStr.replace("+09:00", "");
                }
                return java.time.LocalDateTime.parse(dateStr);
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to parse timestamp: {}", timestamp);
            return null;
        }
    }
}
