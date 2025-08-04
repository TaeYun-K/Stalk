package com.Stalk.project.api.ai.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;

@Component
public class FFmpegUtil {

  @Value("${ffmpeg.path}")
  private String ffmpegPath;

  public String extractAudio(String videoPath, String outputPath) throws IOException {
    File outputFile = new File(outputPath);
      if (outputFile.exists()) {
          outputFile.delete();
      }
    ProcessBuilder pb = new ProcessBuilder(ffmpegPath, "-i", videoPath, "-vn", "-acodec", "mp3",
        outputPath);
    pb.redirectErrorStream(true);
    Process process = pb.start();
    try {
      process.waitFor();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IOException("FFmpeg audio extraction interrupted", e);
    }
      if (!outputFile.exists()) {
          throw new IOException("Failed to extract audio to " + outputPath);
      }
    return outputPath;
  }
}