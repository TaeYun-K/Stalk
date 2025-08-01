package com.Stalk.project.user.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto {

  private String userId;         // 사용자 ID (user_id로 변경 - String 타입)
  private String name;           // 이름
  private String contact;        // 연락처
  private String email;          // 이메일
  private String profileImage;   // 프로필 이미지
  private String role;           // 역할 (USER/ADVISOR/ADMIN)
}