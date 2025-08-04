package com.Stalk.project.api.advisor.dto.in;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdvisorBlockedTimesRequestDto {

  @NotNull(message = "차단할 시간 목록은 필수입니다.")
  @Size(max = 12, message = "차단 가능한 시간은 최대 12개입니다.")
  private List<String> blockedTimes;
}