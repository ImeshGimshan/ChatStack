package com.chatstack.authservice;

import com.chatstack.authservice.entities.User;
import com.chatstack.authservice.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for database connectivity using H2 in-memory database.
 * This test doesn't require Docker or Testcontainers.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@Transactional
public class JDBCTest {

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldSaveAndRetrieveUser() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("hashedPassword");
        user.setEnabled(false);

        // When
        User savedUser = userRepository.save(user);
        Optional<User> retrievedUser = userRepository.findByEmail("test@example.com");

        // Then
        assertThat(savedUser.getId()).isNotNull();
        assertThat(retrievedUser).isPresent();
        assertThat(retrievedUser.get().getUsername()).isEqualTo("testuser");
        assertThat(retrievedUser.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void shouldVerifyDatabaseConnection() {
        // Test that the database is accessible and initially empty
        assertThat(userRepository.count()).isEqualTo(0);

        // Save a user and verify
        User user = new User();
        user.setUsername("dbtest");
        user.setEmail("dbtest@example.com");
        user.setPassword("password");
        user.setEnabled(true);

        userRepository.save(user);
        assertThat(userRepository.count()).isEqualTo(1);
    }
}