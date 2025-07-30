package com.Stalk.project.user.service;

import com.Stalk.project.user.dao.UserProfileMapper;
import com.Stalk.project.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.exception.BaseException;
import com.Stalk.project.response.BaseResponseStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

  private final UserProfileMapper userProfileMapper;

  /**
   * 사용자 프로필 정보 조회
   *
   * @param userId 사용자 ID (users.id)
   * @return 사용자 프로필 정보
   * @throws BaseException 사용자를 찾을 수 없는 경우
   */
  public UserProfileResponseDto getUserProfile(Long userId) {
    log.info("사용자 프로필 조회 요청: userId={}", userId);

    UserProfileResponseDto userProfile = userProfileMapper.findUserProfileById(userId);

    if (userProfile == null) {
      log.warn("존재하지 않는 사용자: userId={}", userId);
      throw new BaseException(BaseResponseStatus.USER_NOT_FOUND);
    }

    log.info("사용자 프로필 조회 성공: userId={}, userName={}, role={}",
        userProfile.getUserId(), userProfile.getName(), userProfile.getRole());

    return userProfile;
  }
}