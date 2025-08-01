package com.Stalk.project.signup.dto.out;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvisorSignupResponse {

  // 기존
  private Long userId;
  private String message;

  // User 정보
  private String name;
  private String email;
  private String contact;
  private String nickname;

  // Advisor 정보
  private String certificateName;
  private String certificateFileSn;
  private String birth;
  private String certificateFileNumber;
}
