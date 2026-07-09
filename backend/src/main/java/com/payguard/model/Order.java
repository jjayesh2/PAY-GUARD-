package com.payguard.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String productId;

    @Column(nullable = false)
    private Long amount; // stored in paise/cents

    private String razorpayOrderId;
    private String razorpayPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    private Integer riskScore = 0;

    @Column(length = 1000)
    private String riskReasons; // Comma-separated or JSON list of reasons

    @Column(nullable = false)
    private String customerIdentifier;

    @Column(nullable = false)
    private String ipAddress;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Order() {}

    public Order(Long id, String productId, Long amount, String razorpayOrderId, String razorpayPaymentId, 
                 OrderStatus status, Integer riskScore, String riskReasons, String customerIdentifier, 
                 String ipAddress, LocalDateTime createdAt) {
        this.id = id;
        this.productId = productId;
        this.amount = amount;
        this.razorpayOrderId = razorpayOrderId;
        this.razorpayPaymentId = razorpayPaymentId;
        this.status = status;
        this.riskScore = riskScore != null ? riskScore : 0;
        this.riskReasons = riskReasons;
        this.customerIdentifier = customerIdentifier;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }

    public String getRiskReasons() { return riskReasons; }
    public void setRiskReasons(String riskReasons) { this.riskReasons = riskReasons; }

    public String getCustomerIdentifier() { return customerIdentifier; }
    public void setCustomerIdentifier(String customerIdentifier) { this.customerIdentifier = customerIdentifier; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder Pattern
    public static OrderBuilder builder() {
        return new OrderBuilder();
    }

    public static class OrderBuilder {
        private Long id;
        private String productId;
        private Long amount;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private OrderStatus status;
        private Integer riskScore = 0;
        private String riskReasons;
        private String customerIdentifier;
        private String ipAddress;
        private LocalDateTime createdAt;

        OrderBuilder() {}

        public OrderBuilder id(Long id) { this.id = id; return this; }
        public OrderBuilder productId(String productId) { this.productId = productId; return this; }
        public OrderBuilder amount(Long amount) { this.amount = amount; return this; }
        public OrderBuilder razorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; return this; }
        public OrderBuilder razorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; return this; }
        public OrderBuilder status(OrderStatus status) { this.status = status; return this; }
        public OrderBuilder riskScore(Integer riskScore) { this.riskScore = riskScore; return this; }
        public OrderBuilder riskReasons(String riskReasons) { this.riskReasons = riskReasons; return this; }
        public OrderBuilder customerIdentifier(String customerIdentifier) { this.customerIdentifier = customerIdentifier; return this; }
        public OrderBuilder ipAddress(String ipAddress) { this.ipAddress = ipAddress; return this; }
        public OrderBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Order build() {
            return new Order(id, productId, amount, razorpayOrderId, razorpayPaymentId, status, riskScore, riskReasons, customerIdentifier, ipAddress, createdAt);
        }
    }
}
