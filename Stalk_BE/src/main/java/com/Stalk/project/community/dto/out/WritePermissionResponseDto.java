package com.Stalk.project.community.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WritePermissionResponseDto {

  private Boolean canWrite;
  private String userRole; // USER or ADVISOR
  private String userName;
  private List<String> availableCategories;
  private String message;
}