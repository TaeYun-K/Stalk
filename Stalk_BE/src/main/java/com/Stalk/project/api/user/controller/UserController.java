package com.Stalk.project.api.user.controller;

import com.Stalk.project.global.util.SecurityUtil;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.api.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.api.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
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
}