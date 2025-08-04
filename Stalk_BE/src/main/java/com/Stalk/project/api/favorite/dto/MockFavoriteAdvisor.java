package com.Stalk.project.api.favorite.dto;

import com.Stalk.project.api.favorite.dto.in.PreferredTradeStyle;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MockFavoriteAdvisor {
    private Long advisorId;
    private String nickname;
    private String profileImage;
    private String shortIntro;
    private PreferredTradeStyle preferredTradeStyle;
}
