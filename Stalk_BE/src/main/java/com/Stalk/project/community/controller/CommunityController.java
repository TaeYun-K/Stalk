package com.Stalk.project.community.controller;

import com.Stalk.project.community.dto.in.CommunityPostCreateRequestDto;
import com.Stalk.project.community.dto.in.CommunityPostListRequestDto;
import com.Stalk.project.community.dto.out.CommunityPostCreateResponseDto;
import com.Stalk.project.community.dto.out.CommunityPostSummaryDto;
import com.Stalk.project.community.dto.out.WritePermissionResponseDto;
import com.Stalk.project.community.service.CommunityService;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.util.CursorPage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Community", description = "커뮤니티 API")
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@Slf4j
public class CommunityController {

  private final CommunityService communityService;

  @Operation(summary = "커뮤니티 글 목록 조회", description = "커뮤니티 글 목록을 페이지네이션으로 조회합니다.")
  @GetMapping("/posts")
  public BaseResponse<CursorPage<CommunityPostSummaryDto>> getCommunityPosts(
      @Parameter(description = "페이지 요청 정보")
      @ModelAttribute CommunityPostListRequestDto requestDto) {

    log.info("커뮤니티 글 목록 조회 요청: {}", requestDto);

    try {
      CursorPage<CommunityPostSummaryDto> result = communityService.getCommunityPosts(requestDto);
      return new BaseResponse<>(result);

    } catch (IllegalArgumentException e) {
      log.warn("잘못된 요청 파라미터: {}", e.getMessage());
      throw e;
    } catch (Exception e) {
      log.error("커뮤니티 글 목록 조회 중 오류 발생", e);
      throw e;
    }
  }

  @Operation(summary = "글쓰기 권한 체크", description = "현재 사용자의 글쓰기 권한을 확인합니다.")
  @GetMapping("/posts/write-permission")
  public BaseResponse<WritePermissionResponseDto> checkWritePermission(
      @Parameter(description = "인증 토큰", required = true)
      @RequestHeader("Authorization") String authorizationHeader) {

    log.info("글쓰기 권한 체크 요청");

    try {
      WritePermissionResponseDto result = communityService.checkWritePermission(
          authorizationHeader);
      return new BaseResponse<>(result);

    } catch (Exception e) {
      log.error("글쓰기 권한 체크 중 오류 발생", e);
      throw e;
    }
  }

  @Operation(summary = "커뮤니티 글 작성", description = "새로운 커뮤니티 글을 작성합니다.")
  @PostMapping("/posts")
  public BaseResponse<CommunityPostCreateResponseDto> createCommunityPost(
      @Parameter(description = "인증 토큰", required = true)
      @RequestHeader("Authorization") String authorizationHeader,
      @Valid @RequestBody CommunityPostCreateRequestDto requestDto) {

    log.info("커뮤니티 글 작성 요청: {}", requestDto);

    try {
      CommunityPostCreateResponseDto result = communityService.createCommunityPost(
          authorizationHeader, requestDto);
      return new BaseResponse<>(result);

    } catch (Exception e) {
      log.error("커뮤니티 글 작성 중 오류 발생", e);
      throw e;
    }
  }
}