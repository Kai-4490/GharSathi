package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.Profile;
import com.gharsathi.alpha.entity.User;
import com.gharsathi.alpha.entity.VerificationStatus;
import com.gharsathi.alpha.repository.ProfileRepository;
import com.gharsathi.alpha.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

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
    public User getUser(@PathVariable Long userId) {
        return findUser(userId);
    }

    // FR-4: update basic account details
    @PutMapping("/{userId}")
    public User updateUser(@PathVariable Long userId, @RequestBody @Valid UpdateUserRequest request) {
        User user = findUser(userId);
        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.email() != null && !request.email().isBlank()) {
            user.setEmail(request.email());
        }
        return userRepository.save(user);
    }

    // FR-4: delete/deactivate account (soft delete)
    @DeleteMapping("/{userId}")
    public User deactivateUser(@PathVariable Long userId) {
        User user = findUser(userId);
        user.setActive(false);
        return userRepository.save(user);
    }

    // FR-5 to FR-8: get profile
    @GetMapping("/{userId}/profile")
    public Profile getProfile(@PathVariable Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
    }

    // FR-5, FR-6, FR-7: create or update profile (upsert)
    @PostMapping("/{userId}/profile")
    public Profile upsertProfile(@PathVariable Long userId, @RequestBody @Valid ProfileRequest request) {
        User user = findUser(userId);

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

        return profileRepository.save(profile);
    }

    // ===== helpers =====

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
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