package com.payguard.service;

import com.payguard.model.Order;
import com.payguard.model.OrderStatus;
import com.payguard.model.Product;
import com.payguard.repository.OrderRepository;
import com.razorpay.RazorpayClient;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private final OrderRepository orderRepository;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    private RazorpayClient razorpayClient;
    
    // In-memory rate limiting: customerIdentifier -> list of attempt timestamps
    private final Map<String, List<LocalDateTime>> rateLimitMap = new ConcurrentHashMap<>();

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @PostConstruct
    public void init() {
        if (keyId != null && !keyId.trim().isEmpty() && keySecret != null && !keySecret.trim().isEmpty()) {
            try {
                this.razorpayClient = new RazorpayClient(keyId, keySecret);
                log.info("Razorpay Client initialized successfully with Key ID: {}", keyId);
            } catch (Exception e) {
                log.error("Failed to initialize Razorpay Client: {}", e.getMessage());
            }
        } else {
            log.warn("Razorpay credentials not provided. Running in MOCK Razorpay mode.");
        }
    }

    /**
     * Checks rate limits for a customer identifier.
     * Limit: Max 5 attempts in 10 seconds.
     */
    public boolean checkRateLimit(String customerIdentifier) {
        LocalDateTime now = LocalDateTime.now();
        List<LocalDateTime> attempts = rateLimitMap.computeIfAbsent(customerIdentifier, k -> new CopyOnWriteArrayList<>());
        
        // Remove attempts older than 10 seconds
        attempts.removeIf(time -> time.isBefore(now.minusSeconds(10)));
        
        if (attempts.size() >= 5) {
            log.warn("Rate limit exceeded for customer: {}", customerIdentifier);
            return false;
        }
        
        attempts.add(now);
        return true;
    }

    /**
     * Creates an order locally and with Razorpay.
     */
    public Order createOrder(String productId, String customerIdentifier, String ipAddress) {
        // 1. Verify Product
        Product product = Product.getById(productId);
        if (product == null) {
            throw new IllegalArgumentException("Invalid Product ID: " + productId);
        }

        // 2. Rate Limiting Check
        if (!checkRateLimit(customerIdentifier)) {
            throw new RuntimeException("Too many requests. Please try again later.");
        }

        // 3. Create Order locally (as CREATED)
        Order order = Order.builder()
                .productId(productId)
                .amount(product.getAmount())
                .status(OrderStatus.CREATED)
                .customerIdentifier(customerIdentifier)
                .ipAddress(ipAddress)
                .createdAt(LocalDateTime.now())
                .build();

        order = orderRepository.save(order);

        // 4. Create Order with Razorpay
        String razorpayOrderId = null;
        if (razorpayClient != null) {
            try {
                JSONObject orderRequest = new JSONObject();
                orderRequest.put("amount", product.getAmount()); // in paise
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", "txn_" + order.getId());
                
                com.razorpay.Order rpOrder = razorpayClient.orders.create(orderRequest);
                razorpayOrderId = rpOrder.get("id");
                log.info("Razorpay Order created: {} for Local Order ID: {}", razorpayOrderId, order.getId());
            } catch (Exception e) {
                log.error("Failed to create order on Razorpay, falling back to mock mode: {}", e.getMessage());
                razorpayOrderId = "order_mock_" + UUID.randomUUID().toString().substring(0, 8);
            }
        } else {
            razorpayOrderId = "order_mock_" + UUID.randomUUID().toString().substring(0, 8);
            log.info("Running in mock mode. Generated Razorpay Order ID: {} for Local Order ID: {}", razorpayOrderId, order.getId());
        }

        order.setRazorpayOrderId(razorpayOrderId);
        return orderRepository.save(order);
    }

    /**
     * Retrieves all orders, optionally filtered by status.
     */
    public List<Order> getAllOrders(OrderStatus status) {
        List<Order> orders = orderRepository.findAll();
        if (status != null) {
            orders.removeIf(order -> order.getStatus() != status);
        }
        // Sort by creation date descending
        orders.sort((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()));
        return orders;
    }

    /**
     * Resolves a flagged order manually.
     */
    public Order resolveOrder(Long orderId, String action) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if (order.getStatus() != OrderStatus.FLAGGED) {
            throw new IllegalStateException("Only FLAGGED orders can be manually resolved.");
        }

        if ("APPROVE".equalsIgnoreCase(action)) {
            order.setStatus(OrderStatus.PAID);
            order.setRiskReasons(order.getRiskReasons() + " (Manually Approved)");
            log.info("Order ID: {} manually APPROVED.", orderId);
        } else if ("REJECT".equalsIgnoreCase(action)) {
            order.setStatus(OrderStatus.FAILED);
            order.setRiskReasons(order.getRiskReasons() + " (Manually Rejected)");
            log.info("Order ID: {} manually REJECTED.", orderId);
        } else {
            throw new IllegalArgumentException("Invalid action: " + action + ". Must be APPROVE or REJECT.");
        }

        return orderRepository.save(order);
    }
}
