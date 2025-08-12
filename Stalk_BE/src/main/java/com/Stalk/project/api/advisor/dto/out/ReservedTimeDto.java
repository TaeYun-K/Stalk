package com.Stalk.project.api.advisor.dto.out;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalTime;

@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ReservedTimeDto {
    private LocalTime startTime;
    private LocalTime endTime;
}