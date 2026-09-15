package com.gharsathi.alpha.response;

import com.gharsathi.alpha.entity.GenderPreference;
import com.gharsathi.alpha.entity.Listing;
import com.gharsathi.alpha.entity.ListingStatus;
import com.gharsathi.alpha.entity.ListingType;
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
public class ListingResponse {

    private Long id;
    private Long postedByUserId;
    private String postedByName;
    private ListingType type;
    private String location;
    private Double rentMin;
    private Double rentMax;
    private LocalDate availableFrom;
    private String amenities;
    private GenderPreference genderPreference;
    private ListingStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ListingResponse fromEntity(Listing listing) {
        return ListingResponse.builder()
                .id(listing.getId())
                .postedByUserId(listing.getPostedBy() != null ? listing.getPostedBy().getId() : null)
                .postedByName(listing.getPostedBy() != null ? listing.getPostedBy().getName() : null)
                .type(listing.getType())
                .location(listing.getLocation())
                .rentMin(listing.getRentMin())
                .rentMax(listing.getRentMax())
                .availableFrom(listing.getAvailableFrom())
                .amenities(listing.getAmenities())
                .genderPreference(listing.getGenderPreference())
                .status(listing.getStatus())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
