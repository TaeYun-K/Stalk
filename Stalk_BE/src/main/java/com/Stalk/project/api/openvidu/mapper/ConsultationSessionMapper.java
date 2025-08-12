package com.Stalk.project.api.openvidu.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ConsultationSessionMapper {

    /**
     * 상담 테이블에 sessionId 업데이트
     * @param consultationId 상담 ID
     * @param sessionId OpenVidu 세션 ID
     */
    void updateSessionId(@Param("consultationId") Long consultationId,
                         @Param("sessionId") String sessionId);
}
