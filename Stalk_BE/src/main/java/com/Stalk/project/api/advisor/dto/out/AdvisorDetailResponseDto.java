package com.Stalk.project.api.advisor.dto.out;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdvisorDetailResponseDto {
    
    // 기본 정보
    private Long user_id;
    private String name;
    private String profile_image_url;
    private String short_intro;
    private String long_intro;
    private String preferred_trade_style;
    private String contact;
    private Double avg_rating;
    private Integer review_count;
    private Integer consultation_fee;
    
    // 경력사항 목록
    private List<CareerDto> careers;
    
    // 자격증 목록
    private List<CertificationDto> certificates;
    
    // 리뷰 목록 (최신 10개)
    private List<ReviewDto> reviews;
    private Boolean has_more_reviews;

    // 프로필 이미지 URL 변환
    public String getProfile_image_url() {
        if (this.profile_image_url != null) {
            if (this.profile_image_url.startsWith("http://") || this.profile_image_url.startsWith("https://")) {
                return this.profile_image_url;
            }
            if (this.profile_image_url.startsWith("/")) {
                return "http://localhost:8081" + this.profile_image_url;
            }
        }
        return this.profile_image_url;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CareerDto {
        private Long id;
        private String title;
        private String description;
        
        @JsonFormat(pattern = "yyyy-MM-dd")
        private java.sql.Date started_at;
        
        @JsonFormat(pattern = "yyyy-MM-dd")
        private java.sql.Date ended_at;
        
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
        private LocalDateTime created_at;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertificationDto {
        private Long id;
        private String certificate_file_sn;
        private String birth;
        private String certificate_file_number;
        private String certificate_name;
        private String issued_by;
        
        @JsonFormat(pattern = "yyyy-MM-dd")
        private java.sql.Date issued_at;
        
        @JsonFormat(pattern = "yyyy-MM-dd")
        private java.sql.Date expires_at;
        
        private String certificate_url;
        
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
        private LocalDateTime created_at;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewDto {
        private Long review_id;
        private String nickname;
        private Integer rating;
        private String content;
        private String profile_image; // 커뮤니티 프로필 이미지 추가
        
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
        private LocalDateTime created_at;
    }
}