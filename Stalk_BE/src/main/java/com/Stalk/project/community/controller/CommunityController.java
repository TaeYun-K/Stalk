package com.Stalk.project.community.controller;

import com.Stalk.project.community.dto.in.CommunityPostCreateRequestDto;
import com.Stalk.project.community.dto.in.CommunityPostDetailRequestDto;
import com.Stalk.project.community.dto.in.CommunityPostListRequestDto;
import com.Stalk.project.community.dto.in.CommunityPostUpdateRequestDto;
import com.Stalk.project.community.dto.out.CommunityPostCreateResponseDto;
import com.Stalk.project.community.dto.out.CommunityPostDeleteResponseDto;
import com.Stalk.project.community.dto.out.CommunityPostDetailDto;
import com.Stalk.project.community.dto.out.CommunityPostSummaryDto;
import com.Stalk.project.community.dto.out.CommunityPostUpdateResponseDto;
import com.Stalk.project.community.dto.out.WritePermissionResponseDto;
import com.Stalk.project.community.service.CommunityService;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.util.CursorPage;
import com.Stalk.project.auth.mock.util.TokenUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

  /**
   * 커뮤니티 글 상세 조회
   */
  @GetMapping("/posts/{postId}")
  @Operation(
      summary = "커뮤니티 글 상세 조회",
      description = "특정 커뮤니티 글의 상세 정보와 댓글 목록을 조회합니다.",
      responses = {
          @ApiResponse(responseCode = "200", description = "조회 성공"),
          @ApiResponse(responseCode = "404", description = "글을 찾을 수 없음")
      }
  )
  public BaseResponse<CommunityPostDetailDto> getCommunityPostDetail(
      @Parameter(description = "글 ID", example = "1")
      @PathVariable Long postId,

      @Parameter(description = "댓글 페이지 번호", example = "1")
      @RequestParam(defaultValue = "1") int commentPageNo,

      @Parameter(description = "댓글 페이지 크기", example = "10")
      @RequestParam(defaultValue = "10") int commentPageSize
  ) {

    CommunityPostDetailRequestDto requestDto = new CommunityPostDetailRequestDto();
    requestDto.setCommentPageNo(commentPageNo);
    requestDto.setCommentPageSize(commentPageSize);

    CommunityPostDetailDto result = communityService.getCommunityPostDetail(postId, requestDto);

    return new BaseResponse<>(result);
  }

  /**
   * 커뮤니티 글 수정
   */
  @PutMapping("/posts/{postId}")
  @Operation(
      summary = "커뮤니티 글 수정",
      description = "본인이 작성한 커뮤니티 글을 수정합니다. 관리자는 모든 글을 수정할 수 있습니다.",
      responses = {
          @ApiResponse(responseCode = "200", description = "수정 성공"),
          @ApiResponse(responseCode = "403", description = "수정 권한 없음"),
          @ApiResponse(responseCode = "404", description = "글을 찾을 수 없음")
      }
  )
  public BaseResponse<CommunityPostUpdateResponseDto> updateCommunityPost(
      @Parameter(description = "글 ID", example = "1")
      @PathVariable Long postId,

      @Parameter(description = "인증 토큰", required = true)
      @RequestHeader("Authorization") String authorization,

      @Valid @RequestBody CommunityPostUpdateRequestDto requestDto
  ) {

    // 토큰에서 사용자 정보 추출
    Long currentUserId = TokenUtils.extractUserId(authorization);
    String currentUserRole = TokenUtils.extractRole(authorization);

    // ✅ 수정: 수정 서비스 호출 및 올바른 응답 타입
    CommunityPostUpdateResponseDto result = communityService.updateCommunityPost(
        postId,
        currentUserId,
        currentUserRole,
        requestDto
    );

    return new BaseResponse<>(result);
  }

  /**
   * 커뮤니티 글 삭제
   */
  @DeleteMapping("/posts/{postId}")
  @Operation(
      summary = "커뮤니티 글 삭제",
      description = "본인이 작성한 커뮤니티 글을 삭제합니다. 관리자는 모든 글을 삭제할 수 있습니다. 글 삭제 시 댓글도 함께 삭제됩니다.",
      responses = {
          @ApiResponse(responseCode = "200", description = "삭제 성공"),
          @ApiResponse(responseCode = "403", description = "삭제 권한 없음"),
          @ApiResponse(responseCode = "404", description = "글을 찾을 수 없음")
      }
  )
  public BaseResponse<CommunityPostDeleteResponseDto> deleteCommunityPost(
      @Parameter(description = "글 ID", example = "1")
      @PathVariable Long postId,

      @Parameter(description = "인증 토큰", required = true)
      @RequestHeader("Authorization") String authorization
  ) {

    // 토큰에서 사용자 정보 추출
    Long currentUserId = TokenUtils.extractUserId(authorization);
    String currentUserRole = TokenUtils.extractRole(authorization);

    CommunityPostDeleteResponseDto result = communityService.deleteCommunityPost(
        postId,
        currentUserId,
        currentUserRole
    );

    return new BaseResponse<>(result);
  }
}