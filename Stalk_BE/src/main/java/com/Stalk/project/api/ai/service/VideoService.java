package com.Stalk.project.api.ai.service;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class VideoService {

  private final S3Client s3Client;
  @Value("${aws.s3.bucket}")
  private String bucketName;

  public VideoService(S3Client s3Client) {
    this.s3Client = s3Client;
  }

  public String uploadVideo(MultipartFile file) throws IOException {
    String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
    File tempFile = File.createTempFile("video_", fileName);
    file.transferTo(tempFile);

    s3Client.putObject(PutObjectRequest.builder().bucket(bucketName).key(fileName).build(),
        RequestBody.fromFile(tempFile.toPath()));
    tempFile.delete();

    return s3Client.utilities().getUrl(b -> b.bucket(bucketName).key(fileName)).toString();
  }
}