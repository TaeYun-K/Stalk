package com.Stalk.project.api.community.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityPostPermissionDto {

  private Long postId;
  private Long authorId;
  private String authorRole;
  private String deletedAt;  // NULL이면 삭제되지 않음

  // 삭제된 글인지 확인
  public boolean isDeleted() {
    return deletedAt != null;
  }

  // 해당 사용자가 수정/삭제 권한이 있는지 확인
  public boolean hasPermission(Long currentUserId, String currentUserRole) {
    // 관리자는 모든 권한
    if ("ADMIN".equals(currentUserRole)) {
      return true;
    }

    // 본인이 작성한 글만 수정/삭제 가능
    return authorId.equals(currentUserId);
  }
}