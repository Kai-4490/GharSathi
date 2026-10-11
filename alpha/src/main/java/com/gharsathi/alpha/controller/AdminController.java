package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.*;
import com.gharsathi.alpha.repository.ProfileRepository;
import com.gharsathi.alpha.repository.ReportRepository;
import com.gharsathi.alpha.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.StreamSupport;

/**
 * Admin panel endpoints. FR-20 to FR-22.
 * Access is restricted to ROLE_ADMIN in SecurityConfig.
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
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // FR-21: deactivate a user (e.g. after acting on a report)
    @PatchMapping("/users/{userId}/deactivate")
    public User deactivateUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setActive(false);
        return userRepository.save(user);
    }

    // FR-20, FR-22: view reports, optionally filtered by status
    @GetMapping("/reports")
    public List<Report> getReports(@RequestParam(required = false) ReportStatus status) {
        return status != null ? reportRepository.findByStatus(status) : reportRepository.findAll();
    }

    // FR-21: review a report and record the action taken
    @PatchMapping("/reports/{reportId}/review")
    public Report reviewReport(@PathVariable Long reportId, @RequestBody @Valid ReviewRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        report.setStatus(request.status());
        report.setAdminNote(request.adminNote());
        return reportRepository.save(report);
    }

    // FR-8: verification queue - profiles waiting on admin review
    @GetMapping("/profiles/pending-verification")
    public List<Profile> getPendingVerifications() {
        Iterable<Profile> pending = profileRepository.findByVerificationStatus(VerificationStatus.PENDING);
        return StreamSupport.stream(pending.spliterator(), false).toList();
    }

    // FR-8: approve/reject a profile's verification
    @PatchMapping("/profiles/{profileId}/verification")
    public Profile setVerificationStatus(@PathVariable Long profileId, @RequestBody @Valid VerificationRequest request) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        profile.setVerificationStatus(request.status());
        return profileRepository.save(profile);
    }

    // ===== Request DTOs =====

    public record ReviewRequest(@NotNull ReportStatus status, String adminNote) {}

    public record VerificationRequest(@NotNull VerificationStatus status) {}
}