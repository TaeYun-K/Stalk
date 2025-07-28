package com.Stalk.project.openvidu.controller;

import com.Stalk.project.openvidu.service.ConsultationSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    private final ConsultationSessionService sessionService;

    public ConsultationController(ConsultationSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/{consultationId}/session")
    public ResponseEntity<Map<String, String>> createSessionToken(
            @PathVariable String consultationId) {
        try {
            String token = sessionService.getTokenForConsultation(consultationId);
            Map<String, String> body = Map.of(
                "sessionId", consultationId,
                "token", token
            );
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", e.getMessage()));
        }
    }
}
