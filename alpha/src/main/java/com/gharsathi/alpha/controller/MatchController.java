package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.*;
import com.gharsathi.alpha.repository.ListingRepository;
import com.gharsathi.alpha.repository.MatchRepository;
import com.gharsathi.alpha.repository.ProfileRepository;
import com.gharsathi.alpha.repository.UserRepository;
import com.gharsathi.alpha.response.ApiResponse;
import com.gharsathi.alpha.response.MatchResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Matching + interest. FR-15, FR-16.
 *
 * Compatibility scoring (0-100) is a simple weighted rule set, not ML - SRS just says
 * "suggest suitable roommates based on compatibility" without specifying an algorithm:
 *   - 40 pts: seeker's preferredLocation appears in the listing's location
 *   - 30 pts: seeker's budget falls within the listing's rent range (partial credit if close)
 *   - 30 pts: shared lifestyle-preference keywords between the two profiles
 */
@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ProfileRepository profileRepository;

    public MatchController(MatchRepository matchRepository, UserRepository userRepository,
                            ListingRepository listingRepository, ProfileRepository profileRepository) {
        this.matchRepository = matchRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.profileRepository = profileRepository;
    }

    // all matches (suggested + interested + accepted) involving a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getMatchesForUser(@PathVariable Long userId) {
        List<MatchResponse> matches = matchRepository.findAllForUser(userId).stream()
                .map(MatchResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Matches fetched", matches));
    }

    @GetMapping("/listing/{listingId}")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getMatchesForListing(@PathVariable Long listingId) {
        List<MatchResponse> matches = matchRepository.findByListingId(listingId).stream()
                .map(MatchResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Matches fetched", matches));
    }

    // FR-15: generate/refresh scored suggestions for a seeker against all active listings
    @GetMapping("/suggestions/{userId}")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getSuggestions(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("User not found"));
        }
        Optional<Profile> myProfileOpt = profileRepository.findByUserId(userId);
        if (myProfileOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Complete your profile first to get suggestions"));
        }
        Profile myProfile = myProfileOpt.get();

        List<Listing> candidateListings = listingRepository.findByStatus(ListingStatus.ACTIVE).stream()
                .filter(l -> !l.getPostedBy().getId().equals(userId))
                .toList();

        List<Match> existingMatches = matchRepository.findAllForUser(userId);

        List<MatchResponse> suggestions = new ArrayList<>();
        for (Listing listing : candidateListings) {
            Long ownerId = listing.getPostedBy().getId();

            // skip if a match already exists between this pair for this listing
            Optional<Match> existing = existingMatches.stream()
                    .filter(m -> m.getListing() != null && m.getListing().getId().equals(listing.getId()))
                    .findFirst();
            if (existing.isPresent()) {
                suggestions.add(MatchResponse.fromEntity(existing.get()));
                continue;
            }

            Optional<Profile> ownerProfileOpt = profileRepository.findByUserId(ownerId);
            double score = calculateCompatibility(myProfile, ownerProfileOpt.orElse(null), listing);

            Match match = Match.builder()
                    .userOne(userOpt.get())
                    .userTwo(listing.getPostedBy())
                    .listing(listing)
                    .compatibilityScore(score)
                    .status(MatchStatus.SUGGESTED)
                    .build();

            Match saved = matchRepository.save(match);
            suggestions.add(MatchResponse.fromEntity(saved));
        }

        suggestions.sort((a, b) -> Double.compare(
                b.getCompatibilityScore() == null ? 0 : b.getCompatibilityScore(),
                a.getCompatibilityScore() == null ? 0 : a.getCompatibilityScore()
        ));

        return ResponseEntity.ok(ApiResponse.success("Suggestions generated", suggestions));
    }

    // FR-16: show interest in a listing/profile - creates (or reactivates) a Match
    @PostMapping("/interest")
    public ResponseEntity<ApiResponse<MatchResponse>> showInterest(@RequestBody @Valid InterestRequest request) {
        Optional<User> userOneOpt = userRepository.findById(request.interestedUserId());
        Optional<User> userTwoOpt = userRepository.findById(request.targetUserId());
        if (userOneOpt.isEmpty() || userTwoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("User not found"));
        }

        Listing listing = null;
        if (request.listingId() != null) {
            Optional<Listing> listingOpt = listingRepository.findById(request.listingId());
            if (listingOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Listing not found"));
            }
            listing = listingOpt.get();
        }

        Match match = Match.builder()
                .userOne(userOneOpt.get())
                .userTwo(userTwoOpt.get())
                .listing(listing)
                .status(MatchStatus.INTERESTED)
                .build();

        Match saved = matchRepository.save(match);
        return ResponseEntity.ok(ApiResponse.success("Interest recorded", MatchResponse.fromEntity(saved)));
    }

    // accept / reject a match
    @PatchMapping("/{matchId}/status")
    public ResponseEntity<ApiResponse<MatchResponse>> updateStatus(@PathVariable Long matchId,
                                                                     @RequestBody @Valid StatusRequest request) {
        Optional<Match> matchOpt = matchRepository.findById(matchId);
        if (matchOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Match not found"));
        }
        Match match = matchOpt.get();
        match.setStatus(request.status());
        Match saved = matchRepository.save(match);
        return ResponseEntity.ok(ApiResponse.success("Match status updated", MatchResponse.fromEntity(saved)));
    }

    // ===== compatibility scoring =====

    private double calculateCompatibility(Profile seeker, Profile ownerProfile, Listing listing) {
        double score = 0;

        // location: does the listing's location mention the seeker's preferred location?
        if (seeker.getPreferredLocation() != null && listing.getLocation() != null
                && listing.getLocation().toLowerCase().contains(seeker.getPreferredLocation().toLowerCase())) {
            score += 40;
        }

        // budget: full credit if within range, partial credit if close
        if (seeker.getBudget() != null) {
            Double min = listing.getRentMin();
            Double max = listing.getRentMax();
            boolean withinRange = (min == null || seeker.getBudget() >= min) && (max == null || seeker.getBudget() <= max);
            if (withinRange) {
                score += 30;
            } else if (min != null && min > 0) {
                double diffRatio = Math.abs(seeker.getBudget() - min) / min;
                if (diffRatio <= 0.2) {
                    score += 15;
                }
            }
        }

        // lifestyle keyword overlap between the two profiles
        if (ownerProfile != null
                && seeker.getLifestylePreferences() != null
                && ownerProfile.getLifestylePreferences() != null) {
            Set<String> seekerWords = new HashSet<>(Arrays.asList(
                    seeker.getLifestylePreferences().toLowerCase().split("[,\\s]+")));
            Set<String> ownerWords = new HashSet<>(Arrays.asList(
                    ownerProfile.getLifestylePreferences().toLowerCase().split("[,\\s]+")));
            seekerWords.retainAll(ownerWords);
            if (!seekerWords.isEmpty()) {
                score += Math.min(30, seekerWords.size() * 10);
            }
        }

        return Math.min(score, 100);
    }

    // ===== Request DTOs =====

    public record InterestRequest(
            @NotNull Long interestedUserId,
            @NotNull Long targetUserId,
            Long listingId
    ) {}

    public record StatusRequest(@NotNull MatchStatus status) {}
}
