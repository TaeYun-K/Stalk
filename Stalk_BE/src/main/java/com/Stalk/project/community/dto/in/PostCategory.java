package com.Stalk.project.community.dto.in;

import lombok.Getter;

@Getter
public enum PostCategory {
  ALL("전체"),
  QUESTION("질문"),
  TRADE_RECORD("매매기록"),
  STOCK_DISCUSSION("종목토론"),
  MARKET_ANALYSIS("시황분석");

  private final String displayName;

  PostCategory(String displayName) {
    this.displayName = displayName;
  }

  public static PostCategory fromString(String category) {
    if (category == null || category.isEmpty()) {
      return ALL;
    }

    try {
      return PostCategory.valueOf(category.toUpperCase());
    } catch (IllegalArgumentException e) {
      return ALL; // 잘못된 값이면 기본값 반환
    }
  }
}