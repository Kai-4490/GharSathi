package com.gharsathi.alpha.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard envelope for every API response so controllers return a
 * consistent shape regardless of the resource.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private boolean success;

    private String message;

    private T data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <D> ApiResponse<D> success(String message, D data) {
        return ApiResponse.<D>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <D> ApiResponse<D> failure(String message) {
        return ApiResponse.<D>builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}
