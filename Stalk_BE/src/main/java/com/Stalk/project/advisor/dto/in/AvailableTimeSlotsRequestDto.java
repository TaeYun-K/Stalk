package com.Stalk.project.advisor.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class AvailableTimeSlotsRequestDto {
    
    @Schema(description = "조회할 날짜 (YYYY-MM-DD 형식)", example = "2025-07-24")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    
    // 기본값을 오늘로 설정하는 메서드
    public LocalDate getDate() {
        return date != null ? date : LocalDate.now();
    }
}