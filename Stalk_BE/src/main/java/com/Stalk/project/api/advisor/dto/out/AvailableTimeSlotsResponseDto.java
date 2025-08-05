package com.Stalk.project.api.advisor.dto.out;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.util.List;

@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailableTimeSlotsResponseDto {
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    
    @JsonProperty("time_slots")
    private List<TimeSlot> timeSlots;
    
    @Getter
    @ToString
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeSlot {
        
        @JsonFormat(pattern = "HH:mm")
        private String time;
        
        @JsonProperty("is_available")
        private Boolean isAvailable;
        
        @JsonProperty("is_reserved")
        private Boolean isReserved;
        
        @JsonProperty("is_blocked")
        private Boolean isBlocked;
    }
}