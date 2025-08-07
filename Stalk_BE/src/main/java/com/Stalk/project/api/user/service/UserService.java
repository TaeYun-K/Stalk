package com.Stalk.project.api.user.service;

import static com.Stalk.project.global.response.BaseResponseStatus.ALREADY_DEACTIVATED_USER;
import static com.Stalk.project.global.response.BaseResponseStatus.USER_DEACTIVATION_FAILED;
import static com.Stalk.project.global.response.BaseResponseStatus.USER_NOT_FOUND;

import com.Stalk.project.api.login.service.AuthService;
import com.Stalk.project.api.signup.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.Stalk.project.api.user.dao.UserProfileMapper;
import com.Stalk.project.api.user.dto.in.UserUpdateRequestDto;
import com.Stalk.project.api.user.dto.out.UserUpdateResponseDto;
import com.Stalk.project.api.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponseStatus;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserProfileMapper userProfileMapper;
  private final AuthService authService;

  public UserProfileResponseDto getUserProfile(Long userId) {
    // 기존 메서드 유지
    return userProfileMapper.findUserProfileById(userId);
  }

  @Transactional
  public UserUpdateResponseDto updateUserProfile(Long userId, UserUpdateRequestDto requestDto) {
    // 1. 사용자 존재 여부 확인
    UserProfileResponseDto currentUser = userProfileMapper.findUserProfileById(userId);
    if (currentUser == null) {
      throw new BaseException(BaseResponseStatus.USER_INFO_NOT_FOUND);
    }

    // 2. 수정할 필드 검증 및 전화번호 형식 검증
    boolean hasNameUpdate = requestDto.getName() != null && !requestDto.getName().trim().isEmpty();
    boolean hasContactUpdate =
        requestDto.getContact() != null && !requestDto.getContact().trim().isEmpty();

    if (!hasNameUpdate && !hasContactUpdate) {
      throw new BaseException(BaseResponseStatus.NO_UPDATE_FIELDS);
    }

    // 전화번호 형식 검증 후 하이픈 추가 처리
    String formattedContact = null;
    if (hasContactUpdate) {
      String contact = requestDto.getContact().trim();
      // 하이픈 없는 11자리 숫자 검증
      if (!contact.matches("^010\\d{8}$")) {
        throw new BaseException(BaseResponseStatus.INVALID_PHONE_FORMAT);
      }
      // 하이픈 추가: 01012345678 → 010-1234-5678
      formattedContact =
          contact.substring(0, 3) + "-" + contact.substring(3, 7) + "-" + contact.substring(7, 11);
    }

    // 3. 동일한 값 검증 (DB에 저장된 형태와 비교)
    if (hasNameUpdate && requestDto.getName().trim().equals(currentUser.getName())) {
      if (hasContactUpdate && formattedContact.equals(currentUser.getContact())) {
        throw new BaseException(BaseResponseStatus.SAME_DATA_UPDATE);
      } else if (!hasContactUpdate) {
        throw new BaseException(BaseResponseStatus.SAME_DATA_UPDATE);
      }
    }

    if (hasContactUpdate && formattedContact.equals(currentUser.getContact()) && !hasNameUpdate) {
      throw new BaseException(BaseResponseStatus.SAME_DATA_UPDATE);
    }

    // 4. 업데이트 실행 (포맷된 전화번호로 전달)
    UserUpdateRequestDto dbUpdateDto = new UserUpdateRequestDto();
    if (hasNameUpdate) {
      dbUpdateDto.setName(requestDto.getName().trim());
    }
    if (hasContactUpdate) {
      dbUpdateDto.setContact(formattedContact); // 하이픈 포함된 형태로 저장
    }

    int updatedRows = userProfileMapper.updateUserProfile(userId, dbUpdateDto);
    if (updatedRows == 0) {
      throw new BaseException(BaseResponseStatus.USER_UPDATE_FAILED);
    }

    // 5. 응답 생성
    StringBuilder message = new StringBuilder("성공적으로 수정되었습니다: ");
    boolean first = true;

    if (hasNameUpdate) {
      message.append("이름");
      first = false;
    }

    if (hasContactUpdate) {
      if (!first) {
        message.append(", ");
      }
      message.append("전화번호");
    }

    return UserUpdateResponseDto.builder()
        .message(message.toString())
        .updatedName(hasNameUpdate ? requestDto.getName().trim() : null)
        .updatedContact(hasContactUpdate ? formattedContact : null) // 응답에도 하이픈 포함된 형태
        .build();
  }

  /**
   * 사용자 계정을 비활성화(소프트 삭제)합니다.
   *
   * @param userId 비활성화할 사용자의 ID
   */
  @Transactional
  public void deactivateUser(Long userId, HttpServletRequest request,
      HttpServletResponse response) {
    // 사용자 존재 및 활성 상태 확인
    User user = userProfileMapper.findUserById(userId);
    if (user == null) {
      throw new BaseException(USER_NOT_FOUND);
    }
    if (!user.getIsActive()) {
      throw new BaseException(ALREADY_DEACTIVATED_USER);
    }

    // 역할(Role)에 따른 탈퇴 전처리 로직
    // ADVISOR 또는 USER 역할에 따라 예정된 예약이 있는지 확인하고 처리.
    // if ("ADVISOR".equals(user.getRole()) || "USER".equals(user.getRole())) {
    //     if (reservationDao.hasUpcomingReservations(userId)) {
    //         throw new BaseException(CANNOT_DEACTIVATE_WITH_RESERVATIONS);
    //     }
    // }

    // 사용자 정보 비활성화 (Soft Delete)
    Long updatedRows = userProfileMapper.deactivateUser(userId);
    if (updatedRows == 0) {
      // 업데이트가 실패한 경우 (이미 비활성화되었거나 사용자가 없는 경우 등)
      throw new BaseException(USER_DEACTIVATION_FAILED);
    }
    // 토큰 로그아웃(블랙리스트) 처리
    authService.invalidateTokens(request, response);
  }
}