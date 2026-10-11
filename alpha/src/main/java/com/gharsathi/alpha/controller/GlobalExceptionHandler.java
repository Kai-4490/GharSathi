package com.gharsathi.alpha.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Not a @RestController - lives in controller/ because the project structure is fixed.
 *
 * Every error comes back as {"message": "..."} with the right HTTP status.
 * Successful responses are plain entities / lists (no envelope).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // thrown by controllers: new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
    // MUST be handled before the catch-all below, otherwise it would turn into a 500.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : ex.getStatusCode().toString();
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return ResponseEntity.badRequest().body(Map.of(
                "message", message.isBlank() ? "Validation failed" : message
        ));
    }

    // catch-all so unexpected exceptions also come back as JSON, not a raw 500 stack trace
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Unexpected error: " + ex.getMessage()));
    }
}