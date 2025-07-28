package com.Stalk.project.advisor.dto.in;

import com.Stalk.project.util.PageRequestDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
public class AdvisorListRequestDto extends PageRequestDto {

    @Schema(description = "거래 스타일 필터 (SHORT, MID, LONG)",
            example = "[\"SHORT\", \"LONG\"]") // 또는 "[\"LONG\"]"
    private List<PreferredTradeStyle> preferredTradeStyle;

    @Schema(description = "커서 (다음 페이지 조회용)", example = "0")
    private Long cursor;

    @Override
    public int getPageSize() {
        return super.getPageSize();
    }
}