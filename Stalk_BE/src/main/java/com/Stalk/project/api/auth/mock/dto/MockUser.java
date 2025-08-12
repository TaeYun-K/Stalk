package com.Stalk.project.api.auth.mock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MockUser {

  private Long id;
  private String userId;
  private String password;
  private String name;
  private String role;
  private boolean isActive;
  private boolean isApproved; // 전문가의 경우 승인 여부
}
