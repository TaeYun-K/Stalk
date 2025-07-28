package com.Stalk.project.advisor.dto.out;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalTime;

@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class BlockedTimeDto {
    private LocalTime startTime;
    private LocalTime endTime;
}