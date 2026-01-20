package com.chatstack.authservice;

import com.chatstack.authservice.dto.LoginRequest;
import com.chatstack.authservice.entities.User;
import com.chatstack.authservice.repositories.UserRepository;
import com.chatstack.authservice.security.JwtUtil;
import com.chatstack.authservice.services.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Register - should successfully register a new user")
    void registerUser_Success() {
        User rawUser = new User();
        rawUser.setUsername("testuser");
        rawUser.setEmail("test@example.com");
        rawUser.setPassword("plainPassword");

        User savedUser = new User();

        savedUser.setId(1L);
        savedUser.setUsername("testuser");
        savedUser.setEmail("test@example.com");
        // The repository should return a user that contains the encoded password.
        savedUser.setPassword("hashedPassword");

        when(passwordEncoder.encode("plainPassword")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        User result = authService.registerUser(rawUser);

        assertNotNull(result);
        assertEquals("hashedPassword", result.getPassword());
        assertFalse(rawUser.getEnabled());

        verify(rabbitTemplate, times(2)).convertAndSend(anyString(), anyString(), any(Map.class));
        verify(userRepository, times(1)).save(any(User.class));

    }

    @Test
    @DisplayName("verify user - should throw exception if code is expired")
    void verifyUser_ExpiredCode() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setVerficationCode("123456");
        user.setVerficationCodeExpiresAt(LocalDateTime.now().minusHours(1));
        user.setEnabled(false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.verifyUser("test@example.com", "123456");
        });

        assertEquals("Verification code expired", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("verify user - should throw exception if code is invalid")
    void verifyUser_InvalidCode() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setVerficationCode("123456");
        user.setVerficationCodeExpiresAt(LocalDateTime.now().plusHours(1));
        user.setEnabled(false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.verifyUser("test@example.com", "654321");
        });

        assertEquals("Invalid verification code", exception.getMessage());
    }

    @Test
    @DisplayName("verify user - should block reactivation of already verified user")
    void verifyUser_AlreadyVerified() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setVerficationCode("123456");
        user.setEnabled(true);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.verifyUser("test@example.com", "123456");
        });

        assertEquals("Account is already verified", exception.getMessage());
    }

    @Test
    @DisplayName("verify user - should successfully verify user with valid code")
    void verifyUser_Success() {
        User user = new User();
        user.setUsername("test@example.com");
        user.setVerficationCode("123456");
        user.setVerficationCodeExpiresAt(LocalDateTime.now().plusHours(1));
        user.setEnabled(false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        authService.verifyUser("test@example.com", "123456");
        assertTrue(user.getEnabled());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("login user - should return JWT token on successful login")
    void loginUser_Success() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.username = "testuser";
        loginRequest.password = "plainPassword";

        User user = new User();
        user.setUsername("testuser");
        user.setPassword("hashedPassword");
        user.setEnabled(true);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("plainPassword","hashedPassword")).thenReturn(true);
        when(jwtUtil.generateToken(any())).thenReturn("token");

        String token = authService.login(loginRequest);
        assertEquals("token", token);
    }

    @Test
    @DisplayName("login user - should throw exception if user is not verified")
    void loginUser_NotVerified() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.username = "testuser";
        loginRequest.password = "plainPassword";

        User user = new User();
        user.setUsername("testuser");
        user.setPassword("hashedPassword");
        user.setEnabled(false);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });

        assertEquals("User not verified", exception.getMessage());
    }

    @Test
    @DisplayName("login user - should throw exception non existent user")
    void loginUser_NonExistentUser() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.username = "testuser";
        loginRequest.password = "plainPassword";

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });

        assertEquals("Username not found", exception.getMessage());
    }

    @Test
    @DisplayName("login user - should throw exception on invalid password")
    void loginUser_InvalidPassword() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.username = "testuser";
        loginRequest.password = "wrongPassword";

        User user = new User();
        user.setUsername("testuser");
        user.setPassword("hashedPassword");
        user.setEnabled(true);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword","hashedPassword")).thenReturn(false);
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });

        assertEquals("Invalid credentials", exception.getMessage());
    }

    @Test
    @DisplayName("register - should throw exception if user already exists")
    void registerUser_UserAlreadyExists(){
        User rawUser = new User();
        rawUser.setUsername("existinguser");
        rawUser.setEmail("new@example.com");

        when(userRepository.existsByUsername("existinguser")).thenReturn(true);
//        when(userRepository.existsByEmail("new@example.com")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.registerUser(rawUser);
        });

        assertEquals("User already exists", exception.getMessage());
        verify(userRepository, never()).save(any());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Map.class));
    }

    @Test
    @DisplayName("register - should throw exception if email already exists")
    void registerUser_EmailAlreadyExists(){
        User rawUser = new User();
        rawUser.setUsername("newuser");
        rawUser.setEmail("existing@example.com");
        rawUser.setPassword("plainPassword");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, ()-> {
            authService.registerUser(rawUser);
        });

        assertEquals("Email already exists", exception.getMessage());

        verify(userRepository, never()).save(any());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Map.class));
    }

    @Test
    @DisplayName("Resend OTP - successfully resends verification code")
    void resendOTP_Success() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setVerficationCode("oldCode");
        user.setVerficationCodeExpiresAt(LocalDateTime.now().minusHours(1));
        user.setEnabled(false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        authService.resendOtp("test@example.com");
        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(Map.class));
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Resend OTP - should throw exception if user is already verified")
    void resendOTP_AlreadyVerified() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setEnabled(true);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.resendOtp("test@example.com");
        });
        assertEquals("Account is already verified", exception.getMessage());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Map.class));
    }

    @Test
    @DisplayName("Resend OTP - should throw exception for non-existent user")
    void resendOTP_NonExistentUser() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.resendOtp("test@example.com");
        });
        assertEquals("User not found", exception.getMessage());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Map.class));
    }
}
