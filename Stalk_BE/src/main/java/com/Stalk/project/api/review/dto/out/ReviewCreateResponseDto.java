package com.Stalk.project.api.review.dto.out;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewCreateResponseDto {
    
    @JsonProperty("reviewId")
    private Long reviewId;
    
    @JsonProperty("message")
    private String message;
}