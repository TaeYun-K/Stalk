package com.Stalk.project.advisor.dao;

import com.Stalk.project.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.advisor.dto.out.AdvisorResponseDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface AdvisorMapper {
    List<AdvisorResponseDto> findAllAdvisorsSummary(AdvisorListRequestDto requestDto);
}