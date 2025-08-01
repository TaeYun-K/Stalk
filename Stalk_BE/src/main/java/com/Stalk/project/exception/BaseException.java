package com.Stalk.project.exception;

import com.Stalk.project.response.BaseResponseStatus;
import lombok.Getter;

@Getter
public class BaseException extends RuntimeException {
    
    private final BaseResponseStatus status;
    
    public BaseException(BaseResponseStatus status) {
        super(status.getMessage());
        this.status = status;
    }
    
    public BaseException(BaseResponseStatus status, String customMessage) {
        super(customMessage);
        this.status = status;
    }
    
    public BaseException(BaseResponseStatus status, Throwable cause) {
        super(status.getMessage(), cause);
        this.status = status;
    }
    
    public BaseException(BaseResponseStatus status, String customMessage, Throwable cause) {
        super(customMessage, cause);
        this.status = status;
    }
}