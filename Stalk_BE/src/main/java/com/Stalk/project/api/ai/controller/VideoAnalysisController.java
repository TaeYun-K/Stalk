package com.Stalk.project.api.ai.controller;

import com.Stalk.project.api.ai.dto.VideoAnalysisResponse;
import com.Stalk.project.api.ai.entity.AnalysisResult;
import com.Stalk.project.api.ai.service.VideoAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/ai")
public class VideoAnalysisController {

  private final VideoAnalysisService videoAnalysisService;

  @Autowired
  public VideoAnalysisController(VideoAnalysisService videoAnalysisService) {
    this.videoAnalysisService = videoAnalysisService;
  }

  /**
   * 영상 파일을 받아 분석하고 결과를 반환하는 API 엔드포인트입니다.
   *
   * @param file 'videoFile'이라는 이름으로 전송된 영상 파일
   * @return 분석 결과 DTO를 포함한 ResponseEntity
   */
  @PostMapping("/analyze-video")
  public ResponseEntity<?> analyzeVideo(@RequestParam("videoFile") MultipartFile file) {
    if (file.isEmpty()) {
      return ResponseEntity.badRequest().body("Please select a file to upload.");
    }

    try {
      AnalysisResult result = videoAnalysisService.processAndSaveAnalysis(file);
      VideoAnalysisResponse responseDto = new VideoAnalysisResponse(
          result.getId(),
          result.getOriginalFileName(),
          result.getAnalysisSummary(),
          result.getCreatedAt()
      );
      return ResponseEntity.ok(responseDto);
    } catch (IOException e) {
      // 로깅 프레임워크를 사용하여 에러를 기록하는 것이 좋습니다.
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Failed to analyze video: " + e.getMessage());
    }
  }
}
