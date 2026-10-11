package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.Block;
import com.gharsathi.alpha.entity.Listing;
import com.gharsathi.alpha.entity.Report;
import com.gharsathi.alpha.entity.ReportStatus;
import com.gharsathi.alpha.entity.User;
import com.gharsathi.alpha.repository.BlockRepository;
import com.gharsathi.alpha.repository.ListingRepository;
import com.gharsathi.alpha.repository.ReportRepository;
import com.gharsathi.alpha.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Filing reports and blocking other users. FR-18.
 * NOTE: SRS's DB schema (3.4) only lists Report, not Block - the Block entity was added
 * separately since FR-18 explicitly requires both "report or block".
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BlockRepository blockRepository;

    public ReportController(ReportRepository reportRepository, UserRepository userRepository,
                             ListingRepository listingRepository, BlockRepository blockRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.blockRepository = blockRepository;
    }

    @PostMapping
    public Report fileReport(@RequestBody @Valid ReportRequest request) {
        if (request.reportedUserId() == null && request.reportedListingId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Must report either a user or a listing");
        }

        User reporter = userRepository.findById(request.reportedByUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporting user not found"));

        User reportedUser = null;
        if (request.reportedUserId() != null) {
            reportedUser = userRepository.findById(request.reportedUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reported user not found"));
        }

        Listing reportedListing = null;
        if (request.reportedListingId() != null) {
            reportedListing = listingRepository.findById(request.reportedListingId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reported listing not found"));
        }

        Report report = Report.builder()
                .reportedBy(reporter)
                .reportedUser(reportedUser)
                .reportedListing(reportedListing)
                .reason(request.reason())
                .status(ReportStatus.PENDING)
                .build();

        return reportRepository.save(report);
    }

    @GetMapping("/user/{userId}")
    public List<Report> getReportsFiledByUser(@PathVariable Long userId) {
        return reportRepository.findByReportedById(userId);
    }

    // FR-18: block a user
    @PostMapping("/block")
    public Block blockUser(@RequestBody @Valid BlockRequest request) {
        if (request.blockerId().equals(request.blockedUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot block yourself");
        }
        User blocker = userRepository.findById(request.blockerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        User blocked = userRepository.findById(request.blockedUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (blockRepository.existsByBlockerIdAndBlockedId(request.blockerId(), request.blockedUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already blocked");
        }

        Block block = Block.builder()
                .blocker(blocker)
                .blocked(blocked)
                .build();

        return blockRepository.save(block);
    }

    // FR-18: unblock
    @DeleteMapping("/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblockUser(@RequestParam Long blockerId, @RequestParam Long blockedUserId) {
        Block block = blockRepository.findByBlockerIdAndBlockedId(blockerId, blockedUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block record not found"));
        blockRepository.delete(block);
    }

    // list who a user has blocked
    @GetMapping("/block/{userId}")
    public List<Block> getBlockedUsers(@PathVariable Long userId) {
        return blockRepository.findByBlockerId(userId);
    }

    // ===== Request DTOs =====

    public record ReportRequest(
            @NotNull Long reportedByUserId,
            Long reportedUserId,
            Long reportedListingId,
            @NotBlank String reason
    ) {}

    public record BlockRequest(
            @NotNull Long blockerId,
            @NotNull Long blockedUserId
    ) {}
}