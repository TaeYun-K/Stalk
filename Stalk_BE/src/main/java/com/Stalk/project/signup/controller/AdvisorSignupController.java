package com.Stalk.project.signup.controller;

import com.Stalk.project.signup.dto.in.AdvisorSignupRequest;
import com.Stalk.project.signup.dto.out.AdvisorSignupResponse;
import com.Stalk.project.signup.service.AdvisorSignupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/advisor")
@RequiredArgsConstructor
public class AdvisorSignupController {

    private final AdvisorSignupService signupService;

    @PostMapping(value = "/signup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdvisorSignupResponse> signup(
            @Validated @ModelAttribute AdvisorSignupRequest request
    ) {
        AdvisorSignupResponse response = signupService.signup(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
