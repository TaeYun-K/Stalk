package com.Stalk.project.api.user.dao;

import com.Stalk.project.api.signup.entity.User;
import com.Stalk.project.api.user.dto.in.UserUpdateRequestDto;
import com.Stalk.project.api.user.dto.out.UserProfileResponseDto;
import java.util.Optional;
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

  /**
   * ID로 사용자를 조회합니다.
   *
   * @param userId 사용자 ID
   * @return User 객체
   */
  User findUserById(@Param("userId") Long userId);

  /**
   * 사용자의 비밀번호를 업데이트합니다.
   *
   * @param userId          사용자 ID
   * @param encodedPassword 암호화된 새 비밀번호
   * @return 업데이트된 행의 수
   */
  void updatePassword(@Param("userId") Long userId,
      @Param("encodedPassword") String encodedPassword);

  /**
   * 사용자를 비활성화 처리합니다. (Soft Delete)
   *
   * @param userId 비활성화할 사용자 ID
   * @return 업데이트된 행의 수
   */
  Long deactivateUser(@Param("userId") Long userId);

  Optional<User> findByNickname(String nickname);

  void updateProfile(User user);
}