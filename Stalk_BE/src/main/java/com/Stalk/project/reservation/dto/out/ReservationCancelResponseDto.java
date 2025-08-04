package com.Stalk.project.reservation.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "예약 취소 응답 DTO")
public class ReservationCancelResponseDto {

  @Schema(description = "취소된 예약 ID", example = "101")
  private Long reservationId;

  @Schema(description = "취소 처리 시각 (ISO 8601 형식)", example = "2025-07-28T14:30:00+09:00")
  private String canceledAt;

  @Schema(description = "취소 완료 메시지", example = "예약이 성공적으로 취소되었습니다.")
  private String message;
}