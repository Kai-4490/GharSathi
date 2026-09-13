package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.*;
import com.gharsathi.alpha.repository.ListingRepository;
import com.gharsathi.alpha.repository.UserRepository;
import com.gharsathi.alpha.response.ApiResponse;
import com.gharsathi.alpha.response.ListingResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Flat / roommate listing CRUD + search. FR-9 to FR-14.
 */
@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public ListingController(ListingRepository listingRepository, UserRepository userRepository) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
    }

    // FR-9, FR-10, FR-11: create listing
    @PostMapping
    public ResponseEntity<ApiResponse<ListingResponse>> createListing(@RequestParam Long userId,
                                                                        @RequestBody @Valid ListingRequest request) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("User not found"));
        }

        Listing listing = Listing.builder()
                .postedBy(userOpt.get())
                .type(request.type())
                .location(request.location())
                .rentMin(request.rentMin())
                .rentMax(request.rentMax())
                .availableFrom(request.availableFrom())
                .amenities(request.amenities())
                .genderPreference(request.genderPreference())
                .status(ListingStatus.ACTIVE)
                .build();

        Listing saved = listingRepository.save(listing);
        return ResponseEntity.ok(ApiResponse.success("Listing created", ListingResponse.fromEntity(saved)));
    }

    @GetMapping("/{listingId}")
    public ResponseEntity<ApiResponse<ListingResponse>> getListing(@PathVariable Long listingId) {
        Optional<Listing> listingOpt = listingRepository.findById(listingId);
        if (listingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Listing not found"));
        }
        return ResponseEntity.ok(ApiResponse.success("Listing fetched", ListingResponse.fromEntity(listingOpt.get())));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getListingsByUser(@PathVariable Long userId) {
        List<ListingResponse> listings = listingRepository.findByPostedById(userId).stream()
                .map(ListingResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Listings fetched", listings));
    }

    // FR-13, FR-14: search & filter
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> search(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double maxBudget,
            @RequestParam(required = false) GenderPreference genderPreference
    ) {
        List<ListingResponse> results = listingRepository
                .search(location, maxBudget, genderPreference, ListingStatus.ACTIVE)
                .stream()
                .map(ListingResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Search results", results));
    }

    // FR-12: edit listing. userId passed to confirm ownership (no auth/session layer yet).
    @PutMapping("/{listingId}")
    public ResponseEntity<ApiResponse<ListingResponse>> updateListing(@PathVariable Long listingId,
                                                                        @RequestParam Long userId,
                                                                        @RequestBody @Valid ListingRequest request) {
        Optional<Listing> listingOpt = listingRepository.findById(listingId);
        if (listingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Listing not found"));
        }
        Listing listing = listingOpt.get();

        if (!listing.getPostedBy().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("Not the owner of this listing"));
        }

        listing.setType(request.type());
        listing.setLocation(request.location());
        listing.setRentMin(request.rentMin());
        listing.setRentMax(request.rentMax());
        listing.setAvailableFrom(request.availableFrom());
        listing.setAmenities(request.amenities());
        listing.setGenderPreference(request.genderPreference());

        Listing saved = listingRepository.save(listing);
        return ResponseEntity.ok(ApiResponse.success("Listing updated", ListingResponse.fromEntity(saved)));
    }

    // FR-12: deactivate (temporarily hide, can be reactivated by editing status again later)
    @PatchMapping("/{listingId}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateListing(@PathVariable Long listingId, @RequestParam Long userId) {
        return changeStatus(listingId, userId, ListingStatus.INACTIVE, "Listing deactivated");
    }

    // FR-12: delete (soft delete)
    @DeleteMapping("/{listingId}")
    public ResponseEntity<ApiResponse<Void>> deleteListing(@PathVariable Long listingId, @RequestParam Long userId) {
        return changeStatus(listingId, userId, ListingStatus.DELETED, "Listing deleted");
    }

    private ResponseEntity<ApiResponse<Void>> changeStatus(Long listingId, Long userId, ListingStatus status, String successMessage) {
        Optional<Listing> listingOpt = listingRepository.findById(listingId);
        if (listingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Listing not found"));
        }
        Listing listing = listingOpt.get();
        if (!listing.getPostedBy().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("Not the owner of this listing"));
        }
        listing.setStatus(status);
        listingRepository.save(listing);
        return ResponseEntity.ok(ApiResponse.success(successMessage, null));
    }

    // ===== Request DTOs =====

    public record ListingRequest(
            @NotNull ListingType type,
            @NotNull String location,
            Double rentMin,
            Double rentMax,
            LocalDate availableFrom,
            String amenities,
            @NotNull GenderPreference genderPreference
    ) {}
}
