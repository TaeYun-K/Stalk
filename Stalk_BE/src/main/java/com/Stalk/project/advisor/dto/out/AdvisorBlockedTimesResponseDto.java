package com.Stalk.project.advisor.dto.out;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdvisorBlockedTimesResponseDto {

  private String date;
  private List<String> blockedTimeSlots;
}