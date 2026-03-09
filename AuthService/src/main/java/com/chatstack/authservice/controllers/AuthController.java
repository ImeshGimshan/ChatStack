package com.chatstack.authservice.controllers;

import com.chatstack.authservice.dto.AuthResponse;
import com.chatstack.authservice.dto.LoginRequest;
import com.chatstack.authservice.entities.User;
import com.chatstack.authservice.repositories.UserRepository;
import com.chatstack.authservice.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<User> register(@Valid @RequestBody User user){
        return ResponseEntity.ok(authService.registerUser(user));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> body){
        String email = body.get("email");
        String code = body.get("code");

        try {
            authService.verifyUser(email, code);
            return ResponseEntity.ok(Map.of("message", "User verified successfully"));
        }
        catch (RuntimeException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("Error", e.getMessage()));
        }
    }

    @PostMapping("/resendOtp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body){
        authService.resendOtp(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "New OTP sent to your email successfully"));
    }

    @PostMapping("/forgotPassword")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body){
        authService.requestPasswordReset(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "Password reset OTP sent to your email successfully"));
    }

    @PostMapping("/resetPassword")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body){
        authService.resetPassword(body.get("email"), body.get("code"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest){
        try {
            String token = authService.login(loginRequest);
            User user = authService.getUserByUsername(loginRequest.username);
            return ResponseEntity.ok(new AuthResponse(
                    token,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail()
            ));
        }
        catch (RuntimeException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("Error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Principal principal){
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        Long userId = Long.parseLong(principal.getName());

        return userRepository.findById(userId)
                .map(user -> {
                    // Return a Map or a DTO so we don't send the password hash!
                    Map<String, Object> response = new HashMap<>();
                    response.put("id", user.getId());
                    response.put("username", user.getUsername());
                    response.put("email", user.getEmail());
                    // add other fields you need like email or profile picture
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
