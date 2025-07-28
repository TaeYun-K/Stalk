package com.Stalk.project.reservation.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ConsultationReservationResponseDto {

  @Schema(description = "생성된 예약 ID", example = "101")
  private Long reservationId;

  @Schema(description = "예약된 일시(ISO 8601)", example = "2025-07-20T15:00:00+09:00")
  private String scheduledTime;
}