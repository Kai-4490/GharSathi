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
import com.gharsathi.alpha.response.ApiResponse;
import com.gharsathi.alpha.response.BlockResponse;
import com.gharsathi.alpha.response.ReportResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Filing reports and blocking other users. FR-18.
 * NOTE: SRS's DB schema (3.4) only lists Report, not Block - the Block entity was added
 * separately since FR-18 explicitly requires both "report or block" and reporting alone
 * doesn't stop a blocked user's listings/messages from being seen.
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
    public ResponseEntity<ApiResponse<ReportResponse>> fileReport(@RequestBody @Valid ReportRequest request) {
        if (request.reportedUserId() == null && request.reportedListingId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Must report either a user or a listing"));
        }

        Optional<User> reporterOpt = userRepository.findById(request.reportedByUserId());
        if (reporterOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Reporting user not found"));
        }

        User reportedUser = null;
        if (request.reportedUserId() != null) {
            Optional<User> reportedUserOpt = userRepository.findById(request.reportedUserId());
            if (reportedUserOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Reported user not found"));
            }
            reportedUser = reportedUserOpt.get();
        }

        Listing reportedListing = null;
        if (request.reportedListingId() != null) {
            Optional<Listing> listingOpt = listingRepository.findById(request.reportedListingId());
            if (listingOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Reported listing not found"));
            }
            reportedListing = listingOpt.get();
        }

        Report report = Report.builder()
                .reportedBy(reporterOpt.get())
                .reportedUser(reportedUser)
                .reportedListing(reportedListing)
                .reason(request.reason())
                .status(ReportStatus.PENDING)
                .build();

        Report saved = reportRepository.save(report);
        return ResponseEntity.ok(ApiResponse.success("Report filed", ReportResponse.fromEntity(saved)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ReportResponse>>> getReportsFiledByUser(@PathVariable Long userId) {
        List<ReportResponse> reports = reportRepository.findByReportedById(userId).stream()
                .map(ReportResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Reports fetched", reports));
    }

    // FR-18: block a user
    @PostMapping("/block")
    public ResponseEntity<ApiResponse<BlockResponse>> blockUser(@RequestBody @Valid BlockRequest request) {
        if (request.blockerId().equals(request.blockedUserId())) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Cannot block yourself"));
        }
        Optional<User> blockerOpt = userRepository.findById(request.blockerId());
        Optional<User> blockedOpt = userRepository.findById(request.blockedUserId());
        if (blockerOpt.isEmpty() || blockedOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("User not found"));
        }
        if (blockRepository.existsByBlockerIdAndBlockedId(request.blockerId(), request.blockedUserId())) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Already blocked"));
        }

        Block block = Block.builder()
                .blocker(blockerOpt.get())
                .blocked(blockedOpt.get())
                .build();

        Block saved = blockRepository.save(block);
        return ResponseEntity.ok(ApiResponse.success("User blocked", BlockResponse.fromEntity(saved)));
    }

    // FR-18: unblock
    @DeleteMapping("/block")
    public ResponseEntity<ApiResponse<Void>> unblockUser(@RequestParam Long blockerId, @RequestParam Long blockedUserId) {
        Optional<Block> blockOpt = blockRepository.findByBlockerIdAndBlockedId(blockerId, blockedUserId);
        if (blockOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Block record not found"));
        }
        blockRepository.delete(blockOpt.get());
        return ResponseEntity.ok(ApiResponse.success("User unblocked", null));
    }

    // list who a user has blocked
    @GetMapping("/block/{userId}")
    public ResponseEntity<ApiResponse<List<BlockResponse>>> getBlockedUsers(@PathVariable Long userId) {
        List<BlockResponse> blocked = blockRepository.findByBlockerId(userId).stream()
                .map(BlockResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Blocked users fetched", blocked));
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
