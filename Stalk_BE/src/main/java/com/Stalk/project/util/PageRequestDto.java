package com.Stalk.project.util;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class PageRequestDto {
    
    @Schema(defaultValue = "1", description = "조회할 페이지 번호 (1부터 시작)")
    private int pageNo = 1;

    @Schema(defaultValue = "10", description = "페이지당 항목 수")
    private int pageSize = 10;

    @JsonIgnore
    public int getOffset() {
        return (pageNo - 1) * pageSize;
    }
    
    @JsonIgnore
    public int getLimitPlusOne() {
        return pageSize + 1;
    }
    
}
