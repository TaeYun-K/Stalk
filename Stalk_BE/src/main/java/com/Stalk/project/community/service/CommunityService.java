package com.Stalk.project.community.service;

import com.Stalk.project.auth.mock.util.TokenUtils;
import com.Stalk.project.community.dao.CommunityMapper;
import com.Stalk.project.community.dto.in.CommunityPostCreateRequestDto;
import com.Stalk.project.community.dto.in.CommunityPostListRequestDto;
import com.Stalk.project.community.dto.in.PostCategory;
import com.Stalk.project.community.dto.out.CommunityPostCreateResponseDto;
import com.Stalk.project.community.dto.out.CommunityPostSummaryDto;
import com.Stalk.project.community.dto.out.WritePermissionResponseDto;
import com.Stalk.project.exception.BaseException;
import com.Stalk.project.response.BaseResponseStatus;
import com.Stalk.project.util.CursorPage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CommunityService {

  private final CommunityMapper communityMapper;

  /**
   * 커뮤니티 글 목록 조회
   */
  public CursorPage<CommunityPostSummaryDto> getCommunityPosts(
      CommunityPostListRequestDto requestDto) {
    log.info("커뮤니티 글 목록 조회 - 카테고리: {}, 페이지: {}",
        requestDto.getCategory(), requestDto.getPageNo());

    // 입력 검증
    validatePageRequest(requestDto);

    // 카테고리 처리
    PostCategory postCategory = requestDto.getCategory();
    String categoryFilter = postCategory == PostCategory.ALL ? null : postCategory.name();

    // 데이터 조회
    List<CommunityPostSummaryDto> posts = communityMapper.findCommunityPosts(
        categoryFilter, requestDto);

    // 카테고리 표시명 설정
    posts.forEach(post -> {
      PostCategory category = PostCategory.valueOf(post.getCategory());
      post.setCategoryDisplayName(category.getDisplayName());
    });

    // CursorPage 처리
    boolean hasNext = posts.size() > requestDto.getPageSize();
    if (hasNext) {
      posts.remove(posts.size() - 1);
    }

    return CursorPage.<CommunityPostSummaryDto>builder()
        .content(posts)
        .nextCursor(null) // 커뮤니티는 단순 페이지네이션으로 처리
        .hasNext(hasNext)
        .pageSize(requestDto.getPageSize())
        .pageNo(requestDto.getPageNo())
        .build();
  }

  /**
   * 글쓰기 권한 체크
   */
  public WritePermissionResponseDto checkWritePermission(String authorizationHeader) {
    log.info("글쓰기 권한 체크 시작");

    try {
      // 토큰에서 사용자 정보 추출
      Long userId = TokenUtils.extractUserId(authorizationHeader);
      String userRole = TokenUtils.extractRole(authorizationHeader);

      log.info("토큰에서 추출된 사용자 정보 - userId: {}, role: {}", userId, userRole);

      // 사용자 정보 조회
      String userName = communityMapper.findUserNameById(userId);
      if (userName == null) {
        throw new BaseException(BaseResponseStatus.USER_NOT_FOUND);
      }

      // 권한 확인 (모든 사용자 글 작성 가능)
      boolean canWrite = true;

      // 사용자 역할에 따른 사용 가능 카테고리 결정
      List<String> availableCategories;
      if ("USER".equals(userRole)) {
        // 일반 사용자: QUESTION만 작성 가능
        availableCategories = Arrays.asList("QUESTION");
      } else {
        // 전문가: 모든 카테고리 작성 가능
        availableCategories = Arrays.stream(PostCategory.values())
            .filter(category -> category != PostCategory.ALL)
            .map(PostCategory::name)
            .collect(Collectors.toList());
      }

      return WritePermissionResponseDto.builder()
          .canWrite(canWrite)
          .userRole(userRole)
          .userName(userName)
          .availableCategories(availableCategories)
          .message("글 작성이 가능합니다.")
          .build();

    } catch (BaseException e) {
      log.warn("권한 체크 실패: {}", e.getMessage());
      throw e;
    } catch (Exception e) {
      log.error("권한 체크 중 오류 발생", e);
      throw new BaseException(BaseResponseStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 커뮤니티 글 작성
   */
  @Transactional
  public CommunityPostCreateResponseDto createCommunityPost(String authorizationHeader,
      CommunityPostCreateRequestDto requestDto) {
    log.info("커뮤니티 글 작성 시작: {}", requestDto);

    try {
      // 토큰에서 사용자 정보 추출
      Long userId = TokenUtils.extractUserId(authorizationHeader);
      String userRole = TokenUtils.extractRole(authorizationHeader);

      log.info("글 작성자 정보 - userId: {}, role: {}", userId, userRole);

      // 권한 검증
      validateWritePermission(userRole, requestDto.getCategory());

      // 글 작성
      int insertedRows = communityMapper.createCommunityPost(userId, requestDto);
      if (insertedRows != 1) {
        throw new BaseException(BaseResponseStatus.COMMUNITY_POST_CREATE_FAILED);
      }

      // 생성된 글 ID 조회
      Long postId = communityMapper.getLastInsertedPostId();
      if (postId == null) {
        throw new BaseException(BaseResponseStatus.COMMUNITY_POST_CREATE_FAILED);
      }

      log.info("커뮤니티 글 작성 완료 - postId: {}", postId);

      return CommunityPostCreateResponseDto.builder()
          .postId(postId)
          .title(requestDto.getTitle())
          .category(requestDto.getCategory().name())
          .message("글이 성공적으로 작성되었습니다.")
          .createdAt(LocalDateTime.now())
          .build();

    } catch (BaseException e) {
      log.warn("글 작성 실패: {}", e.getMessage());
      throw e;
    } catch (Exception e) {
      log.error("글 작성 중 오류 발생", e);
      throw new BaseException(BaseResponseStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 글 작성 권한 검증
   */
  private void validateWritePermission(String userRole, PostCategory category) {
    // 일반 사용자는 QUESTION만 작성 가능
    if ("USER".equals(userRole) && category != PostCategory.QUESTION) {
      throw new BaseException(BaseResponseStatus.COMMUNITY_WRITE_PERMISSION_DENIED);
    }

    // ADVISOR는 모든 카테고리 작성 가능 (추가 검증 없음)
  }

  /**
   * 페이지 요청 검증
   */
  private void validatePageRequest(CommunityPostListRequestDto requestDto) {
    if (requestDto.getPageNo() < 1) {
      throw new IllegalArgumentException("페이지 번호는 1 이상이어야 합니다.");
    }

    if (requestDto.getPageSize() < 1 || requestDto.getPageSize() > 50) {
      throw new IllegalArgumentException("페이지 크기는 1~50 사이여야 합니다.");
    }
  }
}