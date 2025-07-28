package com.Stalk.project.advisor.service;

import com.Stalk.project.advisor.dao.AdvisorMapper;
import com.Stalk.project.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.advisor.dto.out.AdvisorResponseDto;
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
}