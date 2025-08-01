package com.Stalk.project.favorite.dto.out;

import com.Stalk.project.favorite.dto.in.PreferredTradeStyle;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FavoriteAdvisorResponseDto {
    
    private Long advisorId;                    // 전문가 고유 ID (advisors.user_id)
    private String nickname;                   // 전문가 닉네임
    private String profileImage;               // 프로필 이미지 URL (nullable)
    private String shortIntro;                 // 간단한 소개 문구 (nullable)
    private PreferredTradeStyle preferredTradeStyle; // 선호 매매 스타일 (nullable)
}
