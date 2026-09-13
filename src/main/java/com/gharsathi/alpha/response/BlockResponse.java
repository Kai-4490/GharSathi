package com.gharsathi.alpha.response;

import com.gharsathi.alpha.entity.Block;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockResponse {
    private Long id;
    private Long blockedUserId;
    private String blockedUserName;
    private LocalDateTime createdAt;

    public static BlockResponse fromEntity(Block block) {
        return BlockResponse.builder()
                .id(block.getId())
                .blockedUserId(block.getBlocked().getId())
                .blockedUserName(block.getBlocked().getName())
                .createdAt(block.getCreatedAt())
                .build();
    }
}
