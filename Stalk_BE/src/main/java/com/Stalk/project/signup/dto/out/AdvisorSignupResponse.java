package com.Stalk.project.signup.dto.out;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdvisorSignupResponse {

    private Long userId; // 신규 생성된 users.id
    private String message; // 성공 메시지
}
