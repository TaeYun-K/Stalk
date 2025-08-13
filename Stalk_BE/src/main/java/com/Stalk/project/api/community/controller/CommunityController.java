package com.Stalk.project.api.community.controller;

import com.Stalk.project.api.community.dto.in.CommunityCommentCreateRequestDto;
import com.Stalk.project.api.community.dto.in.CommunityCommentListRequestDto;
import com.Stalk.project.api.community.dto.in.CommunityCommentUpdateRequestDto;
import com.Stalk.project.api.community.dto.in.CommunityPostCreateRequestDto;
import com.Stalk.project.api.community.dto.in.CommunityPostDetailRequestDto;
import com.Stalk.project.api.community.dto.in.CommunityPostListRequestDto;
import com.Stalk.project.api.community.dto.in.CommunityPostUpdateRequestDto;
import com.Stalk.project.api.community.dto.out.CommunityCommentCreateResponseDto;
import com.Stalk.project.api.community.dto.out.CommunityCommentDeleteResponseDto;
import com.Stalk.project.api.community.dto.out.CommunityCommentDto;
import com.Stalk.project.api.community.dto.out.CommunityCommentUpdateResponseDto;
import com.Stalk.project.api.community.dto.out.CommunityPostCreateResponseDto;
import com.Stalk.project.api.community.dto.out.CommunityPostDeleteResponseDto;
import com.Stalk.project.api.community.dto.out.CommunityPostDetailDto;
import com.Stalk.project.api.community.dto.out.CommunityPostSummaryDto;
import com.Stalk.project.api.community.dto.out.CommunityPostUpdateResponseDto;
import com.Stalk.project.api.community.dto.out.WritePermissionResponseDto;
import com.Stalk.project.api.community.service.CommunityService;
import com.Stalk.project.global.util.SecurityUtil;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.util.CursorPage;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Community", description = "커뮤니티 관련 API")
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@Slf4j
public class CommunityController {

    private final CommunityService communityService;

    /**
     * 커뮤니티 글 목록 조회
     */
    @GetMapping("/posts")
    @Operation(summary = "커뮤니티 글 목록 조회", description = "카테고리별로 커뮤니티 글 목록을 조회합니다.")
    public BaseResponse<CursorPage<CommunityPostSummaryDto>> getCommunityPosts(
        @Parameter(description = "페이지 요청 정보")
        @ModelAttribute CommunityPostListRequestDto requestDto) {

        log.info("커뮤니티 글 목록 조회 요청: {}", requestDto);

        CursorPage<CommunityPostSummaryDto> result = communityService.getCommunityPosts(requestDto);
        return new BaseResponse<>(result);
    }

    /**
     * 글쓰기 권한 체크
     */
    @GetMapping("/posts/write-permission")
    @Operation(summary = "글쓰기 권한 확인", description = "현재 사용자의 글쓰기 권한과 사용 가능한 카테고리를 확인합니다.")
    public BaseResponse<WritePermissionResponseDto> checkWritePermission() {

        log.info("글쓰기 권한 체크 요청");

        // JWT에서 현재 사용자 ID와 역할 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        String currentUserRole = SecurityUtil.getCurrentUserRole();

        WritePermissionResponseDto result = communityService.checkWritePermission(
            currentUserId, currentUserRole);
        return new BaseResponse<>(result);
    }

    /**
     * 커뮤니티 글 작성
     */
    @PostMapping("/posts")
    @Operation(summary = "커뮤니티 글 작성", description = "새로운 커뮤니티 글을 작성합니다.")
    public BaseResponse<CommunityPostCreateResponseDto> createCommunityPost(
        @Valid @RequestBody CommunityPostCreateRequestDto requestDto) {
        log.info("커뮤니티 글 작성 요청: {}", requestDto);

        // JWT에서 현재 사용자 ID와 역할 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        String currentUserRole = SecurityUtil.getCurrentUserRole();

        CommunityPostCreateResponseDto result = communityService.createCommunityPost(
            currentUserId, currentUserRole, requestDto);
        return new BaseResponse<>(result);
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
        @RequestParam(defaultValue = "10") int commentPageSize) {

        log.info("커뮤니티 글 상세 조회 요청 - postId: {}, commentPageNo: {}, commentPageSize: {}",
            postId, commentPageNo, commentPageSize);

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

        @Valid @RequestBody CommunityPostUpdateRequestDto requestDto) {

        log.info("커뮤니티 글 수정 요청 - postId: {}, requestDto: {}", postId, requestDto);

        // JWT에서 현재 사용자 ID와 역할 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        String currentUserRole = SecurityUtil.getCurrentUserRole();

        CommunityPostUpdateResponseDto result = communityService.updateCommunityPost(
            postId, currentUserId, currentUserRole, requestDto);
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
        @PathVariable Long postId) {

        log.info("커뮤니티 글 삭제 요청 - postId: {}", postId);

        // JWT에서 현재 사용자 ID와 역할 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        String currentUserRole = SecurityUtil.getCurrentUserRole();

        CommunityPostDeleteResponseDto result = communityService.deleteCommunityPost(
            postId, currentUserId, currentUserRole);
        return new BaseResponse<>(result);
    }

