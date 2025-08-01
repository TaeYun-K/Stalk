package com.Stalk.project.login.dto.in;

import lombok.Data;

@Data
public class LoginRequest {

  private String userId;
  private String password;
}