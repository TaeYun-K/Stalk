package com.Stalk.project.api.ai.service;

import com.Stalk.project.api.ai.dao.VideoSummaryMapper;
import com.Stalk.project.api.ai.model.VideoSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

@Service
public class AISummaryService {

  private final VideoSummaryMapper videoSummaryMapper;
  private final RestTemplate restTemplate;
  @Value("${ai.google.api-key}")
  private String googleApiKey;

  public AISummaryService(VideoSummaryMapper videoSummaryMapper, RestTemplate restTemplate) {
    this.videoSummaryMapper = videoSummaryMapper;
    this.restTemplate = restTemplate;
  }

  @Async("taskExecutor")
  public CompletableFuture<VideoSummary> summarize(String videoUrl, String transcript) {
    String apiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key="
            + googleApiKey;
    String requestBody =
        "{ \"contents\": [{ \"parts\": [{ \"text\": \"" + transcript + "\" }] }] }";
    String summary = restTemplate.postForObject(apiUrl, requestBody, String.class);

    VideoSummary videoSummary = new VideoSummary();
    videoSummary.setVideoUrl(videoUrl);
    videoSummary.setTranscript(transcript);
    videoSummary.setSummary(summary);
    videoSummary.setCreatedAt(LocalDateTime.now());

    videoSummaryMapper.insertSummary(videoSummary);
    return CompletableFuture.completedFuture(videoSummary);
  }
}