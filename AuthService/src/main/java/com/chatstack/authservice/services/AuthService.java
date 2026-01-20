package com.chatstack.authservice.services;

import com.chatstack.authservice.config.RabbitMQConfig;
import com.chatstack.authservice.dto.LoginRequest;
import com.chatstack.authservice.entities.User;
import com.chatstack.authservice.repositories.UserRepository;
import com.chatstack.authservice.security.JwtUtil;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Transactional
    public User registerUser(User user){
        // Check if username already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("User already exists");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Encrypt the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        String otp = generateVerificationCode();
        user.setVerficationCode(otp);
        user.setVerficationCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
        user.setEnabled(false);
//        return userRepository.save(user);
        User savedUser = userRepository.save(user);

        Map<String, Object> userDetails = new HashMap<>();
        userDetails.put("id", savedUser.getId());
        userDetails.put("username", savedUser.getUsername());

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.ROUTING_KEY,
                userDetails
        );

        Map<String, Object> nestJsEnvelope = new HashMap<>();
        nestJsEnvelope.put("pattern", "email.otp.key");
        nestJsEnvelope.put("type", "VERIFY");

        Map<String,Object> emailDetails = new HashMap<>();
        emailDetails.put("email", savedUser.getEmail());
        emailDetails.put("otp", otp);

        nestJsEnvelope.put("data", emailDetails);

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.Email_EXCHANGE,
                RabbitMQConfig.Email_ROUTING_KEY,
                nestJsEnvelope
        );

        return savedUser;
    }

    public void resendOtp(String email){
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEnabled()){
            throw new RuntimeException("Account is already verified");
        }

        String newOtp = generateVerificationCode();
        user.setVerficationCode(newOtp);
        user.setVerficationCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        Map<String, Object> nestJsEnvelope = new HashMap<>();
        nestJsEnvelope.put("pattern", "email.otp.key");
        nestJsEnvelope.put("type", "VERIFY");
        nestJsEnvelope.put("data",Map.of(
                "email", user.getEmail(),
                "otp", newOtp
            )
        );
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.Email_EXCHANGE,
                RabbitMQConfig.Email_ROUTING_KEY,
                nestJsEnvelope
        );
    }

    public String login(LoginRequest loginRequest){
        User user = userRepository.findByUsername(loginRequest.username)
                .orElseThrow(() -> new RuntimeException("Username not found"));

        if (!user.getEnabled()){
            throw new RuntimeException("User not verified");
        }

        if (passwordEncoder.matches(loginRequest.password, user.getPassword())){
            return jwtUtil.generateToken(user);
        }
        else {
            throw new RuntimeException("Invalid credentials");
        }
    }

    public void requestPasswordReset(String email){
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String resetCode = generateVerificationCode();
        user.setVerficationCode(resetCode);
        user.setVerficationCodeExpiresAt(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        Map<String, Object> nestJsEnvelope = new HashMap<>();
        nestJsEnvelope.put("pattern", "email.otp.key");
        nestJsEnvelope.put("type", "RESET");
        nestJsEnvelope.put("data",Map.of(
                "email", user.getEmail(),
                "otp", resetCode
            )
        );
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.Email_EXCHANGE,
                RabbitMQConfig.Email_ROUTING_KEY,
                nestJsEnvelope
        );
    }

    public void resetPassword(String email, String code, String newPassword){
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if(!user.getVerficationCode().equals(code) ||
                user.getVerficationCodeExpiresAt().isBefore(LocalDateTime.now())){
            throw new RuntimeException("Invalid or expired reset code");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerficationCode(null);
        user.setVerficationCodeExpiresAt(null);
        userRepository.save(user);
    }

    public User getUserByUsername(String username){
        return userRepository.findByUsername(username)
                .orElseThrow(()-> new RuntimeException("Username not found"));
    }

    private String generateVerificationCode(){
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    public void verifyUser(String email, String code){
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Username not found"));

        if (user.getEnabled()) {
            throw new RuntimeException("Account is already verified");
        }

        if (!user.getVerficationCode().equals(code)){
            throw new RuntimeException("Invalid verification code");
        }

        if(user.getVerficationCodeExpiresAt().isBefore(LocalDateTime.now())){
            throw new RuntimeException("Verification code expired");
        }

        user.setEnabled(true);
        user.setVerficationCode(null);
        user.setVerficationCodeExpiresAt(null);

        userRepository.save(user);
    }
}
