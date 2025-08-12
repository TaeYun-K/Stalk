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
public class AdvisorReviewResponseDto {
    
    @JsonProperty("reviewId")
    private Long reviewId;
    
    @JsonProperty("userName")
    private String userName;
    
    @JsonProperty("rating")
    private Integer rating;
    
    @JsonProperty("content")
    private String content;
    
    @JsonProperty("createdAt")
    private String createdAt;
}