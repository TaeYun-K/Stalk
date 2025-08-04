package com.Stalk.project.api.ai.service;

import com.Stalk.project.api.ai.util.FFmpegUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Service
public class AudioService {

  private final FFmpegUtil ffmpegUtil;
  private final RestTemplate restTemplate;
  @Value("${ai.google.api-key}")
  private String googleApiKey;

  public AudioService(FFmpegUtil ffmpegUtil, RestTemplate restTemplate) {
    this.ffmpegUtil = ffmpegUtil;
    this.restTemplate = restTemplate;
  }

  public String extractAndTranscribe(String videoPath) throws IOException {
    String audioPath = Files.createTempFile("audio_", ".mp3").toString();
    ffmpegUtil.extractAudio(videoPath, audioPath);

    String apiUrl = "https://speech.googleapis.com/v1/speech:recognize?key=" + googleApiKey;
    String requestBody =
        "{ \"config\": { \"encoding\": \"MP3\", \"languageCode\": \"ko-KR\" }, \"audio\": { \"content\": \""
            + encodeAudioToBase64(audioPath) + "\" } }";
    String transcript = restTemplate.postForObject(apiUrl, requestBody, String.class);

    Files.deleteIfExists(Paths.get(audioPath));
    return transcript;
  }

  private String encodeAudioToBase64(String audioPath) throws IOException {
    byte[] audioBytes = Files.readAllBytes(Paths.get(audioPath));
    return java.util.Base64.getEncoder().encodeToString(audioBytes);
  }
}