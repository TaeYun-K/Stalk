package com.Stalk.project.api.user.dao;

import com.Stalk.project.api.user.dto.in.UserUpdateRequestDto;
import com.Stalk.project.api.user.dto.out.UserProfileResponseDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserProfileMapper {

  /**
   * 사용자 ID로 프로필 정보 조회
   *
   * @param userId 사용자 ID (users.id)
   * @return 사용자 프로필 정보
   */
  UserProfileResponseDto findUserProfileById(@Param("userId") Long userId);

  int updateUserProfile(@Param("userId") Long userId,
      @Param("updateDto") UserUpdateRequestDto updateDto);

}