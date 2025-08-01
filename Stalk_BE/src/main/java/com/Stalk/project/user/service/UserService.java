package com.Stalk.project.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.Stalk.project.user.dao.UserProfileMapper;
import com.Stalk.project.user.dto.in.UserUpdateRequestDto;
import com.Stalk.project.user.dto.out.UserUpdateResponseDto;
import com.Stalk.project.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.exception.BaseException;
import com.Stalk.project.response.BaseResponseStatus;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserProfileMapper userProfileMapper;

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
}