package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.Role;
import com.gharsathi.alpha.entity.User;
import com.gharsathi.alpha.repository.UserRepository;
import com.gharsathi.alpha.response.ApiResponse;
import com.gharsathi.alpha.response.AuthResponse;
import com.gharsathi.alpha.response.UserResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

/**
 * OTP-only auth: register -> verify-otp (activates account) -> request-otp -> login.
 * No password, no session/JWT layer yet - client just holds onto the returned userId.
 * FR-1 to FR-4.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final int OTP_EXPIRY_MINUTES = 5;

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    // FR-1: create account
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@RequestBody @Valid RegisterRequest request) {
        if (userRepository.existsByMobileNumber(request.mobileNumber())) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Mobile number already registered"));
        }
        if (request.email() != null && !request.email().isBlank() && userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Email already registered"));
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .mobileNumber(request.mobileNumber())
                .role(request.role())
                .otpVerified(false)
                .active(true)
                .build();

        String otp = generateOtp();
        user.setCurrentOtp(otp);
        user.setOtpGeneratedAt(LocalDateTime.now());

        User saved = userRepository.save(user);

        // TODO: wire an actual SMS/OTP provider (SRS 3.3.3 - OTP Verification Service).
        // Returning the OTP in the response for now so it's testable without one.
        return ResponseEntity.ok(ApiResponse.success(
                "Registered. OTP sent (dev mode, otp=" + otp + ")",
                UserResponse.fromEntity(saved)
        ));
    }

    // FR-2: verify OTP to activate the account
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<UserResponse>> verifyOtp(@RequestBody @Valid OtpVerifyRequest request) {
        Optional<User> userOpt = userRepository.findByMobileNumber(request.mobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("User not found"));
        }
        User user = userOpt.get();

        String otpError = validateOtp(user, request.otp());
        if (otpError != null) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(otpError));
        }

        user.setOtpVerified(true);
        clearOtp(user);
        User saved = userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("OTP verified, account activated", UserResponse.fromEntity(saved)));
    }

    // Issue a fresh OTP - used both for re-verifying registration and for login
    @PostMapping("/request-otp")
    public ResponseEntity<ApiResponse<Void>> requestOtp(@RequestBody @Valid MobileRequest request) {
        Optional<User> userOpt = userRepository.findByMobileNumber(request.mobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("User not found"));
        }
        User user = userOpt.get();

        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("Account is deactivated"));
        }

        String otp = generateOtp();
        user.setCurrentOtp(otp);
        user.setOtpGeneratedAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("OTP sent (dev mode, otp=" + otp + ")", null));
    }

    // FR-3: log in via OTP (account must already be verified) - issues a JWT on success
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody @Valid OtpVerifyRequest request) {
        Optional<User> userOpt = userRepository.findByMobileNumber(request.mobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("User not found"));
        }
        User user = userOpt.get();

        if (!user.isOtpVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("Account not verified yet - verify OTP first"));
        }
        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("Account is deactivated"));
        }

        String otpError = validateOtp(user, request.otp());
        if (otpError != null) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(otpError));
        }

        clearOtp(user);
        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getId(), saved.getMobileNumber(), saved.getRole());
        AuthResponse authResponse = AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(saved))
                .build();

        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    // ===== helpers =====

    private String validateOtp(User user, String submittedOtp) {
        if (user.getCurrentOtp() == null || !user.getCurrentOtp().equals(submittedOtp)) {
            return "Invalid OTP";
        }
        if (user.getOtpGeneratedAt() == null
                || Duration.between(user.getOtpGeneratedAt(), LocalDateTime.now()).toMinutes() > OTP_EXPIRY_MINUTES) {
            return "OTP expired, request a new one";
        }
        return null;
    }

    private void clearOtp(User user) {
        user.setCurrentOtp(null);
        user.setOtpGeneratedAt(null);
    }

    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    // ===== Request DTOs =====

    public record RegisterRequest(
            @NotBlank String name,
            @Email String email,
            @NotBlank String mobileNumber,
            @NotNull Role role
    ) {}

    public record OtpVerifyRequest(
            @NotBlank String mobileNumber,
            @NotBlank String otp
    ) {}

    public record MobileRequest(
            @NotBlank String mobileNumber
    ) {}
}
