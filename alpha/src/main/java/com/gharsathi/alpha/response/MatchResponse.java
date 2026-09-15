package com.gharsathi.alpha.response;

import com.gharsathi.alpha.entity.Match;
import com.gharsathi.alpha.entity.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResponse {

    private Long id;
    private Long userOneId;
    private String userOneName;
    private Long userTwoId;
    private String userTwoName;
    private Long listingId;
    private Double compatibilityScore;
    private MatchStatus status;
    private LocalDateTime createdAt;

    public static MatchResponse fromEntity(Match match) {
        return MatchResponse.builder()
                .id(match.getId())
                .userOneId(match.getUserOne() != null ? match.getUserOne().getId() : null)
                .userOneName(match.getUserOne() != null ? match.getUserOne().getName() : null)
                .userTwoId(match.getUserTwo() != null ? match.getUserTwo().getId() : null)
                .userTwoName(match.getUserTwo() != null ? match.getUserTwo().getName() : null)
                .listingId(match.getListing() != null ? match.getListing().getId() : null)
                .compatibilityScore(match.getCompatibilityScore())
                .status(match.getStatus())
                .createdAt(match.getCreatedAt())
                .build();
    }
}