    /**
     * 댓글 작성
     */
    @PostMapping("/posts/{postId}/comments")
    @Operation(
        summary = "댓글 작성",
        description = "특정 글에 댓글을 작성합니다.",
        responses = {
            @ApiResponse(responseCode = "200", description = "댓글 작성 성공"),
            @ApiResponse(responseCode = "404", description = "글을 찾을 수 없음")
        }
    )
    public BaseResponse<CommunityCommentCreateResponseDto> createComment(
        @Parameter(description = "글 ID", example = "1")
        @PathVariable Long postId,

        @Valid @RequestBody CommunityCommentCreateRequestDto requestDto) {

        log.info("댓글 작성 요청 - postId: {}, requestDto: {}", postId, requestDto);

        // JWT에서 현재 사용자 ID 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

        CommunityCommentCreateResponseDto result = communityService.createComment(
            postId, currentUserId, requestDto);
        return new BaseResponse<>(result);
    }

    /**
     * 댓글 목록 조회 (더보기용)
     */
    @GetMapping("/posts/{postId}/comments")
    @Operation(
        summary = "댓글 목록 조회",
        description = "특정 글의 댓글 목록을 페이지네이션으로 조회합니다.",
        responses = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "글을 찾을 수 없음")
        }
    )
    public BaseResponse<CursorPage<CommunityCommentDto>> getCommentList(
        @Parameter(description = "글 ID", example = "1")
        @PathVariable Long postId,

        @Parameter(description = "댓글 목록 요청 정보")
        @ModelAttribute CommunityCommentListRequestDto requestDto) {

        log.info("댓글 목록 조회 요청 - postId: {}, requestDto: {}", postId, requestDto);

        CursorPage<CommunityCommentDto> result = communityService.getCommentList(postId, requestDto);
        return new BaseResponse<>(result);
    }

    /**
     * 댓글 수정
     */
    @PutMapping("/comments/{commentId}")
    @Operation(
        summary = "댓글 수정",
        description = "본인이 작성한 댓글을 수정합니다. 관리자는 모든 댓글을 수정할 수 있습니다.",
        responses = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "403", description = "수정 권한 없음"),
            @ApiResponse(responseCode = "404", description = "댓글을 찾을 수 없음")
        }
    )
    public BaseResponse<CommunityCommentUpdateResponseDto> updateComment(
        @Parameter(description = "댓글 ID", example = "1")
        @PathVariable Long commentId,

        @Valid @RequestBody CommunityCommentUpdateRequestDto requestDto) {

        log.info("댓글 수정 요청 - commentId: {}, requestDto: {}", commentId, requestDto);

        // JWT에서 현재 사용자 ID와 역할 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        String currentUserRole = SecurityUtil.getCurrentUserRole();

        CommunityCommentUpdateResponseDto result = communityService.updateComment(
            commentId, currentUserId, currentUserRole, requestDto);
        return new BaseResponse<>(result);
    }

    /**
     * 댓글 삭제
     */
    @DeleteMapping("/comments/{commentId}")
    @Operation(
        summary = "댓글 삭제",
        description = "본인이 작성한 댓글을 삭제합니다. 관리자는 모든 댓글을 삭제할 수 있습니다.",
        responses = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "403", description = "삭제 권한 없음"),
            @ApiResponse(responseCode = "404", description = "댓글을 찾을 수 없음")
        }
    )
    public BaseResponse<CommunityCommentDeleteResponseDto> deleteComment(
        @Parameter(description = "댓글 ID", example = "1")
        @PathVariable Long commentId) {

        log.info("댓글 삭제 요청 - commentId: {}", commentId);

        // JWT에서 현재 사용자 ID와 역할 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        String currentUserRole = SecurityUtil.getCurrentUserRole();

        CommunityCommentDeleteResponseDto result = communityService.deleteComment(
            commentId, currentUserId, currentUserRole);
        return new BaseResponse<>(result);
    }
}