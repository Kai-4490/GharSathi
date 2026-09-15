package com.gharsathi.alpha.controller;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * NOTE: this isn't a @RestController - same reasoning as the other infra classes in this
 * package (project structure fixed to 4 folders).
 *
 * Enables STOMP-over-WebSocket for real-time chat (SRS 3.3.4 asks for "real-time message
 * exchange" - plain REST polling doesn't satisfy that).
 *
 * Client connects to ws://localhost:8080/ws (with SockJS fallback), subscribes to
 * /topic/chat/{conversationId}, and sends messages to /app/chat.send.
 * conversationId is built as "min(userA,userB)_max(userA,userB)" - see ChatController.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // dev-friendly; narrow this to your frontend's URL before shipping
                .withSockJS();
    }
}
