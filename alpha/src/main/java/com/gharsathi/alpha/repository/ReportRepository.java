package com.gharsathi.alpha.repository;

import com.gharsathi.alpha.entity.Report;
import com.gharsathi.alpha.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatus(ReportStatus status);

    List<Report> findByReportedUserId(Long userId);

    List<Report> findByReportedListingId(Long listingId);

    List<Report> findByReportedById(Long reporterId);
}
