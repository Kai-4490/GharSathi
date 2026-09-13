package com.gharsathi.alpha.repository;

import com.gharsathi.alpha.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // full conversation between two users, oldest first
    @Query("""
            SELECT m FROM Message m
            WHERE (m.sender.id = :userAId AND m.receiver.id = :userBId)
               OR (m.sender.id = :userBId AND m.receiver.id = :userAId)
            ORDER BY m.sentAt ASC
            """)
    List<Message> findConversation(@Param("userAId") Long userAId, @Param("userBId") Long userBId);

    // unread messages for a user (drives FR-19 notifications)
    List<Message> findByReceiverIdAndReadFalse(Long receiverId);

    long countByReceiverIdAndReadFalse(Long receiverId);
}
