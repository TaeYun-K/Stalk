package com.Stalk.project.api.reservation.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentReservationRequestDto {

    @NotNull(message = "전문가 ID는 필수입니다.")
    @Schema(description = "전문가 사용자 ID", example = "1")
    private Long advisorUserId;

    @NotNull(message = "날짜는 필수입니다.")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)")
    @Schema(description = "예약 날짜", example = "2025-07-30")
    private String date;

    @NotNull(message = "시간은 필수입니다.")
    @Pattern(regexp = "^([0-1]?[0-9]|2[0-3]):00$", message = "정시만 입력 가능합니다. (HH:00)")
    @Schema(description = "예약 시간", example = "15:00")
    private String time;

    @Schema(description = "상담 요청 메시지", example = "주식 투자 초보자 상담 요청")
    private String requestMessage;
}