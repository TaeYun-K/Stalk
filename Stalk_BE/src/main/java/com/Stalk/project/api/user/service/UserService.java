package com.Stalk.project.api.user.service;

import static com.Stalk.project.global.response.BaseResponseStatus.ALREADY_DEACTIVATED_USER;
import static com.Stalk.project.global.response.BaseResponseStatus.USER_DEACTIVATION_FAILED;
import static com.Stalk.project.global.response.BaseResponseStatus.USER_NOT_FOUND;

import com.Stalk.project.api.login.service.AuthService;
import com.Stalk.project.api.signup.entity.User;
import com.Stalk.project.api.user.dto.in.PasswordChangeRequestDto;
import com.Stalk.project.api.user.dto.in.ProfileUpdateRequestDto;
import com.Stalk.project.api.user.dto.out.ProfileUpdateResponseDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.Stalk.project.api.user.dao.UserProfileMapper;
import com.Stalk.project.api.user.dto.in.UserUpdateRequestDto;
import com.Stalk.project.api.user.dto.out.UserUpdateResponseDto;
import com.Stalk.project.api.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponseStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserProfileMapper userProfileMapper;
  private final AuthService authService;
  private final PasswordEncoder passwordEncoder;
  private final FileStorageService fileStorageService;

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

  /**
   * 비밀번호 변경 로직
   *
   * @param userId     현재 사용자 ID
   * @param requestDto 비밀번호 변경 요청 DTO
   */
  @Transactional // 데이터 변경이 있으므로 트랜잭션 처리
  public void changePassword(Long userId, PasswordChangeRequestDto requestDto) {
    // 사용자 조회 (없으면 예외 발생)
    User user = userProfileMapper.findUserById(userId);

    // 소셜 로그인 사용자인지 확인 (users 테이블의 login_type 컬럼 활용) - 추가

    // 계정 상태 확인 (비활성/탈퇴 사용자)
    if (!user.getIsActive()) { // is_active 컬럼
      throw new BaseException(BaseResponseStatus.DISABLED_USER); // 비활성화된 계정 에러
    }

    // 현재 비밀번호 검증
    if (!passwordEncoder.matches(requestDto.currentPassword(), user.getPassword())) {
      throw new BaseException(BaseResponseStatus.PASSWORD_NOT_MATCHED); // 기존 비밀번호 불일치 에러
    }

    // 새 비밀번호가 현재 비밀번호와 동일한지 확인
    if (passwordEncoder.matches(requestDto.newPassword(), user.getPassword())) {
      throw new BaseException(BaseResponseStatus.PASSWORD_SAME_AS_CURRENT); // 기존 비밀번호와 동일 에러
    }

    // 새 비밀번호 암호화 및 업데이트
    String newEncodedPassword = passwordEncoder.encode(requestDto.newPassword());
    userProfileMapper.updatePassword(userId, newEncodedPassword); // User 엔티티에 password 업데이트 메소드 추천

    // @Transactional에 의해 메소드 종료 시 변경 감지(Dirty Checking)로 자동 업데이트
    // userRepository.save(user); // 명시적으로 호출해도 무방
  }

  @Transactional
  public ProfileUpdateResponseDto updateNicknameAndImage(Long userId,
      ProfileUpdateRequestDto requestDto) {
    User user = userProfileMapper.findUserById(userId);

    String newNickname = requestDto.getNickname();
    String oldImageUrl = user.getImage();
    String newImageUrl = null;

    if (StringUtils.hasText(newNickname) && !newNickname.equals(user.getNickname())) {
      userProfileMapper.findByNickname(newNickname).ifPresent(u -> {
        throw new BaseException(BaseResponseStatus.NICKNAME_DUPLICATION);
      });
      user.setNickname(newNickname);
    }

    // 프로필 이미지 파일이 있으면 저장 처리
    // FileStorageService 내부에서 예외 발생 시 BaseException이 던져짐
    newImageUrl = fileStorageService.storeFile(requestDto.getProfileImage());
    if (newImageUrl != null) {
      user.setImage(newImageUrl);
    }

    // 데이터베이스 업데이트
    userProfileMapper.updateProfile(user);

    // DB 업데이트 성공 후, 기존 이미지가 있다면 파일 시스템에서 삭제
    if (newImageUrl != null) {
      fileStorageService.deleteFile(oldImageUrl);
    }

    // 응답 DTO 생성 및 반환
    return new ProfileUpdateResponseDto(user.getNickname(), user.getImage());
  }
}