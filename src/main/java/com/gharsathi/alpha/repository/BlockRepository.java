package com.gharsathi.alpha.repository;

import com.gharsathi.alpha.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlockRepository extends JpaRepository<Block, Long> {

    List<Block> findByBlockerId(Long blockerId);

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    Optional<Block> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
}
