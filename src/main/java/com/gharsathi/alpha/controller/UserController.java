package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.Profile;
import com.gharsathi.alpha.entity.User;
import com.gharsathi.alpha.entity.VerificationStatus;
import com.gharsathi.alpha.repository.ProfileRepository;
import com.gharsathi.alpha.repository.UserRepository;
import com.gharsathi.alpha.response.ApiResponse;
import com.gharsathi.alpha.response.ProfileResponse;
import com.gharsathi.alpha.response.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;

/**
 * Account + profile management. FR-4 to FR-8.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public UserController(UserRepository userRepository, ProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("User not found"));
        }
        return ResponseEntity.ok(ApiResponse.success("User fetched", UserResponse.fromEntity(userOpt.get())));
    }

    // FR-4: update basic account details
    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long userId,
                                                                  @RequestBody @Valid UpdateUserRequest request) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("User not found"));
        }
        User user = userOpt.get();
        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.email() != null && !request.email().isBlank()) {
            user.setEmail(request.email());
        }
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("User updated", UserResponse.fromEntity(saved)));
    }

    // FR-4: delete/deactivate account (soft delete)
    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("User not found"));
        }
        User user = userOpt.get();
        user.setActive(false);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Account deactivated", null));
    }

    // FR-5 to FR-8: get profile
    @GetMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(@PathVariable Long userId) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Profile not found"));
        }
        return ResponseEntity.ok(ApiResponse.success("Profile fetched", ProfileResponse.fromEntity(profileOpt.get())));
    }

    // FR-5, FR-6, FR-7: create or update profile (upsert)
    @PostMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> upsertProfile(@PathVariable Long userId,
                                                                        @RequestBody @Valid ProfileRequest request) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("User not found"));
        }
        User user = userOpt.get();

        Profile profile = profileRepository.findByUserId(userId).orElseGet(() -> {
            Profile p = new Profile();
            p.setUser(user);
            p.setVerificationStatus(VerificationStatus.NOT_SUBMITTED);
            return p;
        });

        profile.setAge(request.age());
        profile.setOccupation(request.occupation());
        profile.setBudget(request.budget());
        profile.setPreferredLocation(request.preferredLocation());
        profile.setLifestylePreferences(request.lifestylePreferences());
        profile.setMoveInDate(request.moveInDate());
        if (request.profilePicUrl() != null) {
            profile.setProfilePicUrl(request.profilePicUrl());
        }
        // FR-7: uploading a verification doc resets status to PENDING for admin review
        if (request.verificationDocUrl() != null && !request.verificationDocUrl().isBlank()) {
            profile.setVerificationDocUrl(request.verificationDocUrl());
            profile.setVerificationStatus(VerificationStatus.PENDING);
        }

        Profile saved = profileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.success("Profile saved", ProfileResponse.fromEntity(saved)));
    }

    // ===== Request DTOs =====

    public record UpdateUserRequest(String name, String email) {}

    public record ProfileRequest(
            Integer age,
            String occupation,
            Double budget,
            String preferredLocation,
            String lifestylePreferences,
            LocalDate moveInDate,
            String profilePicUrl,
            String verificationDocUrl
    ) {}
}
