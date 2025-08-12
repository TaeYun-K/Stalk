package com.Stalk.project.api.advisor.dto.out;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdvisorBlockedTimesUpdateResponseDto {

  private String date;
  private List<String> updatedBlockedTimes;
}