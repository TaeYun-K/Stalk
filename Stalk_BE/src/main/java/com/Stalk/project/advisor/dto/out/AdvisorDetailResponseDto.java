package com.Stalk.project.advisor.dto.out;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvisorDetailResponseDto {
    
    @JsonProperty("user_id")
    private Long userId;
    
    private String name;
    
    @JsonProperty("profile_image_url")
    private String profileImageUrl;
    
    @JsonProperty("short_intro")
    private String shortIntro;
    
    @JsonProperty("long_intro")
    private String longIntro;
    
    @JsonProperty("preferred_trade_style")
    private String preferredTradeStyle;
    
    private String contact;
    
    @JsonProperty("avg_rating")
    private Float avgRating;
    
    @JsonProperty("review_count")
    private Integer reviewCount;
    
    private List<ReviewDto> reviews;
    
    @JsonProperty("has_more_reviews")
    private Boolean hasMoreReviews;
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewDto {
        
        @JsonProperty("review_id")
        private Long reviewId;
        
        private String nickname;
        
        private Integer rating;
        
        private String content;
        
        @JsonProperty("created_at")
        private String createdAt;
    }
}