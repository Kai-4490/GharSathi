package com.gharsathi.alpha.repository;

import com.gharsathi.alpha.entity.GenderPreference;
import com.gharsathi.alpha.entity.Listing;
import com.gharsathi.alpha.entity.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    List<Listing> findByPostedById(Long userId);

    List<Listing> findByStatus(ListingStatus status);

    List<Listing> findByLocationContainingIgnoreCaseAndStatus(String location, ListingStatus status);

    List<Listing> findByGenderPreferenceAndStatus(GenderPreference genderPreference, ListingStatus status);

    // FR-13, FR-14: combined search by location, budget range, and gender preference.
    // Any parameter can be passed as null to skip that filter.
    @Query("""
            SELECT l FROM Listing l
            WHERE l.status = :status
              AND (:location IS NULL OR LOWER(l.location) LIKE LOWER(CONCAT('%', :location, '%')))
              AND (:maxBudget IS NULL OR l.rentMin IS NULL OR l.rentMin <= :maxBudget)
              AND (:genderPreference IS NULL OR l.genderPreference = :genderPreference)
            """)
    List<Listing> search(
            @Param("location") String location,
            @Param("maxBudget") Double maxBudget,
            @Param("genderPreference") GenderPreference genderPreference,
            @Param("status") ListingStatus status
    );
}
