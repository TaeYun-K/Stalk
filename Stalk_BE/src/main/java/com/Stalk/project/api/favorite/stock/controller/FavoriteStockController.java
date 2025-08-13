package com.Stalk.project.api.favorite.stock.controller;

import com.Stalk.project.api.favorite.stock.dto.in.FavoriteStockRequestDto;
import com.Stalk.project.api.favorite.stock.dto.out.FavoriteStockResponseDto;
import com.Stalk.project.api.favorite.stock.service.FavoriteStockService;
import com.Stalk.project.global.util.SecurityUtil; // SecurityUtil import 추가
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "관심 종목 API", description = "관심 종목 조회, 추가, 삭제 관련 API")
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteStockController {

    private final FavoriteStockService favoriteStockService;

    // --- [조회] ---
    @GetMapping
    @Operation(summary = "관심 종목 목록 조회", description = "로그인된 사용자의 관심 종목 목록과 각 종목의 현재 시세를 조회합니다.")
    public ResponseEntity<List<FavoriteStockResponseDto>> getFavorites() {
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryIdRequired();
        List<FavoriteStockResponseDto> favorites = favoriteStockService.getFavorites(currentUserId);
        return ResponseEntity.ok(favorites);
    }

    // --- [저장] ---
    @PostMapping
    @Operation(summary = "관심 종목 추가", description = "로그인된 사용자의 관심 종목 목록에 새로운 종목을 추가합니다.")
    public ResponseEntity<Void> addFavorite(
        @Valid @RequestBody FavoriteStockRequestDto requestDto) {
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryIdRequired();
        favoriteStockService.addFavorite(currentUserId, requestDto.getTicker());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // --- [삭제] ---
    @DeleteMapping("/{ticker}")
    @Operation(summary = "관심 종목 삭제", description = "로그인된 사용자의 관심 종목 목록에서 특정 종목을 삭제합니다.")
    public ResponseEntity<Void> deleteFavorite(@PathVariable String ticker) {
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryIdRequired();
        favoriteStockService.deleteFavorite(currentUserId, ticker);
        return ResponseEntity.noContent().build();
    }
}