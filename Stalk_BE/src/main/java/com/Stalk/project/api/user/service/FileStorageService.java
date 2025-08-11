package com.Stalk.project.api.user.service;

import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponseStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

  private final Path fileStorageLocation;

  public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
    this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    try {
      Files.createDirectories(this.fileStorageLocation);
    } catch (Exception ex) {
      // 디렉토리 생성 실패 시 BaseException 발생
      throw new BaseException(BaseResponseStatus.FILE_STORAGE_ERROR, "파일을 업로드할 디렉토리를 생성할 수 없습니다.");
    }
  }

  public String storeFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      return null;
    }

    String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
    String fileExtension = "";
    try {
      if (originalFileName.contains("..")) {
        // 파일명에 부적절한 문자가 있을 경우 BaseException 발생
        throw new BaseException(BaseResponseStatus.INVALID_INPUT_VALUE,
            "파일 이름에 부적절한 문자가 포함되어 있습니다: " + originalFileName);
      }
      fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
    } catch (Exception e) {
      throw new BaseException(BaseResponseStatus.INVALID_INPUT_VALUE, "파일 확장자를 확인할 수 없습니다.");
    }

    String fileName = UUID.randomUUID().toString() + fileExtension;

    try {
      Path targetLocation = this.fileStorageLocation.resolve(fileName);
      Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
      return "/uploads/" + fileName;
    } catch (IOException ex) {
      // 파일 저장 중 I/O 에러 발생 시 BaseException 발생
      throw new BaseException(BaseResponseStatus.FILE_UPLOAD_FAILED,
          "파일 " + fileName + "을(를) 저장할 수 없습니다. 다시 시도해주세요.");
    }
  }

  public void deleteFile(String webFilePath) {
    if (webFilePath == null || webFilePath.isEmpty() || webFilePath.equals(
        "/images/default_profile.png")) {
      return;
    }

    try {
      String fileName = webFilePath.substring(webFilePath.lastIndexOf("/") + 1);
      Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
      Files.deleteIfExists(filePath);
    } catch (IOException ex) {
      // 파일 삭제 실패는 치명적인 오류가 아니므로 로그만 남기고 무시할 수 있습니다.
      // 필요하다면 여기에서도 BaseException을 던질 수 있습니다.
      System.err.println("파일 삭제 실패: " + webFilePath);
    }
  }
}
