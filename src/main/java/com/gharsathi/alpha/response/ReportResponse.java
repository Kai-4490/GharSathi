package com.gharsathi.alpha.response;

import com.gharsathi.alpha.entity.Report;
import com.gharsathi.alpha.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private Long id;
    private Long reportedByUserId;
    private String reportedByName;
    private Long reportedUserId;
    private Long reportedListingId;
    private String reason;
    private ReportStatus status;
    private String adminNote;
    private LocalDateTime createdAt;

    public static ReportResponse fromEntity(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .reportedByUserId(report.getReportedBy() != null ? report.getReportedBy().getId() : null)
                .reportedByName(report.getReportedBy() != null ? report.getReportedBy().getName() : null)
                .reportedUserId(report.getReportedUser() != null ? report.getReportedUser().getId() : null)
                .reportedListingId(report.getReportedListing() != null ? report.getReportedListing().getId() : null)
                .reason(report.getReason())
                .status(report.getStatus())
                .adminNote(report.getAdminNote())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
