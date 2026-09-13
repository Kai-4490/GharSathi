package com.gharsathi.alpha.response;

import com.gharsathi.alpha.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private Long listingId;
    private String content;
    private boolean read;
    private LocalDateTime sentAt;

    public static MessageResponse fromEntity(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getName() : null)
                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                .listingId(message.getListing() != null ? message.getListing().getId() : null)
                .content(message.getContent())
                .read(message.isRead())
                .sentAt(message.getSentAt())
                .build();
    }
}
