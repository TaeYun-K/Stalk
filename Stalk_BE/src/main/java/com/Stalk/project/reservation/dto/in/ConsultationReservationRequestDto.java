package com.Stalk.project.reservation.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ConsultationReservationRequestDto {

  @NotNull(message = "전문가 ID는 필수입니다.")
  @Schema(description = "상담할 전문가의 user_id", example = "27")
  private Long advisorUserId;

  @NotBlank(message = "상담일자는 필수입니다.")
  @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)")
  @Schema(description = "상담일자(YYYY-MM-DD)", example = "2025-07-20")
  private String date;

  @NotBlank(message = "상담시간은 필수입니다.")
  @Pattern(regexp = "^([0-1]?[0-9]|2[0-3]):00$", message = "시간 형식이 올바르지 않습니다. 정시만 입력 가능합니다. (HH:00)")
  @Schema(description = "상담 시간 (HH:00, 정시만 가능)", example = "15:00")
  private String time;

  @Schema(description = "상담 요청 내용", example = "입문 투자 상담")
  private String requestMessage;
}