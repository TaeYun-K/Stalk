package com.Stalk.project.user.dto.out;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserUpdateResponseDto {

  private String message;
  private String updatedName;
  private String updatedContact;

}