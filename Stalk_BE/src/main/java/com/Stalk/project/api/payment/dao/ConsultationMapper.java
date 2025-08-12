package com.Stalk.project.api.payment.dao;

import com.Stalk.project.api.payment.dto.in.ConsultationSessionUpdateDto;
import com.Stalk.project.api.payment.dto.out.ConsultationSession;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ConsultationMapper {
    
    /**
     * orderId로 결제 정보 조회
     */
    ConsultationSession findByOrderId(@Param("orderId") String orderId);
    
    /**
     * 결제 상태 업데이트 (취소 처리)
     */
    void updateConsultationStatus(ConsultationSessionUpdateDto updateDto);
}