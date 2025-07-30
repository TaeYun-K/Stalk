package com.Stalk.project.user.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.user.service.UserService;
import com.Stalk.project.user.dto.in.UserUpdateRequestDto;
import com.Stalk.project.user.dto.out.UserUpdateResponseDto;
import com.Stalk.project.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.auth.mock.util.TokenUtils;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/me")
  public BaseResponse<UserProfileResponseDto> getMyProfile(
      @RequestHeader("Authorization") String token) {
    Long userId = TokenUtils.extractUserId(token);
    UserProfileResponseDto userProfile = userService.getUserProfile(userId);
    return new BaseResponse<>(userProfile);
  }

  @PatchMapping("/me")
  public BaseResponse<UserUpdateResponseDto> updateMyProfile(
      @RequestHeader("Authorization") String token,
      @Valid @RequestBody UserUpdateRequestDto requestDto) {

    Long userId = TokenUtils.extractUserId(token);
    UserUpdateResponseDto result = userService.updateUserProfile(userId, requestDto);
    return new BaseResponse<>(result);
  }
}
