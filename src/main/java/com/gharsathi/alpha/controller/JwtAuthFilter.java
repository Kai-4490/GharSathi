package com.gharsathi.alpha.controller;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * NOTE: this isn't a @RestController - it lives in the controller/ package only because
 * the project structure is fixed to 4 folders (entity, controller, repository, response).
 *
 * Runs once per request. If a valid "Authorization: Bearer <token>" header is present,
 * decodes it and puts the userId + role into Spring Security's context so
 * @PreAuthorize / hasRole(...) checks in SecurityConfig work downstream.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.isTokenValid(token)) {
                Long userId = jwtUtil.extractUserId(token);
                String role = jwtUtil.extractRole(token);

                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

                // principal = userId (as String) so controllers can read it back via
                // SecurityContextHolder.getContext().getAuthentication().getPrincipal() if needed
                var authToken = new UsernamePasswordAuthenticationToken(String.valueOf(userId), null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
            // if invalid/expired, we simply don't set auth - request falls through as anonymous
            // and gets rejected by SecurityConfig's authorizeHttpRequests rules if the route needs auth
        }

        filterChain.doFilter(request, response);
    }
}
