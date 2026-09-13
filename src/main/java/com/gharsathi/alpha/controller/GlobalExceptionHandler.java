package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * NOTE: this isn't a @RestController either - same reasoning as JwtUtil/JwtAuthFilter/SecurityConfig,
 * it lives in controller/ because the project structure is fixed to 4 folders.
 *
 * Without this, a failed @Valid check returns Spring's default error JSON shape, which doesn't
 * match the ApiResponse envelope every other endpoint uses. This makes validation failures
 * consistent with the rest of the API.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return ResponseEntity.badRequest().body(ApiResponse.failure(
                message.isBlank() ? "Validation failed" : message
        ));
    }

    // catch-all so unexpected exceptions also come back in ApiResponse shape, not a raw 500 stack trace
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure("Unexpected error: " + ex.getMessage()));
    }
}
