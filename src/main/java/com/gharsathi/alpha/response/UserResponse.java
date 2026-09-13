package com.gharsathi.alpha.response;

import com.gharsathi.alpha.entity.Role;
import com.gharsathi.alpha.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String mobileNumber;
    private Role role;
    private boolean otpVerified;
    private boolean active;
    private LocalDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .role(user.getRole())
                .otpVerified(user.isOtpVerified())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
