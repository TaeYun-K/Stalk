package com.Stalk.project.reservation.dao;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReservationCancelCheckDto {
    
    private Long id;
    private Long userId;
    private Long advisorId;
    private String date;
    private String startTime;
    private String status;
    private String advisorName;
    private String clientName;
}
