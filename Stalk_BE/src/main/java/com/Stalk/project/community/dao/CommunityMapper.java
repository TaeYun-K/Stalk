package com.Stalk.project.community.dao;

import com.Stalk.project.community.dto.in.CommunityPostCreateRequestDto;
import com.Stalk.project.community.dto.in.CommunityPostListRequestDto;
import com.Stalk.project.community.dto.out.CommunityPostSummaryDto;
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
}