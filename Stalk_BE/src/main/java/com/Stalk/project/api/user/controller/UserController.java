package com.Stalk.project.api.user.controller;

import com.Stalk.project.api.login.service.MyUserDetails;
import com.Stalk.project.api.user.dto.in.PasswordChangeRequestDto;
import com.Stalk.project.global.util.SecurityUtil;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.api.user.dto.in.UserUpdateRequestDto;
import com.Stalk.project.api.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.api.user.dto.out.UserUpdateResponseDto;
import com.Stalk.project.api.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "사용자 관련 API")
public class UserController {

  private final UserService userService;

  @GetMapping("/me")
  @Operation(
      summary = "내 프로필 정보 조회",
      description = "현재 로그인한 사용자의 프로필 정보를 조회합니다.",
      security = @SecurityRequirement(name = "Bearer Authentication")
  )
  public BaseResponse<UserProfileResponseDto> getMyProfile() {

    // JWT에서 현재 사용자 ID 추출 (users.id)
    Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

    UserProfileResponseDto userProfile = userService.getUserProfile(currentUserId);
    return new BaseResponse<>(userProfile);
  }

  @PutMapping("/me")
  @Operation(
      summary = "내 정보 수정",
      description = "현재 로그인한 사용자의 이름과 전화번호를 수정합니다. " +
          "전화번호는 010으로 시작하는 11자리 숫자로 입력해주세요 (하이픈 없이).",
      security = @SecurityRequirement(name = "Bearer Authentication")
  )
  public BaseResponse<UserUpdateResponseDto> updateMyProfile(
      @Valid @RequestBody UserUpdateRequestDto requestDto) {

    // JWT에서 현재 사용자 ID 추출 (users.id)
    Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

    UserUpdateResponseDto result = userService.updateUserProfile(currentUserId, requestDto);
    return new BaseResponse<>(result);
  }

  /**
   * 회원 탈퇴 API
   *
   * @param request  현재 HTTP 요청 객체 (토큰 추출용)
   * @param response 현재 HTTP 응답 객체 (쿠키 만료용)
   * @return BaseResponse<String>
   */
  @PatchMapping("/me/deactivate")
  @Operation(summary = "회원 탈퇴 (비활성화)", description = "로그인된 사용자의 계정을 비활성화하고 즉시 로그아웃 처리합니다.")
  public BaseResponse<String> deactivateUser(HttpServletRequest request,
      HttpServletResponse response) {
    // SecurityUtil을 통해 현재 로그인한 사용자의 ID를 가져옴
    Long userId = SecurityUtil.getCurrentUserPrimaryIdRequired();
    userService.deactivateUser(userId, request, response);

    return new BaseResponse<>("회원 탈퇴가 성공적으로 처리되었습니다.");
  }

  @PatchMapping("/me/password")
  @Operation(
      summary = "비밀번호 변경",
      description = "현재 로그인한 사용자의 비밀번호를 변경합니다.",
      security = @SecurityRequirement(name = "Bearer Authentication")
  )
  public BaseResponse<String> changeMyPassword(
      @Valid @RequestBody PasswordChangeRequestDto requestDto) {
    // JWT에서 현재 사용자 ID 추출
    Long currentUserId = SecurityUtil.getCurrentUserPrimaryIdRequired();
    userService.changePassword(currentUserId, requestDto);
    return new BaseResponse<>("비밀번호가 성공적으로 변경되었습니다.");
  }
}