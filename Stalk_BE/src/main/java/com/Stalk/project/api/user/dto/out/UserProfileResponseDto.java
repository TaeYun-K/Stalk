package com.Stalk.project.api.user.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto {

  private Long id;               // 👈 새로 추가: 숫자 기본키 (users.id)
  private String userId;         // 사용자 ID (user_id)
  private String name;           // 이름
  private String nickname;       // 👈 새로 추가: 커뮤니티 닉네임 (일반 사용자용)
  private String contact;        // 연락처
  private String email;          // 이메일
  private String profileImage;   // 프로필 이미지
  private String role;           // 역할 (USER/ADVISOR/ADMIN)
}