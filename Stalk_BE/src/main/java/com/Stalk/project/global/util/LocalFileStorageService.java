package com.Stalk.project.global.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    // application.properties에 정의된 업로드 기본 경로
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file) {
        // 1) 원본 파일명 정리
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        // 2) 확장자 분리
        String ext = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx >= 0) {
            ext = originalFilename.substring(dotIdx);
        }
        // 3) 저장할 파일명 생성 (UUID + 타임스탬프)
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String filename = UUID.randomUUID() + "_" + timestamp + ext;

        // 4) 디렉터리 생성 (없으면)
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("업로드 디렉터리 생성 실패: " + uploadPath, e);
        }

        // 5) 실제 파일 저장
        try {
            Path targetLocation = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            // 반환값은 클라이언트가 접근 가능한 URL 혹은 저장된 상대 경로
            return "/uploads/" + filename;
        } catch (IOException ex) {
            throw new RuntimeException("파일 저장 실패: " + originalFilename, ex);
        }
    }
}
