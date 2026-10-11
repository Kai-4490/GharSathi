package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.Role;
import com.gharsathi.alpha.entity.User;
import com.gharsathi.alpha.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;

/**
 * OTP-only auth: register -> verify-otp (activates account) -> request-otp -> login.
 * FR-1 to FR-4.
 *
 * DEV MODE: until an SMS provider is wired in, OTPs are printed to the server console
 * (look for "DEV OTP") instead of being returned in the HTTP response.
 */
@Slf4j
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
    public User register(@RequestBody @Valid RegisterRequest request) {
        if (userRepository.existsByMobileNumber(request.mobileNumber())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mobile number already registered");
        }
        if (request.email() != null && !request.email().isBlank() && userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered");
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
        log.info("DEV OTP for {}: {}", saved.getMobileNumber(), otp);
        return saved;
    }

    // FR-2: verify OTP to activate the account
    @PostMapping("/verify-otp")
    public User verifyOtp(@RequestBody @Valid OtpVerifyRequest request) {
        User user = findByMobile(request.mobileNumber());
        checkOtp(user, request.otp());

        user.setOtpVerified(true);
        clearOtp(user);
        return userRepository.save(user);
    }

    // Issue a fresh OTP - used both for re-verifying registration and for login
    @PostMapping("/request-otp")
    public Map<String, String> requestOtp(@RequestBody @Valid MobileRequest request) {
        User user = findByMobile(request.mobileNumber());

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is deactivated");
        }

        String otp = generateOtp();
        user.setCurrentOtp(otp);
        user.setOtpGeneratedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("DEV OTP for {}: {}", user.getMobileNumber(), otp);
        return Map.of("message", "OTP sent");
    }

    // FR-3: log in via OTP (account must already be verified) - issues a JWT on success
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody @Valid OtpVerifyRequest request) {
        User user = findByMobile(request.mobileNumber());

        if (!user.isOtpVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account not verified yet - verify OTP first");
        }
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is deactivated");
        }

        checkOtp(user, request.otp());

        clearOtp(user);
        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getId(), saved.getMobileNumber(), saved.getRole());
        return Map.of("token", token, "user", saved);
    }

    // ===== helpers =====

    private User findByMobile(String mobileNumber) {
        return userRepository.findByMobileNumber(mobileNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));
    }

    private void checkOtp(User user, String submittedOtp) {
        if (user.getCurrentOtp() == null || !user.getCurrentOtp().equals(submittedOtp)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }
        if (user.getOtpGeneratedAt() == null
                || Duration.between(user.getOtpGeneratedAt(), LocalDateTime.now()).toMinutes() > OTP_EXPIRY_MINUTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired, request a new one");
        }
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