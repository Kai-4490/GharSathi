package com.gharsathi.alpha.controller;

import com.gharsathi.alpha.entity.Listing;
import com.gharsathi.alpha.entity.Message;
import com.gharsathi.alpha.entity.User;
import com.gharsathi.alpha.repository.ListingRepository;
import com.gharsathi.alpha.repository.MessageRepository;
import com.gharsathi.alpha.repository.UserRepository;
import com.gharsathi.alpha.response.ApiResponse;
import com.gharsathi.alpha.response.MessageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * In-app chat between interested users. FR-17, FR-19.
 *
 * Real-time via STOMP/WebSocket (see WebSocketConfig): clients subscribe to
 * /topic/chat/{conversationId} and send to /app/chat.send. REST endpoints remain for
 * loading history (/conversation) and unread counts - a message sent via either path
 * gets persisted the same way and broadcast to the live topic, so both stay in sync.
 */
@RestController
@RequestMapping("/api/messages")
public class ChatController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(MessageRepository messageRepository, UserRepository userRepository,
                           ListingRepository listingRepository, SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // FR-17: send a message (REST path - also broadcasts to any live WebSocket subscribers)
    @PostMapping
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(@RequestBody @Valid SendMessageRequest request) {
        try {
            Message saved = persistMessage(request);
            broadcast(saved);
            return ResponseEntity.ok(ApiResponse.success("Message sent", MessageResponse.fromEntity(saved)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure(e.getMessage()));
        }
    }

    // WebSocket path: client sends to /app/chat.send, server persists + broadcasts to
    // /topic/chat/{conversationId}. No response body here - the broadcast IS the response.
    @MessageMapping("/chat.send")
    public void sendMessageWs(SendMessageRequest request) {
        try {
            Message saved = persistMessage(request);
            broadcast(saved);
        } catch (IllegalArgumentException ignored) {
            // invalid sender/receiver/listing on a WS message - silently dropped.
            // A production version would push an error frame back to the sender's own queue.
        }
    }

    // full conversation between two users (history load on chat screen open)
    @GetMapping("/conversation")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getConversation(@RequestParam Long userAId,
                                                                                @RequestParam Long userBId) {
        List<MessageResponse> conversation = messageRepository.findConversation(userAId, userBId).stream()
                .map(MessageResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Conversation fetched", conversation));
    }

    // FR-19: unread messages, drives notification badges client-side
    @GetMapping("/unread/{userId}")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getUnread(@PathVariable Long userId) {
        List<MessageResponse> unread = messageRepository.findByReceiverIdAndReadFalse(userId).stream()
                .map(MessageResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Unread messages fetched", unread));
    }

    @GetMapping("/unread/{userId}/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@PathVariable Long userId) {
        long count = messageRepository.countByReceiverIdAndReadFalse(userId);
        return ResponseEntity.ok(ApiResponse.success("Unread count fetched", count));
    }

    @PatchMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long messageId) {
        Optional<Message> messageOpt = messageRepository.findById(messageId);
        if (messageOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Message not found"));
        }
        Message message = messageOpt.get();
        message.setRead(true);
        messageRepository.save(message);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    // ===== shared helpers =====

    private Message persistMessage(SendMessageRequest request) {
        User sender = userRepository.findById(request.senderId())
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        User receiver = userRepository.findById(request.receiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        Listing listing = null;
        if (request.listingId() != null) {
            listing = listingRepository.findById(request.listingId())
                    .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .listing(listing)
                .content(request.content())
                .read(false)
                .build();

        return messageRepository.save(message);
    }

    private void broadcast(Message message) {
        String conversationId = buildConversationId(message.getSender().getId(), message.getReceiver().getId());
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId, MessageResponse.fromEntity(message));
    }

    // order-independent id so both participants subscribe to the same topic regardless of who's "sender"
    private String buildConversationId(Long userAId, Long userBId) {
        long lo = Math.min(userAId, userBId);
        long hi = Math.max(userAId, userBId);
        return lo + "_" + hi;
    }

    // ===== Request DTOs =====

    public record SendMessageRequest(
            @NotNull Long senderId,
            @NotNull Long receiverId,
            Long listingId,
            @NotBlank String content
    ) {}
}
