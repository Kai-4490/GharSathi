package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.*;
import com.gharsathi.alpha.repository.ListingRepository;
import com.gharsathi.alpha.repository.MatchRepository;
import com.gharsathi.alpha.repository.ProfileRepository;
import com.gharsathi.alpha.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
    public List<Match> getMatchesForUser(@PathVariable Long userId) {
        return matchRepository.findAllForUser(userId);
    }

    @GetMapping("/listing/{listingId}")
    public List<Match> getMatchesForListing(@PathVariable Long listingId) {
        return matchRepository.findByListingId(listingId);
    }

    // FR-15: generate/refresh scored suggestions for a seeker against all active listings
    @GetMapping("/suggestions/{userId}")
    public List<Match> getSuggestions(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Profile myProfile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Complete your profile first to get suggestions"));

        List<Listing> candidateListings = listingRepository.findByStatus(ListingStatus.ACTIVE).stream()
                .filter(l -> !l.getPostedBy().getId().equals(userId))
                .toList();

        List<Match> existingMatches = matchRepository.findAllForUser(userId);

        List<Match> suggestions = new ArrayList<>();
        for (Listing listing : candidateListings) {
            Long ownerId = listing.getPostedBy().getId();

            // if a match already exists between this pair for this listing, reuse it
            Optional<Match> existing = existingMatches.stream()
                    .filter(m -> m.getListing() != null && m.getListing().getId().equals(listing.getId()))
                    .findFirst();
            if (existing.isPresent()) {
                suggestions.add(existing.get());
                continue;
            }

            Optional<Profile> ownerProfileOpt = profileRepository.findByUserId(ownerId);
            double score = calculateCompatibility(myProfile, ownerProfileOpt.orElse(null), listing);

            Match match = Match.builder()
                    .userOne(user)
                    .userTwo(listing.getPostedBy())
                    .listing(listing)
                    .compatibilityScore(score)
                    .status(MatchStatus.SUGGESTED)
                    .build();

            suggestions.add(matchRepository.save(match));
        }

        // highest score first
        suggestions.sort((a, b) -> Double.compare(scoreOf(b), scoreOf(a)));
        return suggestions;
    }

    // FR-16: show interest in a listing/profile - creates a Match
    @PostMapping("/interest")
    public Match showInterest(@RequestBody @Valid InterestRequest request) {
        User userOne = userRepository.findById(request.interestedUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        User userTwo = userRepository.findById(request.targetUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Listing listing = null;
        if (request.listingId() != null) {
            listing = listingRepository.findById(request.listingId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        }

        Match match = Match.builder()
                .userOne(userOne)
                .userTwo(userTwo)
                .listing(listing)
                .status(MatchStatus.INTERESTED)
                .build();

        return matchRepository.save(match);
    }

    // accept / reject a match
    @PatchMapping("/{matchId}/status")
    public Match updateStatus(@PathVariable Long matchId, @RequestBody @Valid StatusRequest request) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found"));
        match.setStatus(request.status());
        return matchRepository.save(match);
    }

    // ===== compatibility scoring =====

    private double scoreOf(Match match) {
        return match.getCompatibilityScore() == null ? 0 : match.getCompatibilityScore();
    }

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