package com.Stalk.project.community.dao;

import com.Stalk.project.community.dto.in.CommunityPostCreateRequestDto;
import com.Stalk.project.community.dto.in.CommunityPostListRequestDto;
import com.Stalk.project.community.dto.out.CommunityCommentDto;
import com.Stalk.project.community.dto.out.CommunityCommentPermissionDto;
import com.Stalk.project.community.dto.out.CommunityPostDetailDto;
import com.Stalk.project.community.dto.out.CommunityPostPermissionDto;
import com.Stalk.project.community.dto.out.CommunityPostSummaryDto;
import com.Stalk.project.util.PageRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommunityMapper {

  /**
   * 커뮤니티 글 목록 조회
   *
   * @param category    카테고리 필터 (null이면 전체 조회)
   * @param pageRequest 페이지 요청 정보
   * @return 커뮤니티 글 요약 목록
   */
  List<CommunityPostSummaryDto> findCommunityPosts(
      @Param("category") String category,
      @Param("pageRequest") CommunityPostListRequestDto pageRequest
  );

  /**
   * 사용자 이름 조회 (권한 체크용)
   *
   * @param userId 사용자 ID
   * @return 사용자 이름 (일반 사용자: nickname, 전문가: name)
   */
  String findUserNameById(@Param("userId") Long userId);

  /**
   * 커뮤니티 글 작성
   *
   * @param userId     작성자 ID
   * @param requestDto 글 작성 요청 정보
   * @return 생성된 행 수 (1이면 성공)
   */
  int createCommunityPost(
      @Param("userId") Long userId,
      @Param("request") CommunityPostCreateRequestDto requestDto
  );

  /**
   * 마지막으로 생성된 글 ID 조회
   *
   * @return 마지막 INSERT된 글 ID
   */
  Long getLastInsertedPostId();

  /**
   * 커뮤니티 글 상세 조회 (댓글 제외)
   *
   * @param postId 글 ID
   * @return 글 상세 정보
   */
  CommunityPostDetailDto findCommunityPostDetail(@Param("postId") Long postId);

  /**
   * 커뮤니티 글의 댓글 목록 조회 (페이징 적용)
   *
   * @param postId       글 ID
   * @param offset       시작 위치
   * @param limitPlusOne 조회할 개수 + 1 (hasNext 판단용)
   * @return 댓글 목록
   */
  List<CommunityCommentDto> findCommunityPostComments(
      @Param("postId") Long postId,
      @Param("offset") int offset,
      @Param("limitPlusOne") int limitPlusOne
  );

  /**
   * 글 수정/삭제 권한 확인용 조회
   *
   * @param postId 글 ID
   * @return 글 권한 정보
   */
  CommunityPostPermissionDto findPostPermission(@Param("postId") Long postId);

  /**
   * 커뮤니티 글 수정
   *
   * @param postId   글 ID
   * @param title    수정할 제목
   * @param content  수정할 내용
   * @param category 수정할 카테고리
   * @return 수정된 행 수
   */
  int updateCommunityPost(
      @Param("postId") Long postId,
      @Param("title") String title,
      @Param("content") String content,
      @Param("category") String category
  );

  /**
   * 커뮤니티 글 논리적 삭제
   *
   * @param postId 글 ID
   * @return 삭제된 행 수
   */
  int deleteCommunityPost(@Param("postId") Long postId);

  /**
   * 글에 달린 모든 댓글 물리적 삭제
   *
   * @param postId 글 ID
   * @return 삭제된 댓글 수
   */
  int deleteAllCommentsOfPost(@Param("postId") Long postId);

  // 1. 댓글 작성
  void createComment(@Param("postId") Long postId, @Param("userId") Long userId,
      @Param("content") String content);

  // 2. 마지막 생성된 댓글 ID 조회
  Long getLastInsertedCommentId();

  // 3. 댓글 목록 조회 (페이징)
  List<CommunityCommentDto> findCommentsByPostId(@Param("postId") Long postId,
      @Param("pageRequest") PageRequestDto pageRequest);

  // 4. 댓글 권한 확인 (수정/삭제용)
  CommunityCommentPermissionDto findCommentPermission(@Param("commentId") Long commentId);

  // 5. 댓글 수정
  int updateComment(@Param("commentId") Long commentId, @Param("content") String content);

  // 6. 댓글 삭제
  int deleteComment(@Param("commentId") Long commentId);

  // 7. 글 존재 여부 확인 (댓글 작성 전)
  boolean existsPostById(@Param("postId") Long postId);
}