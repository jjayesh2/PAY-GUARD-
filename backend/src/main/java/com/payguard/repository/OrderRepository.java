package com.payguard.repository;

import com.payguard.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);
    
    Optional<Order> findByRazorpayPaymentId(String razorpayPaymentId);
    
    // For Velocity Check: count attempts in last 60 seconds
    int countByCustomerIdentifierAndCreatedAtAfter(String customerIdentifier, LocalDateTime dateTime);
    
    // For IP Change Check: get attempts in last 60 seconds
    List<Order> findByCustomerIdentifierAndCreatedAtAfterOrderByCreatedAtDesc(String customerIdentifier, LocalDateTime dateTime);
}
