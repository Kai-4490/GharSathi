package com.gharsathi.alpha.repository;

import com.gharsathi.alpha.entity.Match;
import com.gharsathi.alpha.entity.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {

    // all matches involving a given user, regardless of which side they're on
    @Query("SELECT m FROM Match m WHERE m.userOne.id = :userId OR m.userTwo.id = :userId")
    List<Match> findAllForUser(@Param("userId") Long userId);

    List<Match> findByStatus(MatchStatus status);

    List<Match> findByListingId(Long listingId);
}
