package com.Stalk.project.api.ai.controller;

import com.Stalk.project.api.ai.dto.in.VideoAnalysisRequest;
import com.Stalk.project.api.ai.dto.out.VideoAnalysisResponse;
import com.Stalk.project.api.ai.entity.AnalysisResult;
import com.Stalk.project.api.ai.service.VideoAnalysisService;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/*
 * @RestController를 통해 이 클래스의 모든 메소드가 HTTP 응답 본문(Body)으로 직접 데이터를 반환함을 명시
 */
@RestController
@RequestMapping("/api/ai")
public class VideoAnalysisController {

  private final VideoAnalysisService videoAnalysisService;

  @Autowired
  public VideoAnalysisController(VideoAnalysisService videoAnalysisService) {
    this.videoAnalysisService = videoAnalysisService;
  }

  /**
   * 영상 URL을 받아 분석하고 결과를 반환하는 API 엔드포인트
   *
   * @param request 'videoUrl'을 포함하는 요청 본문
   * @return 분석 결과 DTO를 포함한 ResponseEntity
   */
  @PostMapping("/analyze-video")
  public ResponseEntity<?> analyzeVideoFromUrl(@RequestBody VideoAnalysisRequest request) {
    if (request.getVideoUrl() == null || request.getVideoUrl().trim().isEmpty()) {
      return ResponseEntity.badRequest().body("Please provide a 'videoUrl'.");
    }


    try {
      // URL을 처리하는 서비스 메소드를 호출하도록 변경
      AnalysisResult result = videoAnalysisService.processAndSaveAnalysisFromUrl(
          request.getVideoRecordingId(),
          request.getVideoUrl()
      );
      VideoAnalysisResponse responseDto = new VideoAnalysisResponse(
          result.getId(),
          result.getOriginalFileName(),
          result.getAnalysisSummary(),
          result.getCreatedAt()
      );
      return ResponseEntity.ok(responseDto);
    } catch (IOException e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Failed to analyze video from URL: " + e.getMessage());
    }
  }

  /**
   * 녹화 ID로 영상 분석 결과를 조회하는 API 엔드포인트
   *
   * @param videoRecordingId 조회할 영상의 녹화 ID
   * @return 분석 결과 DTO 또는 404 Not Found
   */
  @GetMapping("/analysis-result/{videoRecordingId}")
  public ResponseEntity<?> getAnalysisResult(@PathVariable Long videoRecordingId) {
    Optional<AnalysisResult> resultOptional = videoAnalysisService.getAnalysisResultByVideoRecordingId(videoRecordingId);

    if (resultOptional.isPresent()) {
      AnalysisResult result = resultOptional.get();
      VideoAnalysisResponse responseDto = new VideoAnalysisResponse(
          result.getId(),
          result.getOriginalFileName(),
          result.getAnalysisSummary(),
          result.getCreatedAt()
      );
      return ResponseEntity.ok(responseDto);
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body("Analysis result not found for video recording ID: " + videoRecordingId);
    }
  }
}
