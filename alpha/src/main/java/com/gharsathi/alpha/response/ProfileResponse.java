package com.gharsathi.alpha.response;

import com.gharsathi.alpha.entity.Profile;
import com.gharsathi.alpha.entity.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Long id;
    private Long userId;
    private Integer age;
    private String occupation;
    private Double budget;
    private String preferredLocation;
    private String lifestylePreferences;
    private LocalDate moveInDate;
    private String profilePicUrl;
    private VerificationStatus verificationStatus;
    private LocalDateTime updatedAt;

    public static ProfileResponse fromEntity(Profile profile) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .age(profile.getAge())
                .occupation(profile.getOccupation())
                .budget(profile.getBudget())
                .preferredLocation(profile.getPreferredLocation())
                .lifestylePreferences(profile.getLifestylePreferences())
                .moveInDate(profile.getMoveInDate())
                .profilePicUrl(profile.getProfilePicUrl())
                .verificationStatus(profile.getVerificationStatus())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
