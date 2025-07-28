package com.Stalk.project.advisor.service;

import com.Stalk.project.advisor.dao.AdvisorMapper;
import com.Stalk.project.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.advisor.dto.out.AdvisorDetailResponseDto;
import com.Stalk.project.advisor.dto.out.AdvisorResponseDto;
import com.Stalk.project.exception.BaseException;
import com.Stalk.project.response.BaseResponseStatus;
import com.Stalk.project.util.CursorPage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdvisorService {

    private final AdvisorMapper advisorMapper;

    public CursorPage<AdvisorResponseDto> getAdvisorList(AdvisorListRequestDto requestDto) {
        // cursor가 null인 경우 첫 페이지 조회
        if (requestDto.getCursor() == null) {
            requestDto.setCursor(0L); // 1L → 0L로 변경
        }

        // limit + 1로 조회하여 다음 페이지 존재 여부 확인
        List<AdvisorResponseDto> advisors = advisorMapper.findAllAdvisorsSummary(requestDto);

        boolean hasNext = advisors.size() > requestDto.getPageSize();
        Long nextCursor = null;

        // 다음 페이지가 있으면 마지막 요소 제거하고 nextCursor 설정
        if (hasNext) {
            AdvisorResponseDto lastAdvisor = advisors.remove(advisors.size() - 1);
            nextCursor = lastAdvisor.getId();
        }

        return CursorPage.<AdvisorResponseDto>builder()
                .content(advisors)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .pageSize(requestDto.getPageSize())
                .pageNo(requestDto.getPageNo())
                .build();
    }
    /**
     * 어드바이저 상세 정보 조회
     */
    public AdvisorDetailResponseDto getAdvisorDetail(Long advisorId) {
        // 1. 어드바이저 기본 정보 조회
        AdvisorDetailResponseDto advisorDetail = advisorMapper.findAdvisorDetailById(advisorId);

        if (advisorDetail == null) {
            throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND); // 404 에러
        }

        // 2. 최신 리뷰 10개 조회
        List<AdvisorDetailResponseDto.ReviewDto> reviews = advisorMapper.findLatestReviewsByAdvisorId(advisorId, 10);

        // 3. 전체 리뷰 수 조회 (더보기 버튼 표시 여부 판단용)
        int totalReviewCount = advisorMapper.countReviewsByAdvisorId(advisorId);
        boolean hasMoreReviews = totalReviewCount > 10;

        // 4. preferredTradeStyle enum을 한글로 변환
        String preferredTradeStyleKorean = convertTradeStyleToKorean(advisorDetail.getPreferredTradeStyle());

        // 5. 응답 DTO 구성
        return AdvisorDetailResponseDto.builder()
                .userId(advisorDetail.getUserId())
                .name(advisorDetail.getName())
                .profileImageUrl(advisorDetail.getProfileImageUrl())
                .shortIntro(advisorDetail.getShortIntro())
                .longIntro(advisorDetail.getLongIntro())
                .preferredTradeStyle(preferredTradeStyleKorean)
                .contact(advisorDetail.getContact())
                .avgRating(advisorDetail.getAvgRating())
                .reviewCount(advisorDetail.getReviewCount())
                .reviews(reviews)
                .hasMoreReviews(hasMoreReviews)
                .build();
    }

    /**
     * 투자 성향 enum을 한글로 변환
     */
    private String convertTradeStyleToKorean(String tradeStyle) {
        if (tradeStyle == null) return null;

        return switch (tradeStyle.toUpperCase()) {
            case "SHORT" -> "단기";
            case "MID" -> "중기";
            case "LONG" -> "장기";
            default -> tradeStyle;
        };
    }
}