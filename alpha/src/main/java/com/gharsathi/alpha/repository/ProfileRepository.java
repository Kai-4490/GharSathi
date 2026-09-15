package com.gharsathi.alpha.repository;

import com.gharsathi.alpha.entity.Profile;
import com.gharsathi.alpha.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    Optional<Profile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    // useful for admin: list users pending verification
    Iterable<Profile> findByVerificationStatus(VerificationStatus verificationStatus);
}
