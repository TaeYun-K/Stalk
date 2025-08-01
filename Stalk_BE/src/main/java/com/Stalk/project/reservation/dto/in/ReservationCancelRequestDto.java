package com.Stalk.project.reservation.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "예약 취소 요청 DTO")
public class ReservationCancelRequestDto {

    @NotNull(message = "취소 사유는 필수입니다.")
    @Schema(description = "취소 사유", example = "PERSONAL_REASON", required = true)
    private CancelReason cancelReason;

    @Size(max = 500, message = "취소 상세 사유는 500자 이내로 입력해주세요.")
    @Schema(description = "취소 상세 사유 (선택사항)", example = "갑작스런 개인 일정으로 인해 취소합니다.", maxLength = 500)
    private String cancelMemo;
}
