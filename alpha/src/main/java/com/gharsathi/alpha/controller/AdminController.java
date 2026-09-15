package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.*;
import com.gharsathi.alpha.repository.ProfileRepository;
import com.gharsathi.alpha.repository.ReportRepository;
import com.gharsathi.alpha.repository.UserRepository;
import com.gharsathi.alpha.response.ApiResponse;
import com.gharsathi.alpha.response.ProfileResponse;
import com.gharsathi.alpha.response.ReportResponse;
import com.gharsathi.alpha.response.UserResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;

/**
 * Admin panel endpoints. FR-20 to FR-22.
 * NOTE: no auth/role-guard middleware exists yet - anyone can hit these URLs right now.
 * Before shipping, these need to be locked down to Role.ADMIN (e.g. via a request header
 * carrying the acting userId, checked against user.getRole(), until real auth exists).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public AdminController(ReportRepository reportRepository, UserRepository userRepository, ProfileRepository profileRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    // FR-20: list all users
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Users fetched", users));
    }

    // FR-21: deactivate a user (e.g. after acting on a report)
    @PatchMapping("/users/{userId}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("User not found"));
        }
        User user = userOpt.get();
        user.setActive(false);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("User deactivated", null));
    }

    // FR-20, FR-22: view reports, optionally filtered by status
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<ReportResponse>>> getReports(
            @RequestParam(required = false) ReportStatus status
    ) {
        List<Report> reports = status != null ? reportRepository.findByStatus(status) : reportRepository.findAll();
        List<ReportResponse> response = reports.stream().map(ReportResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success("Reports fetched", response));
    }

    // FR-21: review a report and record the action taken
    @PatchMapping("/reports/{reportId}/review")
    public ResponseEntity<ApiResponse<ReportResponse>> reviewReport(@PathVariable Long reportId,
                                                                      @RequestBody @Valid ReviewRequest request) {
        Optional<Report> reportOpt = reportRepository.findById(reportId);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Report not found"));
        }
        Report report = reportOpt.get();
        report.setStatus(request.status());
        report.setAdminNote(request.adminNote());
        Report saved = reportRepository.save(report);
        return ResponseEntity.ok(ApiResponse.success("Report reviewed", ReportResponse.fromEntity(saved)));
    }

    // FR-8: verification queue - profiles waiting on admin review
    @GetMapping("/profiles/pending-verification")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> getPendingVerifications() {
        Iterable<Profile> pendingProfiles = profileRepository.findByVerificationStatus(VerificationStatus.PENDING);
        List<ProfileResponse> pending = StreamSupport.stream(pendingProfiles.spliterator(), false)
                .map(ProfileResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Pending verifications fetched", pending));
    }

    // FR-8: approve/reject a profile's verification
    @PatchMapping("/profiles/{profileId}/verification")
    public ResponseEntity<ApiResponse<ProfileResponse>> setVerificationStatus(@PathVariable Long profileId,
                                                                                @RequestBody @Valid VerificationRequest request) {
        Optional<Profile> profileOpt = profileRepository.findById(profileId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Profile not found"));
        }
        Profile profile = profileOpt.get();
        profile.setVerificationStatus(request.status());
        Profile saved = profileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.success("Verification status updated", ProfileResponse.fromEntity(saved)));
    }

    // ===== Request DTOs =====

    public record ReviewRequest(@NotNull ReportStatus status, String adminNote) {}

    public record VerificationRequest(@NotNull VerificationStatus status) {}
}
