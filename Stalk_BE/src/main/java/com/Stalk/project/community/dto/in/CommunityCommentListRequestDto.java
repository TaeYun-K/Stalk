package com.Stalk.project.community.dto.in;

import com.Stalk.project.util.PageRequestDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CommunityCommentListRequestDto extends PageRequestDto {

  // 부모 클래스의 pageNo, pageSize 그대로 사용
  // 필요시 추가 필터링 조건 여기에 추가 가능

}