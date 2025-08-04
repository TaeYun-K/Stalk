package com.Stalk.project.community.controller;

import com.Stalk.project.community.dto.in.CommunityPostCreateRequestDto;
import com.Stalk.project.community.dto.in.CommunityPostListRequestDto;
import com.Stalk.project.community.dto.out.CommunityPostCreateResponseDto;
import com.Stalk.project.community.dto.out.CommunityPostDetailDto;
import com.Stalk.project.community.dto.out.CommunityPostSummaryDto;
import com.Stalk.project.community.dto.out.WritePermissionResponseDto;
import com.Stalk.project.community.service.CommunityService;
import com.Stalk.project.login.util.SecurityUtil;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.util.CursorPage;
import com.Stalk.project.util.PageRequestDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@Tag(name = "Community", description = "커뮤니티 관련 API")
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping("/posts")
    @Operation(summary = "커뮤니티 글 목록 조회", description = "카테고리별로 커뮤니티 글 목록을 조회합니다.")
    public BaseResponse<CursorPage<CommunityPostSummaryDto>> getCommunityPosts(
            @ModelAttribute CommunityPostListRequestDto requestDto) {
        
        CursorPage<CommunityPostSummaryDto> result = communityService.getCommunityPosts(requestDto);
        return new BaseResponse<>(result);
    }

    @GetMapping("/posts/write-permission")
    @Operation(summary = "글쓰기 권한 확인", description = "현재 사용자의 글쓰기 권한과 사용 가능한 카테고리를 확인합니다.")
    public BaseResponse<WritePermissionResponseDto> checkWritePermission() {
        
        // JWT에서 현재 사용자 ID와 역할 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        String currentUserRole = SecurityUtil.getCurrentUserRole();
        
        WritePermissionResponseDto result = communityService.checkWritePermission(
            currentUserId, currentUserRole);
        return new BaseResponse<>(result);
    }

    @PostMapping("/posts")
    @Operation(summary = "커뮤니티 글 작성", description = "새로운 커뮤니티 글을 작성합니다.")
    public BaseResponse<CommunityPostCreateResponseDto> createCommunityPost(
            @Valid @RequestBody CommunityPostCreateRequestDto requestDto) {
        
        // JWT에서 현재 사용자 ID와 역할 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        String currentUserRole = SecurityUtil.getCurrentUserRole();
        
        CommunityPostCreateResponseDto result = communityService.createCommunityPost(
            currentUserId, currentUserRole, requestDto);
        return new BaseResponse<>(result);
    }

    // CommunityController.java에 추가할 메서드

    @GetMapping("/posts/{postId}")
    @Operation(summary = "커뮤니티 글 상세 조회", description = "특정 커뮤니티 글의 상세 정보와 댓글을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "글 상세 조회 성공")
    @ApiResponse(responseCode = "404", description = "존재하지 않거나 삭제된 글")
    public BaseResponse<CommunityPostDetailDto> getCommunityPostDetail(
        @PathVariable @Schema(description = "글 ID") Long postId,
        @ModelAttribute @Schema(description = "페이징 정보") PageRequestDto pageRequest) {

        CommunityPostDetailDto postDetail = communityService.getCommunityPostDetail(postId, pageRequest);
        return new BaseResponse<>(postDetail);
    }
}