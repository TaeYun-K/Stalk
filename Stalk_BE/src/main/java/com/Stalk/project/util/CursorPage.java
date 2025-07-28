package com.Stalk.project.util;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
public class CursorPage<T> {

    private List<T> content;
    private Long nextCursor;
    private Boolean hasNext;
    private Integer pageSize;
    private Integer pageNo;

    public static <T, U> CursorPage<T> toCursorPage(CursorPage<U> cursorPage, List<T> content) {

        return CursorPage.<T>builder()
                        .content(content)
                        .nextCursor(cursorPage.getNextCursor())
                        .hasNext(cursorPage.getHasNext())
                        .pageSize(cursorPage.getPageSize())
                        .pageNo(cursorPage.getPageNo())
                        .build();
    }

    @Builder
    public CursorPage(List<T> content, Long nextCursor, Boolean hasNext, Integer pageSize,
                    Integer pageNo) {
        this.content = content;
        this.nextCursor = nextCursor;
        this.hasNext = hasNext;
        this.pageSize = pageSize;
        this.pageNo = pageNo;
    }
}
