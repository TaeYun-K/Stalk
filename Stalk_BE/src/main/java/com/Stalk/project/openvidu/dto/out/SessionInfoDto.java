package com.Stalk.project.openvidu.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Repository;
@Schema(description = "상담방 생성 여부 조회 시 보내는 response")
@Data
@AllArgsConstructor
public class SessionInfoDto {
    private String sessionId;
    private String createdAt; // ISO 8601 문자열
}
