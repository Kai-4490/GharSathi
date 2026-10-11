package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.*;
import com.gharsathi.alpha.repository.ListingRepository;
import com.gharsathi.alpha.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

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
    public Listing createListing(@RequestParam Long userId, @RequestBody @Valid ListingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Listing listing = Listing.builder()
                .postedBy(user)
                .type(request.type())
                .location(request.location())
                .rentMin(request.rentMin())
                .rentMax(request.rentMax())
                .availableFrom(request.availableFrom())
                .amenities(request.amenities())
                .genderPreference(request.genderPreference())
                .status(ListingStatus.ACTIVE)
                .build();

        return listingRepository.save(listing);
    }

    @GetMapping("/{listingId}")
    public Listing getListing(@PathVariable Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
    }

    @GetMapping("/user/{userId}")
    public List<Listing> getListingsByUser(@PathVariable Long userId) {
        return listingRepository.findByPostedById(userId);
    }

    // FR-13, FR-14: search & filter
    @GetMapping("/search")
    public List<Listing> search(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double maxBudget,
            @RequestParam(required = false) GenderPreference genderPreference
    ) {
        return listingRepository.search(location, maxBudget, genderPreference, ListingStatus.ACTIVE);
    }

    // FR-12: edit listing. userId passed to confirm ownership.
    @PutMapping("/{listingId}")
    public Listing updateListing(@PathVariable Long listingId,
                                  @RequestParam Long userId,
                                  @RequestBody @Valid ListingRequest request) {
        Listing listing = getOwnedListing(listingId, userId);

        listing.setType(request.type());
        listing.setLocation(request.location());
        listing.setRentMin(request.rentMin());
        listing.setRentMax(request.rentMax());
        listing.setAvailableFrom(request.availableFrom());
        listing.setAmenities(request.amenities());
        listing.setGenderPreference(request.genderPreference());

        return listingRepository.save(listing);
    }

    // FR-12: deactivate (temporarily hide)
    @PatchMapping("/{listingId}/deactivate")
    public Listing deactivateListing(@PathVariable Long listingId, @RequestParam Long userId) {
        return changeStatus(listingId, userId, ListingStatus.INACTIVE);
    }

    // FR-12: delete (soft delete)
    @DeleteMapping("/{listingId}")
    public Listing deleteListing(@PathVariable Long listingId, @RequestParam Long userId) {
        return changeStatus(listingId, userId, ListingStatus.DELETED);
    }

    // ===== helpers =====

    private Listing getOwnedListing(Long listingId, Long userId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        if (!listing.getPostedBy().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not the owner of this listing");
        }
        return listing;
    }

    private Listing changeStatus(Long listingId, Long userId, ListingStatus status) {
        Listing listing = getOwnedListing(listingId, userId);
        listing.setStatus(status);
        return listingRepository.save(listing);
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