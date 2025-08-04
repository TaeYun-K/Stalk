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

  // ===== 글 관련 메서드 =====

  /**
   * 커뮤니티 글 목록 조회
   */
  List<CommunityPostSummaryDto> findCommunityPosts(
      @Param("category") String category,
      @Param("pageRequest") CommunityPostListRequestDto pageRequest
  );

  /**
   * 커뮤니티 글 상세 조회 (댓글 제외)
   */
  CommunityPostDetailDto findCommunityPostDetail(@Param("postId") Long postId);

  /**
   * 글 존재 여부 확인 (삭제되지 않은 글만)
   */
  boolean existsPostById(@Param("postId") Long postId);

  /**
   * 커뮤니티 글 작성
   */
  int createCommunityPost(
      @Param("userId") Long userId,
      @Param("request") CommunityPostCreateRequestDto requestDto
  );

  /**
   * 마지막으로 생성된 글 ID 조회
   */
  Long getLastInsertedPostId();

  /**
   * 글 수정/삭제 권한 확인용 조회
   */
  CommunityPostPermissionDto findPostPermission(@Param("postId") Long postId);

  /**
   * 커뮤니티 글 수정
   */
  int updateCommunityPost(
      @Param("postId") Long postId,
      @Param("title") String title,
      @Param("content") String content,
      @Param("category") String category
  );

  /**
   * 커뮤니티 글 논리적 삭제
   */
  int deleteCommunityPost(@Param("postId") Long postId);

  // ===== 댓글 관련 메서드 =====

  /**
   * 글의 댓글 목록 조회 (페이징)
   */
  List<CommunityCommentDto> findCommentsByPostId(
      @Param("postId") Long postId,
      @Param("pageRequest") PageRequestDto pageRequest
  );

  /**
   * 댓글 작성
   */
  void createComment(
      @Param("postId") Long postId,
      @Param("userId") Long userId,
      @Param("content") String content
  );

  /**
   * 마지막 생성된 댓글 ID 조회
   */
  Long getLastInsertedCommentId();

  /**
   * 댓글 권한 확인 (수정/삭제용)
   */
  CommunityCommentPermissionDto findCommentPermission(@Param("commentId") Long commentId);

  /**
   * 댓글 수정
   */
  int updateComment(@Param("commentId") Long commentId, @Param("content") String content);

  /**
   * 댓글 삭제
   */
  int deleteComment(@Param("commentId") Long commentId);

  /**
   * 글에 달린 모든 댓글 물리적 삭제 (글 삭제 시 사용)
   */
  int deleteAllCommentsOfPost(@Param("postId") Long postId);

  // ===== 유틸리티 메서드 =====

  /**
   * 사용자 이름 조회 (권한 체크용)
   * @return 사용자 이름 (일반 사용자: nickname, 전문가: name)
   */
  String findUserNameById(@Param("userId") Long userId);
}