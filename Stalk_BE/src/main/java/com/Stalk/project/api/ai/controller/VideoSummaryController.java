package com.Stalk.project.api.ai.controller;

import com.Stalk.project.api.ai.dto.VideoSummaryDTO;
import com.Stalk.project.api.ai.model.VideoSummary;
import com.Stalk.project.api.ai.service.AudioService;
import com.Stalk.project.api.ai.service.AISummaryService;
import com.Stalk.project.api.ai.service.VideoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/ai/video")
public class VideoSummaryController {

  private final VideoService videoService;
  private final AudioService audioService;
  private final AISummaryService aiSummaryService;

  public VideoSummaryController(VideoService videoService, AudioService audioService,
      AISummaryService aiSummaryService) {
    this.videoService = videoService;
    this.audioService = audioService;
    this.aiSummaryService = aiSummaryService;
  }

  @PostMapping("/upload")
  public ResponseEntity<String> uploadVideo(@RequestParam("file") MultipartFile file)
      throws IOException {
    String videoUrl = videoService.uploadVideo(file);
    return ResponseEntity.ok(videoUrl);
  }

  @PostMapping("/summarize")
  public CompletableFuture<ResponseEntity<VideoSummaryDTO>> summarizeVideo(
      @RequestParam("videoUrl") String videoUrl) throws IOException {
    String tempFilePath = downloadVideoFromS3(videoUrl);
    String transcript = audioService.extractAndTranscribe(tempFilePath);
    return aiSummaryService.summarize(videoUrl, transcript)
        .thenApply(summary -> {
          VideoSummaryDTO dto = new VideoSummaryDTO();
          dto.setId(summary.getId());
          dto.setVideoUrl(summary.getVideoUrl());
          dto.setTranscript(summary.getTranscript());
          dto.setSummary(summary.getSummary());
          dto.setCreatedAt(summary.getCreatedAt().toString());
          return ResponseEntity.ok(dto);
        });
  }

  private String downloadVideoFromS3(String videoUrl) throws IOException {
    String fileName = videoUrl.substring(videoUrl.lastIndexOf("/") + 1);
    File tempFile = File.createTempFile("video_", fileName);
    // S3Client를 사용해 다운로드 로직 구현 필요 (예시 생략)
    return tempFile.getAbsolutePath();
  }
}